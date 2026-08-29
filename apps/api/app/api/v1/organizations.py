"""Organization routes.

The caller can only ever address its own organization, so the resource path is
``/organizations/current`` rather than ``/organizations/{id}``. There is no list
endpoint and no by-id endpoint: cross-tenant addressing is not expressible, which
removes a whole class of IDOR bug rather than defending against it.
"""

from __future__ import annotations

from typing import Any
import uuid

from fastapi import APIRouter, Depends, Request, Response

from app.api.deps import CurrentContext, RequestContext, get_organization_service, get_position_service
from app.api.etag import require_if_match, set_etag
from app.api.partial import any_provided, provided
from app.modules.organization.schemas import (
    OrganizationResponse,
    OrganizationUpdateRequest,
    OrgTreeResponse,
    PositionCreateRequest,
    PositionResponse,
    PositionTransferRequest,
)
from app.modules.organization.service import OrganizationService, PositionService


router = APIRouter(prefix="/organizations", tags=["organization"])


@router.get(
    "/current",
    response_model=OrganizationResponse,
    summary="Read the authenticated user's organization",
)
def get_current_organization(
    response: Response,
    context: RequestContext = CurrentContext,
    service: OrganizationService = Depends(get_organization_service),
) -> OrganizationResponse:
    """Requires ``organization.read`` at organization scope."""
    organization = service.get_current(context.authorization)
    set_etag(response, organization.version)
    return OrganizationResponse.from_model(organization)


@router.patch(
    "/current",
    response_model=OrganizationResponse,
    summary="Update the authenticated user's organization",
)
def update_current_organization(
    request: Request,
    response: Response,
    payload: OrganizationUpdateRequest,
    context: RequestContext = CurrentContext,
    service: OrganizationService = Depends(get_organization_service),
) -> OrganizationResponse:
    """Requires ``organization.update`` at organization scope and ``If-Match``."""
    expected_version = require_if_match(request)
    if not any_provided(payload, "name", "timezone", "is_active"):
        from app.core.errors import ValidationFailedError

        raise ValidationFailedError("Supply at least one field to update.")

    organization = service.update_current(
        context.authorization,
        expected_version=expected_version,
        actor=context.actor,
        name=provided(payload, "name"),
        timezone=provided(payload, "timezone"),
        is_active=provided(payload, "is_active"),
        reason=payload.reason,
    )
    set_etag(response, organization.version)
    return OrganizationResponse.from_model(organization)


# ---------------------------------------------------------------------------
# Canonical Organization Tree, Positions & Unified Transfer
# ---------------------------------------------------------------------------

import uuid

from app.api.deps import get_position_service
from app.core.clock import utcnow
from app.modules.organization.schemas import (
    OrgTreeResponse,
    PositionAssignmentResponse,
    PositionCreateRequest,
    PositionResponse,
    PositionTransferRequest,
)


@router.get(
    "/tree",
    response_model=OrgTreeResponse,
    summary="Get canonical Organization Chart hierarchy tree",
)
def get_organization_tree(
    context: RequestContext = CurrentContext,
    service: PositionService = Depends(get_position_service),
) -> OrgTreeResponse:
    """Returns database-backed hierarchical organization chart."""
    return service.get_organization_tree(context.authorization)


@router.get(
    "/tree/scoped",
    response_model=OrgTreeResponse,
    summary="Get scoped Organization Chart hierarchy tree for caller's subtree",
)
def get_scoped_organization_tree(
    context: RequestContext = CurrentContext,
    service: PositionService = Depends(get_position_service),
) -> OrgTreeResponse:
    """Returns database-backed organization chart scoped to caller's position subtree."""
    return service.get_scoped_organization_tree(context.authorization)



@router.get(
    "/positions",
    response_model=list[PositionResponse],
    summary="List organizational positions with current occupants",
)
def list_positions(
    department_id: uuid.UUID | None = None,
    include_inactive: bool = False,
    context: RequestContext = CurrentContext,
    service: PositionService = Depends(get_position_service),
) -> list[PositionResponse]:
    """List positions and current occupants."""
    return service.list_positions(
        context.authorization,
        department_id=department_id,
        include_inactive=include_inactive,
    )


@router.post(
    "/positions",
    response_model=PositionResponse,
    summary="Create a new organizational position",
)
def create_position(
    payload: PositionCreateRequest,
    context: RequestContext = CurrentContext,
    service: PositionService = Depends(get_position_service),
) -> PositionResponse:
    """Create a new post in a department."""
    pos = service.create_position(
        context.authorization,
        department_id=payload.department_id,
        title=payload.title,
        code=payload.code,
        reports_to_position_id=payload.reports_to_position_id,
        is_leadership=payload.is_leadership,
        actor=context.actor,
    )
    return PositionResponse(
        id=pos.id,
        organization_id=pos.organization_id,
        department_id=pos.department_id,
        reports_to_position_id=pos.reports_to_position_id,
        title=pos.title,
        code=pos.code,
        is_leadership=pos.is_leadership,
        is_active=pos.is_active,
        archived_at=pos.archived_at,
        created_at=pos.created_at,
        updated_at=pos.updated_at,
        version=pos.version,
    )


@router.post(
    "/transfer",
    response_model=PositionAssignmentResponse,
    summary="Unified organizational transfer of an employee",
)
def transfer_person(
    payload: PositionTransferRequest,
    context: RequestContext = CurrentContext,
    service: PositionService = Depends(get_position_service),
) -> PositionAssignmentResponse:
    """Executes atomic unified organizational transfer."""
    from datetime import date

    transfer_date = date.fromisoformat(payload.started_on) if payload.started_on else utcnow().date()
    assignment = service.transfer_person(
        context.authorization,
        user_id=payload.user_id,
        new_position_id=payload.new_position_id,
        started_on=transfer_date,
        transfer_reason=payload.transfer_reason,
        actor=context.actor,
    )
    return PositionAssignmentResponse(
        id=assignment.id,
        organization_id=assignment.organization_id,
        user_id=assignment.user_id,
        position_id=assignment.position_id,
        is_primary=assignment.is_primary,
        started_on=assignment.started_on.isoformat(),
        ended_on=assignment.ended_on.isoformat() if assignment.ended_on else None,
        transfer_reason=assignment.transfer_reason,
        is_current=assignment.is_current,
    )


@router.get(
    "/reporting-chain/{user_id}",
    summary="Get reporting hierarchy chain for a user",
)
def get_user_reporting_chain(
    user_id: uuid.UUID,
    context: RequestContext = CurrentContext,
    service: PositionService = Depends(get_position_service),
) -> list[dict[str, Any]]:
    """Walks up the reporting line from employee to MD."""
    return service.get_user_reporting_chain(context.authorization, user_id)
