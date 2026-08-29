"""FastAPI router for LAKSHYA Append-Only Audit Query API."""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import CurrentContext, RequestContext, get_db
from app.modules.audit.schemas import AuditEventResponse, AuditListResponse
from app.modules.audit.service import AuditQueryService

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/events", response_model=AuditListResponse)
def list_audit_events(
    start_time: datetime | None = Query(default=None),
    end_time: datetime | None = Query(default=None),
    actor_id: uuid.UUID | None = Query(default=None),
    action: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    entity_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> AuditListResponse:
    """Query immutable audit events with strict role and relationship scoping."""
    effective_roles = list(ctx.authorization.effective_roles)
    subordinates = set(ctx.authorization.subordinate_user_ids)
    
    events, total = AuditQueryService.query_events(
        session=db,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        subordinate_user_ids=subordinates,
        start_time=start_time,
        end_time=end_time,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        limit=limit,
        offset=offset,
    )

    items = [AuditEventResponse.model_validate(e) for e in events]
    return AuditListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )
