"""Single import surface for every mapped model.

Alembic's ``target_metadata`` and the test schema builder import this module so
no table can be forgotten by autogenerate. Nothing else should import it.
"""

from __future__ import annotations

from app.db.base import Base
from app.modules.access.models import Permission, Role, RoleAssignment, RolePermission
from app.modules.audit.models import AuditEvent
from app.modules.identity.models import Credential, User, UserSession
from app.modules.organization.models import Department, DepartmentMembership, Organization

__all__ = [
    "AuditEvent",
    "Base",
    "Credential",
    "Department",
    "DepartmentMembership",
    "Organization",
    "Permission",
    "Role",
    "RoleAssignment",
    "RolePermission",
    "User",
    "UserSession",
]
