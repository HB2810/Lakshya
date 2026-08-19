"""Seed the permission-key catalog and the persona role templates.

DATABASE.md §9: "Seed only stable permission keys and optional role templates
through versioned data migrations. Organization-specific policy and users are
application-managed data, not hard-coded seeds."

**This migration grants nothing to anybody.**

It inserts the stable permission keys (identifiers — they confer no authority)
and the five Stavya persona templates (MD, MD Office, Department Head, Manager,
Employee) **with no permissions attached**, because RBAC.md §3 still marks the
identity/access matrix ``REQUIRES BUSINESS DECISION`` and ADR-006 states that
"unresolved role grants must not be invented or broadly seeded".

Consequences a reviewer should expect:

* After ``alembic upgrade head`` on an empty database, every protected endpoint
  denies every caller. That is deny-by-default working correctly.
* Templates are organization-less and therefore unassignable (see the composite
  foreign key in ``0001``). An organization creates its own role from a template
  and receives grants once Stavya approves them.
* No Stavya organization, department or user is seeded. Those are application
  data; local development uses ``app/scripts/bootstrap_local.py``.

The seed is idempotent: re-running inserts nothing that already exists, so it is
safe on a database that has been partially seeded.

Revision ID: 0003
Revises: 0002
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import bindparam, text

from alembic import op
from app.modules.access.catalog import (
    PERMISSION_CATALOG,
    ROLE_TEMPLATES,
    assert_catalog_grants_nothing,
)

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Refuse to run if someone has attached permissions to a persona template
    # without an approved business decision.
    assert_catalog_grants_nothing()

    connection = op.get_bind()

    insert_permission = text(
        """
        INSERT INTO permissions (id, key, resource, action, description)
        VALUES (:id, :key, :resource, :action, :description)
        ON CONFLICT (key) DO NOTHING
        """
    ).bindparams(bindparam("id"))

    for permission in PERMISSION_CATALOG:
        connection.execute(
            insert_permission,
            {
                "id": uuid.uuid4(),
                "key": permission.key,
                "resource": permission.resource,
                "action": permission.action,
                "description": permission.description,
            },
        )

    # organization_id is NULL and is_system_template is true, which is what makes
    # these rows unassignable.
    insert_template = text(
        """
        INSERT INTO roles (
            id, organization_id, key, name, description, is_system_template, is_active
        )
        VALUES (:id, NULL, :key, :name, :description, true, true)
        ON CONFLICT DO NOTHING
        """
    ).bindparams(bindparam("id"))

    for template in ROLE_TEMPLATES:
        connection.execute(
            insert_template,
            {
                "id": uuid.uuid4(),
                "key": template.key,
                "name": template.name,
                "description": template.description,
            },
        )


def downgrade() -> None:
    connection = op.get_bind()

    # Remove only the template rows this migration created. Organization roles and
    # any role_permissions rows are application data and are left untouched: a
    # downgrade must not silently delete an administrator's configuration.
    connection.execute(
        text(
            """
            DELETE FROM roles
            WHERE organization_id IS NULL
              AND is_system_template
              AND key = ANY(:keys)
            """
        ),
        {"keys": [template.key for template in ROLE_TEMPLATES]},
    )

    # Permissions are removed only when nothing references them, so a downgrade
    # cannot destroy a live grant.
    connection.execute(
        text(
            """
            DELETE FROM permissions
            WHERE key = ANY(:keys)
              AND NOT EXISTS (
                  SELECT 1 FROM role_permissions
                  WHERE role_permissions.permission_id = permissions.id
              )
            """
        ),
        {"keys": [permission.key for permission in PERMISSION_CATALOG]},
    )
