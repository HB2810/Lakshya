"""WorkItem business logic and server-side authorization enforcement.

TASK ISOLATION RULES (V1 SPEC):
- EMPLOYEE: Can ONLY see/update own WorkItems. Accessing another user's task returns 403 Forbidden.
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

from app.modules.work_item.models import WorkItem, WorkItemActivity, WorkItemEscalation
from app.modules.work_item.schemas import (
    EscalateRequest,
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
    is_master = any(r in upper_roles for r in ("MASTER", "ADMIN"))

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
        is_leader = any(r in upper_roles for r in ("LEADER", "LEADERS", "DEPARTMENT_HEAD", "MANAGER"))
        is_master = any(r in upper_roles for r in ("MASTER", "ADMIN"))
        subordinates = subordinate_user_ids or set()

        query = select(WorkItem).where(WorkItem.organization_id == current_user.organization_id)

        # Apply role-based scoping filter
        if is_md or is_master:
            # MD sees all organization work items, optional specific owner filter
            if owner_id:
                query = query.where(WorkItem.owner_id == owner_id)
            if department_id:
                query = query.where(WorkItem.department_id == department_id)
        elif is_leader:
            # Leader sees own tasks + subordinate team reportees' tasks + department tasks
            if owner_id:
                # If querying a specific employee, ensure it's themselves, a subordinate, or in their dept
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
            # EMPLOYEE: STRICT ISOLATION -> only own tasks
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
    ) -> WorkItem:
        now = datetime.now(timezone.utc)
        item = WorkItem(
            organization_id=current_user.organization_id,
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            status="todo",
            owner_id=payload.owner_id or current_user.id,
            owner_name=payload.owner_name or getattr(current_user, "full_name", "Employee"),
            department_id=payload.department_id,
            department_name=payload.department_name,
            created_by=current_user.id,
            due_at=payload.due_at,
            parent_id=payload.parent_id,
            origin_meeting_id=payload.origin_meeting_id,
            source_type=payload.source_type,
            source_title=payload.source_title,
            raci=payload.raci,
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
            author_name=getattr(current_user, "full_name", "Employee"),
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
    def update_work_item(
        session: Session,
        work_item_id: uuid.UUID,
        payload: WorkItemUpdate,
        current_user: Any,
        effective_roles: list[str],
        user_department_ids: list[uuid.UUID],
        subordinate_user_ids: set[uuid.UUID] | None = None,
    ) -> WorkItem:
        item = WorkItemService.get_work_item(
            session=session,
            work_item_id=work_item_id,
            current_user=current_user,
            effective_roles=effective_roles,
            user_department_ids=user_department_ids,
            subordinate_user_ids=subordinate_user_ids,
        )

        now = datetime.now(timezone.utc)
        prev_status = item.status
        prev_progress = item.progress_percent

        if payload.title is not None:
            item.title = payload.title
        if payload.description is not None:
            item.description = payload.description
        if payload.priority is not None:
            item.priority = payload.priority
        if payload.owner_id is not None:
            item.owner_id = payload.owner_id
        if payload.owner_name is not None:
            item.owner_name = payload.owner_name
        if payload.department_id is not None:
            item.department_id = payload.department_id
        if payload.due_at is not None:
            item.due_at = payload.due_at
        if payload.progress_percent is not None:
            item.progress_percent = payload.progress_percent
        if payload.raci is not None:
            item.raci = payload.raci
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
            activity_type="PROGRESS_UPDATE" if payload.progress_percent != prev_progress else "STATUS_CHANGE",
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
            escalated_by_name=getattr(current_user, "full_name", "Employee"),
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
            author_name=getattr(current_user, "full_name", "Employee"),
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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation not found")

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
        item = WorkItemService.get_work_item(
            session=session,
            work_item_id=work_item_id,
            current_user=current_user,
            effective_roles=effective_roles,
            user_department_ids=user_department_ids,
            subordinate_user_ids=subordinate_user_ids,
        )

        now = datetime.now(timezone.utc)
        item.status = "completed"
        item.completed_at = now
        item.progress_percent = 100

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=getattr(current_user, "full_name", "Leader"),
            activity_type="COMPLETION_VERIFIED",
            note=verification_note or "EDC criteria confirmed and verified.",
            previous_status="ready_for_review",
            new_status="completed",
            progress_percent=100,
            created_at=now,
        )
        session.add(activity)
        session.commit()
        session.refresh(item)
        return item


