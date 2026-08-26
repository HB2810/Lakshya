"""Strategic planning domain persistence models.

Implements AnnualGoal, QuarterlyPriority, MonthlyPriority, and WeeklyMilestone.
"""

from __future__ import annotations

import uuid
from datetime import datetime, date

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import UTC_TIMESTAMP, UUID_PK, Base, TimestampMixin, VersionMixin, uuid_fk, uuid_pk

QUARTERLY_PRIORITY_STATUSES = (
    "DRAFT",
    "PROPOSED",
    "MD_REVIEW",
    "APPROVED",
    "CHANGES_REQUESTED",
    "REJECTED",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
)


class AnnualGoal(Base, TimestampMixin, VersionMixin):
    """Top-level organizational annual goal."""

    __tablename__ = "annual_goals"
    __table_args__ = (
        Index("ix_annual_goals_organization_id", "organization_id"),
        Index("ix_annual_goals_fy_start_year", "fy_start_year"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = uuid_fk("organizations.id")
    fy_start_year: Mapped[int] = mapped_column(Integer, nullable=False)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_outcome: Mapped[str | None] = mapped_column(Text, nullable=True)

    owner_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    md_sponsor_id: Mapped[uuid.UUID] = uuid_fk("users.id")

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'ACTIVE'"))
    health_status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'ON_TRACK'"))


class QuarterlyPriority(Base, TimestampMixin, VersionMixin):
    """Financial-Quarter Priority (Requires MD Approval)."""

    __tablename__ = "quarterly_priorities"
    __table_args__ = (
        CheckConstraint(f"status IN {QUARTERLY_PRIORITY_STATUSES}", name="ck_quarterly_priorities_status"),
        Index("ix_quarterly_priorities_organization_id", "organization_id"),
        Index("ix_quarterly_priorities_fy_quarter", "fy_start_year", "quarter"),
        Index("ix_quarterly_priorities_status", "status"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = uuid_fk("organizations.id")
    annual_goal_id: Mapped[uuid.UUID | None] = uuid_fk("annual_goals.id", nullable=True, ondelete="SET NULL")

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    expected_outcome: Mapped[str | None] = mapped_column(Text, nullable=True)

    owner_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    proposer_id: Mapped[uuid.UUID] = uuid_fk("users.id")

    fy_start_year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[str] = mapped_column(String(10), nullable=False)  # "Q1", "Q2", "Q3", "Q4"

    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'DRAFT'"))
    rejection_or_change_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    approved_by_id: Mapped[uuid.UUID | None] = uuid_fk("users.id", nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)

    source_meeting_id: Mapped[uuid.UUID | None] = uuid_fk("meetings.id", nullable=True)
    source_agenda_id: Mapped[uuid.UUID | None] = uuid_fk("meeting_agendas.id", nullable=True)


class MonthlyPriority(Base, TimestampMixin, VersionMixin):
    """Monthly breakdown outcome belonging to an approved Quarterly Priority."""

    __tablename__ = "monthly_priorities"
    __table_args__ = (
        Index("ix_monthly_priorities_quarterly_priority_id", "quarterly_priority_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    quarterly_priority_id: Mapped[uuid.UUID] = uuid_fk("quarterly_priorities.id", ondelete="CASCADE")
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    expected_result: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[uuid.UUID] = uuid_fk("users.id")

    target_month: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 - 12
    target_year: Mapped[int] = mapped_column(Integer, nullable=False)
    
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'ACTIVE'"))
    progress_percentage: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))


class WeeklyMilestone(Base, TimestampMixin, VersionMixin):
    """Weekly execution result belonging to a Monthly Priority."""

    __tablename__ = "weekly_milestones"
    __table_args__ = (
        Index("ix_weekly_milestones_monthly_priority_id", "monthly_priority_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    monthly_priority_id: Mapped[uuid.UUID] = uuid_fk("monthly_priorities.id", ondelete="CASCADE")

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    expected_result: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[uuid.UUID] = uuid_fk("users.id")

    week_number: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 - 53
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'PLANNED'"))
    progress_percentage: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    is_blocked: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    blocker_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
