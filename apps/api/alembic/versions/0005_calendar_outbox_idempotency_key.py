"""Add idempotency_key column and unique constraint to calendar_sync_outbox table.

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-26 12:35:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "calendar_sync_outbox",
        sa.Column("idempotency_key", sa.String(255), nullable=True),
    )
    # Populate default idempotency_key for existing rows if any
    op.execute("UPDATE calendar_sync_outbox SET idempotency_key = concat('outbox_', id) WHERE idempotency_key IS NULL")
    
    op.alter_column("calendar_sync_outbox", "idempotency_key", nullable=False)
    
    op.create_unique_constraint(
        "uq_calendar_sync_outbox_org_idempotency",
        "calendar_sync_outbox",
        ["organization_id", "idempotency_key"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_calendar_sync_outbox_org_idempotency",
        "calendar_sync_outbox",
        type_="unique",
    )
    op.drop_column("calendar_sync_outbox", "idempotency_key")
