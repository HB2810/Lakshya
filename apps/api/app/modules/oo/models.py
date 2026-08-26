"""Obstacle & Opportunity (O&O) persistence models.

Implements OAndOItem for tracking operational obstacles and strategic opportunities.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import UTC_TIMESTAMP, UUID_PK, Base, TimestampMixin, VersionMixin, uuid_fk, uuid_pk

OO_TYPES = ("OBSTACLE", "OPPORTUNITY")

OO_STATUSES = (
    "OPEN",
    "UNDER_REVIEW",
    "APPROVED_FOR_ACTION",
    "IN_PROGRESS",
    "WAITING",
    "RESOLVED",
    "VERIFIED",
    "CLOSED",
)

OO_PRIORITIES = ("LOW", "MEDIUM", "HIGH", "CRITICAL")


class OAndOItem(Base, TimestampMixin, VersionMixin):
    """First-class domain entity representing an Obstacle or Opportunity."""

    __tablename__ = "o_and_o_items"
    __table_args__ = (
        CheckConstraint(f"oo_type IN {OO_TYPES}", name="ck_o_and_o_items_type"),
        CheckConstraint(f"status IN {OO_STATUSES}", name="ck_o_and_o_items_status"),
        CheckConstraint(f"priority IN {OO_PRIORITIES}", name="ck_o_and_o_items_priority"),
        Index("ix_o_and_o_items_organization_id", "organization_id"),
        Index("ix_o_and_o_items_status", "status"),
        Index("ix_o_and_o_items_assigned_owner_id", "assigned_owner_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = uuid_fk("organizations.id")

    oo_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'OBSTACLE'"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    raised_by_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    assigned_owner_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    source_department_id: Mapped[uuid.UUID | None] = uuid_fk("departments.id", nullable=True)

    priority: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'MEDIUM'"))
    business_impact: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'OPEN'"))
    outcome: Mapped[str | None] = mapped_column(String(100), nullable=True)

    resolution_evidence: Mapped[str | None] = mapped_column(Text, nullable=True)

    source_meeting_id: Mapped[uuid.UUID | None] = uuid_fk("meetings.id", nullable=True)
    source_agenda_id: Mapped[uuid.UUID | None] = uuid_fk("meeting_agendas.id", nullable=True)
