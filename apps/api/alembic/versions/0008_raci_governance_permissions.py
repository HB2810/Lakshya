"""Add stable RACI permission keys without granting them to any role.

Revision ID: 0008
Revises: 0007
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.modules.access.catalog import RACI_MANAGE, RACI_READ

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    statement = sa.text(
        """
        INSERT INTO permissions (id, key, resource, action, description)
        VALUES (:id, :key, 'raci', :action, :description)
        ON CONFLICT (key) DO NOTHING
        """
    )
    rows = (
        (RACI_READ, "read", "Read RACI on an already-visible work item."),
        (RACI_MANAGE, "manage", "Atomically replace RACI within granted scope."),
    )
    for key, action, description in rows:
        connection.execute(
            statement,
            {"id": uuid.uuid4(), "key": key, "action": action, "description": description},
        )


def downgrade() -> None:
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            DELETE FROM permissions
            WHERE key IN (:read_key, :manage_key)
              AND NOT EXISTS (
                  SELECT 1 FROM role_permissions
                  WHERE role_permissions.permission_id = permissions.id
              )
            """
        ),
        {"read_key": RACI_READ, "manage_key": RACI_MANAGE},
    )
