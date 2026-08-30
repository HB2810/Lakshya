"""WorkItem, WorkItemActivity, WorkItemDependency, and WorkItemEscalation persistence models.

Canonical WorkItem execution model for LAKSHYA V1.
All execution across tasks, meeting action items, commitments, and strategy milestones
convergences into WorkItem.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
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
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import UTC_TIMESTAMP, UUID_PK, Base, TimestampMixin, VersionMixin, uuid_pk

WORK_ITEM_STATUSES = (
    "todo",
    "in_progress",
    "submitted_for_verification",
    "revision_requested",
    "completed",
    "verified",
    "stuck",
    "blocked",
    "cancelled",
)
WORK_ITEM_PRIORITIES = ("low", "medium", "high", "urgent")
_STATUSES_SQL = ", ".join(repr(s) for s in WORK_ITEM_STATUSES)
_PRIORITIES_SQL = ", ".join(repr(p) for p in WORK_ITEM_PRIORITIES)


class WorkItem(Base, TimestampMixin, VersionMixin):
    """Canonical execution entity in LAKSHYA."""

    __tablename__ = "work_items"
    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_work_items_organization_id_id"),
        ForeignKeyConstraint(
            ["organization_id", "owner_id"],
            ["users.organization_id", "users.id"],
            name="fk_work_items_owner_same_organization",
            ondelete="SET NULL",
        ),
        ForeignKeyConstraint(
            ["organization_id", "created_by"],
            ["users.organization_id", "users.id"],
            name="fk_work_items_creator_same_organization",
            ondelete="RESTRICT",
        ),
        CheckConstraint(f"status IN ({_STATUSES_SQL})", name="status_allowed"),
        CheckConstraint(f"priority IN ({_PRIORITIES_SQL})", name="priority_allowed"),
        CheckConstraint("length(btrim(title)) > 0", name="title_not_blank"),
        CheckConstraint(
            "progress_percent >= 0 AND progress_percent <= 100", name="progress_range"
        ),
        Index("ix_work_items_organization_id_owner_id", "organization_id", "owner_id"),
        Index("ix_work_items_organization_id_status", "organization_id", "status"),
        Index("ix_work_items_organization_id_due_at", "organization_id", "due_at"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False
    )

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID_PK, nullable=True)

    status: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default=text("'todo'")
    )
    priority: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default=text("'medium'")
    )

    owner_id: Mapped[uuid.UUID | None] = mapped_column(UUID_PK, nullable=True)
    owner_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)

    department_id: Mapped[uuid.UUID | None] = mapped_column(UUID_PK, nullable=True)
    department_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    due_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
    progress_percent: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )

    blocked_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
    blocked_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    blocker_details: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    # Verification & Incharge Sign-off
    submission_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_for_verification_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
    verification_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    # RACI, EDC, Dependencies, Escalations stored as structured metadata
    raci: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    edc: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    origin_meeting_id: Mapped[uuid.UUID | None] = mapped_column(UUID_PK, nullable=True)
    source_type: Mapped[str] = mapped_column(
        String(64), nullable=False, server_default=text("'MANUAL'")
    )
    source_title: Mapped[str | None] = mapped_column(String(300), nullable=True)


class WorkItemActivity(Base):
    """Immutable audit & activity timeline for WorkItem."""

    __tablename__ = "work_item_activities"
    __table_args__ = (
        Index("ix_work_item_activities_work_item_id", "work_item_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    work_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("work_items.id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)
    author_name: Mapped[str] = mapped_column(String(200), nullable=False)
    activity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    previous_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    new_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    progress_percent: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        UTC_TIMESTAMP, nullable=False, server_default=text("now()")
    )


class WorkItemEscalation(Base, TimestampMixin):
    """Hierarchical organizational escalation."""

    __tablename__ = "work_item_escalations"
    __table_args__ = (
        Index("ix_work_item_escalations_work_item_id", "work_item_id"),
        Index("ix_work_item_escalations_escalated_to_id", "escalated_to_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)
    work_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("work_items.id", ondelete="CASCADE"), nullable=False
    )
    level: Mapped[str] = mapped_column(String(64), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    escalated_by_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)
    escalated_by_name: Mapped[str] = mapped_column(String(200), nullable=False)
    escalated_to_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)
    escalated_to_name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default=text("'PENDING'")
    )
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
