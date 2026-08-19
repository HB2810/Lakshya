"""Allow-listed security-effect intents (ADR-007).

ADR-007 defines a narrow exception to the one-transaction-per-request rule: a
handful of security facts must survive the rollback of the request that produced
them, because they exist *precisely because* the request was rejected.

This module holds the intent model only. It performs no I/O, imports nothing
from the domain modules, and is deliberately the whole vocabulary of that
exception:

* :class:`SecurityEffectKind` is a **closed** set. A caller cannot invent an
  effect, choose a table, choose an audit action, or smuggle arbitrary SQL
  through this path. ADR-007 requires the independent transaction to be "an
  allow-list, not a general mechanism for committing arbitrary work after
  errors".
* An effect carries **scalar, already-redacted values only**: resolved
  identifiers, an internal reason code, normalized request metadata, a sanitized
  correlation ID and a timestamp. There is no field for a password, a password
  hash, a session token, a CSRF token, a table name or a SQL fragment, so none
  can travel through this path.
* Instances are frozen, so an effect cannot be edited between classification and
  persistence.
* Every field is validated per kind: required identifiers must be present,
  irrelevant identifiers must be absent, and the tenant identifiers a resolved
  effect needs to constrain its ``UPDATE`` are mandatory (see
  :data:`_FIELD_RULES`).

The validation runs in ``__post_init__``, so it applies to direct construction
too, not only to the classmethod constructors. A malformed effect therefore
raises at the moment it is built, inside the request, rather than reaching the
security transaction.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum

#: Mirrors ``app.core.correlation`` sanitisation and the ``audit_events``
#: ``correlation_id`` column width.
CORRELATION_ID_MAX_LENGTH = 64
_CORRELATION_ID_PATTERN = re.compile(r"^[A-Za-z0-9\-_.]{1,64}$")

#: Column widths in ``sessions`` / ``audit_events``.
IP_ADDRESS_MAX_LENGTH = 64
USER_AGENT_MAX_LENGTH = 256


class SecurityEffectKind(str, Enum):
    """The complete set of effects permitted to outlive a rejected request."""

    #: Durable evidence of a rejected login. Audit only, no state change.
    LOGIN_FAILURE = "login_failure"

    #: Rejected login against a resolved credential: atomically increments the
    #: failure counter AND writes the single ``auth.login.failed`` event for the
    #: attempt, so one rejected request still produces exactly one audit row.
    CREDENTIAL_FAILURE_COUNTER = "credential_failure_counter"

    #: Conditionally revoke one presented session.
    SESSION_REVOCATION = "session_revocation"

    #: Conditionally revoke every live session of one user.
    USER_SESSION_REVOCATION = "user_session_revocation"


# ---------------------------------------------------------------------------
# Reason codes
# ---------------------------------------------------------------------------
# Internal constants. Request input can never choose one, and none is ever
# returned to the caller: every rejection keeps the same generic message.

REASON_UNKNOWN_ACCOUNT = "unknown_account"
REASON_AMBIGUOUS_ACCOUNT = "ambiguous_account"
REASON_NO_ACTIVE_CREDENTIAL = "no_active_credential"
REASON_INVALID_PASSWORD = "invalid_password"  # noqa: S105 - a reason code, not a credential
REASON_ACCOUNT_DISABLED = "account_disabled"
REASON_ORGANIZATION_INACTIVE = "organization_inactive"
REASON_ABSOLUTE_EXPIRY = "absolute_expiry"
REASON_IDLE_TIMEOUT = "idle_timeout"
REASON_SECURITY_ACTION = "security_action"

#: Reasons a login may be refused.
LOGIN_FAILURE_REASONS: frozenset[str] = frozenset(
    {
        REASON_UNKNOWN_ACCOUNT,
        REASON_AMBIGUOUS_ACCOUNT,
        REASON_NO_ACTIVE_CREDENTIAL,
        REASON_INVALID_PASSWORD,
        REASON_ACCOUNT_DISABLED,
        REASON_ORGANIZATION_INACTIVE,
    }
)

#: Reasons a session may be revoked by this path. Each must also be accepted by
#: the ``ck_sessions_revoked_reason_allowed`` database constraint.
REVOCATION_REASONS: frozenset[str] = frozenset(
    {
        REASON_ABSOLUTE_EXPIRY,
        REASON_IDLE_TIMEOUT,
        REASON_ACCOUNT_DISABLED,
        REASON_SECURITY_ACTION,
    }
)


@dataclass(frozen=True)
class _FieldRule:
    """Per-kind field contract.

    ``required`` fields must be present; ``forbidden`` fields must be absent. A
    field in neither set is optional. Stating both directions is what stops an
    effect carrying an identifier its handler ignores — an ignored identifier is
    how a reader ends up believing a constraint exists that does not.
    """

    reasons: frozenset[str]
    required: frozenset[str]
    forbidden: frozenset[str]


#: The tenant identifiers each kind needs. ``organization_id`` and
#: ``target_user_id`` are mandatory wherever a row is mutated, because the writer
#: puts them into the ``UPDATE`` predicate: an effect whose identifiers were
#: mismatched internally must match no row rather than mutate another tenant's
#: security state.
_FIELD_RULES: dict[SecurityEffectKind, _FieldRule] = {
    SecurityEffectKind.LOGIN_FAILURE: _FieldRule(
        reasons=LOGIN_FAILURE_REASONS,
        required=frozenset(),
        # Audit-only: it mutates nothing, so a credential or session identifier
        # would be inert and misleading.
        forbidden=frozenset({"credential_id", "session_id"}),
    ),
    SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER: _FieldRule(
        reasons=LOGIN_FAILURE_REASONS,
        required=frozenset({"credential_id", "organization_id", "target_user_id"}),
        forbidden=frozenset({"session_id"}),
    ),
    SecurityEffectKind.SESSION_REVOCATION: _FieldRule(
        reasons=REVOCATION_REASONS,
        required=frozenset({"session_id", "organization_id", "target_user_id"}),
        forbidden=frozenset({"credential_id"}),
    ),
    SecurityEffectKind.USER_SESSION_REVOCATION: _FieldRule(
        reasons=REVOCATION_REASONS,
        required=frozenset({"organization_id", "target_user_id"}),
        forbidden=frozenset({"credential_id", "session_id"}),
    ),
}


class SecurityEffectError(ValueError):
    """A security effect was constructed with an invalid or unsafe shape."""


@dataclass(frozen=True)
class SecurityEffect:
    """One immutable, allow-listed security fact awaiting durable persistence.

    An internal value: never built from request JSON, never serialised into an
    error response, never returned to the client.
    """

    kind: SecurityEffectKind
    reason_code: str
    #: Sanitized request correlation ID, carried explicitly rather than read from
    #: an ambient context variable at write time.
    correlation_id: str
    occurred_at: datetime

    #: Resolved tenant. Mandatory for every kind that mutates a row.
    organization_id: uuid.UUID | None = None
    #: The account the effect targets. Recorded as the audit *entity*, never as
    #: the actor: an unauthenticated caller is not proven to be this user.
    target_user_id: uuid.UUID | None = None
    credential_id: uuid.UUID | None = None
    session_id: uuid.UUID | None = None

    #: Normalized, length-bounded client metadata for audit only.
    ip_address: str | None = None
    user_agent: str | None = None

    def __post_init__(self) -> None:
        self._validate_kind()
        rule = _FIELD_RULES[self.kind]
        self._validate_reason(rule)
        self._validate_correlation_id()
        self._validate_occurred_at()
        self._validate_identifier_types()
        self._validate_required_and_forbidden(rule)
        self._validate_consistency()
        self._validate_metadata()

    # -- Validation -------------------------------------------------------

    def _validate_kind(self) -> None:
        if not isinstance(self.kind, SecurityEffectKind):
            raise SecurityEffectError(
                f"kind must be a SecurityEffectKind, got {type(self.kind).__name__}"
            )

    def _validate_reason(self, rule: _FieldRule) -> None:
        if not isinstance(self.reason_code, str):
            raise SecurityEffectError("reason_code must be a string")
        if self.reason_code not in rule.reasons:
            raise SecurityEffectError(
                f"reason {self.reason_code!r} is not allow-listed for {self.kind.value}"
            )

    def _validate_correlation_id(self) -> None:
        if not isinstance(self.correlation_id, str):
            raise SecurityEffectError("correlation_id must be a string")
        if not _CORRELATION_ID_PATTERN.match(self.correlation_id):
            raise SecurityEffectError(
                "correlation_id must be 1-"
                f"{CORRELATION_ID_MAX_LENGTH} characters of [A-Za-z0-9-_.]; it is "
                "written to an audit column and must already be sanitized"
            )

    def _validate_occurred_at(self) -> None:
        if not isinstance(self.occurred_at, datetime):
            raise SecurityEffectError("occurred_at must be a datetime")
        if self.occurred_at.tzinfo is None or self.occurred_at.utcoffset() is None:
            # A naive timestamp compared against a timestamptz column is a silent
            # correctness bug, and this value feeds the monotonic last_failed_at.
            raise SecurityEffectError("occurred_at must be timezone-aware")

    def _validate_identifier_types(self) -> None:
        for name in ("organization_id", "target_user_id", "credential_id", "session_id"):
            value = getattr(self, name)
            if value is not None and not isinstance(value, uuid.UUID):
                raise SecurityEffectError(f"{name} must be a uuid.UUID, got {type(value).__name__}")

    def _validate_required_and_forbidden(self, rule: _FieldRule) -> None:
        missing = sorted(name for name in rule.required if getattr(self, name) is None)
        if missing:
            raise SecurityEffectError(
                f"{self.kind.value} requires {', '.join(missing)}: the writer uses "
                "them to constrain its UPDATE to the correct tenant"
            )
        present = sorted(name for name in rule.forbidden if getattr(self, name) is not None)
        if present:
            raise SecurityEffectError(
                f"{self.kind.value} must not carry {', '.join(present)}: the handler "
                "does not use it, so it would imply a constraint that is not applied"
            )

    def _validate_consistency(self) -> None:
        if self.target_user_id is not None and self.organization_id is None:
            # A resolved account always belongs to a known organization. Allowing
            # the pair to disagree is exactly the shape that could address a row
            # outside the intended tenant.
            raise SecurityEffectError(
                "target_user_id without organization_id is inconsistent: a resolved "
                "user always has a known organization"
            )

    def _validate_metadata(self) -> None:
        for name, limit in (
            ("ip_address", IP_ADDRESS_MAX_LENGTH),
            ("user_agent", USER_AGENT_MAX_LENGTH),
        ):
            value = getattr(self, name)
            if value is None:
                continue
            if not isinstance(value, str):
                raise SecurityEffectError(f"{name} must be a string")
            if len(value) > limit:
                raise SecurityEffectError(f"{name} must be at most {limit} characters")

    # -- Validated constructors -------------------------------------------

    @classmethod
    def login_failure(
        cls,
        *,
        reason_code: str,
        correlation_id: str,
        occurred_at: datetime,
        organization_id: uuid.UUID | None = None,
        target_user_id: uuid.UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> SecurityEffect:
        """Evidence of a refused login, with no state change."""
        return cls(
            kind=SecurityEffectKind.LOGIN_FAILURE,
            reason_code=reason_code,
            correlation_id=correlation_id,
            occurred_at=occurred_at,
            organization_id=organization_id,
            target_user_id=target_user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @classmethod
    def credential_failure_counter(
        cls,
        *,
        credential_id: uuid.UUID,
        correlation_id: str,
        occurred_at: datetime,
        organization_id: uuid.UUID,
        target_user_id: uuid.UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> SecurityEffect:
        """A wrong password against a real credential: count it and audit it."""
        return cls(
            kind=SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER,
            reason_code=REASON_INVALID_PASSWORD,
            correlation_id=correlation_id,
            occurred_at=occurred_at,
            organization_id=organization_id,
            target_user_id=target_user_id,
            credential_id=credential_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @classmethod
    def session_revocation(
        cls,
        *,
        session_id: uuid.UUID,
        organization_id: uuid.UUID,
        target_user_id: uuid.UUID,
        reason_code: str,
        correlation_id: str,
        occurred_at: datetime,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> SecurityEffect:
        """Revoke one presented session, if it is still live."""
        return cls(
            kind=SecurityEffectKind.SESSION_REVOCATION,
            reason_code=reason_code,
            correlation_id=correlation_id,
            occurred_at=occurred_at,
            organization_id=organization_id,
            target_user_id=target_user_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @classmethod
    def user_session_revocation(
        cls,
        *,
        target_user_id: uuid.UUID,
        organization_id: uuid.UUID,
        reason_code: str,
        correlation_id: str,
        occurred_at: datetime,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> SecurityEffect:
        """Revoke every live session of one user, if any are still live."""
        return cls(
            kind=SecurityEffectKind.USER_SESSION_REVOCATION,
            reason_code=reason_code,
            correlation_id=correlation_id,
            occurred_at=occurred_at,
            organization_id=organization_id,
            target_user_id=target_user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )


def utc_now_for_effect() -> datetime:
    """Timezone-aware UTC timestamp, for callers outside the app clock module."""
    return datetime.now(timezone.utc)
