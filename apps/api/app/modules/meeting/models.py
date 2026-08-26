"""Meeting execution engine persistence models.

Implements Meeting, MeetingParticipant, MeetingAgenda, MeetingCheckin, and MeetingHeadline.
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
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import UTC_TIMESTAMP, UUID_PK, Base, TimestampMixin, VersionMixin, uuid_fk, uuid_pk

MEETING_TYPES = (
    "WEEKLY",
    "DAILY",
    "ONE_ON_ONE_SCHEDULED",
    "ONE_ON_ONE_INSTANT",
    "MAJOR",
    "CFT",
)

MEETING_STATUSES = (
    "DRAFT",
    "SCHEDULED",
    "READY",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
)

AGENDA_STATUSES = (
    "PENDING",
    "DISCUSSED",
    "DEFERRED",
    "COMPLETED",
)


class Meeting(Base, TimestampMixin, VersionMixin):
    """Core domain model representing a LAKSHYA operational or strategic meeting."""

    __tablename__ = "meetings"
    __table_args__ = (
        CheckConstraint(f"meeting_type IN {MEETING_TYPES}", name="ck_meetings_meeting_type"),
        CheckConstraint(f"status IN {MEETING_STATUSES}", name="ck_meetings_status"),
        Index("ix_meetings_organization_id", "organization_id"),
        Index("ix_meetings_status", "status"),
        Index("ix_meetings_start_time", "start_time"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = uuid_fk("organizations.id")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str | None] = mapped_column(Text, nullable=True)
    meeting_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'WEEKLY'"))
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'DRAFT'"))

    organizer_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    facilitator_id: Mapped[uuid.UUID | None] = uuid_fk("users.id", nullable=True)

    start_time: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'Asia/Kolkata'"))
    location_or_link: Mapped[str | None] = mapped_column(String(500), nullable=True)

    is_instant: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    recurrence_rule: Mapped[str | None] = mapped_column(String(255), nullable=True)

    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    reopen_reason: Mapped[str | None] = mapped_column(Text, nullable=True)


class MeetingParticipant(Base, TimestampMixin):
    """Join model capturing meeting attendance and participant role."""

    __tablename__ = "meeting_participants"
    __table_args__ = (
        UniqueConstraint("meeting_id", "user_id", name="uq_meeting_participants_meeting_user"),
        Index("ix_meeting_participants_meeting_id", "meeting_id"),
        Index("ix_meeting_participants_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    meeting_id: Mapped[uuid.UUID] = uuid_fk("meetings.id", ondelete="CASCADE")
    user_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    role: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'ATTENDEE'"))
    attended: Mapped[bool | None] = mapped_column(Boolean, nullable=True)


class MeetingAgenda(Base, TimestampMixin, VersionMixin):
    """Agenda item created pre-meeting or during live execution."""

    __tablename__ = "meeting_agendas"
    __table_args__ = (
        CheckConstraint(f"status IN {AGENDA_STATUSES}", name="ck_meeting_agendas_status"),
        Index("ix_meeting_agendas_meeting_id", "meeting_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    meeting_id: Mapped[uuid.UUID] = uuid_fk("meetings.id", ondelete="CASCADE")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    presenter_id: Mapped[uuid.UUID | None] = uuid_fk("users.id", nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'PENDING'"))
    
    # Deferred item tracking
    deferred_to_meeting_id: Mapped[uuid.UUID | None] = uuid_fk("meetings.id", nullable=True)


class MeetingCheckin(Base, TimestampMixin):
    """Individual operational check-in record for a meeting participant."""

    __tablename__ = "meeting_checkins"
    __table_args__ = (
        UniqueConstraint("meeting_id", "user_id", name="uq_meeting_checkins_meeting_user"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    meeting_id: Mapped[uuid.UUID] = uuid_fk("meetings.id", ondelete="CASCADE")
    user_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    confidence_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    important_update: Mapped[str | None] = mapped_column(Text, nullable=True)
    immediate_concern: Mapped[str | None] = mapped_column(Text, nullable=True)
    support_needed: Mapped[str | None] = mapped_column(Text, nullable=True)


class MeetingHeadline(Base, TimestampMixin):
    """Significant information item logged during a meeting section."""

    __tablename__ = "meeting_headlines"

    id: Mapped[uuid.UUID] = uuid_pk()
    meeting_id: Mapped[uuid.UUID] = uuid_fk("meetings.id", ondelete="CASCADE")
    author_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    headline_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'UPDATE'"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
