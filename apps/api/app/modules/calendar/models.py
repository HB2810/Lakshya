"""Calendar engine persistence models.

Implements CalendarEvent, CalendarSyncOutbox, and UserCalendarIntegration.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import UTC_TIMESTAMP, UUID_PK, Base, TimestampMixin, VersionMixin, uuid_fk, uuid_pk

from enum import Enum

class CalendarEventType(str, Enum):
    LAKSHYA_MEETING = "LAKSHYA_MEETING"
    MILESTONE_REVIEW = "MILESTONE_REVIEW"
    STRATEGY_REVIEW = "STRATEGY_REVIEW"
    EXTERNAL_EVENT = "EXTERNAL_EVENT"


class CalendarProvider(str, Enum):
    LAKSHYA = "LAKSHYA"
    GOOGLE = "GOOGLE"


class CalendarSyncStatus(str, Enum):
    NOT_SYNCED = "NOT_SYNCED"
    SYNC_PENDING = "SYNC_PENDING"
    SYNCHRONIZED = "SYNCHRONIZED"
    SYNC_FAILED = "SYNC_FAILED"


class CalendarOutboxStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


CALENDAR_EVENT_TYPES = (
    "LAKSHYA_MEETING",
    "MILESTONE_REVIEW",
    "STRATEGY_REVIEW",
    "EXTERNAL_EVENT",
)

SYNC_STATUSES = (
    "NOT_SYNCED",
    "SYNC_PENDING",
    "SYNCHRONIZED",
    "SYNC_FAILED",
)

OUTBOX_STATUSES = (
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
)


class CalendarEvent(Base, TimestampMixin, VersionMixin):
    """Unified LAKSHYA internal calendar event model."""

    __tablename__ = "calendar_events"
    __table_args__ = (
        CheckConstraint(f"event_type IN {CALENDAR_EVENT_TYPES}", name="ck_calendar_events_type"),
        CheckConstraint(f"sync_status IN {SYNC_STATUSES}", name="ck_calendar_events_sync_status"),
        Index("ix_calendar_events_organization_id", "organization_id"),
        Index("ix_calendar_events_user_id", "user_id"),
        Index("ix_calendar_events_meeting_id", "meeting_id"),
        Index("ix_calendar_events_start_time", "start_time"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = uuid_fk("organizations.id")
    user_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    meeting_id: Mapped[uuid.UUID | None] = uuid_fk("meetings.id", nullable=True, ondelete="CASCADE")

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'LAKSHYA_MEETING'"))

    start_time: Mapped[datetime] = mapped_column(UTC_TIMESTAMP, nullable=False)
    end_time: Mapped[datetime] = mapped_column(UTC_TIMESTAMP, nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'Asia/Kolkata'"))

    provider: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'LAKSHYA'"))
    external_event_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    external_calendar_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    sync_status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'NOT_SYNCED'"))
    last_synced_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)


class CalendarSyncOutbox(Base, TimestampMixin):
    """Transactional outbox queue for resilient background calendar synchronization."""

    __tablename__ = "calendar_sync_outbox"
    __table_args__ = (
        CheckConstraint(f"status IN {OUTBOX_STATUSES}", name="ck_calendar_sync_outbox_status"),
        UniqueConstraint("organization_id", "idempotency_key", name="uq_calendar_sync_outbox_org_idempotency"),
        Index("ix_calendar_sync_outbox_status_next_attempt", "status", "next_attempt_at"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = uuid_fk("organizations.id")
    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'PENDING'"))
    
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("5"))
    
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_attempt_at: Mapped[datetime] = mapped_column(UTC_TIMESTAMP, nullable=False)


class UserCalendarIntegration(Base, TimestampMixin):
    """OAuth 2.0 calendar integration record for connected user accounts."""

    __tablename__ = "user_calendar_integrations"
    __table_args__ = (
        UniqueConstraint("user_id", "provider", name="uq_user_calendar_integrations_user_provider"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = uuid_fk("users.id", ondelete="CASCADE")
    provider: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'GOOGLE'"))

    encrypted_refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    account_email: Mapped[str] = mapped_column(String(255), nullable=False)
    calendar_id: Mapped[str] = mapped_column(String(255), nullable=False, server_default=text("'primary'"))
    
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    last_sync_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
