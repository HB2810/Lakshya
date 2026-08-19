"""AuditEvent persistence model.

ADR-005 / ARCHITECTURE.md §11: append-only evidence of who changed what.
Distinct from a domain event: audit answers "who changed what", a domain event
tells automation "what happened".

Append-only is enforced at three levels:

1. There is no ORM update or delete path — the recorder only inserts.
2. Migration ``0002`` installs a ``BEFORE UPDATE OR DELETE`` trigger that raises,
   and (when ``LAKSHYA_DB_APP_ROLE`` is configured) revokes ``UPDATE``/``DELETE``
   from the API runtime role.
3. The model has no ``updated_at`` and no ``version``: an audit row has no
   lifecycle to mutate.

Atomicity: the audit insert shares the transaction of the mutation it records,
so a failed audit write aborts its business mutation (ADR-005: "audit insert
failure aborts the mutation").
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import UTC_TIMESTAMP, UUID_PK, Base, uuid_pk

#: Bumped when the redacted before/after payload shape changes, so an old row
#: stays interpretable (ADR-005: "schema-versioned redacted before/after values").
AUDIT_PAYLOAD_SCHEMA_VERSION = 1


class ActorType(str, Enum):
    """Who performed the action."""

    USER = "user"
    #: Deterministic automation or a maintenance job acting under a service
    #: identity. Used by the later automation phase (AUTOMATION.md §9).
    SYSTEM = "system"
    #: Pre-authentication security events, e.g. a rejected login.
    ANONYMOUS = "anonymous"


class AuditSource(str, Enum):
    """Which entry point produced the event."""

    API = "api"
    WORKER = "worker"
    CLI = "cli"
    MIGRATION = "migration"


_ACTOR_TYPES_SQL = ", ".join(repr(item.value) for item in ActorType)
_SOURCES_SQL = ", ".join(repr(item.value) for item in AuditSource)


class AuditEvent(Base):
    """One immutable record of a security- or business-relevant action."""

    __tablename__ = "audit_events"
    __table_args__ = (
        CheckConstraint(f"actor_type IN ({_ACTOR_TYPES_SQL})", name="actor_type_allowed"),
        CheckConstraint(f"source IN ({_SOURCES_SQL})", name="source_allowed"),
        CheckConstraint(
            "(actor_type = 'user' AND actor_user_id IS NOT NULL) OR actor_type <> 'user'",
            name="user_actor_has_id",
        ),
        CheckConstraint("length(btrim(action)) > 0", name="action_not_blank"),
        CheckConstraint("length(btrim(entity_type)) > 0", name="entity_type_not_blank"),
        CheckConstraint("length(btrim(correlation_id)) > 0", name="correlation_id_not_blank"),
        CheckConstraint("payload_schema_version >= 1", name="payload_schema_version_positive"),
        # DATABASE.md §6 audit index candidates.
        Index(
            "ix_audit_events_entity_timeline",
            "organization_id",
            "entity_type",
            "entity_id",
            text("occurred_at DESC"),
        ),
        Index("ix_audit_events_actor_timeline", "actor_user_id", text("occurred_at DESC")),
        Index(
            "ix_audit_events_action_timeline",
            "organization_id",
            "action",
            text("occurred_at DESC"),
        ),
        Index("ix_audit_events_correlation_id", "correlation_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()

    #: NULL **only** for pre-authentication security events where no
    #: organization can be resolved — for example a login attempt for an address
    #: that matches no account. Every event recorded for an identified actor or
    #: entity carries the organization. See docs/implementation/
    #: PHASE2_FOUNDATION.md ("Implementation findings") for why this column is
    #: nullable while DATABASE.md §1 requires organization_id on tenant-owned
    #: tables: such an event is not tenant-owned, because no tenant is known.
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=True
    )

    occurred_at: Mapped[datetime] = mapped_column(
        UTC_TIMESTAMP, nullable=False, server_default=text("now()")
    )

    #: Stable dotted action name, e.g. ``auth.login.succeeded``,
    #: ``role_assignment.created``.
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(60), nullable=False)
    #: NULL when the action has no persisted entity (a rejected login).
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID_PK, nullable=True)

    actor_type: Mapped[str] = mapped_column(String(20), nullable=False)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID_PK, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    #: Human-readable actor label for system actors, e.g. ``system:bootstrap``.
    #: Never used for authorization.
    actor_label: Mapped[str | None] = mapped_column(String(120), nullable=True)

    source: Mapped[str] = mapped_column(String(20), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(64), nullable=False)
    #: The event or command that caused this one, once automation exists.
    causation_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    #: Business reason supplied by the actor. Which transitions *require* a
    #: reason is REQUIRES BUSINESS DECISION (DATABASE.md §5).
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    #: Redacted field-level snapshots. Populated through the audit service's
    #: allow-list, so secret material cannot reach them (SECURITY.md §6).
    before_state: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    after_state: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    payload_schema_version: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text(str(AUDIT_PAYLOAD_SCHEMA_VERSION))
    )

    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(256), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        UTC_TIMESTAMP, nullable=False, server_default=text("now()")
    )
