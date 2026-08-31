"""FastAPI router for LAKSHYA Canonical WorkItem API.

Enforces server-side task isolation across MASTER, MD, LEADER, and STAVYAN roles.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentContext, RequestContext, get_db
from app.modules.work_item.models import WorkItem
from app.modules.work_item.schemas import (
    EscalateRequest,
    EscalationResolveRequest,
    EscalationResponse,
    WorkItemActivityResponse,
    WorkItemCreate,
    WorkItemResponse,
    WorkItemUpdate,
)
from app.modules.work_item.service import WorkItemService

router = APIRouter(prefix="/work_items", tags=["work_items"])


def _to_response(item: WorkItem) -> WorkItemResponse:
    activities: list[WorkItemActivityResponse] = []
    # If activities are loaded/queried
    return WorkItemResponse(
        id=item.id,
        organization_id=item.organization_id,
        title=item.title,
        description=item.description,
        parent_id=item.parent_id,
        status=item.status,
        priority=item.priority,
        owner_id=item.owner_id,
        owner_name=item.owner_name,
        created_by=item.created_by,
        department_id=item.department_id,
        department_name=item.department_name,
        due_at=item.due_at,
        completed_at=item.completed_at,
        progress_percent=item.progress_percent,
        blocked_at=item.blocked_at,
        blocked_reason=item.blocked_reason,
        blocker_details=item.blocker_details,
        raci=item.raci,
        edc=item.edc,
        origin_meeting_id=item.origin_meeting_id,
        source_type=item.source_type,
        source_title=item.source_title,
        activity_history=activities,
        created_at=item.created_at,
        updated_at=item.updated_at,
        version=item.version,
    )


@router.get("", response_model=list[WorkItemResponse])
def list_work_items(
    status_filter: str | None = Query(default=None, alias="status"),
    owner_id: uuid.UUID | None = Query(default=None),
    department_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> list[WorkItemResponse]:
    """List work items scoped server-side by authenticated user's role and permissions."""
    effective_roles = list(ctx.authorization.effective_roles)
    subordinates = set(ctx.authorization.subordinate_user_ids)
    items = WorkItemService.list_work_items(
        session=db,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        user_department_ids=ctx.authorization.department_ids,
        subordinate_user_ids=subordinates,
        status_filter=status_filter,
        owner_id=owner_id,
        department_id=department_id,
    )
    return [_to_response(item) for item in items]


@router.post("", response_model=WorkItemResponse, status_code=status.HTTP_201_CREATED)
def create_work_item(
    payload: WorkItemCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> WorkItemResponse:
    """Create a new canonical work item."""
    item = WorkItemService.create_work_item(
        session=db,
        payload=payload,
        current_user=ctx.authenticated.user,
    )
    return _to_response(item)


@router.get("/{work_item_id}", response_model=WorkItemResponse)
def get_work_item(
    work_item_id: uuid.UUID,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> WorkItemResponse:
    """Get work item by ID with strict task isolation enforcement (403 on unauthorized access)."""
    effective_roles = list(ctx.authorization.effective_roles)
    subordinates = set(ctx.authorization.subordinate_user_ids)
    item = WorkItemService.get_work_item(
        session=db,
        work_item_id=work_item_id,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        user_department_ids=ctx.authorization.department_ids,
        subordinate_user_ids=subordinates,
    )
    return _to_response(item)


@router.patch("/{work_item_id}", response_model=WorkItemResponse)
def update_work_item(
    work_item_id: uuid.UUID,
    payload: WorkItemUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> WorkItemResponse:
    """Update work item status, progress, blockers, or metadata with server-side authorization check."""
    effective_roles = list(ctx.authorization.effective_roles)
    subordinates = set(ctx.authorization.subordinate_user_ids)
    item = WorkItemService.update_work_item(
        session=db,
        work_item_id=work_item_id,
        payload=payload,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        user_department_ids=ctx.authorization.department_ids,
        subordinate_user_ids=subordinates,
    )
    return _to_response(item)


@router.post("/{work_item_id}/escalate", status_code=status.HTTP_200_OK)
def escalate_work_item(
    work_item_id: uuid.UUID,
    payload: EscalateRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> dict[str, str]:
    """Escalate a blocked work item along the organizational hierarchy."""
    effective_roles = list(ctx.authorization.effective_roles)
    subordinates = set(ctx.authorization.subordinate_user_ids)
    escalation = WorkItemService.escalate_work_item(
        session=db,
        work_item_id=work_item_id,
        payload=payload,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        user_department_ids=ctx.authorization.department_ids,
        subordinate_user_ids=subordinates,
    )
    return {
        "status": "escalated",
        "escalation_id": str(escalation.id),
        "level": escalation.level,
        "escalated_to": escalation.escalated_to_name,
    }


@router.get("/escalations/inbox", response_model=list[EscalationResponse])
def get_escalations_inbox(
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> list[EscalationResponse]:
    """Get pending escalations directed to the current leader."""
    escalations = WorkItemService.list_inbox_escalations(
        session=db,
        current_user=ctx.authenticated.user,
    )
    return [
        EscalationResponse(
            id=esc.id,
            organization_id=esc.organization_id,
            work_item_id=esc.work_item_id,
            level=esc.level,
            reason=esc.reason,
            escalated_by_id=esc.escalated_by_id,
            escalated_by_name=esc.escalated_by_name,
            escalated_to_id=esc.escalated_to_id,
            escalated_to_name=esc.escalated_to_name,
            status=esc.status,
            resolution_note=esc.resolution_note,
            resolved_at=esc.resolved_at,
            created_at=esc.created_at,
        )
        for esc in escalations
    ]


@router.post("/escalations/{escalation_id}/resolve", response_model=EscalationResponse)
def resolve_escalation(
    escalation_id: uuid.UUID,
    payload: EscalationResolveRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> EscalationResponse:
    """Resolve an assigned escalation and unblock the task."""
    esc = WorkItemService.resolve_escalation(
        session=db,
        escalation_id=escalation_id,
        resolution_note=payload.resolution_note,
        current_user=ctx.authenticated.user,
    )
    return EscalationResponse(
        id=esc.id,
        organization_id=esc.organization_id,
        work_item_id=esc.work_item_id,
        level=esc.level,
        reason=esc.reason,
        escalated_by_id=esc.escalated_by_id,
        escalated_by_name=esc.escalated_by_name,
        escalated_to_id=esc.escalated_to_id,
        escalated_to_name=esc.escalated_to_name,
        status=esc.status,
        resolution_note=esc.resolution_note,
        resolved_at=esc.resolved_at,
        created_at=esc.created_at,
    )


@router.post("/{work_item_id}/verify", response_model=WorkItemResponse)
def verify_work_item(
    work_item_id: uuid.UUID,
    note: str | None = Query(default=None),
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> WorkItemResponse:
    """Leader / Accountable sign-off and verification for a completed commitment."""
    effective_roles = list(ctx.authorization.effective_roles)
    subordinates = set(ctx.authorization.subordinate_user_ids)
    item = WorkItemService.verify_work_item(
        session=db,
        work_item_id=work_item_id,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        user_department_ids=ctx.authorization.department_ids,
        subordinate_user_ids=subordinates,
        verification_note=note,
    )
    return _to_response(item)


