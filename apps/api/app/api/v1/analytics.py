"""FastAPI router for LAKSHYA Operational Analytics API."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentContext, RequestContext, get_db
from app.modules.analytics.schemas import OperationalAnalyticsResponse
from app.modules.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/operational", response_model=OperationalAnalyticsResponse)
def get_operational_analytics(
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> OperationalAnalyticsResponse:
    """Get aggregated operational analytics scoped server-side by authenticated user role."""
    effective_roles = list(ctx.authorization.effective_roles)
    subordinates = set(ctx.authorization.subordinate_user_ids)
    return AnalyticsService.get_operational_analytics(
        session=db,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        user_department_ids=ctx.authorization.department_ids,
        subordinate_user_ids=subordinates,
    )
