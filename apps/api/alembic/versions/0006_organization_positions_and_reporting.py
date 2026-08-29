"""Organization positions and reporting structure.

Revision ID: 0006_organization_positions_and_reporting
Revises: 0005_calendar_outbox_idempotency_key
Create Date: 2026-08-29 09:16:00.000000

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None



def upgrade() -> None:
    # 1. Create positions table
    op.create_table(
        "positions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("department_id", sa.UUID(), nullable=False),
        sa.Column("reports_to_position_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=True),
        sa.Column("is_leadership", sa.Boolean(), server_default=sa.text("false"), nullable=False),
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
            name="position_archived_implies_inactive",
        ),
        sa.CheckConstraint("length(btrim(title)) > 0", name="title_not_blank"),
        sa.CheckConstraint(
            "code IS NULL OR length(btrim(code)) > 0",
            name="position_code_not_blank",
        ),
        sa.CheckConstraint(
            "reports_to_position_id IS NULL OR reports_to_position_id <> id",
            name="reports_to_is_not_self",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_positions_department_same_organization",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "reports_to_position_id"],
            ["positions.organization_id", "positions.id"],
            name="fk_positions_reports_to_same_organization",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_positions_organization_id_organizations",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_positions")),
        sa.UniqueConstraint("organization_id", "id", name="uq_positions_organization_id_id"),
    )
    op.create_index(
        "ix_positions_organization_id_is_active",
        "positions",
        ["organization_id", "is_active"],
    )
    op.create_index("ix_positions_department_id", "positions", ["department_id"])
    op.create_index(
        "ix_positions_reports_to_position_id", "positions", ["reports_to_position_id"]
    )

    # 2. Create position_assignments table
    op.create_table(
        "position_assignments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("position_id", sa.UUID(), nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("started_on", sa.Date(), nullable=False),
        sa.Column("ended_on", sa.Date(), nullable=True),
        sa.Column("transfer_reason", sa.Text(), nullable=True),
        sa.Column("assigned_by_user_id", sa.UUID(), nullable=True),
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
            name="pos_assign_end_after_start",
        ),

        sa.ForeignKeyConstraint(
            ["organization_id", "user_id"],
            ["users.organization_id", "users.id"],
            name="fk_position_assignments_user_same_organization",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "position_id"],
            ["positions.organization_id", "positions.id"],
            name="fk_position_assignments_position_same_organization",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_position_assignments_organization_id_organizations",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["assigned_by_user_id"],
            ["users.id"],
            name="fk_position_assignments_assigned_by_user_id",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_position_assignments"),
    )
    op.create_index(
        "uq_position_assignments_active",
        "position_assignments",
        ["user_id", "position_id"],
        unique=True,
        postgresql_where=sa.text("ended_on IS NULL"),
    )
    op.create_index(
        "ix_position_assignments_position_id_ended_on",
        "position_assignments",
        ["position_id", "ended_on"],
    )
    op.create_index(
        "ix_position_assignments_user_id_ended_on",
        "position_assignments",
        ["user_id", "ended_on"],
    )


def downgrade() -> None:
    op.drop_table("position_assignments")
    op.drop_table("positions")
