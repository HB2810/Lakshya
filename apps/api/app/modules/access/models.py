"""Permission, Role, RolePermission and RoleAssignment persistence models.

ADR-003 / RBAC.md: authorization is **data-driven**. There is no
``if role == "MD"`` branch anywhere in LAKSHYA. A request is allowed when:

    permission granted by an active role assignment
    AND organization scope matches
    AND department/resource scope permits access
    AND the domain invariant permits the transition

(ARCHITECTURE.md §8). Roles and their permissions are rows, so Stavya can change
policy without a code change.
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
from app.modules.access.catalog import ScopeType

_SCOPE_TYPES_SQL = ", ".join(repr(scope.value) for scope in ScopeType)


class Permission(Base, TimestampMixin):
    """A stable action identifier.

    DATABASE.md §2: "globally unique permission key". Permissions are reference
    data seeded by a versioned data migration, never created at runtime — an API
    that could mint permission keys would let a caller invent authority.
    """

    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint("key", name="uq_permissions_key"),
        # Mirrors app.modules.access.catalog.PERMISSION_KEY_PATTERN so a manual
        # INSERT cannot introduce a malformed key.
        CheckConstraint(
            "key ~ '^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$'",
            name="key_format",
        ),
        CheckConstraint("length(btrim(resource)) > 0", name="resource_not_blank"),
        CheckConstraint("length(btrim(action)) > 0", name="action_not_blank"),
        Index("ix_permissions_resource", "resource"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    key: Mapped[str] = mapped_column(String(120), nullable=False)
    resource: Mapped[str] = mapped_column(String(60), nullable=False)
    action: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)


class Role(Base, TimestampMixin, VersionMixin):
    """A named bundle of permissions.

    Two kinds of row:

    * **System template** (``organization_id IS NULL``,
      ``is_system_template = true``) — a seeded persona such as MD or Stavyan.
      Templates are *not assignable*: ``role_assignments`` has a composite
      foreign key to ``roles (organization_id, id)``, which a NULL-organization
      row can never satisfy. A template is a starting point an organization
      copies, so a seeded persona can never silently become live authority.
    * **Organization role** (``organization_id`` set) — the assignable role that
      actually carries grants.
    """

    __tablename__ = "roles"
    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_roles_organization_id_id"),
        CheckConstraint(
            "(is_system_template AND organization_id IS NULL) "
            "OR (NOT is_system_template AND organization_id IS NOT NULL)",
            name="template_has_no_organization",
        ),
        CheckConstraint("length(btrim(name)) > 0", name="name_not_blank"),
        CheckConstraint("key ~ '^[a-z][a-z0-9_]*$'", name="key_format"),
        # "unique name per organization" (DATABASE.md §2), case-insensitive.
        Index(
            "uq_roles_organization_key",
            "organization_id",
            "key",
            unique=True,
            postgresql_where=text("organization_id IS NOT NULL"),
        ),
        Index(
            "uq_roles_organization_name",
            "organization_id",
            text("lower(name)"),
            unique=True,
            postgresql_where=text("organization_id IS NOT NULL"),
        ),
        Index(
            "uq_roles_template_key",
            "key",
            unique=True,
            postgresql_where=text("organization_id IS NULL"),
        ),
        Index("ix_roles_organization_id_is_active", "organization_id", "is_active"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=True
    )

    key: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_system_template: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))

    #: Provenance when this role was instantiated from a seeded persona.
    #: Recorded for traceability only; it confers nothing.
    template_key: Mapped[str | None] = mapped_column(String(64), nullable=True)


class RolePermission(Base):
    """Mapping of a role to a permission.

    ``granted_by_user_id`` records who extended the role's authority. Every
    grant and revocation also writes an audit event (SECURITY.md §4).
    """

    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint(
            "role_id", "permission_id", name="uq_role_permissions_role_id_permission_id"
        ),
        Index("ix_role_permissions_permission_id", "permission_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    permission_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("permissions.id", ondelete="RESTRICT"), nullable=False
    )
    granted_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID_PK, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        UTC_TIMESTAMP, nullable=False, server_default=text("now()")
    )


class RoleAssignment(Base, TimestampMixin):
    """A user's role at organization or department scope, with effective dates.

    Ending an assignment sets ``revoked_at`` — rows are never deleted, so the
    history of who held what authority when is preserved (API.md: "preserve
    history/audit").

    TODO REQUIRES BUSINESS DECISION (RBAC.md §4, §6.3): a department-scoped
    assignment grants authority over **exactly that department**, not its
    descendants. Inheriting down a hierarchy requires an authoritative reporting
    structure that Stavya has not yet defined, and guessing would silently widen
    authority. See ``authorization.py``.
    """

    __tablename__ = "role_assignments"
    __table_args__ = (
        ForeignKeyConstraint(
            ["organization_id", "user_id"],
            ["users.organization_id", "users.id"],
            name="fk_role_assignments_user_same_organization",
            ondelete="RESTRICT",
        ),
        # Pins the role to the same organization AND makes system templates
        # unassignable (their organization_id is NULL).
        ForeignKeyConstraint(
            ["organization_id", "role_id"],
            ["roles.organization_id", "roles.id"],
            name="fk_role_assignments_role_same_organization",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_role_assignments_department_same_organization",
            ondelete="RESTRICT",
        ),
        CheckConstraint(f"scope_type IN ({_SCOPE_TYPES_SQL})", name="scope_type_allowed"),
        CheckConstraint(
            "(scope_type = 'organization' AND department_id IS NULL) "
            "OR (scope_type = 'department' AND department_id IS NOT NULL)",
            name="scope_matches_department",
        ),
        CheckConstraint(
            "effective_to IS NULL OR effective_to >= effective_from",
            name="effective_period_ordered",
        ),
        CheckConstraint(
            "revoked_reason IS NULL OR revoked_at IS NOT NULL",
            name="revocation_consistent",
        ),
        # "One active role assignment per equivalent user/role/scope"
        # (DATABASE.md §5). Two partial indexes because a NULL department_id
        # would not collide in a single composite unique index.
        Index(
            "uq_role_assignments_active_organization_scope",
            "user_id",
            "role_id",
            unique=True,
            postgresql_where=text("revoked_at IS NULL AND scope_type = 'organization'"),
        ),
        Index(
            "uq_role_assignments_active_department_scope",
            "user_id",
            "role_id",
            "department_id",
            unique=True,
            postgresql_where=text("revoked_at IS NULL AND scope_type = 'department'"),
        ),
        # Drives the effective-permission query on every authenticated request.
        Index(
            "ix_role_assignments_live_lookup",
            "user_id",
            "organization_id",
            postgresql_where=text("revoked_at IS NULL"),
        ),
        Index("ix_role_assignments_role_id", "role_id"),
        Index("ix_role_assignments_department_id", "department_id"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID_PK, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)
    role_id: Mapped[uuid.UUID] = mapped_column(UUID_PK, nullable=False)

    scope_type: Mapped[str] = mapped_column(String(20), nullable=False)
    department_id: Mapped[uuid.UUID | None] = mapped_column(UUID_PK, nullable=True)

    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)

    granted_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID_PK, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    revoked_at: Mapped[datetime | None] = mapped_column(UTC_TIMESTAMP, nullable=True)
    revoked_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID_PK, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    revoked_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
