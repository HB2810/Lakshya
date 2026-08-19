"""Identity, access and audit foundation.

Creates the V0.1 identity/access tables from DATABASE.md §2 plus the append-only
audit table from ADR-005:

    organizations, departments, department_memberships, users, credentials,
    sessions, permissions, roles, role_permissions, role_assignments,
    audit_events

Design points worth reviewing:

* Every tenant-owned table carries ``organization_id``.
* ``(organization_id, id)`` unique constraints on ``departments``, ``users`` and
  ``roles`` exist so the composite foreign keys below can pin organization scope
  in the database, not only in service code (DATABASE.md §5).
* ``role_assignments`` references ``roles (organization_id, id)``. System role
  templates have ``organization_id IS NULL`` and therefore cannot satisfy that
  foreign key — a seeded persona template can never be assigned to a user.
* Partial unique indexes express "one *active* X": active department name/code,
  active department membership, active credential per user, and one active role
  assignment per user/role/scope.
* ``audit_events.organization_id`` is nullable. It is NULL only for
  pre-authentication security events where no organization can be resolved (a
  login attempt for an unknown address). See
  docs/implementation/PHASE2_FOUNDATION.md.

Revision ID: 0001
Revises: None
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # -- Tenant boundary --------------------------------------------------
    op.create_table(
        "organizations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("archived_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.CheckConstraint(
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name=op.f("ck_organizations_slug_format")
        ),
        sa.CheckConstraint(
            "(is_active AND archived_at IS NULL) OR (NOT is_active)",
            name=op.f("ck_organizations_archived_implies_inactive"),
        ),
        sa.CheckConstraint("length(btrim(name)) > 0", name=op.f("ck_organizations_name_not_blank")),
        sa.CheckConstraint(
            "length(btrim(timezone)) > 0", name=op.f("ck_organizations_timezone_not_blank")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_organizations")),
        sa.UniqueConstraint("slug", name="uq_organizations_slug"),
    )

    # -- Permission catalog (reference data, seeded in 0003) --------------
    op.create_table(
        "permissions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("resource", sa.String(length=60), nullable=False),
        sa.Column("action", sa.String(length=60), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "key ~ '^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$'", name=op.f("ck_permissions_key_format")
        ),
        sa.CheckConstraint(
            "length(btrim(action)) > 0", name=op.f("ck_permissions_action_not_blank")
        ),
        sa.CheckConstraint(
            "length(btrim(resource)) > 0", name=op.f("ck_permissions_resource_not_blank")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_permissions")),
        sa.UniqueConstraint("key", name="uq_permissions_key"),
    )
    op.create_index("ix_permissions_resource", "permissions", ["resource"], unique=False)

    # -- Departments ------------------------------------------------------
    op.create_table(
        "departments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("parent_department_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("archived_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.CheckConstraint(
            "(is_active AND archived_at IS NULL) OR (NOT is_active)",
            name=op.f("ck_departments_archived_implies_inactive"),
        ),
        sa.CheckConstraint(
            "code IS NULL OR length(btrim(code)) > 0", name=op.f("ck_departments_code_not_blank")
        ),
        sa.CheckConstraint("length(btrim(name)) > 0", name=op.f("ck_departments_name_not_blank")),
        sa.CheckConstraint(
            "parent_department_id IS NULL OR parent_department_id <> id",
            name=op.f("ck_departments_parent_is_not_self"),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "parent_department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_departments_parent_same_organization",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_departments_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_departments")),
        sa.UniqueConstraint("organization_id", "id", name="uq_departments_organization_id_id"),
    )
    op.create_index(
        "ix_departments_organization_id_is_active",
        "departments",
        ["organization_id", "is_active"],
        unique=False,
    )
    op.create_index(
        "ix_departments_parent_department_id", "departments", ["parent_department_id"], unique=False
    )
    op.create_index(
        "uq_departments_active_code",
        "departments",
        ["organization_id", sa.literal_column("lower(code)")],
        unique=True,
        postgresql_where=sa.text("is_active AND code IS NOT NULL"),
    )
    op.create_index(
        "uq_departments_active_name",
        "departments",
        ["organization_id", sa.literal_column("lower(name)")],
        unique=True,
        postgresql_where=sa.text("is_active"),
    )

    # -- Roles ------------------------------------------------------------
    op.create_table(
        "roles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=True),
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "is_system_template", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("template_key", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.CheckConstraint("key ~ '^[a-z][a-z0-9_]*$'", name=op.f("ck_roles_key_format")),
        sa.CheckConstraint(
            "(is_system_template AND organization_id IS NULL) "
            "OR (NOT is_system_template AND organization_id IS NOT NULL)",
            name=op.f("ck_roles_template_has_no_organization"),
        ),
        sa.CheckConstraint("length(btrim(name)) > 0", name=op.f("ck_roles_name_not_blank")),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_roles_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_roles")),
        sa.UniqueConstraint("organization_id", "id", name="uq_roles_organization_id_id"),
    )
    op.create_index(
        "ix_roles_organization_id_is_active",
        "roles",
        ["organization_id", "is_active"],
        unique=False,
    )
    op.create_index(
        "uq_roles_organization_key",
        "roles",
        ["organization_id", "key"],
        unique=True,
        postgresql_where=sa.text("organization_id IS NOT NULL"),
    )
    op.create_index(
        "uq_roles_organization_name",
        "roles",
        ["organization_id", sa.literal_column("lower(name)")],
        unique=True,
        postgresql_where=sa.text("organization_id IS NOT NULL"),
    )
    op.create_index(
        "uq_roles_template_key",
        "roles",
        ["key"],
        unique=True,
        postgresql_where=sa.text("organization_id IS NULL"),
    )

    # -- Users ------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("normalized_email", sa.String(length=320), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("disabled_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("disabled_reason", sa.Text(), nullable=True),
        sa.Column("last_login_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.CheckConstraint(
            "position('@' in email) > 1", name=op.f("ck_users_email_has_local_and_domain")
        ),
        sa.CheckConstraint(
            "(is_active AND disabled_at IS NULL) OR (NOT is_active AND disabled_at IS NOT NULL)",
            name=op.f("ck_users_disabled_state_consistent"),
        ),
        sa.CheckConstraint("length(btrim(email)) > 0", name=op.f("ck_users_email_not_blank")),
        sa.CheckConstraint(
            "length(btrim(full_name)) > 0", name=op.f("ck_users_full_name_not_blank")
        ),
        sa.CheckConstraint(
            "normalized_email = lower(normalized_email)",
            name=op.f("ck_users_normalized_email_lower"),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_users_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("organization_id", "id", name="uq_users_organization_id_id"),
        sa.UniqueConstraint(
            "organization_id", "normalized_email", name="uq_users_organization_id_normalized_email"
        ),
    )
    # Login resolves an account by normalized email before the organization is
    # known, so this lookup needs its own index.
    op.create_index("ix_users_normalized_email", "users", ["normalized_email"], unique=False)
    op.create_index(
        "ix_users_organization_id_is_active",
        "users",
        ["organization_id", "is_active"],
        unique=False,
    )

    # -- Audit ------------------------------------------------------------
    op.create_table(
        "audit_events",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=True),
        sa.Column(
            "occurred_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("entity_type", sa.String(length=60), nullable=False),
        sa.Column("entity_id", sa.UUID(), nullable=True),
        sa.Column("actor_type", sa.String(length=20), nullable=False),
        sa.Column("actor_user_id", sa.UUID(), nullable=True),
        sa.Column("actor_label", sa.String(length=120), nullable=True),
        sa.Column("source", sa.String(length=20), nullable=False),
        sa.Column("correlation_id", sa.String(length=64), nullable=False),
        sa.Column("causation_id", sa.String(length=64), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("before_state", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("after_state", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "payload_schema_version", sa.Integer(), server_default=sa.text("1"), nullable=False
        ),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=256), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "(actor_type = 'user' AND actor_user_id IS NOT NULL) OR actor_type <> 'user'",
            name=op.f("ck_audit_events_user_actor_has_id"),
        ),
        sa.CheckConstraint(
            "actor_type IN ('user', 'system', 'anonymous')",
            name=op.f("ck_audit_events_actor_type_allowed"),
        ),
        sa.CheckConstraint(
            "source IN ('api', 'worker', 'cli', 'migration')",
            name=op.f("ck_audit_events_source_allowed"),
        ),
        sa.CheckConstraint(
            "length(btrim(action)) > 0", name=op.f("ck_audit_events_action_not_blank")
        ),
        sa.CheckConstraint(
            "length(btrim(correlation_id)) > 0",
            name=op.f("ck_audit_events_correlation_id_not_blank"),
        ),
        sa.CheckConstraint(
            "length(btrim(entity_type)) > 0", name=op.f("ck_audit_events_entity_type_not_blank")
        ),
        sa.CheckConstraint(
            "payload_schema_version >= 1",
            name=op.f("ck_audit_events_payload_schema_version_positive"),
        ),
        # RESTRICT on the actor: an audited action's actor must remain
        # resolvable, so a user row that is referenced by audit history cannot be
        # deleted out from under it.
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.id"],
            name=op.f("fk_audit_events_actor_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_audit_events_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_audit_events")),
    )
    op.create_index(
        "ix_audit_events_action_timeline",
        "audit_events",
        ["organization_id", "action", sa.literal_column("occurred_at DESC")],
        unique=False,
    )
    op.create_index(
        "ix_audit_events_actor_timeline",
        "audit_events",
        ["actor_user_id", sa.literal_column("occurred_at DESC")],
        unique=False,
    )
    op.create_index(
        "ix_audit_events_correlation_id", "audit_events", ["correlation_id"], unique=False
    )
    op.create_index(
        "ix_audit_events_entity_timeline",
        "audit_events",
        ["organization_id", "entity_type", "entity_id", sa.literal_column("occurred_at DESC")],
        unique=False,
    )

    # -- Credentials ------------------------------------------------------
    op.create_table(
        "credentials",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "kind", sa.String(length=32), server_default=sa.text("'password'"), nullable=False
        ),
        # Argon2id encoded hash only. There is no plaintext column, by design.
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column(
            "algorithm", sa.String(length=32), server_default=sa.text("'argon2id'"), nullable=False
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("password_updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column(
            "must_change_password", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
        sa.Column(
            "failed_attempt_count", sa.Integer(), server_default=sa.text("0"), nullable=False
        ),
        sa.Column("last_failed_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("last_verified_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("kind IN ('password')", name=op.f("ck_credentials_kind_allowed")),
        sa.CheckConstraint(
            "failed_attempt_count >= 0",
            name=op.f("ck_credentials_failed_attempt_count_non_negative"),
        ),
        sa.CheckConstraint(
            "length(password_hash) > 0", name=op.f("ck_credentials_password_hash_present")
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "user_id"],
            ["users.organization_id", "users.id"],
            name="fk_credentials_user_same_organization",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_credentials_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_credentials")),
    )
    op.create_index(
        "uq_credentials_active_per_user_kind",
        "credentials",
        ["user_id", "kind"],
        unique=True,
        postgresql_where=sa.text("is_active"),
    )

    # -- Department memberships -------------------------------------------
    op.create_table(
        "department_memberships",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("department_id", sa.UUID(), nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("started_on", sa.Date(), nullable=False),
        sa.Column("ended_on", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "ended_on IS NULL OR ended_on >= started_on",
            name=op.f("ck_department_memberships_end_after_start"),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_department_memberships_department_same_organization",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "user_id"],
            ["users.organization_id", "users.id"],
            name="fk_department_memberships_user_same_organization",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_department_memberships_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_department_memberships")),
    )
    op.create_index(
        "ix_department_memberships_department_id_ended_on",
        "department_memberships",
        ["department_id", "ended_on"],
        unique=False,
    )
    op.create_index(
        "ix_department_memberships_user_id_ended_on",
        "department_memberships",
        ["user_id", "ended_on"],
        unique=False,
    )
    op.create_index(
        "uq_department_memberships_active",
        "department_memberships",
        ["user_id", "department_id"],
        unique=True,
        postgresql_where=sa.text("ended_on IS NULL"),
    )

    # -- Role assignments -------------------------------------------------
    op.create_table(
        "role_assignments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role_id", sa.UUID(), nullable=False),
        sa.Column("scope_type", sa.String(length=20), nullable=False),
        sa.Column("department_id", sa.UUID(), nullable=True),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_to", sa.Date(), nullable=True),
        sa.Column("granted_by_user_id", sa.UUID(), nullable=True),
        sa.Column("revoked_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("revoked_by_user_id", sa.UUID(), nullable=True),
        sa.Column("revoked_reason", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "(scope_type = 'organization' AND department_id IS NULL) "
            "OR (scope_type = 'department' AND department_id IS NOT NULL)",
            name=op.f("ck_role_assignments_scope_matches_department"),
        ),
        sa.CheckConstraint(
            "scope_type IN ('organization', 'department')",
            name=op.f("ck_role_assignments_scope_type_allowed"),
        ),
        sa.CheckConstraint(
            "effective_to IS NULL OR effective_to >= effective_from",
            name=op.f("ck_role_assignments_effective_period_ordered"),
        ),
        sa.CheckConstraint(
            "revoked_reason IS NULL OR revoked_at IS NOT NULL",
            name=op.f("ck_role_assignments_revocation_consistent"),
        ),
        sa.ForeignKeyConstraint(
            ["granted_by_user_id"],
            ["users.id"],
            name=op.f("fk_role_assignments_granted_by_user_id_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_role_assignments_department_same_organization",
            ondelete="RESTRICT",
        ),
        # Also makes system role templates unassignable: their organization_id is
        # NULL, so no template row can satisfy this composite key.
        sa.ForeignKeyConstraint(
            ["organization_id", "role_id"],
            ["roles.organization_id", "roles.id"],
            name="fk_role_assignments_role_same_organization",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "user_id"],
            ["users.organization_id", "users.id"],
            name="fk_role_assignments_user_same_organization",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_role_assignments_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["revoked_by_user_id"],
            ["users.id"],
            name=op.f("fk_role_assignments_revoked_by_user_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_role_assignments")),
    )
    op.create_index(
        "ix_role_assignments_department_id", "role_assignments", ["department_id"], unique=False
    )
    # Drives the effective-permission query on every authenticated request.
    op.create_index(
        "ix_role_assignments_live_lookup",
        "role_assignments",
        ["user_id", "organization_id"],
        unique=False,
        postgresql_where=sa.text("revoked_at IS NULL"),
    )
    op.create_index("ix_role_assignments_role_id", "role_assignments", ["role_id"], unique=False)
    op.create_index(
        "uq_role_assignments_active_department_scope",
        "role_assignments",
        ["user_id", "role_id", "department_id"],
        unique=True,
        postgresql_where=sa.text("revoked_at IS NULL AND scope_type = 'department'"),
    )
    op.create_index(
        "uq_role_assignments_active_organization_scope",
        "role_assignments",
        ["user_id", "role_id"],
        unique=True,
        postgresql_where=sa.text("revoked_at IS NULL AND scope_type = 'organization'"),
    )

    # -- Role permissions -------------------------------------------------
    op.create_table(
        "role_permissions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("role_id", sa.UUID(), nullable=False),
        sa.Column("permission_id", sa.UUID(), nullable=False),
        sa.Column("granted_by_user_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["granted_by_user_id"],
            ["users.id"],
            name=op.f("fk_role_permissions_granted_by_user_id_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["permission_id"],
            ["permissions.id"],
            name=op.f("fk_role_permissions_permission_id_permissions"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            name=op.f("fk_role_permissions_role_id_roles"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_role_permissions")),
        sa.UniqueConstraint(
            "role_id", "permission_id", name="uq_role_permissions_role_id_permission_id"
        ),
    )
    op.create_index(
        "ix_role_permissions_permission_id", "role_permissions", ["permission_id"], unique=False
    )

    # -- Sessions ---------------------------------------------------------
    op.create_table(
        "sessions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        # SHA-256 (base64url) of the opaque session token. Never the token.
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("csrf_token_hash", sa.String(length=64), nullable=False),
        sa.Column("issued_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("expires_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("last_activity_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("revoked_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("revoked_reason", sa.String(length=32), nullable=True),
        sa.Column("rotated_from_session_id", sa.UUID(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=256), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "revoked_reason IS NULL OR revoked_reason IN "
            "('logout', 'rotated', 'absolute_expiry', 'idle_timeout', 'account_disabled', "
            "'password_changed', 'role_assignment_changed', 'security_action')",
            name=op.f("ck_sessions_revoked_reason_allowed"),
        ),
        sa.CheckConstraint("expires_at > issued_at", name=op.f("ck_sessions_expiry_after_issue")),
        sa.CheckConstraint(
            "revoked_reason IS NULL OR revoked_at IS NOT NULL",
            name=op.f("ck_sessions_revocation_consistent"),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "user_id"],
            ["users.organization_id", "users.id"],
            name="fk_sessions_user_same_organization",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_sessions_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["rotated_from_session_id"],
            ["sessions.id"],
            name=op.f("fk_sessions_rotated_from_session_id_sessions"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sessions")),
        sa.UniqueConstraint("token_hash", name="uq_sessions_token_hash"),
    )
    op.create_index(
        "ix_sessions_expires_at_live",
        "sessions",
        ["expires_at"],
        unique=False,
        postgresql_where=sa.text("revoked_at IS NULL"),
    )
    op.create_index(
        "ix_sessions_user_id_revoked_at", "sessions", ["user_id", "revoked_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index(
        "ix_sessions_expires_at_live",
        table_name="sessions",
        postgresql_where=sa.text("revoked_at IS NULL"),
    )
    op.drop_index("ix_sessions_user_id_revoked_at", table_name="sessions")
    op.drop_table("sessions")

    op.drop_index("ix_role_permissions_permission_id", table_name="role_permissions")
    op.drop_table("role_permissions")

    op.drop_index("ix_role_assignments_department_id", table_name="role_assignments")
    op.drop_index(
        "ix_role_assignments_live_lookup",
        table_name="role_assignments",
        postgresql_where=sa.text("revoked_at IS NULL"),
    )
    op.drop_index("ix_role_assignments_role_id", table_name="role_assignments")
    op.drop_index(
        "uq_role_assignments_active_department_scope",
        table_name="role_assignments",
        postgresql_where=sa.text("revoked_at IS NULL AND scope_type = 'department'"),
    )
    op.drop_index(
        "uq_role_assignments_active_organization_scope",
        table_name="role_assignments",
        postgresql_where=sa.text("revoked_at IS NULL AND scope_type = 'organization'"),
    )
    op.drop_table("role_assignments")

    op.drop_index(
        "ix_department_memberships_department_id_ended_on", table_name="department_memberships"
    )
    op.drop_index("ix_department_memberships_user_id_ended_on", table_name="department_memberships")
    op.drop_index(
        "uq_department_memberships_active",
        table_name="department_memberships",
        postgresql_where=sa.text("ended_on IS NULL"),
    )
    op.drop_table("department_memberships")

    op.drop_index(
        "uq_credentials_active_per_user_kind",
        table_name="credentials",
        postgresql_where=sa.text("is_active"),
    )
    op.drop_table("credentials")

    op.drop_index("ix_audit_events_action_timeline", table_name="audit_events")
    op.drop_index("ix_audit_events_actor_timeline", table_name="audit_events")
    op.drop_index("ix_audit_events_correlation_id", table_name="audit_events")
    op.drop_index("ix_audit_events_entity_timeline", table_name="audit_events")
    op.drop_table("audit_events")

    op.drop_index("ix_users_normalized_email", table_name="users")
    op.drop_index("ix_users_organization_id_is_active", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_roles_organization_id_is_active", table_name="roles")
    op.drop_index(
        "uq_roles_organization_key",
        table_name="roles",
        postgresql_where=sa.text("organization_id IS NOT NULL"),
    )
    op.drop_index(
        "uq_roles_organization_name",
        table_name="roles",
        postgresql_where=sa.text("organization_id IS NOT NULL"),
    )
    op.drop_index(
        "uq_roles_template_key",
        table_name="roles",
        postgresql_where=sa.text("organization_id IS NULL"),
    )
    op.drop_table("roles")

    op.drop_index("ix_departments_organization_id_is_active", table_name="departments")
    op.drop_index("ix_departments_parent_department_id", table_name="departments")
    op.drop_index(
        "uq_departments_active_code",
        table_name="departments",
        postgresql_where=sa.text("is_active AND code IS NOT NULL"),
    )
    op.drop_index(
        "uq_departments_active_name",
        table_name="departments",
        postgresql_where=sa.text("is_active"),
    )
    op.drop_table("departments")

    op.drop_index("ix_permissions_resource", table_name="permissions")
    op.drop_table("permissions")

    op.drop_table("organizations")
