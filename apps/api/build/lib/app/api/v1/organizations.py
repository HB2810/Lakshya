"""Organization routes.

The caller can only ever address its own organization, so the resource path is
``/organizations/current`` rather than ``/organizations/{id}``. There is no list
endpoint and no by-id endpoint: cross-tenant addressing is not expressible, which
removes a whole class of IDOR bug rather than defending against it.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response

from app.api.deps import CurrentContext, RequestContext, get_organization_service
from app.api.etag import require_if_match, set_etag
from app.api.partial import any_provided, provided
from app.modules.organization.schemas import OrganizationResponse, OrganizationUpdateRequest
from app.modules.organization.service import OrganizationService

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
