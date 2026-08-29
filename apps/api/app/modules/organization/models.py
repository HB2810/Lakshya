"""Organization, Department and DepartmentMembership persistence models.

DOMAIN_MODEL.md §3 and DATABASE.md §2 (identity and access).

Organization is the top-level security and data boundary. Every tenant-owned
table carries ``organization_id`` so cross-organization leakage is structurally
impossible rather than merely unlikely (ARCHITECTURE.md §6).

Cross-table organization consistency is enforced with composite foreign keys
referencing ``(organization_id, id)``, which DATABASE.md §5 endorses for
"highest-risk relationships". A department can therefore never be re-parented
into another organization, even by a defective service method or a manual SQL
statement.

Stavya's actual departments are NOT seeded anywhere: they are application-managed
data (DATABASE.md §9).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import UTC_TIMESTAMP, UUID_PK, Base, TimestampMixin, VersionMixin, uuid_pk

# Slug is used in URLs and login organization selection; keep it strict.
_SLUG_PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$"


class Organization(Base, TimestampMixin, VersionMixin):
    """Tenant, security boundary and business-settings holder.

    V0.1 serves a single Stavya organization, but the boundary is modelled now
    to avoid a later redesign (ARCHITECTURE.md §6).
    """

    __tablename__ = "organizations"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_organizations_slug"),
        CheckConstraint("length(btrim(name)) > 0", name="name_not_blank"),
        CheckConstraint(f"slug ~ '{_SLUG_PATTERN}'", name="slug_format"),
        CheckConstraint("length(btrim(timezone)) > 0", name="timezone_not_blank"),
        CheckConstraint(
            "(is_active AND archived_at IS NULL) OR (NOT is_active)",
            name="archived_implies_inactive",
        ),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(64), nullable=False)

    #: IANA timezone name. Used for business-calendar presentation only; all
    #: instants are stored in UTC (DATABASE.md §1). The specific Stavya value
    #: and the week-start convention are REQUIRES BUSINESS DECISION
    #: (DOMAIN_MODEL.md §10), so no default is assumed here.
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    archived_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)


class Department(Base, TimestampMixin, VersionMixin):
    """Operating unit within an organization.

    A nullable ``parent_department_id`` supports hierarchy without requiring it
    (DOMAIN_MODEL.md §3). Department ownership is not visibility: RBAC scope
    controls who can see what.
    """

    __tablename__ = "departments"
    __table_args__ = (
        # Target for the composite foreign keys that pin organization scope.
        UniqueConstraint("organization_id", "id", name="uq_departments_organization_id_id"),
        # A parent department must live in the same organization.
        ForeignKeyConstraint(
            ["organization_id", "parent_department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_departments_parent_same_organization",
            ondelete="RESTRICT",
        ),
        CheckConstraint(
            "parent_department_id IS NULL OR parent_department_id <> id",
            name="parent_is_not_self",
        ),
        CheckConstraint("length(btrim(name)) > 0", name="name_not_blank"),
        CheckConstraint("code IS NULL OR length(btrim(code)) > 0", name="code_not_blank"),
        CheckConstraint(
            "(is_active AND archived_at IS NULL) OR (NOT is_active)",
            name="archived_implies_inactive",
        ),
        # "unique active name/code per organization" (DATABASE.md §2). Partial
        # and case-insensitive: an archived department does not block reuse of
        # its name, and "Radiology" cannot coexist with "radiology".
        Index(
            "uq_departments_active_name",
            "organization_id",
            text("lower(name)"),
            unique=True,
            postgresql_where=text("is_active"),
        ),
        Index(
            "uq_departments_active_code",
            "organization_id",
            text("lower(code)"),
            unique=True,
            postgresql_where=text("is_active AND code IS NOT NULL"),
        ),
        Index("ix_departments_organization_id_is_active", "organization_id", "is_active"),
        Index("ix_departments_parent_department_id", "parent_department_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False
    )
    parent_department_id: Mapped[uuid.UUID | None] = mapped_column(UUID_PK, nullable=True)

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str | None] = mapped_column(String(32), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    archived_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)


class DepartmentMembership(Base, TimestampMixin):
    """Time-aware membership of a user in a department.

    Modelled separately from the user so transfers and additional memberships
    retain history (DOMAIN_MODEL.md §3). Ending a membership sets ``ended_on``;
    rows are never deleted, so historical relationships are preserved.

    TODO REQUIRES BUSINESS DECISION (DOMAIN_MODEL.md §10): whether one user may
    hold multiple *concurrent* active memberships. Until Stavya decides, the
    schema permits it (only duplicate active membership in the *same* department
    is blocked) and no rule is invented in code.
    """

    __tablename__ = "department_memberships"
    __table_args__ = (
        ForeignKeyConstraint(
            ["organization_id", "user_id"],
            ["users.organization_id", "users.id"],
            name="fk_department_memberships_user_same_organization",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_department_memberships_department_same_organization",
            ondelete="RESTRICT",
        ),
        CheckConstraint("ended_on IS NULL OR ended_on >= started_on", name="end_after_start"),
        # "no duplicate active membership" (DATABASE.md §2).
        Index(
            "uq_department_memberships_active",
            "user_id",
            "department_id",
            unique=True,
            postgresql_where=text("ended_on IS NULL"),
        ),
        Index(
            "ix_department_memberships_department_id_ended_on",
            "department_id",
            "ended_on",
        ),
        Index("ix_department_memberships_user_id_ended_on", "user_id", "ended_on"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)
    department_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)

    #: Marks the department a user primarily belongs to. It carries no
    #: authorization meaning: RBAC scope comes from role assignments only.
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))

    started_on: Mapped[date] = mapped_column(Date, nullable=False)
    ended_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    @property
    def is_current(self) -> bool:
        return self.ended_on is None


class Position(Base, TimestampMixin, VersionMixin):
    """A defined organizational post / position.

    Core principle: "A person is not a post." A post exists independently of
    whether a person occupies it. Reporting lines exist structurally between
    positions via ``reports_to_position_id``.
    """

    __tablename__ = "positions"
    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_positions_organization_id_id"),
        ForeignKeyConstraint(
            ["organization_id", "department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_positions_department_same_organization",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "reports_to_position_id"],
            ["positions.organization_id", "positions.id"],
            name="fk_positions_reports_to_same_organization",
            ondelete="RESTRICT",
        ),
        CheckConstraint(
            "reports_to_position_id IS NULL OR reports_to_position_id <> id",
            name="reports_to_is_not_self",
        ),
        CheckConstraint("length(btrim(title)) > 0", name="title_not_blank"),
        CheckConstraint("code IS NULL OR length(btrim(code)) > 0", name="position_code_not_blank"),
        CheckConstraint(
            "(is_active AND archived_at IS NULL) OR (NOT is_active)",
            name="position_archived_implies_inactive",
        ),
        Index("ix_positions_organization_id_is_active", "organization_id", "is_active"),
        Index("ix_positions_department_id", "department_id"),
        Index("ix_positions_reports_to_position_id", "reports_to_position_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False
    )
    department_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)
    reports_to_position_id: Mapped[uuid.UUID | None] = mapped_column(UUID_PK, nullable=True)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_leadership: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    archived_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)


class PositionAssignment(Base, TimestampMixin):
    """Effective-dated assignment of a person (User) to a Position.

    Retains complete history of who occupied what position when. When a user
    transfers positions, the active assignment is ended (ended_on set) and a new
    assignment is created.
    """

    __tablename__ = "position_assignments"
    __table_args__ = (
        ForeignKeyConstraint(
            ["organization_id", "user_id"],
            ["users.organization_id", "users.id"],
            name="fk_position_assignments_user_same_organization",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "position_id"],
            ["positions.organization_id", "positions.id"],
            name="fk_position_assignments_position_same_organization",
            ondelete="RESTRICT",
        ),
        CheckConstraint(
            "ended_on IS NULL OR ended_on >= started_on", name="pos_assign_end_after_start"
        ),
        Index(
            "uq_position_assignments_active",
            "user_id",
            "position_id",
            unique=True,
            postgresql_where=text("ended_on IS NULL"),
        ),
        Index(
            "ix_position_assignments_position_id_ended_on",
            "position_id",
            "ended_on",
        ),
        Index("ix_position_assignments_user_id_ended_on", "user_id", "ended_on"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)
    position_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)

    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    started_on: Mapped[date] = mapped_column(Date, nullable=False)
    ended_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    transfer_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID_PK, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    @property
    def is_current(self) -> bool:
        return self.ended_on is None

