"""Authentication and session lifecycle.

ADR-002 / SECURITY.md §3. First-party credentials behind a service boundary so a
future OpenID Connect adapter can replace :meth:`AuthenticationService.authenticate`
without touching routes or session handling.

Guarantees enforced here:

* Argon2id verification with upgrade-on-login rehashing.
* A generic failure for every rejected login, so the caller cannot distinguish
  unknown account, wrong password and disabled account.
* Constant-ish work on failure: an unknown account still performs one Argon2
  verification against a dummy hash, so response time does not reveal whether an
  address exists.
* Session rotation on login; revocation on logout, account disablement and
  privilege change.
* Absolute and inactivity expiry, both re-evaluated on every request.
* Only token *hashes* touch the database.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, cast

from sqlalchemy import CursorResult, select, update
from sqlalchemy.orm import Session

from app.core.clock import as_utc, utcnow
from app.core.config import Settings
from app.core.correlation import get_correlation_id
from app.core.errors import AuthenticationFailedError, AuthenticationRequiredError
from app.core.security import (
    IssuedToken,
    PasswordHasherService,
    generate_opaque_token,
    hash_opaque_token,
)
from app.core.security_effects import (
    REASON_ABSOLUTE_EXPIRY,
    REASON_ACCOUNT_DISABLED,
    REASON_AMBIGUOUS_ACCOUNT,
    REASON_IDLE_TIMEOUT,
    REASON_INVALID_PASSWORD,
    REASON_NO_ACTIVE_CREDENTIAL,
    REASON_ORGANIZATION_INACTIVE,
    REASON_SECURITY_ACTION,
    REASON_UNKNOWN_ACCOUNT,
    SecurityEffect,
)
from app.core.text import normalize_email
from app.modules.audit.service import (
    AUTH_CREDENTIAL_REHASHED,
    AUTH_LOGIN_SUCCEEDED,
    AUTH_LOGOUT,
    AUTH_SESSION_REVOKED,
    CREDENTIAL_PASSWORD_CHANGED,
    AuditActor,
    AuditRecorder,
)
from app.modules.identity.models import (
    CREDENTIAL_KIND_PASSWORD,
    Credential,
    User,
    UserSession,
)
from app.modules.organization.models import Organization

_USER_AGENT_MAX_LENGTH = 256
_IP_MAX_LENGTH = 64

# Failure reason codes now live in app.core.security_effects, because the
# security-telemetry writer and the authentication service must agree on the
# allow-list. Re-exported here so existing importers keep working.
FAILURE_UNKNOWN_ACCOUNT = REASON_UNKNOWN_ACCOUNT
FAILURE_AMBIGUOUS_ACCOUNT = REASON_AMBIGUOUS_ACCOUNT
FAILURE_NO_ACTIVE_CREDENTIAL = REASON_NO_ACTIVE_CREDENTIAL
FAILURE_INVALID_PASSWORD = REASON_INVALID_PASSWORD
FAILURE_ACCOUNT_DISABLED = REASON_ACCOUNT_DISABLED
FAILURE_ORGANIZATION_INACTIVE = REASON_ORGANIZATION_INACTIVE


@dataclass(frozen=True)
class IssuedSession:
    """A newly created session and the two secrets handed to the browser.

    ``session_token`` and ``csrf_token`` exist only in this object and in the
    response cookies. Neither is stored or logged.
    """

    session: UserSession
    session_token: str
    csrf_token: str


@dataclass(frozen=True)
class AuthenticatedSession:
    """A resolved, currently valid session with its user."""

    session: UserSession
    user: User


@dataclass(frozen=True)
class RequestMetadata:
    """Non-authoritative client metadata retained for audit."""

    ip_address: str | None = None
    user_agent: str | None = None

    def normalized(self) -> RequestMetadata:
        return RequestMetadata(
            ip_address=(self.ip_address or None) and self.ip_address[:_IP_MAX_LENGTH],
            user_agent=(self.user_agent or None) and self.user_agent[:_USER_AGENT_MAX_LENGTH],
        )


class AuthenticationService:
    """Password login and opaque session management."""

    def __init__(
        self,
        session: Session,
        settings: Settings,
        hasher: PasswordHasherService,
        audit: AuditRecorder,
    ) -> None:
        self._session = session
        self._settings = settings
        self._hasher = hasher
        self._audit = audit

    # -- Login ------------------------------------------------------------

    def login(
        self,
        *,
        email: str,
        password: str,
        organization_slug: str | None,
        metadata: RequestMetadata,
        existing_session_token: str | None = None,
    ) -> IssuedSession:
        """Verify credentials and issue a rotated session.

        Raises :class:`AuthenticationFailedError` — always with the same generic
        message — for every rejection path.
        """
        meta = metadata.normalized()
        normalized = normalize_email(email)
        user = self._resolve_login_user(normalized, organization_slug, meta)

        credential = self._session.execute(
            select(Credential).where(
                Credential.user_id == user.id,
                Credential.kind == CREDENTIAL_KIND_PASSWORD,
                Credential.is_active.is_(True),
            )
        ).scalar_one_or_none()

        if credential is None:
            # The account exists but has no active password credential (not yet
            # provisioned, or deactivated). Without this, the branch would return
            # far faster than a wrong-password rejection, and the difference is
            # measurable — it would disclose which accounts are provisioned.
            # One dummy Argon2 verification makes the work comparable.
            self._hasher.verify(_dummy_password_hash(self._hasher), "timing-equalizer")
            raise AuthenticationFailedError(
                security_effects=(
                    self._login_failure_effect(
                        REASON_NO_ACTIVE_CREDENTIAL,
                        meta,
                        organization_id=user.organization_id,
                        target_user_id=user.id,
                    ),
                )
            )

        if not self._hasher.verify(credential.password_hash, password):
            # ADR-007: classify, do not mutate. Incrementing the counter on this
            # session would be rolled back with the request; the writer performs
            # an atomic SQL increment once the request transaction is released.
            raise AuthenticationFailedError(
                security_effects=(
                    SecurityEffect.credential_failure_counter(
                        credential_id=credential.id,
                        correlation_id=get_correlation_id(),
                        occurred_at=utcnow(),
                        organization_id=user.organization_id,
                        target_user_id=user.id,
                        ip_address=meta.ip_address,
                        user_agent=meta.user_agent,
                    ),
                )
            )

        # Password is correct. Account and organization state are checked only
        # now, so a disabled account cannot be probed without the password.
        if not user.is_active:
            # Evidence of the refusal *and* revocation of any session the account
            # still holds, committed together in one security transaction.
            raise AuthenticationFailedError(
                security_effects=(
                    self._login_failure_effect(
                        REASON_ACCOUNT_DISABLED,
                        meta,
                        organization_id=user.organization_id,
                        target_user_id=user.id,
                    ),
                    SecurityEffect.user_session_revocation(
                        target_user_id=user.id,
                        organization_id=user.organization_id,
                        reason_code=REASON_ACCOUNT_DISABLED,
                        correlation_id=get_correlation_id(),
                        occurred_at=utcnow(),
                        ip_address=meta.ip_address,
                        user_agent=meta.user_agent,
                    ),
                )
            )

        organization = self._session.get(Organization, user.organization_id)
        if organization is None or not organization.is_active:
            raise AuthenticationFailedError(
                security_effects=(
                    self._login_failure_effect(
                        REASON_ORGANIZATION_INACTIVE,
                        meta,
                        organization_id=user.organization_id,
                        target_user_id=user.id,
                    ),
                )
            )

        now = utcnow()
        credential.failed_attempt_count = 0
        credential.last_failed_at = None
        credential.last_verified_at = now
        user.last_login_at = now

        # Upgrade-on-login: re-hash with current parameters when the stored hash
        # was produced by weaker settings (SECURITY.md §3).
        if self._hasher.needs_rehash(credential.password_hash):
            credential.password_hash = self._hasher.hash(password)
            credential.password_updated_at = now
            self._audit.record(
                action=AUTH_CREDENTIAL_REHASHED,
                entity_type="credential",
                entity_id=credential.id,
                actor=AuditActor.user(
                    user.id, ip_address=meta.ip_address, user_agent=meta.user_agent
                ),
                organization_id=user.organization_id,
                after={"user_id": user.id, "algorithm": credential.algorithm},
                reason="argon2_parameters_upgraded",
            )

        # Rotate: any session presented with the login request is retired.
        rotated_from = self._revoke_presented_session(existing_session_token, user)

        issued = self._create_session(user, meta, rotated_from_session_id=rotated_from)

        self._audit.record(
            action=AUTH_LOGIN_SUCCEEDED,
            entity_type="session",
            entity_id=issued.session.id,
            actor=AuditActor.user(user.id, ip_address=meta.ip_address, user_agent=meta.user_agent),
            organization_id=user.organization_id,
            after={
                "user_id": user.id,
                "expires_at": issued.session.expires_at,
                "ip_address": meta.ip_address,
                "user_agent": meta.user_agent,
            },
        )
        return issued

    def _resolve_login_user(
        self, normalized_email: str, organization_slug: str | None, meta: RequestMetadata
    ) -> User:
        """Find the account for a login attempt.

        Organization scope is derived from the matched user record, never taken
        from the request as an authorization input (SECURITY.md §4). The optional
        ``organization_slug`` only disambiguates when the same address exists in
        more than one organization; it cannot widen access.
        """
        query = select(User).where(User.normalized_email == normalized_email)
        if organization_slug is not None:
            query = query.join(Organization, Organization.id == User.organization_id).where(
                Organization.slug == organization_slug
            )

        candidates = list(self._session.execute(query.limit(2)).scalars())

        if not candidates:
            # Equalise work with the success path so response time does not
            # disclose whether the address exists.
            self._hasher.verify(_dummy_password_hash(self._hasher), "timing-equalizer")
            raise AuthenticationFailedError(
                security_effects=(self._login_failure_effect(REASON_UNKNOWN_ACCOUNT, meta),)
            )

        if len(candidates) > 1:
            # The same address exists in several organizations and the caller did
            # not say which. Refusing is safer than guessing.
            self._hasher.verify(_dummy_password_hash(self._hasher), "timing-equalizer")
            raise AuthenticationFailedError(
                security_effects=(self._login_failure_effect(REASON_AMBIGUOUS_ACCOUNT, meta),)
            )

        return candidates[0]

    def _login_failure_effect(
        self,
        reason: str,
        meta: RequestMetadata,
        *,
        organization_id: uuid.UUID | None = None,
        target_user_id: uuid.UUID | None = None,
    ) -> SecurityEffect:
        """Classify a rejected login as a durable security effect (ADR-007).

        ``organization_id`` stays NULL when no account matched, because no tenant
        is known at that point. The submitted address is deliberately NOT
        recorded: an audit table full of attempted addresses is itself a
        disclosure risk, and the account identity is already captured whenever it
        resolved.

        The resolved account travels as ``target_user_id`` and is written as the
        audit *entity*. It never becomes the actor: this caller failed to
        authenticate, so nothing proves they are that user.
        """
        return SecurityEffect.login_failure(
            reason_code=reason,
            correlation_id=get_correlation_id(),
            occurred_at=utcnow(),
            organization_id=organization_id,
            target_user_id=target_user_id,
            ip_address=meta.ip_address,
            user_agent=meta.user_agent,
        )

    # -- Session creation and resolution ----------------------------------

    def _create_session(
        self,
        user: User,
        meta: RequestMetadata,
        *,
        rotated_from_session_id: uuid.UUID | None = None,
    ) -> IssuedSession:
        now = utcnow()
        session_token: IssuedToken = generate_opaque_token()
        csrf_token: IssuedToken = generate_opaque_token()

        record = UserSession(
            organization_id=user.organization_id,
            user_id=user.id,
            token_hash=session_token.hashed,
            csrf_token_hash=csrf_token.hashed,
            issued_at=now,
            last_activity_at=now,
            expires_at=now + timedelta(minutes=self._settings.session_absolute_lifetime_minutes),
            rotated_from_session_id=rotated_from_session_id,
            ip_address=meta.ip_address,
            user_agent=meta.user_agent,
        )
        self._session.add(record)
        self._session.flush()
        return IssuedSession(
            session=record,
            session_token=session_token.value,
            csrf_token=csrf_token.value,
        )

    def resolve_session(self, session_token: str) -> AuthenticatedSession:
        """Validate a presented session token.

        Raises :class:`AuthenticationRequiredError` when the token is unknown,
        revoked, past its absolute expiry, idle beyond the timeout, or belongs to
        a disabled account or organization.
        """
        record = self._session.execute(
            select(UserSession).where(UserSession.token_hash == hash_opaque_token(session_token))
        ).scalar_one_or_none()

        if record is None or record.revoked_at is not None:
            # A missing, forged or already-revoked token carries no effect.
            # Persisting one per attempt would let an attacker inflate the audit
            # table at will (ADR-007: no uncontrolled audit volume).
            raise AuthenticationRequiredError("The session is not valid.")

        now = utcnow()
        if as_utc(record.expires_at) <= now:
            raise AuthenticationRequiredError(
                "The session has expired.",
                security_effects=(self._revocation_effect(record, REASON_ABSOLUTE_EXPIRY, now),),
            )

        idle_deadline = as_utc(record.last_activity_at) + timedelta(
            minutes=self._settings.session_idle_timeout_minutes
        )
        if idle_deadline <= now:
            raise AuthenticationRequiredError(
                "The session expired through inactivity.",
                security_effects=(self._revocation_effect(record, REASON_IDLE_TIMEOUT, now),),
            )

        user = self._session.get(User, record.user_id)
        if user is None or not user.is_active:
            # Disabled-account handling: an account disabled mid-session loses
            # every live session, not just the one presented here. The bulk
            # effect covers the presented session too, so a single conditional
            # update performs the whole transition.
            effect = (
                SecurityEffect.user_session_revocation(
                    target_user_id=user.id,
                    organization_id=user.organization_id,
                    reason_code=REASON_ACCOUNT_DISABLED,
                    correlation_id=get_correlation_id(),
                    occurred_at=now,
                )
                if user is not None
                else self._revocation_effect(record, REASON_SECURITY_ACTION, now)
            )
            raise AuthenticationRequiredError(
                "The session is not valid.", security_effects=(effect,)
            )

        organization = self._session.get(Organization, record.organization_id)
        if organization is None or not organization.is_active:
            raise AuthenticationRequiredError(
                "The session is not valid.",
                security_effects=(self._revocation_effect(record, REASON_SECURITY_ACTION, now),),
            )

        # Only a session that actually authenticated advances its idle window,
        # and only if this request goes on to succeed: this write belongs to the
        # main request transaction (ADR-007) so a rejected request downstream
        # cannot extend an idle session.
        record.last_activity_at = now
        return AuthenticatedSession(session=record, user=user)

    def _revocation_effect(
        self, record: UserSession, reason: str, occurred_at: datetime
    ) -> SecurityEffect:
        """Classify a session revocation discovered while rejecting a request.

        The row is NOT mutated here. Mutating it would flush into the request
        transaction, which is about to roll back, and would take a row lock the
        independent writer would then have to wait for.
        """
        return SecurityEffect.session_revocation(
            session_id=record.id,
            reason_code=reason,
            correlation_id=get_correlation_id(),
            occurred_at=occurred_at,
            organization_id=record.organization_id,
            target_user_id=record.user_id,
            ip_address=record.ip_address,
            user_agent=record.user_agent,
        )

    def active_credential(self, user: User) -> Credential | None:
        """Return the user's active password credential, if any.

        Callers may read ``must_change_password`` from it. They must never
        serialise the credential itself: the response schemas have no field for
        ``password_hash``, so it cannot leave the process.
        """
        return self._session.execute(
            select(Credential).where(
                Credential.user_id == user.id,
                Credential.kind == CREDENTIAL_KIND_PASSWORD,
                Credential.is_active.is_(True),
            )
        ).scalar_one_or_none()

    # -- Password change --------------------------------------------------

    def change_password(
        self,
        authenticated: AuthenticatedSession,
        *,
        current_password: str,
        new_password: str,
        metadata: RequestMetadata,
    ) -> IssuedSession:
        """Change the caller's own password.

        API.md: "Change own password and revoke other sessions". ADR-002 requires
        session rotation on password change, so this returns a **new** session:
        the caller's old session and every other live session are revoked, which
        is what makes a password change effective against a stolen cookie.

        Re-authentication is enforced by requiring ``current_password``
        (SECURITY.md §3). The full password policy — length beyond the configured
        minimum, breached-password screening, reuse rules — is
        TODO REQUIRES BUSINESS DECISION.
        """
        meta = metadata.normalized()
        user = authenticated.user

        credential = self._session.execute(
            select(Credential).where(
                Credential.user_id == user.id,
                Credential.kind == CREDENTIAL_KIND_PASSWORD,
                Credential.is_active.is_(True),
            )
        ).scalar_one_or_none()
        if credential is None or not self._hasher.verify(
            credential.password_hash, current_password
        ):
            raise AuthenticationFailedError("The current password is not correct.")

        now = utcnow()
        credential.password_hash = self._hasher.hash(new_password)
        credential.password_updated_at = now
        credential.must_change_password = False
        credential.failed_attempt_count = 0
        credential.last_failed_at = None
        self._session.flush()

        actor = AuditActor.user(user.id, ip_address=meta.ip_address, user_agent=meta.user_agent)
        self._audit.record(
            action=CREDENTIAL_PASSWORD_CHANGED,
            entity_type="credential",
            entity_id=credential.id,
            actor=actor,
            organization_id=user.organization_id,
            after={
                "user_id": user.id,
                "algorithm": credential.algorithm,
                "must_change_password": credential.must_change_password,
            },
            diff_only=False,
        )

        # Revoke every existing session, including the one used for this request.
        self.revoke_all_user_sessions(user, reason="password_changed", actor=actor)
        return self._create_session(user, meta, rotated_from_session_id=authenticated.session.id)

    # -- Revocation -------------------------------------------------------

    def logout(self, authenticated: AuthenticatedSession, metadata: RequestMetadata) -> None:
        """Revoke the current session."""
        meta = metadata.normalized()
        self._revoke(authenticated.session, reason="logout")
        self._audit.record(
            action=AUTH_LOGOUT,
            entity_type="session",
            entity_id=authenticated.session.id,
            actor=AuditActor.user(
                authenticated.user.id, ip_address=meta.ip_address, user_agent=meta.user_agent
            ),
            organization_id=authenticated.session.organization_id,
            after={
                "user_id": authenticated.user.id,
                "revoked_at": authenticated.session.revoked_at,
                "revoked_reason": authenticated.session.revoked_reason,
            },
        )

    def revoke_all_user_sessions(
        self,
        user: User,
        *,
        reason: str,
        actor: AuditActor | None,
        except_session_id: uuid.UUID | None = None,
    ) -> int:
        """Revoke every live session for ``user``.

        Called when an account is disabled and when role assignments change, so
        authorization state cannot outlive its grant (SECURITY.md §4: "invalidating
        authorization state promptly"). Returns the number of sessions revoked.
        """
        now = utcnow()
        conditions = [
            UserSession.user_id == user.id,
            UserSession.organization_id == user.organization_id,
            UserSession.revoked_at.is_(None),
        ]
        if except_session_id is not None:
            conditions.append(UserSession.id != except_session_id)

        result = self._session.execute(
            update(UserSession)
            .where(*conditions)
            .values(revoked_at=now, revoked_reason=reason)
            .execution_options(synchronize_session="fetch")
        )
        # An UPDATE always yields a CursorResult, which is where ``rowcount``
        # lives; the generic ``execute`` signature cannot express that.
        revoked = int(cast("CursorResult[Any]", result).rowcount or 0)

        if revoked and actor is not None:
            self._audit.record(
                action=AUTH_SESSION_REVOKED,
                entity_type="session",
                entity_id=None,
                actor=actor,
                organization_id=user.organization_id,
                after={"user_id": user.id, "revoked_at": now, "revoked_reason": reason},
                reason=reason,
            )
        return revoked

    def _revoke_presented_session(self, session_token: str | None, user: User) -> uuid.UUID | None:
        """Retire a session presented alongside a login request."""
        if not session_token:
            return None
        record = self._session.execute(
            select(UserSession).where(
                UserSession.token_hash == hash_opaque_token(session_token),
                UserSession.user_id == user.id,
                UserSession.revoked_at.is_(None),
            )
        ).scalar_one_or_none()
        if record is None:
            return None
        self._revoke(record, reason="rotated")
        return record.id

    def _revoke(self, record: UserSession, *, reason: str) -> None:
        if record.revoked_at is None:
            record.revoked_at = utcnow()
            record.revoked_reason = reason
        self._session.flush()


_DUMMY_HASH: dict[int, str] = {}


def _dummy_password_hash(hasher: PasswordHasherService) -> str:
    """Return a cached Argon2 hash used to equalise failure timing.

    Computed once per process against a value that is not a credential for any
    account, so verifying against it can never succeed.
    """
    key = id(hasher)
    cached = _DUMMY_HASH.get(key)
    if cached is None:
        cached = hasher.hash("lakshya-timing-equalizer-not-a-credential")
        _DUMMY_HASH[key] = cached
    return cached
