"""Role, role-permission and role-assignment routes.

API.md maps ``GET /roles`` and ``GET /permissions`` to ``role.read``, and
``POST/DELETE /role-assignments`` to ``role.assign``. Role creation, role updates
and role-permission management are separate capabilities so that "may grant an
existing role" and "may invent a new set of powers" are distinct authorities
(ADR-003: "Keep sensitive field/transition capabilities separate").
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, Response, status

from app.api.deps import (
    CurrentContext,
    RequestContext,
    get_permission_catalog_service,
    get_role_service,
)
from app.api.etag import require_if_match, set_etag
from app.api.partial import any_provided, provided
from app.core.clock import utcnow
from app.core.errors import ValidationFailedError
from app.modules.access.schemas import (
    PermissionListResponse,
    PermissionResponse,
    RoleAssignmentCreateRequest,
    RoleAssignmentEndRequest,
    RoleAssignmentListResponse,
    RoleAssignmentResponse,
    RoleCreateRequest,
    RoleListResponse,
    RolePermissionRequest,
    RoleResponse,
    RoleUpdateRequest,
)
from app.modules.access.service import PermissionCatalogService, RoleService

router = APIRouter(tags=["access"])


# ---------------------------------------------------------------------------
# Permission catalog
# ---------------------------------------------------------------------------


@router.get(
    "/permissions",
    response_model=PermissionListResponse,
    summary="List the permission catalog",
)
def list_permissions(
    context: RequestContext = CurrentContext,
    service: PermissionCatalogService = Depends(get_permission_catalog_service),
) -> PermissionListResponse:
    """Requires ``role.read``.

    Read-only by design: permissions are seeded reference data. An endpoint that
    could create a permission key would be an endpoint that creates authority.
    """
    rows = service.list_permissions(context.authorization)
    return PermissionListResponse(items=[PermissionResponse.from_model(row) for row in rows])


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------


@router.get("/roles", response_model=RoleListResponse, summary="List roles")
def list_roles(
    context: RequestContext = CurrentContext,
    service: RoleService = Depends(get_role_service),
    include_templates: bool = Query(True, description="Include seeded persona templates."),
) -> RoleListResponse:
    """Requires ``role.read``.

    Seeded persona templates (MD, MD Office, Department Head, Manager, Stavyan)
    appear with ``is_system_template: true``, no permissions and no organization.
    They cannot be assigned; an organization creates its own role from one.
    """
    roles = service.list_roles(context.authorization, include_templates=include_templates)
    return RoleListResponse(
        items=[
            RoleResponse.from_model(
                role,
                permissions=list(service.list_role_permission_keys(context.authorization, role.id)),
            )
            for role in roles
        ]
    )


@router.get("/roles/{role_id}", response_model=RoleResponse, summary="Read one role")
def get_role(
    role_id: uuid.UUID,
    response: Response,
    context: RequestContext = CurrentContext,
    service: RoleService = Depends(get_role_service),
) -> RoleResponse:
    """Requires ``role.read``."""
    role = service.get_role(context.authorization, role_id)
    permissions = list(service.list_role_permission_keys(context.authorization, role.id))
    set_etag(response, role.version)
    return RoleResponse.from_model(role, permissions=permissions)


@router.post(
    "/roles",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an organization role",
)
def create_role(
    response: Response,
    payload: RoleCreateRequest,
    context: RequestContext = CurrentContext,
    service: RoleService = Depends(get_role_service),
) -> RoleResponse:
    """Requires ``role.create`` at organization scope.

    The role is created with no permissions. Grants are a separate command, so
    creating a role never confers authority by itself.
    """
    role = service.create_role(
        context.authorization,
        key=payload.key,
        name=payload.name,
        description=payload.description,
        template_key=payload.template_key,
        actor=context.actor,
        reason=payload.reason,
    )
    set_etag(response, role.version)
    response.headers["Location"] = f"/api/v1/roles/{role.id}"
    return RoleResponse.from_model(role, permissions=[])


@router.patch("/roles/{role_id}", response_model=RoleResponse, summary="Update a role")
def update_role(
    role_id: uuid.UUID,
    request: Request,
    response: Response,
    payload: RoleUpdateRequest,
    context: RequestContext = CurrentContext,
    service: RoleService = Depends(get_role_service),
) -> RoleResponse:
    """Requires ``role.update`` at organization scope and ``If-Match``.

    Deactivating a role immediately removes its grants from every holder and
    revokes their sessions.
    """
    expected_version = require_if_match(request)
    if not any_provided(payload, "name", "description", "is_active"):
        raise ValidationFailedError("Supply at least one field to update.")

    role = service.update_role(
        context.authorization,
        role_id,
        expected_version=expected_version,
        actor=context.actor,
        name=provided(payload, "name"),
        description=provided(payload, "description"),
        is_active=provided(payload, "is_active"),
        reason=payload.reason,
    )
    permissions = list(service.list_role_permission_keys(context.authorization, role.id))
    set_etag(response, role.version)
    return RoleResponse.from_model(role, permissions=permissions)


# ---------------------------------------------------------------------------
# Role permissions
# ---------------------------------------------------------------------------


@router.post(
    "/roles/{role_id}/permissions",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Grant a permission to a role",
)
def grant_role_permission(
    role_id: uuid.UUID,
    payload: RolePermissionRequest,
    context: RequestContext = CurrentContext,
    service: RoleService = Depends(get_role_service),
) -> RoleResponse:
    """Requires ``role.permission.manage`` at organization scope **and** holding
    the granted permission at organization scope.

    The second condition is the anti-escalation rule from RBAC.md §4: "A user
    cannot grant a permission or scope they do not possess."
    """
    service.grant_permission(
        context.authorization,
        role_id,
        permission_key=payload.permission_key,
        actor=context.actor,
        reason=payload.reason,
    )
    role = service.get_role(context.authorization, role_id)
    permissions = list(service.list_role_permission_keys(context.authorization, role_id))
    return RoleResponse.from_model(role, permissions=permissions)


@router.delete(
    "/roles/{role_id}/permissions/{permission_key}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke a permission from a role",
)
def revoke_role_permission(
    role_id: uuid.UUID,
    permission_key: str,
    response: Response,
    context: RequestContext = CurrentContext,
    service: RoleService = Depends(get_role_service),
) -> Response:
    """Requires ``role.permission.manage`` at organization scope."""
    service.revoke_permission(
        context.authorization,
        role_id,
        permission_key=permission_key,
        actor=context.actor,
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


# ---------------------------------------------------------------------------
# Role assignments
# ---------------------------------------------------------------------------


@router.get(
    "/role-assignments",
    response_model=RoleAssignmentListResponse,
    summary="List role assignments",
)
def list_role_assignments(
    context: RequestContext = CurrentContext,
    service: RoleService = Depends(get_role_service),
    user_id: uuid.UUID | None = Query(None),
    include_revoked: bool = Query(False, description="Include ended assignments."),
) -> RoleAssignmentListResponse:
    """Requires ``role.read``.

    A department-scoped reader sees only department-scoped assignments for their
    own departments: who holds organization-wide authority is itself
    organization-level information.
    """
    rows = service.list_assignments(
        context.authorization, user_id=user_id, include_revoked=include_revoked
    )
    return RoleAssignmentListResponse(
        items=[RoleAssignmentResponse.from_model(row) for row in rows]
    )


@router.post(
    "/role-assignments",
    response_model=RoleAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Grant a scoped role",
)
def create_role_assignment(
    response: Response,
    payload: RoleAssignmentCreateRequest,
    context: RequestContext = CurrentContext,
    service: RoleService = Depends(get_role_service),
) -> RoleAssignmentResponse:
    """Requires ``role.assign`` at the requested scope, and the actor must hold
    every permission the role carries at that scope.

    Granting a role revokes the grantee's live sessions so the next request
    resolves the new authority.
    """
    assignment = service.create_assignment(
        context.authorization,
        user_id=payload.user_id,
        role_id=payload.role_id,
        scope_type=payload.scope_type,
        department_id=payload.department_id,
        effective_from=payload.effective_from or utcnow().date(),
        effective_to=payload.effective_to,
        actor=context.actor,
        reason=payload.reason,
    )
    response.headers["Location"] = f"/api/v1/role-assignments/{assignment.id}"
    return RoleAssignmentResponse.from_model(assignment)


@router.delete(
    "/role-assignments/{assignment_id}",
    response_model=RoleAssignmentResponse,
    summary="End a role assignment",
)
def end_role_assignment(
    assignment_id: uuid.UUID,
    payload: RoleAssignmentEndRequest | None = None,
    context: RequestContext = CurrentContext,
    service: RoleService = Depends(get_role_service),
) -> RoleAssignmentResponse:
    """Requires ``role.assign`` at the assignment's scope.

    Returns the ended assignment rather than ``204``: the row is preserved with
    ``revoked_at`` set, so the caller can see the recorded history (API.md:
    "preserve history/audit").
    """
    assignment = service.end_assignment(
        context.authorization,
        assignment_id,
        actor=context.actor,
        reason=payload.reason if payload else None,
    )
    return RoleAssignmentResponse.from_model(assignment)
