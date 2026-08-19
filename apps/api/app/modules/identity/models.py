"""User, Credential and UserSession persistence models.

DOMAIN_MODEL.md §3, DATABASE.md §2, ADR-002 and SECURITY.md §3.

Two deliberate separations:

1. **Credential is not part of the user profile.** A password hash lives in
   ``credentials``, keyed by user, so the profile can be read, listed and
   serialised without ever loading authentication material (DATABASE.md §2:
   "hash only, never plaintext").
2. **Sessions store only a token hash.** The opaque session identifier exists in
   the browser cookie and nowhere else. A database compromise therefore does not
   yield usable session tokens (ADR-002).

There is no plaintext password column anywhere in this module, by construction.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.security import PASSWORD_ALGORITHM
from app.db.base import UTC_TIMESTAMP, UUID_PK, Base, TimestampMixin, VersionMixin, uuid_pk

#: Only local password credentials exist in V0.1. An OIDC credential kind is
#: added by the future identity-provider adapter (ADR-002), not invented here.
CREDENTIAL_KIND_PASSWORD = "password"  # noqa: S105 - credential kind, not a credential

#: Reasons a session may be revoked. Stable strings, used in audit payloads.
SESSION_REVOCATION_REASONS = (
    "logout",
    "rotated",
    "absolute_expiry",
    "idle_timeout",
    "account_disabled",
    "password_changed",
    "role_assignment_changed",
    "security_action",
)


class User(Base, TimestampMixin, VersionMixin):
    """A person with an account in one organization.

    User identity is organization-wide; department relationships live in
    ``department_memberships`` (DOMAIN_MODEL.md §3).
    """

    __tablename__ = "users"
    __table_args__ = (
        # Target for composite foreign keys that pin organization scope.
        UniqueConstraint("organization_id", "id", name="uq_users_organization_id_id"),
        # DATABASE.md §6: "(organization_id, normalized_email) unique for users".
        UniqueConstraint(
            "organization_id",
            "normalized_email",
            name="uq_users_organization_id_normalized_email",
        ),
        CheckConstraint("length(btrim(full_name)) > 0", name="full_name_not_blank"),
        CheckConstraint("length(btrim(email)) > 0", name="email_not_blank"),
        CheckConstraint("position('@' in email) > 1", name="email_has_local_and_domain"),
        CheckConstraint(
            "normalized_email = lower(normalized_email)", name="normalized_email_lower"
        ),
        CheckConstraint(
            "(is_active AND disabled_at IS NULL) OR (NOT is_active AND disabled_at IS NOT NULL)",
            name="disabled_state_consistent",
        ),
        Index("ix_users_organization_id_is_active", "organization_id", "is_active"),
        # Login resolves an account by normalized email before the organization
        # is known, so this lookup needs its own index.
        Index("ix_users_normalized_email", "normalized_email"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False
    )

    full_name: Mapped[str] = mapped_column(String(200), nullable=False)

    #: Address as entered, preserved for display and outbound mail.
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    #: Canonical form backing the unique constraint and all lookups.
    normalized_email: Mapped[str] = mapped_column(String(320), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    disabled_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
    disabled_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    last_login_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)


class Credential(Base, TimestampMixin):
    """Local password credential metadata for one user.

    SECURITY.md §3: Argon2id with upgrade-on-login. ``password_hash`` holds the
    Argon2 encoded hash (algorithm, parameters and salt included); the plaintext
    is never stored, logged or audited.
    """

    __tablename__ = "credentials"
    __table_args__ = (
        ForeignKeyConstraint(
            ["organization_id", "user_id"],
            ["users.organization_id", "users.id"],
            name="fk_credentials_user_same_organization",
            ondelete="CASCADE",
        ),
        CheckConstraint(
            f"kind IN ('{CREDENTIAL_KIND_PASSWORD}')",
            name="kind_allowed",
        ),
        CheckConstraint("length(password_hash) > 0", name="password_hash_present"),
        CheckConstraint("failed_attempt_count >= 0", name="failed_attempt_count_non_negative"),
        # DATABASE.md §2: "one active per local user".
        Index(
            "uq_credentials_active_per_user_kind",
            "user_id",
            "kind",
            unique=True,
            postgresql_where=text("is_active"),
        ),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)

    kind: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default=text(f"'{CREDENTIAL_KIND_PASSWORD}'")
    )
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    algorithm: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default=text(f"'{PASSWORD_ALGORITHM}'")
    )

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    password_updated_at: Mapped[datetime] = mapped_column(UTC_TIMESTAMP, nullable=False)

    #: Forces a password change at next login. The change endpoint that consumes
    #: this flag arrives with the approved password policy
    #: (TODO REQUIRES BUSINESS DECISION, SECURITY.md §3).
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    #: Failure counters exist for monitoring and audit only. They deliberately
    #: do NOT drive an account lockout: lockout thresholds and unlock authority
    #: are TODO REQUIRES BUSINESS DECISION (SECURITY.md §3). Login abuse is
    #: currently contained by rate limiting, which cannot lock out a real user
    #: permanently.
    failed_attempt_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    last_failed_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
    last_verified_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)


class UserSession(Base, TimestampMixin):
    """An opaque, database-backed browser session.

    ADR-002: the cookie carries a high-entropy random identifier; the database
    stores only ``token_hash``. Immediate revocation is therefore possible, which
    is the property stateless browser JWTs cannot provide.

    ``csrf_token_hash`` binds the double-submit CSRF token to this exact session,
    so a token minted for another session (or injected by a sibling subdomain)
    fails validation.
    """

    __tablename__ = "sessions"
    __table_args__ = (
        ForeignKeyConstraint(
            ["organization_id", "user_id"],
            ["users.organization_id", "users.id"],
            name="fk_sessions_user_same_organization",
            ondelete="CASCADE",
        ),
        UniqueConstraint("token_hash", name="uq_sessions_token_hash"),
        CheckConstraint("expires_at > issued_at", name="expiry_after_issue"),
        CheckConstraint(
            f"revoked_reason IS NULL OR revoked_reason IN "
            f"({', '.join(repr(reason) for reason in SESSION_REVOCATION_REASONS)})",
            name="revoked_reason_allowed",
        ),
        CheckConstraint(
            "revoked_reason IS NULL OR revoked_at IS NOT NULL",
            name="revocation_consistent",
        ),
        Index("ix_sessions_user_id_revoked_at", "user_id", "revoked_at"),
        # Cleanup / expiry sweeps only care about live sessions.
        Index(
            "ix_sessions_expires_at_live",
            "expires_at",
            postgresql_where=text("revoked_at IS NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)

    #: SHA-256 (base64url) of the opaque session token. Never the token itself.
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    #: SHA-256 (base64url) of this session's CSRF token.
    csrf_token_hash: Mapped[str] = mapped_column(String(64), nullable=False)

    issued_at: Mapped[datetime] = mapped_column(UTC_TIMESTAMP, nullable=False)
    #: Absolute expiry. Inactivity expiry is derived from ``last_activity_at``
    #: and the configured idle timeout, so shortening the timeout takes effect
    #: for sessions that already exist.
    expires_at: Mapped[datetime] = mapped_column(UTC_TIMESTAMP, nullable=False)
    last_activity_at: Mapped[datetime] = mapped_column(UTC_TIMESTAMP, nullable=False)

    revoked_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(String(32), nullable=True)

    #: Session rotation chain (ADR-002: "Rotate on login, privilege elevation
    #: and password change"). Retained so a rotated session can be traced.
    rotated_from_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID_PK, ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True
    )

    #: Request metadata for audit and anomaly detection. Truncated at the
    #: service boundary; never used for authorization.
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(256), nullable=True)
