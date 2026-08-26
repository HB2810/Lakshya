"""KPI engine persistence models.

Implements KPIDefinition and KPIValue.
"""

from __future__ import annotations

import uuid
from datetime import datetime, date

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import UTC_TIMESTAMP, UUID_PK, Base, TimestampMixin, VersionMixin, uuid_fk, uuid_pk


class KPIDefinition(Base, TimestampMixin, VersionMixin):
    """KPI metadata and threshold specification."""

    __tablename__ = "kpi_definitions"
    __table_args__ = (
        Index("ix_kpi_definitions_organization_id", "organization_id"),
        Index("ix_kpi_definitions_department_id", "department_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = uuid_fk("organizations.id")
    department_id: Mapped[uuid.UUID | None] = uuid_fk("departments.id", nullable=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    owner_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    accountable_leader_id: Mapped[uuid.UUID] = uuid_fk("users.id")

    unit: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'COUNT'"))
    measurement_frequency: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'WEEKLY'"))

    target_value: Mapped[float] = mapped_column(Float, nullable=False, server_default=text("0.0"))
    warning_threshold: Mapped[float | None] = mapped_column(Float, nullable=True)
    critical_threshold: Mapped[float | None] = mapped_column(Float, nullable=True)

    is_automated: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    data_source_config: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))


class KPIValue(Base, TimestampMixin):
    """Recorded actual value for a KPI."""

    __tablename__ = "kpi_values"
    __table_args__ = (
        Index("ix_kpi_values_kpi_definition_id", "kpi_definition_id"),
        Index("ix_kpi_values_recorded_date", "recorded_date"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    kpi_definition_id: Mapped[uuid.UUID] = uuid_fk("kpi_definitions.id", ondelete="CASCADE")

    actual_value: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    recorded_by_id: Mapped[uuid.UUID] = uuid_fk("users.id")
    source_meeting_id: Mapped[uuid.UUID | None] = uuid_fk("meetings.id", nullable=True)
