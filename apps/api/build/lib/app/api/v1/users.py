"""User and department-membership routes (API.md "Users, roles and departments")."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, Response, status

from app.api.deps import CurrentContext, RequestContext, get_user_service
from app.api.etag import require_if_match, set_etag
from app.api.partial import any_provided, provided
from app.core.clock import utcnow
from app.core.errors import ValidationFailedError
from app.modules.identity.schemas import (
    DepartmentMembershipCreateRequest,
    DepartmentMembershipEndRequest,
    DepartmentMembershipResponse,
    UserCreateRequest,
    UserListResponse,
    UserResponse,
    UserUpdateRequest,
)
from app.modules.identity.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 50


@router.get("", response_model=UserListResponse, summary="List readable users")
def list_users(
    context: RequestContext = CurrentContext,
    service: UserService = Depends(get_user_service),
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    cursor: uuid.UUID | None = Query(None, description="Return users after this id."),
    department_id: uuid.UUID | None = Query(None, description="Restrict to one department."),
    include_inactive: bool = Query(False),
) -> UserListResponse:
    """Requires ``user.read``. Rows are scoped in SQL before filter and pagination.

    ``department_id`` can only narrow the authorized set — it is applied on top of
    the scope predicate, so it cannot be used to reach another department.
    """
    rows = service.list_users(
        context.authorization,
        limit=limit + 1,
        include_inactive=include_inactive,
        department_id=department_id,
        cursor=cursor,
    )
    page = list(rows[:limit])
    next_cursor = page[-1].id if len(rows) > limit and page else None
    return UserListResponse(
        items=[UserResponse.from_model(row) for row in page],
        next_cursor=next_cursor,
    )


@router.get("/{user_id}", response_model=UserResponse, summary="Read one user")
def get_user(
    user_id: uuid.UUID,
    response: Response,
    context: RequestContext = CurrentContext,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Requires ``user.read`` in scope; ``404`` outside it (API.md §2)."""
    user = service.get_user(context.authorization, user_id)
    set_etag(response, user.version)
    return UserResponse.from_model(user)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Provision a user",
)
def create_user(
    response: Response,
    payload: UserCreateRequest,
    context: RequestContext = CurrentContext,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Requires ``user.create`` at organization scope.

    The new account has **no roles**: authority is granted separately through
    ``POST /role-assignments``, which applies its own anti-escalation check.
    """
    if payload.initial_password is not None and (
        len(payload.initial_password) < context.settings.password_min_length
    ):
        raise ValidationFailedError(
            "The initial password must be at least "
            f"{context.settings.password_min_length} characters.",
            field_errors={"initial_password": ["Too short."]},
        )

    user = service.create_user(
        context.authorization,
        full_name=payload.full_name,
        email=str(payload.email),
        actor=context.actor,
        initial_password=payload.initial_password,
        department_memberships=[
            (membership.department_id, membership.is_primary)
            for membership in payload.department_memberships
        ],
        reason=payload.reason,
    )
    set_etag(response, user.version)
    response.headers["Location"] = f"/api/v1/users/{user.id}"
    return UserResponse.from_model(user)


@router.patch("/{user_id}", response_model=UserResponse, summary="Update a user")
def update_user(
    user_id: uuid.UUID,
    request: Request,
    response: Response,
    payload: UserUpdateRequest,
    context: RequestContext = CurrentContext,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Requires ``user.update`` in scope and ``If-Match``.

    Setting ``is_active: false`` disables the account and revokes its sessions in
    the same transaction.
    """
    expected_version = require_if_match(request)
    if not any_provided(payload, "full_name", "email", "is_active", "disabled_reason"):
        raise ValidationFailedError("Supply at least one field to update.")

    email = provided(payload, "email")
    user = service.update_user(
        context.authorization,
        user_id,
        expected_version=expected_version,
        actor=context.actor,
        full_name=provided(payload, "full_name"),
        email=str(email) if isinstance(email, str) else email,
        is_active=provided(payload, "is_active"),
        disabled_reason=provided(payload, "disabled_reason"),
        reason=payload.reason,
    )
    set_etag(response, user.version)
    return UserResponse.from_model(user)


# ---------------------------------------------------------------------------
# Department memberships
# ---------------------------------------------------------------------------


@router.get(
    "/{user_id}/department-memberships",
    response_model=list[DepartmentMembershipResponse],
    summary="List a user's department memberships",
)
def list_memberships(
    user_id: uuid.UUID,
    context: RequestContext = CurrentContext,
    service: UserService = Depends(get_user_service),
    current_only: bool = Query(False, description="Exclude ended memberships."),
) -> list[DepartmentMembershipResponse]:
    """Requires ``user.read``. Ended memberships are included by default, because
    a transfer must remain explicable after the fact (DOMAIN_MODEL.md §3)."""
    rows = service.list_memberships(context.authorization, user_id, current_only=current_only)
    return [DepartmentMembershipResponse.from_model(row) for row in rows]


@router.post(
    "/{user_id}/department-memberships",
    response_model=DepartmentMembershipResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a department membership",
)
def add_membership(
    user_id: uuid.UUID,
    payload: DepartmentMembershipCreateRequest,
    context: RequestContext = CurrentContext,
    service: UserService = Depends(get_user_service),
) -> DepartmentMembershipResponse:
    """Requires ``user.update`` for the user and the target department."""
    membership = service.add_membership(
        context.authorization,
        user_id=user_id,
        department_id=payload.department_id,
        is_primary=payload.is_primary,
        started_on=payload.started_on or utcnow().date(),
        actor=context.actor,
        note=payload.note,
    )
    return DepartmentMembershipResponse.from_model(membership)


@router.post(
    "/{user_id}/department-memberships/{membership_id}:end",
    response_model=DepartmentMembershipResponse,
    summary="End a department membership",
)
def end_membership(
    user_id: uuid.UUID,
    membership_id: uuid.UUID,
    payload: DepartmentMembershipEndRequest,
    context: RequestContext = CurrentContext,
    service: UserService = Depends(get_user_service),
) -> DepartmentMembershipResponse:
    """Requires ``user.update``.

    A domain transition, so it uses the ``:end`` action form (API.md §1) rather
    than ``DELETE``: the row is retained with ``ended_on`` set, never deleted.
    """
    membership = service.end_membership(
        context.authorization,
        user_id=user_id,
        membership_id=membership_id,
        ended_on=payload.ended_on or utcnow().date(),
        actor=context.actor,
        reason=payload.reason,
    )
    return DepartmentMembershipResponse.from_model(membership)
