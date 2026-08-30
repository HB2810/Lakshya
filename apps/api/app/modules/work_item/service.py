"""WorkItem business logic and server-side authorization enforcement.

TASK ISOLATION RULES (V1 SPEC):
- STAVYAN: Can ONLY see/update own WorkItems. Accessing another user's task returns 403 Forbidden.
- LEADER: Can see/update own WorkItems and permitted team/department members' WorkItems.
- MD: Broadest operational visibility across the organization.
- MASTER: System admin scope.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.modules.access.authorization import AuthorizationContext
from app.modules.access.catalog import RACI_MANAGE
from app.modules.audit.models import AuditSource
from app.modules.audit.service import AuditActor, AuditRecorder
from app.modules.identity.models import User
from app.modules.organization.models import DepartmentMembership
from app.modules.organization.service import PositionService
from app.modules.work_item.models import WorkItem, WorkItemActivity, WorkItemEscalation
from app.modules.work_item.schemas import (
    EscalateRequest,
    RACIReplaceRequest,
    RACISchema,
    WorkItemCreate,
    WorkItemUpdate,
)


def _check_work_item_access(
    work_item: WorkItem,
    current_user: Any,
    effective_roles: list[str],
    user_department_ids: list[uuid.UUID],
    subordinate_user_ids: set[uuid.UUID] | None = None,
    is_write: bool = False,
) -> None:
    """Validate server-side whether current_user is authorized to access work_item.

    Raises HTTPException(403) on unauthorized cross-user access.
    """
    user_id = current_user.id
    org_id = current_user.organization_id
    subordinates = subordinate_user_ids or set()

    # 1. Organization boundary must strictly match
    if work_item.organization_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: WorkItem belongs to a different organization.",
        )

    # 2. Check Roles
    upper_roles = [r.upper() for r in effective_roles]
    is_md = any(r in upper_roles for r in ("MD", "MANAGING_DIRECTOR", "MD_OFFICE"))
    is_leader = any(r in upper_roles for r in ("LEADER", "LEADERS", "DEPARTMENT_HEAD", "MANAGER"))
    is_master = any(r in upper_roles for r in ("MASTER", "ADMIN", "LOCAL_BOOTSTRAP_ADMIN"))

    # MD has organization-wide operational authority
    if is_md:
        return

    # Master has admin authority
    if is_master:
        return

    # Direct owner or creator always has access to their own task
    if work_item.owner_id == user_id or work_item.created_by == user_id:
        return

    # Leader can access tasks of team members in their reporting line or department
    if is_leader:
        if work_item.owner_id and work_item.owner_id in subordinates:
            return
        if work_item.department_id and work_item.department_id in user_department_ids:
            return

    # Otherwise: strict task isolation denies access
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access forbidden: You do not have permission to access this work item.",
    )


def _validate_and_canonicalize_raci(
    session: Session,
    org_id: uuid.UUID,
    raci_input: RACISchema | dict[str, Any],
    current_user: Any,
    auth_ctx: AuthorizationContext | None = None,
    work_item: WorkItem | None = None,
) -> dict[str, Any]:
    """Validates RACI invariants, active same-org users, scoping, and canonicalizes names."""
    if isinstance(raci_input, dict):
        raci_obj = RACISchema.model_validate(raci_input)
    else:
        raci_obj = raci_input

    # 1. Separation of duty (R != A)
    if raci_obj.responsible_id == raci_obj.accountable_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Responsible (R) and Accountable (A) must be different people.",
        )

    all_ids = [
        raci_obj.responsible_id,
        raci_obj.accountable_id,
        *raci_obj.consulted_ids,
        *raci_obj.informed_ids,
    ]
    # 2. Mutual exclusivity
    if len(all_ids) != len(set(all_ids)):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="One person cannot hold multiple RACI roles or be assigned twice.",
        )

    # 3. Active same-organization users check
    users = list(
        session.scalars(
            select(User).where(
                User.id.in_(all_ids),
                User.organization_id == org_id,
                User.is_active.is_(True),
            )
        ).all()
    )
    users_by_id = {u.id: u for u in users}
    missing = [str(uid) for uid in all_ids if uid not in users_by_id]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "One or more RACI assignees are not active users in your organization: "
                f"{', '.join(missing)}"
            ),
        )

    resp_user = users_by_id[raci_obj.responsible_id]
    acc_user = users_by_id[raci_obj.accountable_id]
    resp_name = resp_user.full_name or resp_user.email
    acc_name = acc_user.full_name or acc_user.email
    consulted_names = [
        users_by_id[uid].full_name or users_by_id[uid].email for uid in raci_obj.consulted_ids
    ]
    informed_names = [
        users_by_id[uid].full_name or users_by_id[uid].email for uid in raci_obj.informed_ids
    ]

    # 4. Scoped raci.manage authorization enforcement
    if auth_ctx is not None:
        if not auth_ctx.has_permission(RACI_MANAGE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission 'raci.manage' is required to manage RACI.",
            )

        if not auth_ctx.has_organization_scope(RACI_MANAGE):
            # Scoped R: self, subordinate, or member of same department
            dept_member_ids: set[uuid.UUID] = set()
            if auth_ctx.member_department_ids:
                dept_member_ids = set(
                    session.scalars(
                        select(DepartmentMembership.user_id).where(
                            DepartmentMembership.organization_id == org_id,
                            DepartmentMembership.department_id.in_(auth_ctx.member_department_ids),
                            DepartmentMembership.ended_on.is_(None),
                        )
                    ).all()
                )

            allowed_r_ids = (
                {auth_ctx.user_id} | set(auth_ctx.subordinate_user_ids) | dept_member_ids
            )
            if raci_obj.responsible_id not in allowed_r_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "Scoped RACI authorization violation: Responsible (R) must be "
                        "yourself, a direct reportee, or a member of your department."
                    ),
                )

            # Scoped A: self or an active reporting supervisor in chain
            supervisor_ids: set[uuid.UUID] = set()
            try:
                pos_service = PositionService(session, None)  # type: ignore[arg-type]
                chain = pos_service.get_user_reporting_chain(auth_ctx, auth_ctx.user_id)
                for link in chain[1:]:
                    if link.get("occupant_id"):
                        supervisor_ids.add(uuid.UUID(link["occupant_id"]))
            except Exception:
                supervisor_ids = set()

            allowed_a_ids = {auth_ctx.user_id} | supervisor_ids
            if raci_obj.accountable_id not in allowed_a_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "Scoped RACI authorization violation: Accountable (A) must be "
                        "yourself or an active reporting supervisor."
                    ),
                )

    now = utcnow()
    return {
        "responsible_id": str(raci_obj.responsible_id),
        "responsible_name": resp_name,
        "accountable_id": str(raci_obj.accountable_id),
        "accountable_name": acc_name,
        "consulted_ids": [str(uid) for uid in raci_obj.consulted_ids],
        "consulted_names": consulted_names,
        "informed_ids": [str(uid) for uid in raci_obj.informed_ids],
        "informed_names": informed_names,
        "consultation_expectation": raci_obj.consultation_expectation,
        "information_cadence": raci_obj.information_cadence,
        "updated_at": now.isoformat(),
        "updated_by_name": getattr(current_user, "full_name", "User"),
    }


class WorkItemService:
    @staticmethod
    def list_work_items(
        session: Session,
        current_user: Any,
        effective_roles: list[str],
        user_department_ids: list[uuid.UUID],
        subordinate_user_ids: set[uuid.UUID] | None = None,
        status_filter: str | None = None,
        owner_id: uuid.UUID | None = None,
        department_id: uuid.UUID | None = None,
    ) -> list[WorkItem]:
        upper_roles = [r.upper() for r in effective_roles]
        is_md = any(r in upper_roles for r in ("MD", "MANAGING_DIRECTOR", "MD_OFFICE"))
        is_leader = any(
            r in upper_roles for r in ("LEADER", "LEADERS", "DEPARTMENT_HEAD", "MANAGER")
        )
        is_master = any(r in upper_roles for r in ("MASTER", "ADMIN", "LOCAL_BOOTSTRAP_ADMIN"))
        subordinates = subordinate_user_ids or set()

        query = select(WorkItem).where(WorkItem.organization_id == current_user.organization_id)

        # Apply role-based scoping filter
        if is_md or is_master:
            if owner_id:
                query = query.where(WorkItem.owner_id == owner_id)
            if department_id:
                query = query.where(WorkItem.department_id == department_id)
        elif is_leader:
            if owner_id:
                # If querying a specific stavyan, ensure it's themselves, a subordinate, or in their dept
                query = query.where(WorkItem.owner_id == owner_id)
            else:
                clauses = [
                    WorkItem.owner_id == current_user.id,
                    WorkItem.created_by == current_user.id,
                ]
                if subordinates:
                    clauses.append(WorkItem.owner_id.in_(subordinates))
                if user_department_ids:
                    clauses.append(WorkItem.department_id.in_(user_department_ids))
                query = query.where(or_(*clauses))
        else:
            # STAVYAN: STRICT ISOLATION -> only own tasks
            query = query.where(
                (WorkItem.owner_id == current_user.id) | (WorkItem.created_by == current_user.id)
            )

        if status_filter:
            query = query.where(WorkItem.status == status_filter)

        query = query.order_by(desc(WorkItem.created_at))
        return list(session.scalars(query).all())

    @staticmethod
    def get_work_item(
        session: Session,
        work_item_id: uuid.UUID,
        current_user: Any,
        effective_roles: list[str],
        user_department_ids: list[uuid.UUID],
        subordinate_user_ids: set[uuid.UUID] | None = None,
    ) -> WorkItem:
        item = session.get(WorkItem, work_item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item not found.",
            )

        _check_work_item_access(
            work_item=item,
            current_user=current_user,
            effective_roles=effective_roles,
            user_department_ids=user_department_ids,
            subordinate_user_ids=subordinate_user_ids,
            is_write=False,
        )
        return item

    @staticmethod
    def create_work_item(
        session: Session,
        payload: WorkItemCreate,
        current_user: Any,
        auth_ctx: AuthorizationContext | None = None,
    ) -> WorkItem:
        now = utcnow()
        owner_id = payload.owner_id or current_user.id
        owner_name = payload.owner_name or getattr(current_user, "full_name", "Stavyan")
        raci_data = payload.raci

        if raci_data:
            canonical_raci = _validate_and_canonicalize_raci(
                session=session,
                org_id=current_user.organization_id,
                raci_input=raci_data,
                current_user=current_user,
                auth_ctx=auth_ctx,
            )
            raci_data = canonical_raci
            owner_id = uuid.UUID(canonical_raci["responsible_id"])
            owner_name = canonical_raci["responsible_name"]

        item = WorkItem(
            organization_id=current_user.organization_id,
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            status="todo",
            owner_id=owner_id,
            owner_name=owner_name,
            department_id=payload.department_id,
            department_name=payload.department_name,
            created_by=current_user.id,
            due_at=payload.due_at,
            parent_id=payload.parent_id,
            origin_meeting_id=payload.origin_meeting_id,
            source_type=payload.source_type,
            source_title=payload.source_title,
            raci=raci_data,
            edc=payload.edc,
            created_at=now,
            updated_at=now,
            version=1,
        )
        session.add(item)
        session.flush()

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=getattr(current_user, "full_name", "Stavyan"),
            activity_type="CREATED",
            note=f"Created work item '{item.title}'",
            new_status="todo",
            progress_percent=0,
            created_at=now,
        )
        session.add(activity)
        session.commit()
        session.refresh(item)
        return item

    @staticmethod
    def replace_raci(
        session: Session,
        work_item_id: uuid.UUID,
        payload: RACIReplaceRequest,
        current_user: Any,
        auth_ctx: AuthorizationContext,
    ) -> WorkItem:
        effective_roles = list(auth_ctx.effective_roles)
        subordinates = set(auth_ctx.subordinate_user_ids)
        item = WorkItemService.get_work_item(
            session=session,
            work_item_id=work_item_id,
            current_user=current_user,
            effective_roles=effective_roles,
            user_department_ids=auth_ctx.department_ids,
            subordinate_user_ids=subordinates,
        )

        now = utcnow()
        prev_raci = dict(item.raci or {})
        prev_owner_id = item.owner_id
        prev_owner_name = item.owner_name

        canonical_raci = _validate_and_canonicalize_raci(
            session=session,
            org_id=current_user.organization_id,
            raci_input=payload,
            current_user=current_user,
            auth_ctx=auth_ctx,
            work_item=item,
        )

        item.raci = canonical_raci
        item.owner_id = payload.responsible_id
        item.owner_name = canonical_raci["responsible_name"]
        item.updated_at = now
        item.version += 1

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=getattr(current_user, "full_name", "User"),
            activity_type="RACI_CHANGE",
            note=(
                f"RACI updated: R={canonical_raci['responsible_name']}, "
                f"A={canonical_raci['accountable_name']}. Reason: {payload.reason.strip()}"
            ),
            previous_status=item.status,
            new_status=item.status,
            progress_percent=item.progress_percent,
            created_at=now,
        )
        session.add(activity)

        recorder = AuditRecorder(session, source=AuditSource.API)
        recorder.record(
            action="work_item.raci.update",
            entity_type="work_item",
            entity_id=item.id,
            actor=AuditActor.user(current_user.id),
            organization_id=current_user.organization_id,
            before={
                "raci": prev_raci,
                "owner_id": str(prev_owner_id) if prev_owner_id else None,
                "owner_name": prev_owner_name,
            },
            after={
                "raci": item.raci,
                "owner_id": str(item.owner_id) if item.owner_id else None,
                "owner_name": item.owner_name,
            },
            reason=payload.reason.strip(),
        )
        session.commit()
        session.refresh(item)
        return item

    @staticmethod
    def update_work_item(
        session: Session,
        work_item_id: uuid.UUID,
        payload: WorkItemUpdate,
        current_user: Any,
        effective_roles: list[str],
        user_department_ids: list[uuid.UUID],
        subordinate_user_ids: set[uuid.UUID] | None = None,
    ) -> WorkItem:
        if (
            payload.raci is not None
            or payload.owner_id is not None
            or payload.owner_name is not None
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "RACI and owner assignments cannot be changed via generic PATCH; "
                    "use PUT /work_items/{id}/raci"
                ),
            )

        item = WorkItemService.get_work_item(
            session=session,
            work_item_id=work_item_id,
            current_user=current_user,
            effective_roles=effective_roles,
            user_department_ids=user_department_ids,
            subordinate_user_ids=subordinate_user_ids,
        )

        now = utcnow()
        prev_status = item.status
        prev_progress = item.progress_percent

        if payload.title is not None:
            item.title = payload.title
        if payload.description is not None:
            item.description = payload.description
        if payload.priority is not None:
            item.priority = payload.priority
        if payload.department_id is not None:
            item.department_id = payload.department_id
        if payload.due_at is not None:
            item.due_at = payload.due_at
        if payload.progress_percent is not None:
            item.progress_percent = payload.progress_percent
        if payload.edc is not None:
            item.edc = payload.edc

        # Status changes & blocker handling
        if payload.status is not None and payload.status != prev_status:
            item.status = payload.status
            if payload.status == "completed":
                item.completed_at = now
                item.progress_percent = 100
            elif payload.status in ("blocked", "stuck"):
                item.blocked_at = now
                item.blocked_reason = payload.blocked_reason or "Reported blocker"
                if payload.blocker_details:
                    item.blocker_details = payload.blocker_details
            elif payload.status == "in_progress" and prev_status in ("blocked", "stuck"):
                item.blocked_reason = None
                item.blocker_details = None

        item.updated_at = now
        item.version += 1

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=getattr(current_user, "full_name", "User"),
            activity_type=(
                "PROGRESS_UPDATE"
                if payload.progress_percent != prev_progress
                else "STATUS_CHANGE"
            ),
            note=payload.update_note or f"Updated status to {item.status}",
            previous_status=prev_status,
            new_status=item.status,
            progress_percent=item.progress_percent,
            created_at=now,
        )
        session.add(activity)
        session.commit()
        session.refresh(item)
        return item

    @staticmethod
    def escalate_work_item(
        session: Session,
        work_item_id: uuid.UUID,
        payload: EscalateRequest,
        current_user: Any,
        effective_roles: list[str],
        user_department_ids: list[uuid.UUID],
        subordinate_user_ids: set[uuid.UUID] | None = None,
    ) -> WorkItemEscalation:
        item = WorkItemService.get_work_item(
            session=session,
            work_item_id=work_item_id,
            current_user=current_user,
            effective_roles=effective_roles,
            user_department_ids=user_department_ids,
            subordinate_user_ids=subordinate_user_ids,
        )

        now = datetime.now(timezone.utc)
        item.status = "blocked"
        item.blocked_at = now
        item.blocked_reason = f"Escalated to {payload.level}: {payload.reason}"

        # Dynamically determine escalation target from organizational hierarchy if not provided
        target_id = payload.escalated_to_id
        target_name = payload.escalated_to_name

        if not target_id:
            from app.modules.access.authorization import AuthorizationContext
            from app.modules.organization.service import PositionService

            auth_ctx = AuthorizationContext(
                user_id=current_user.id,
                organization_id=current_user.organization_id,
                grants=(),
                member_department_ids=frozenset(user_department_ids),
            )
            chain = PositionService(session, None).get_user_reporting_chain(  # type: ignore[arg-type]
                auth_ctx,
                current_user.id,
            )


            # Find next leader in chain
            for link in chain[1:]:
                if link.get("occupant_id"):
                    target_id = uuid.UUID(link["occupant_id"])
                    target_name = link["occupant_name"]
                    break

        if not target_id:
            target_id = current_user.id
            target_name = "Managing Director"

        escalation = WorkItemEscalation(
            organization_id=current_user.organization_id,
            work_item_id=item.id,
            level=payload.level,
            reason=payload.reason,
            escalated_by_id=current_user.id,
            escalated_by_name=getattr(current_user, "full_name", "Stavyan"),
            escalated_to_id=target_id,
            escalated_to_name=target_name,
            status="PENDING",
            created_at=now,
            updated_at=now,
        )
        session.add(escalation)

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=getattr(current_user, "full_name", "Stavyan"),
            activity_type="ESCALATION_TRIGGERED",
            note=f"Escalated to {payload.level}: {payload.reason}",
            previous_status=item.status,
            new_status="blocked",
            created_at=now,
        )
        session.add(activity)
        session.commit()
        session.refresh(escalation)
        return escalation

    @staticmethod
    def list_inbox_escalations(
        session: Session,
        current_user: Any,
    ) -> list[WorkItemEscalation]:
        """List pending escalations targeted to the current leader."""
        query = (
            select(WorkItemEscalation)
            .where(
                WorkItemEscalation.organization_id == current_user.organization_id,
                WorkItemEscalation.escalated_to_id == current_user.id,
                WorkItemEscalation.status == "PENDING",
            )
            .order_by(desc(WorkItemEscalation.created_at))
        )
        return list(session.scalars(query).all())

    @staticmethod
    def resolve_escalation(
        session: Session,
        escalation_id: uuid.UUID,
        resolution_note: str,
        current_user: Any,
    ) -> WorkItemEscalation:
        """Resolve an escalation assigned to the current user and unblock the associated task."""
        escalation = session.get(WorkItemEscalation, escalation_id)
        if not escalation or escalation.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Escalation not found"
            )

        if escalation.escalated_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to resolve this escalation",
            )

        now = datetime.now(timezone.utc)
        escalation.status = "RESOLVED"
        escalation.resolution_note = resolution_note
        escalation.resolved_at = now
        escalation.updated_at = now

        # Unblock associated work item
        item = session.get(WorkItem, escalation.work_item_id)
        if item:
            item.status = "in_progress"
            item.blocked_at = None
            item.blocked_reason = None
            activity = WorkItemActivity(
                work_item_id=item.id,
                author_id=current_user.id,
                author_name=getattr(current_user, "full_name", "Leader"),
                activity_type="ESCALATION_RESOLVED",
                note=f"Escalation resolved: {resolution_note}",
                previous_status="blocked",
                new_status="in_progress",
                created_at=now,
            )
            session.add(activity)

        session.commit()
        session.refresh(escalation)
        return escalation

    @staticmethod
    def submit_for_verification(
        session: Session,
        work_item_id: uuid.UUID,
        submission_notes: str,
        current_user: Any,
        effective_roles: list[str],
        user_department_ids: list[uuid.UUID],
        subordinate_user_ids: set[uuid.UUID] | None = None,
    ) -> WorkItem:
        """Submit a completed work item deliverable for incharge / leader verification."""
        item = WorkItemService.get_work_item(
            session=session,
            work_item_id=work_item_id,
            current_user=current_user,
            effective_roles=effective_roles,
            user_department_ids=user_department_ids,
            subordinate_user_ids=subordinate_user_ids,
        )

        now = utcnow()
        prev_status = item.status
        item.status = "submitted_for_verification"
        item.submission_notes = submission_notes.strip()
        item.submitted_for_verification_at = now
        item.updated_at = now
        item.version += 1

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=getattr(current_user, "full_name", "Employee"),
            activity_type="SUBMITTED_FOR_VERIFICATION",
            note=f"Submitted deliverable for verification: {submission_notes.strip()}",
            previous_status=prev_status,
            new_status="submitted_for_verification",
            progress_percent=item.progress_percent,
            created_at=now,
        )
        session.add(activity)
        session.commit()
        session.refresh(item)
        return item

    @staticmethod
    def audit_verify(
        session: Session,
        work_item_id: uuid.UUID,
        decision: str,
        audit_score: int | None,
        sop_compliance: bool,
        remarks: str | None,
        current_user: Any,
        effective_roles: list[str],
        user_department_ids: list[uuid.UUID],
        subordinate_user_ids: set[uuid.UUID] | None = None,
    ) -> WorkItem:
        """Audit and verify or request revision on a submitted work item."""
        item = WorkItemService.get_work_item(
            session=session,
            work_item_id=work_item_id,
            current_user=current_user,
            effective_roles=effective_roles,
            user_department_ids=user_department_ids,
            subordinate_user_ids=subordinate_user_ids,
        )

        upper_roles = [r.upper() for r in effective_roles]
        is_md = any(r in upper_roles for r in ("MD", "MANAGING_DIRECTOR", "MD_OFFICE", "MASTER"))
        is_leader = any(r in upper_roles for r in ("LEADER", "LEADERS", "DEPARTMENT_HEAD", "MANAGER"))

        if not is_md and not is_leader:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Incharges, Leaders, and Governance authorities can verify or audit tasks.",
            )

        now = utcnow()
        prev_status = item.status
        verifier_name = getattr(current_user, "full_name", "Incharge / Leader")

        verification_record = {
            "verified_by_id": str(current_user.id),
            "verified_by_name": verifier_name,
            "verified_at": now.isoformat(),
            "decision": decision,
            "audit_score": audit_score,
            "sop_compliance": sop_compliance,
            "remarks": remarks.strip() if remarks else None,
        }

        if decision == "APPROVED":
            item.status = "verified"
            item.completed_at = now
            item.progress_percent = 100
            act_type = "VERIFIED"
            act_note = f"Task verified & approved by {verifier_name}. Audit Score: {audit_score or 'N/A'}/5. Remarks: {remarks or 'Approved'}"
        else:
            item.status = "revision_requested"
            act_type = "REVISION_REQUESTED"
            act_note = f"Revision requested by {verifier_name}: {remarks or 'Please revise work deliverable.'}"

        item.verification_data = verification_record
        item.updated_at = now
        item.version += 1

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=verifier_name,
            activity_type=act_type,
            note=act_note,
            previous_status=prev_status,
            new_status=item.status,
            progress_percent=item.progress_percent,
            created_at=now,
        )
        session.add(activity)
        session.commit()
        session.refresh(item)
        return item

    @staticmethod
    def verify_work_item(
        session: Session,
        work_item_id: uuid.UUID,
        current_user: Any,
        effective_roles: list[str],
        user_department_ids: list[uuid.UUID],
        subordinate_user_ids: set[uuid.UUID] | None = None,
        verification_note: str | None = None,
    ) -> WorkItem:
        """Verify EDC / completion of a formal commitment."""
        return WorkItemService.audit_verify(
            session=session,
            work_item_id=work_item_id,
            decision="APPROVED",
            audit_score=5,
            sop_compliance=True,
            remarks=verification_note,
            current_user=current_user,
            effective_roles=effective_roles,
            user_department_ids=user_department_ids,
            subordinate_user_ids=subordinate_user_ids,
        )



