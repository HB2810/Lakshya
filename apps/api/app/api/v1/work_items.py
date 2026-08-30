"""FastAPI router for LAKSHYA Canonical WorkItem API.

Enforces server-side task isolation across MASTER, MD, LEADER, and STAVYAN roles.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentContext, RequestContext, get_db
from app.modules.work_item.models import WorkItem, WorkItemActivity
from app.modules.work_item.schemas import (
    AuditVerificationRequest,
    EscalateRequest,
    EscalationResolveRequest,
    EscalationResponse,
    RACIReplaceRequest,
    SubmitForVerificationRequest,
    WorkItemActivityResponse,
    WorkItemCreate,
    WorkItemResponse,
    WorkItemUpdate,
)
from app.modules.work_item.service import WorkItemService

router = APIRouter(prefix="/work_items", tags=["work_items"])


def _to_response(item: WorkItem, session: Session | None = None) -> WorkItemResponse:
    activities: list[WorkItemActivityResponse] = []
    if session is not None:
        act_rows = list(
            session.scalars(
                select(WorkItemActivity)
                .where(WorkItemActivity.work_item_id == item.id)
                .order_by(desc(WorkItemActivity.created_at))
            ).all()
        )
        activities = [
            WorkItemActivityResponse(
                id=a.id,
                work_item_id=a.work_item_id,
                author_id=a.author_id,
                author_name=a.author_name,
                activity_type=a.activity_type,
                note=a.note,
                previous_status=a.previous_status,
                new_status=a.new_status,
                progress_percent=a.progress_percent,
                created_at=a.created_at,
            )
            for a in act_rows
        ]

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
        submission_notes=getattr(item, "submission_notes", None),
        submitted_for_verification_at=getattr(item, "submitted_for_verification_at", None),
        verification=getattr(item, "verification_data", None),
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
    return [_to_response(item, session=db) for item in items]


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
        auth_ctx=ctx.authorization,
    )
    return _to_response(item, session=db)


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
    return _to_response(item, session=db)


@router.put("/{work_item_id}/raci", response_model=WorkItemResponse)
def replace_raci(
    work_item_id: uuid.UUID,
    payload: RACIReplaceRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> WorkItemResponse:
    """Atomically replace RACI assignments and synchronize Responsible with WorkItem owner."""
    item = WorkItemService.replace_raci(
        session=db,
        work_item_id=work_item_id,
        payload=payload,
        current_user=ctx.authenticated.user,
        auth_ctx=ctx.authorization,
    )
    return _to_response(item, session=db)


@router.patch("/{work_item_id}", response_model=WorkItemResponse)
def update_work_item(
    work_item_id: uuid.UUID,
    payload: WorkItemUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> WorkItemResponse:
    """Update work item status, progress, blockers, or metadata with server auth check."""
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
    return _to_response(item, session=db)


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


@router.post("/{work_item_id}/submit_for_verification", response_model=WorkItemResponse)
def submit_for_verification(
    work_item_id: uuid.UUID,
    payload: SubmitForVerificationRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> WorkItemResponse:
    """Employee submission of completed deliverable / evidence for incharge verification."""
    effective_roles = list(ctx.authorization.effective_roles)
    subordinates = set(ctx.authorization.subordinate_user_ids)
    item = WorkItemService.submit_for_verification(
        session=db,
        work_item_id=work_item_id,
        submission_notes=payload.submission_notes,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        user_department_ids=ctx.authorization.department_ids,
        subordinate_user_ids=subordinates,
    )
    return _to_response(item, session=db)


@router.post("/{work_item_id}/audit_verify", response_model=WorkItemResponse)
def audit_verify_work_item(
    work_item_id: uuid.UUID,
    payload: AuditVerificationRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> WorkItemResponse:
    """Incharge / Leader formal audit verification sign-off or revision request."""
    effective_roles = list(ctx.authorization.effective_roles)
    subordinates = set(ctx.authorization.subordinate_user_ids)
    item = WorkItemService.audit_verify(
        session=db,
        work_item_id=work_item_id,
        decision=payload.decision,
        audit_score=payload.audit_score,
        sop_compliance=payload.sop_compliance,
        remarks=payload.remarks,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        user_department_ids=ctx.authorization.department_ids,
        subordinate_user_ids=subordinates,
    )
    return _to_response(item, session=db)


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
    return _to_response(item, session=db)



