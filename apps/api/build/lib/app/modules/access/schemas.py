"""Role, permission and role-assignment API contracts."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.modules.access.catalog import ScopeType
from app.modules.access.models import Permission, Role, RoleAssignment

_REQUEST_CONFIG = ConfigDict(extra="forbid", str_strip_whitespace=True)

RoleKey = Annotated[str, Field(min_length=1, max_length=64, pattern=r"^[a-z][a-z0-9_]*$")]
RoleName = Annotated[str, Field(min_length=1, max_length=120)]
PermissionKey = Annotated[
    str, Field(min_length=3, max_length=120, pattern=r"^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$")
]
Reason = Annotated[str, Field(max_length=1000)]


class PermissionResponse(BaseModel):
    """One catalog entry."""

    key: str
    resource: str
    action: str
    description: str

    @classmethod
    def from_model(cls, permission: Permission) -> PermissionResponse:
        return cls(
            key=permission.key,
            resource=permission.resource,
            action=permission.action,
            description=permission.description,
        )


class PermissionListResponse(BaseModel):
    items: list[PermissionResponse]


class RoleResponse(BaseModel):
    """Role projection.

    ``is_system_template`` distinguishes a seeded persona (organization-less, no
    permissions, not assignable) from an assignable organization role.
    """

    id: uuid.UUID
    organization_id: uuid.UUID | None
    key: str
    name: str
    description: str | None
    is_system_template: bool
    is_active: bool
    template_key: str | None
    created_at: datetime
    updated_at: datetime
    version: int
    permissions: list[str] = Field(default_factory=list)

    @classmethod
    def from_model(cls, role: Role, *, permissions: list[str] | None = None) -> RoleResponse:
        return cls(
            id=role.id,
            organization_id=role.organization_id,
            key=role.key,
            name=role.name,
            description=role.description,
            is_system_template=role.is_system_template,
            is_active=role.is_active,
            template_key=role.template_key,
            created_at=role.created_at,
            updated_at=role.updated_at,
            version=role.version,
            permissions=permissions or [],
        )


class RoleListResponse(BaseModel):
    items: list[RoleResponse]


class RoleCreateRequest(BaseModel):
    """Create an assignable organization role.

    Permissions cannot be supplied here. Granting is a separate command with its
    own permission and its own anti-escalation check, so creating a role can never
    itself confer authority.
    """

    model_config = _REQUEST_CONFIG

    key: RoleKey
    name: RoleName
    description: Annotated[str, Field(max_length=2000)] | None = None
    template_key: RoleKey | None = None
    reason: Reason | None = None


class RoleUpdateRequest(BaseModel):
    model_config = _REQUEST_CONFIG

    name: RoleName | None = None
    description: Annotated[str, Field(max_length=2000)] | None = None
    is_active: bool | None = None
    reason: Reason | None = None


class RolePermissionRequest(BaseModel):
    model_config = _REQUEST_CONFIG

    permission_key: PermissionKey
    reason: Reason | None = None


class RoleAssignmentResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    role_id: uuid.UUID
    scope_type: ScopeType
    department_id: uuid.UUID | None
    effective_from: date
    effective_to: date | None
    granted_by_user_id: uuid.UUID | None
    revoked_at: datetime | None
    revoked_reason: str | None
    created_at: datetime

    @classmethod
    def from_model(cls, assignment: RoleAssignment) -> RoleAssignmentResponse:
        return cls(
            id=assignment.id,
            organization_id=assignment.organization_id,
            user_id=assignment.user_id,
            role_id=assignment.role_id,
            scope_type=ScopeType(assignment.scope_type),
            department_id=assignment.department_id,
            effective_from=assignment.effective_from,
            effective_to=assignment.effective_to,
            granted_by_user_id=assignment.granted_by_user_id,
            revoked_at=assignment.revoked_at,
            revoked_reason=assignment.revoked_reason,
            created_at=assignment.created_at,
        )


class RoleAssignmentListResponse(BaseModel):
    items: list[RoleAssignmentResponse]


class RoleAssignmentCreateRequest(BaseModel):
    """Grant a scoped role.

    ``organization_id`` is absent by design: the organization comes from the
    session. ``department_id`` is required at department scope and forbidden at
    organization scope.
    """

    model_config = _REQUEST_CONFIG

    user_id: uuid.UUID
    role_id: uuid.UUID
    scope_type: ScopeType
    department_id: uuid.UUID | None = None
    effective_from: date | None = None
    effective_to: date | None = None
    reason: Reason | None = None


class RoleAssignmentEndRequest(BaseModel):
    model_config = _REQUEST_CONFIG

    reason: Reason | None = None
