"""Department routes (API.md "Users, roles and departments")."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, Response, status

from app.api.deps import CurrentContext, RequestContext, get_department_service
from app.api.etag import require_if_match, set_etag
from app.api.partial import any_provided, provided
from app.core.errors import ValidationFailedError
from app.modules.organization.schemas import (
    DepartmentCreateRequest,
    DepartmentListResponse,
    DepartmentResponse,
    DepartmentUpdateRequest,
)
from app.modules.organization.service import DepartmentService

router = APIRouter(prefix="/departments", tags=["departments"])

#: Bounded page size (SECURITY.md §5: "Limit ... pagination").
MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 50


@router.get("", response_model=DepartmentListResponse, summary="List readable departments")
def list_departments(
    context: RequestContext = CurrentContext,
    service: DepartmentService = Depends(get_department_service),
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    cursor: uuid.UUID | None = Query(None, description="Return departments after this id."),
    include_inactive: bool = Query(False),
) -> DepartmentListResponse:
    """Requires ``department.read``. Rows are scoped in SQL before pagination."""
    # One extra row tells us whether a further page exists, without a COUNT.
    rows = service.list_departments(
        context.authorization,
        limit=limit + 1,
        include_inactive=include_inactive,
        cursor=cursor,
    )
    page = list(rows[:limit])
    next_cursor = page[-1].id if len(rows) > limit and page else None
    return DepartmentListResponse(
        items=[DepartmentResponse.from_model(row) for row in page],
        next_cursor=next_cursor,
    )


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
    summary="Read one department",
)
def get_department(
    department_id: uuid.UUID,
    response: Response,
    context: RequestContext = CurrentContext,
    service: DepartmentService = Depends(get_department_service),
) -> DepartmentResponse:
    """Requires ``department.read`` for this department.

    Returns ``404`` for an identifier outside the caller's scope (API.md §2).
    """
    department = service.get_department(context.authorization, department_id)
    set_etag(response, department.version)
    return DepartmentResponse.from_model(department)


@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a department",
)
def create_department(
    response: Response,
    payload: DepartmentCreateRequest,
    context: RequestContext = CurrentContext,
    service: DepartmentService = Depends(get_department_service),
) -> DepartmentResponse:
    """Requires ``department.create`` at organization scope."""
    department = service.create_department(
        context.authorization,
        name=payload.name,
        code=payload.code,
        parent_department_id=payload.parent_department_id,
        actor=context.actor,
        reason=payload.reason,
    )
    set_etag(response, department.version)
    response.headers["Location"] = f"/api/v1/departments/{department.id}"
    return DepartmentResponse.from_model(department)


@router.patch(
    "/{department_id}",
    response_model=DepartmentResponse,
    summary="Update or archive a department",
)
def update_department(
    department_id: uuid.UUID,
    request: Request,
    response: Response,
    payload: DepartmentUpdateRequest,
    context: RequestContext = CurrentContext,
    service: DepartmentService = Depends(get_department_service),
) -> DepartmentResponse:
    """Requires ``department.update`` for this department and ``If-Match``.

    Archiving uses ``is_active: false``. Departments are never hard-deleted
    because memberships and role assignments reference them (DATABASE.md §7).
    """
    expected_version = require_if_match(request)
    if not any_provided(payload, "name", "code", "parent_department_id", "is_active"):
        raise ValidationFailedError("Supply at least one field to update.")

    department = service.update_department(
        context.authorization,
        department_id,
        expected_version=expected_version,
        actor=context.actor,
        name=provided(payload, "name"),
        code=provided(payload, "code"),
        parent_department_id=provided(payload, "parent_department_id"),
        is_active=provided(payload, "is_active"),
        reason=payload.reason,
    )
    set_etag(response, department.version)
    return DepartmentResponse.from_model(department)
