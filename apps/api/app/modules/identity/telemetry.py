"""Independent security-telemetry transaction (ADR-007).

The one place in LAKSHYA permitted to commit outside the request unit of work.

Why it exists
-------------
Some authentication checks must both reject the request and persist a security
fact. The rejection raises, so the request transaction rolls back — taking the
evidence with it. Before ADR-007 no ``auth.login.failed`` row was ever written,
which silently defeated the SECURITY.md §7 requirement to audit authentication
failures and alert on repeated ones.

Why it is safe
--------------
* **Allow-list, not a general mechanism.** The dispatch table below is the entire
  set of things this path can do. Request input cannot choose a table, an audit
  action, an actor or a reason code.
* **Runs after the request connection is released.** The request unit of work
  rolls back and closes its session *before* calling :meth:`persist`, so one
  rejection never holds two pooled connections and never waits on row locks the
  main transaction still holds.
* **Atomic within itself.** State change and its audit event share one
  transaction, so audit failure rolls the state change back. ADR-005 is
  preserved for every ordinary mutation, which keeps using the main transaction.
* **Conditional and idempotent.** Revocation only transitions a live row and only
  audits the transition it actually performed, so concurrent presentations of one
  expired session produce one revocation and one event.
* **Atomic counters.** The failure counter is incremented in SQL, never
  read-modify-written, so concurrent attempts cannot lose an increment.
* **Fail-loud operationally, fail-closed for access.** A telemetry failure is
  logged at high severity and swallowed: it must never turn a ``401`` into a
  ``500``, and never into a success.
"""

from __future__ import annotations

import logging
import uuid
from collections.abc import Sequence
from typing import Any

from sqlalchemy import func, update
from sqlalchemy.orm import Session, sessionmaker

from app.core.security_effects import SecurityEffect, SecurityEffectKind
from app.modules.audit.models import AuditSource
from app.modules.audit.service import (
    AUTH_LOGIN_FAILED,
    AUTH_SESSION_REVOKED,
    AuditActor,
    AuditRecorder,
)
from app.modules.identity.models import Credential, UserSession

logger = logging.getLogger(__name__)

#: Structured log event name for operational alerting (ADR-007 §Failure
#: semantics). Alert on sustained occurrences.
TELEMETRY_FAILURE_EVENT = "security_telemetry_persist_failed"


class MismatchedTenantError(RuntimeError):
    """A state-changing effect matched no row under its tenant predicate.

    Raised inside the security transaction so it rolls back: no state change and
    no audit event. It signals an internal defect — a well-formed effect built
    from database-resolved identifiers always matches — so it is logged at high
    severity like any other telemetry failure, and never surfaces to the client.
    """


class SecurityTelemetryWriter:
    """Persists allow-listed security effects in their own short transaction.

    Application-scoped: built once in the application lifespan from the existing
    ``sessionmaker``, so it shares the one Engine and connection pool. It never
    creates an Engine.
    """

    def __init__(
        self,
        session_factory: sessionmaker[Session],
        *,
        source: AuditSource = AuditSource.API,
    ) -> None:
        self._session_factory = session_factory
        self._source = source
        #: Counts failures for operational visibility. Deliberately in-process
        #: and non-persistent: writing a telemetry failure through the same audit
        #: path that just failed would recurse.
        self.failure_count = 0

    def persist(self, effects: Sequence[SecurityEffect]) -> bool:
        """Apply every effect in one independent transaction.

        Returns ``True`` when the transaction committed. A ``False`` return is
        informational only — the caller re-raises the original rejection either
        way, because a telemetry failure must not change what the client sees.
        """
        if not effects:
            return True

        try:
            # ``sessionmaker.begin()`` commits on success, rolls back on any
            # exception and closes the session deterministically.
            with self._session_factory.begin() as session:
                recorder = AuditRecorder(session, source=self._source)
                for effect in effects:
                    self._apply(effect, session, recorder)
            return True
        except Exception:
            self.failure_count += 1
            # Log, never re-raise. Message and fields carry no credential, token
            # or address; the structured logger scrubs the record as well.
            #
            # The field extraction is deliberately defensive. This branch runs
            # *because* something was wrong, so an effect may itself be malformed
            # — and an exception raised while reporting a failure would escape
            # ``persist`` and change the caller's response, which is precisely
            # what ADR-007 forbids. The failure path must never be the thing that
            # breaks the request.
            logger.error(
                TELEMETRY_FAILURE_EVENT,
                exc_info=True,
                extra={
                    "event": TELEMETRY_FAILURE_EVENT,
                    "effect_kinds": [_describe_kind(effect) for effect in effects],
                    "effect_correlation_id": _describe_correlation_id(effects),
                    "failure_count": self.failure_count,
                },
            )
            return False

    # -- Dispatch ---------------------------------------------------------

    def _apply(self, effect: SecurityEffect, session: Session, recorder: AuditRecorder) -> None:
        """Route one effect to its handler.

        An exhaustive match over a closed enum: an effect kind with no handler is
        a programming error, not something to ignore silently.
        """
        if effect.kind is SecurityEffectKind.LOGIN_FAILURE:
            self._audit_login_failure(effect, recorder)
        elif effect.kind is SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER:
            self._count_credential_failure(effect, session, recorder)
        elif effect.kind is SecurityEffectKind.SESSION_REVOCATION:
            self._revoke_session(effect, session, recorder)
        elif effect.kind is SecurityEffectKind.USER_SESSION_REVOCATION:
            self._revoke_user_sessions(effect, session, recorder)
        else:  # pragma: no cover - unreachable while the enum stays closed
            raise ValueError(f"no handler for security effect {effect.kind!r}")

    # -- Handlers ---------------------------------------------------------

    def _audit_login_failure(self, effect: SecurityEffect, recorder: AuditRecorder) -> None:
        """Record a refused login. No state change."""
        recorder.record(
            action=AUTH_LOGIN_FAILED,
            entity_type="user",
            entity_id=effect.target_user_id,
            actor=_anonymous_actor(effect),
            organization_id=effect.organization_id,
            reason=effect.reason_code,
            correlation_id=effect.correlation_id,
        )

    def _count_credential_failure(
        self, effect: SecurityEffect, session: Session, recorder: AuditRecorder
    ) -> None:
        """Increment the failure counter atomically, then audit the attempt.

        Three properties, all enforced in SQL:

        * **Atomic count.** ``failed_attempt_count = failed_attempt_count + 1`` is
          computed by the database, so two concurrent wrong-password attempts
          cannot both read 0 and both write 1. PostgreSQL serialises them on the
          row lock, and no increment is lost.
        * **Monotonic timestamp.** ``last_failed_at`` uses ``GREATEST`` so a
          transaction that commits late with an older ``occurred_at`` cannot move
          the recorded time backwards. ``GREATEST`` ignores NULL in PostgreSQL,
          which gives the first-ever failure the correct value without a
          ``COALESCE`` special case.
        * **Tenant constraint.** The predicate carries the organization and user,
          not just the credential id. An effect whose identifiers were internally
          mismatched then matches no row, instead of touching another tenant.

        The counter drives monitoring only. It does not lock the account: lockout
        thresholds and unlock authority remain REQUIRES BUSINESS DECISION
        (SECURITY.md §3).
        """
        updated = session.execute(
            update(Credential)
            .where(
                Credential.id == effect.credential_id,
                Credential.user_id == effect.target_user_id,
                Credential.organization_id == effect.organization_id,
            )
            .values(
                failed_attempt_count=Credential.failed_attempt_count + 1,
                last_failed_at=func.greatest(Credential.last_failed_at, effect.occurred_at),
            )
            .returning(Credential.id)
            .execution_options(synchronize_session=False)
        ).scalars()

        if not list(updated):
            # No row matched the tenant-constrained predicate. Auditing anyway
            # would record evidence against an account this effect does not
            # actually describe.
            raise MismatchedTenantError(
                "credential effect matched no row for its organization and user"
            )

        self._audit_login_failure(effect, recorder)

    def _revoke_session(
        self, effect: SecurityEffect, session: Session, recorder: AuditRecorder
    ) -> None:
        """Revoke one session, only if it is still live."""
        revoked = self._conditional_revoke(
            session,
            effect,
            UserSession.id == effect.session_id,
            UserSession.user_id == effect.target_user_id,
            UserSession.organization_id == effect.organization_id,
        )
        if not revoked:
            # Another concurrent request already performed the transition. It
            # wrote the audit event; a second one would be duplicate evidence.
            return
        recorder.record(
            action=AUTH_SESSION_REVOKED,
            entity_type="session",
            entity_id=effect.session_id,
            actor=_anonymous_actor(effect),
            organization_id=effect.organization_id,
            after={
                "user_id": effect.target_user_id,
                "revoked_at": effect.occurred_at,
                "revoked_reason": effect.reason_code,
            },
            reason=effect.reason_code,
            correlation_id=effect.correlation_id,
            diff_only=False,
        )

    def _revoke_user_sessions(
        self, effect: SecurityEffect, session: Session, recorder: AuditRecorder
    ) -> None:
        """Revoke every live session of one user, auditing only what changed."""
        revoked = self._conditional_revoke(
            session,
            effect,
            UserSession.user_id == effect.target_user_id,
            UserSession.organization_id == effect.organization_id,
        )
        if not revoked:
            return
        recorder.record(
            action=AUTH_SESSION_REVOKED,
            entity_type="session",
            entity_id=None,
            actor=_anonymous_actor(effect),
            organization_id=effect.organization_id,
            after={
                "user_id": effect.target_user_id,
                "revoked_at": effect.occurred_at,
                "revoked_reason": effect.reason_code,
                # The count, never the session identifiers or their tokens.
                "revoked_session_count": len(revoked),
            },
            reason=effect.reason_code,
            correlation_id=effect.correlation_id,
            diff_only=False,
        )

    @staticmethod
    def _conditional_revoke(
        session: Session, effect: SecurityEffect, *conditions: Any
    ) -> list[uuid.UUID]:
        """``UPDATE ... WHERE revoked_at IS NULL RETURNING id``.

        Returning the ids makes the transition observable: only the transaction
        that actually changed a live row writes evidence for it, which is what
        keeps concurrent presentations of one expired session from producing
        duplicate audit events.
        """
        result = session.execute(
            update(UserSession)
            .where(*conditions, UserSession.revoked_at.is_(None))
            .values(revoked_at=effect.occurred_at, revoked_reason=effect.reason_code)
            .returning(UserSession.id)
            .execution_options(synchronize_session=False)
        )
        return list(result.scalars())


def _describe_kind(effect: SecurityEffect) -> str:
    """Best-effort effect-kind label for a failure log."""
    kind = getattr(effect, "kind", None)
    return str(getattr(kind, "value", kind))


def _describe_correlation_id(effects: Sequence[SecurityEffect]) -> str:
    """Best-effort correlation ID for a failure log."""
    if not effects:
        return "unknown"
    return str(getattr(effects[0], "correlation_id", "unknown"))


def _anonymous_actor(effect: SecurityEffect) -> AuditActor:
    """Build the actor for a security-telemetry event.

    Always anonymous. Every effect here originates from a request that failed
    authentication, so the caller's identity is unproven even when the *target*
    account resolved (ADR-007: "``actor_user_id`` must not assert that the
    unauthenticated caller is that user"). The resolved account appears as the
    audit entity and organization instead.
    """
    return AuditActor.anonymous(ip_address=effect.ip_address, user_agent=effect.user_agent)


def build_security_telemetry_writer(
    session_factory: sessionmaker[Session],
) -> SecurityTelemetryWriter:
    """Factory used by the application lifespan."""
    return SecurityTelemetryWriter(session_factory)
