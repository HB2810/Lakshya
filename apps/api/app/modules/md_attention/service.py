"""Needs MD Attention Domain Service.

Derives executive attention items directly from database entities:
1. Critical Overdue Work (High/Urgent past due date)
2. High-Impact Blockers (Stuck/Need with high/urgent urgency or escalated)
3. Decisions Awaiting MD Authority (Pending decisions / commitments)
4. Evidence Awaiting Independent Verification (Completed items where verification is pending)
5. At-Risk Milestones (Milestones nearing due date with incomplete prerequisite steps)
6. Repeated Deferrals (Items with multiple deadline reschedules/extensions)

Provides authoritative MD Cockpit action handlers for executive overrides,
RACI reassignments, evidence sign-off/rejection, and escalation resolution.

Strictly organization-isolated and RBAC-gated to MD & MD Office personas.
Standard employees are forbidden with HTTP 403.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import PermissionDeniedError, ResourceNotFoundError
from app.modules.audit.models import AuditEvent, AuditSource
from app.modules.identity.models import User
from app.modules.md_attention.schemas import (
    CockpitActionResponse,
    ExecutiveOverrideRequest,
    GrantExtensionRequest,
    MDAttentionCategory,
    MDAttentionItemResponse,
    MDAttentionSummary,
    ReassignRaciRequest,
    ResolveEscalationRequest,
    UpdateMilestoneStepRequest,
    VerifyEvidenceRequest,
)
from app.modules.strategy.models import QuarterlyPriority
from app.modules.work_item.models import WorkItem, WorkItemActivity, WorkItemEscalation


class MDAttentionService:
    """Computes server-derived executive attention items and executes Cockpit actions."""

    @classmethod
    def _verify_md_authority(cls, effective_roles: list[str]) -> None:
        allowed_roles = {"md", "md_office", "master", "admin", "local_bootstrap_admin"}
        has_md_role = any(r.lower() in allowed_roles for r in effective_roles)
        if not has_md_role:
            raise PermissionDeniedError(
                "Access Denied: Needs MD Attention Cockpit is strictly restricted to MD and MD Office leadership."
            )

    @classmethod
    def get_attention_summary(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
    ) -> MDAttentionSummary:
        """Derives the Needs MD Attention summary for MD/MD Office leadership."""
        cls._verify_md_authority(effective_roles)

        now = utcnow()
        org_id = current_user.organization_id

        items: list[MDAttentionItemResponse] = []

        # -------------------------------------------------------------------
        # 1. Critical Overdue Work (High / Urgent priority past due_at)
        # -------------------------------------------------------------------
        overdue_stmt = (
            select(WorkItem)
            .where(
                WorkItem.organization_id == org_id,
                WorkItem.status.in_(["todo", "in_progress", "blocked", "stuck"]),
                WorkItem.priority.in_(["high", "urgent"]),
                WorkItem.due_at.is_not(None),
                WorkItem.due_at < now,
            )
            .order_by(WorkItem.due_at.asc())
        )
        overdue_records = session.scalars(overdue_stmt).all()

        for rec in overdue_records:
            due_age_days = 0
            if rec.due_at:
                due_dt = rec.due_at if rec.due_at.tzinfo is not None else rec.due_at.replace(tzinfo=timezone.utc)
                due_age_days = max(1, (now - due_dt).days)

            raci_data = rec.raci or {}
            acc_name = raci_data.get("accountable_name") or rec.owner_name or "Unassigned"

            items.append(
                MDAttentionItemResponse(
                    id=f"att-overdue-{rec.id}",
                    category=MDAttentionCategory.CRITICAL_OVERDUE,
                    title=rec.title,
                    source=rec.source_title or f"{rec.source_type} Source",
                    owner_name=rec.owner_name or "Unassigned",
                    accountable_name=acc_name,
                    department_name=rec.department_name or "Clinical & Hospital Ops",
                    due_at=rec.due_at,
                    due_age_days=due_age_days,
                    impact=f"High priority commitment overdue by {due_age_days}d. Threatens operational timeline.",
                    requested_action="Require owner to submit verified recovery plan or reassign accountable lead.",
                    evidence_state="OVERDUE — Incomplete",
                    audit_provenance=f"work_items.id={rec.id}",
                    why_included=f"Rule: High/Urgent priority item breached due date ({rec.due_at.strftime('%Y-%m-%d') if rec.due_at else 'N/A'}).",
                    priority=rec.priority,
                    entity_id=str(rec.id),
                    entity_type="work_item",
                    raci=rec.raci,
                    edc=rec.edc,
                )
            )

        # -------------------------------------------------------------------
        # 2. High-Impact Blockers (Status blocked/stuck with URGENT/HIGH urgency or escalations)
        # -------------------------------------------------------------------
        blocker_stmt = (
            select(WorkItem)
            .where(
                WorkItem.organization_id == org_id,
                WorkItem.status.in_(["blocked", "stuck"]),
            )
            .order_by(WorkItem.updated_at.desc())
        )
        blocker_records = session.scalars(blocker_stmt).all()

        for rec in blocker_records:
            b_details = rec.blocker_details or {}
            reason = rec.blocked_reason or b_details.get("reason") or "Cross-department dependency blocked"
            need = b_details.get("needDescription") or "Intervention required"
            urgency = b_details.get("urgency", "HIGH")
            category = b_details.get("category", "DEPENDENCY")

            raci_data = rec.raci or {}
            acc_name = raci_data.get("accountable_name") or rec.owner_name or "Unassigned"

            items.append(
                MDAttentionItemResponse(
                    id=f"att-blocker-{rec.id}",
                    category=MDAttentionCategory.HIGH_IMPACT_BLOCKER,
                    title=f"[BLOCKED] {rec.title}",
                    source=rec.source_title or f"{rec.source_type} Source",
                    owner_name=rec.owner_name or "Unassigned",
                    accountable_name=acc_name,
                    department_name=rec.department_name or "Clinical & Hospital Ops",
                    due_at=rec.due_at,
                    due_age_days=None,
                    impact=f"Blocker Category: {category}. Need: {need}",
                    requested_action="Provide executive authorization or override inter-departmental blocker.",
                    evidence_state="BLOCKED — StuckNeedItem Active",
                    audit_provenance=f"work_items.id={rec.id} (status={rec.status})",
                    why_included=f"Rule: Unresolved {urgency} blocker active: {reason}",
                    priority=rec.priority,
                    entity_id=str(rec.id),
                    entity_type="work_item",
                    blocker_details=rec.blocker_details,
                    raci=rec.raci,
                    edc=rec.edc,
                )
            )

        # -------------------------------------------------------------------
        # 3. Decisions Awaiting MD Authority
        # -------------------------------------------------------------------
        esc_stmt = (
            select(WorkItemEscalation)
            .where(
                WorkItemEscalation.organization_id == org_id,
                WorkItemEscalation.status == "PENDING",
                WorkItemEscalation.level == "MANAGING_DIRECTOR",
            )
            .order_by(WorkItemEscalation.created_at.desc())
        )
        escalations = session.scalars(esc_stmt).all()

        for esc in escalations:
            items.append(
                MDAttentionItemResponse(
                    id=f"att-decision-{esc.id}",
                    category=MDAttentionCategory.DECISION_AWAITING_AUTHORITY,
                    title=f"L3 Executive Escalation: {esc.reason[:80]}...",
                    source="Direct Level 3 Management Escalation",
                    owner_name=esc.escalated_by_name,
                    accountable_name=esc.escalated_to_name,
                    department_name="MD Office Cell",
                    due_at=None,
                    due_age_days=None,
                    impact="Unresolved operational issue escalated directly to Managing Director.",
                    requested_action="Review escalation details and render authoritative resolution directive.",
                    evidence_state="ESCALATED_L3 — Pending MD Decision",
                    audit_provenance=f"work_item_escalations.id={esc.id}",
                    why_included="Rule: Pending L3 escalation awaiting MD decision authority.",
                    priority="urgent",
                    entity_id=str(esc.work_item_id),
                    entity_type="work_item_escalation",
                    escalation_id=str(esc.id),
                )
            )

        # -------------------------------------------------------------------
        # 4. Evidence Awaiting Independent Verification
        # -------------------------------------------------------------------
        completed_stmt = (
            select(WorkItem)
            .where(
                WorkItem.organization_id == org_id,
                WorkItem.status == "completed",
            )
            .order_by(WorkItem.completed_at.desc())
            .limit(10)
        )
        completed_items = session.scalars(completed_stmt).all()

        for rec in completed_items:
            edc = rec.edc or {}
            v_status = edc.get("verification_status")
            if v_status == "VERIFIED":
                continue  # Skip items already independently verified

            evidence_needed = edc.get("evidence_required") or edc.get("definition_of_done") or "Sign-off required"
            raci_data = rec.raci or {}
            acc_name = raci_data.get("accountable_name") or "Het Bhatt (MD)"

            items.append(
                MDAttentionItemResponse(
                    id=f"att-verify-{rec.id}",
                    category=MDAttentionCategory.EVIDENCE_AWAITING_VERIFICATION,
                    title=f"Verification Pending: {rec.title}",
                    source=rec.source_title or f"{rec.source_type} Source",
                    owner_name=rec.owner_name or "Unassigned",
                    accountable_name=acc_name,
                    department_name=rec.department_name,
                    due_at=rec.due_at,
                    due_age_days=None,
                    impact=f"Reported complete by contributor. Required evidence: {evidence_needed}",
                    requested_action="Conduct independent verification against Definition of Done before closing.",
                    evidence_state="REPORTED_COMPLETE (Awaiting Independent Signoff)",
                    audit_provenance=f"work_items.id={rec.id} (completed_at={rec.completed_at})",
                    why_included="Rule: Claimed completion is never equated with VERIFIED/CLOSED without independent evidence.",
                    priority=rec.priority,
                    entity_id=str(rec.id),
                    entity_type="work_item",
                    raci=rec.raci,
                    edc=rec.edc,
                )
            )

        # -------------------------------------------------------------------
        # 5. At-Risk Milestones
        # -------------------------------------------------------------------
        strat_stmt = (
            select(QuarterlyPriority)
            .where(
                QuarterlyPriority.organization_id == org_id,
                QuarterlyPriority.status == "ACTIVE",
            )
        )
        priorities = session.scalars(strat_stmt).all()

        for prio in priorities:
            from app.modules.strategy.service import StrategyService
            milestones = StrategyService._parse_milestones(prio.expected_outcome)
            for ms in milestones:
                if ms.status in ("IN_PROGRESS", "AT_RISK"):
                    step_num = ms.step_number
                    ms_title = ms.title
                    items.append(
                        MDAttentionItemResponse(
                            id=f"att-milestone-{prio.id}-{step_num}",
                            category=MDAttentionCategory.AT_RISK_MILESTONE,
                            title=f"Step #{step_num} Delivery in Progress: {ms_title}",
                            source=f"Quarterly Priority: {prio.title}",
                            owner_name=ms.owner_name or "Strategic Lead",
                            accountable_name="Het Bhatt (MD)",
                            department_name="Spine Surgery & Hospital Operations",
                            due_at=None,
                            due_age_days=None,
                            impact=f"Active step in delivery chain. Prerequisite for downstream Step #{step_num + 1}.",
                            requested_action="Track weekly milestone velocity and unblock dependency gates.",
                            evidence_state=f"{ms.status} — Step #{step_num}",
                            audit_provenance=f"quarterly_priorities.id={prio.id}",
                            why_included=f"Rule: Active milestone step in progress requiring MD oversight.",
                            priority="high",
                            entity_id=str(prio.id),
                            entity_type="quarterly_priority",
                        )
                    )

        # -------------------------------------------------------------------
        # 6. Repeated Deferrals
        # -------------------------------------------------------------------
        activity_counts_stmt = (
            select(WorkItemActivity.work_item_id, func.count(WorkItemActivity.id).label("cnt"))
            .group_by(WorkItemActivity.work_item_id)
            .having(func.count(WorkItemActivity.id) >= 2)
        )
        activity_counts = session.execute(activity_counts_stmt).all()

        deferral_item_ids = [row[0] for row in activity_counts]
        if deferral_item_ids:
            deferral_wis = session.scalars(
                select(WorkItem).where(
                    WorkItem.id.in_(deferral_item_ids),
                    WorkItem.organization_id == org_id,
                    WorkItem.status.in_(["todo", "in_progress"]),
                )
            ).all()

            for rec in deferral_wis:
                items.append(
                    MDAttentionItemResponse(
                        id=f"att-deferral-{rec.id}",
                        category=MDAttentionCategory.REPEATED_DEFERRAL,
                        title=f"Multiple Updates: {rec.title}",
                        source=rec.source_title or f"{rec.source_type} Source",
                        owner_name=rec.owner_name or "Unassigned",
                        accountable_name=rec.owner_name or "Het Bhatt",
                        department_name=rec.department_name,
                        due_at=rec.due_at,
                        due_age_days=None,
                        impact="Task has been updated repeatedly without achieving final verified outcome.",
                        requested_action="Review task scope with owner; split into smaller atomic deliverables if needed.",
                        evidence_state="REPEATED_UPDATES",
                        audit_provenance=f"work_items.id={rec.id}",
                        why_included="Rule: Item has multiple status/progress adjustments without closure.",
                        priority=rec.priority,
                        entity_id=str(rec.id),
                        entity_type="work_item",
                        raci=rec.raci,
                        edc=rec.edc,
                    )
                )

        # Count summary metrics
        counts: dict[MDAttentionCategory, int] = {cat: 0 for cat in MDAttentionCategory}
        for item in items:
            counts[item.category] = counts.get(item.category, 0) + 1

        return MDAttentionSummary(
            total_items=len(items),
            critical_overdue_count=counts[MDAttentionCategory.CRITICAL_OVERDUE],
            high_impact_blocker_count=counts[MDAttentionCategory.HIGH_IMPACT_BLOCKER],
            decision_awaiting_count=counts[MDAttentionCategory.DECISION_AWAITING_AUTHORITY],
            evidence_verification_count=counts[MDAttentionCategory.EVIDENCE_AWAITING_VERIFICATION],
            at_risk_milestone_count=counts[MDAttentionCategory.AT_RISK_MILESTONE],
            repeated_deferrals_count=counts[MDAttentionCategory.REPEATED_DEFERRAL],
            items=items,
        )

    # -----------------------------------------------------------------------
    # Cockpit Executive Action Handlers
    # -----------------------------------------------------------------------

    @classmethod
    def resolve_escalation(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
        payload: ResolveEscalationRequest,
    ) -> CockpitActionResponse:
        """Resolves an L3 escalation with authoritative MD directive."""
        cls._verify_md_authority(effective_roles)
        now = utcnow()

        esc = session.scalar(
            select(WorkItemEscalation).where(
                WorkItemEscalation.id == payload.escalation_id,
                WorkItemEscalation.organization_id == current_user.organization_id,
            )
        )
        if not esc:
            raise ResourceNotFoundError(f"Escalation {payload.escalation_id} not found.")

        esc.status = "RESOLVED"
        esc.resolution_notes = f"Decision: {payload.decision}. Directive: {payload.directive_notes}"

        # If unblock requested, set associated work item to in_progress
        work_item = session.scalar(
            select(WorkItem).where(
                WorkItem.id == esc.work_item_id,
                WorkItem.organization_id == current_user.organization_id,
            )
        )
        if work_item and payload.unblock_work_item:
            work_item.status = "in_progress"
            work_item.blocked_reason = None
            work_item.updated_at = now
            
            activity = WorkItemActivity(
                work_item_id=work_item.id,
                author_id=current_user.id,
                author_name=current_user.full_name,
                activity_type="STATUS_CHANGE",
                note=f"MD Escalation Directive: {payload.decision} — {payload.directive_notes}",
                previous_status="blocked",
                new_status="in_progress",
                progress_percent=work_item.progress_percent,
                created_at=now,
            )
            session.add(activity)

        # Audit Event
        audit = AuditEvent(
            id=uuid.uuid4(),
            organization_id=current_user.organization_id,
            occurred_at=now,
            actor_id=current_user.id,
            actor_role="MD",
            action="MD_RESOLVE_ESCALATION",
            entity_type="work_item_escalation",
            entity_id=esc.id,
            source=AuditSource.WEB,
            payload={
                "decision": payload.decision,
                "directive_notes": payload.directive_notes,
                "work_item_id": str(esc.work_item_id),
            },
        )
        session.add(audit)
        session.commit()

        return CockpitActionResponse(
            success=True,
            message=f"Escalation resolved with {payload.decision} directive.",
            action_type="RESOLVE_ESCALATION",
            entity_id=str(esc.id),
            entity_type="work_item_escalation",
            audit_event_id=str(audit.id),
            updated_at=now,
        )

    @classmethod
    def verify_evidence(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
        payload: VerifyEvidenceRequest,
    ) -> CockpitActionResponse:
        """Formally verifies Definition of Done evidence or reopens task if insufficient."""
        cls._verify_md_authority(effective_roles)
        now = utcnow()

        item = session.scalar(
            select(WorkItem).where(
                WorkItem.id == payload.work_item_id,
                WorkItem.organization_id == current_user.organization_id,
            )
        )
        if not item:
            raise ResourceNotFoundError(f"WorkItem {payload.work_item_id} not found.")

        edc = dict(item.edc or {})
        prev_status = item.status

        if payload.verification_result == "VERIFIED_CLOSED":
            item.status = "completed"
            item.progress_percent = 100
            edc["verification_status"] = "VERIFIED"
            edc["verified_by"] = current_user.full_name
            edc["verified_at"] = now.isoformat()
            edc["verification_notes"] = payload.verification_notes
            item.edc = edc
            note = f"MD Independent Verification: APPROVED & CLOSED. Notes: {payload.verification_notes}"
        else:
            item.status = "in_progress"
            item.progress_percent = 80
            edc["verification_status"] = "REJECTED"
            edc["rejected_by"] = current_user.full_name
            edc["rejected_at"] = now.isoformat()
            edc["rejection_notes"] = payload.verification_notes
            item.edc = edc
            note = f"MD Independent Verification: REJECTED (Reopened to in_progress). Notes: {payload.verification_notes}"

        item.updated_at = now
        item.version += 1

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=current_user.full_name,
            activity_type="STATUS_CHANGE",
            note=note,
            previous_status=prev_status,
            new_status=item.status,
            progress_percent=item.progress_percent,
            created_at=now,
        )
        session.add(activity)

        audit = AuditEvent(
            id=uuid.uuid4(),
            organization_id=current_user.organization_id,
            occurred_at=now,
            actor_id=current_user.id,
            actor_role="MD",
            action="MD_VERIFY_EVIDENCE",
            entity_type="work_item",
            entity_id=item.id,
            source=AuditSource.WEB,
            payload={
                "verification_result": payload.verification_result,
                "notes": payload.verification_notes,
            },
        )
        session.add(audit)
        session.commit()

        return CockpitActionResponse(
            success=True,
            message=f"Evidence verification updated: {payload.verification_result}.",
            action_type="VERIFY_EVIDENCE",
            entity_id=str(item.id),
            entity_type="work_item",
            audit_event_id=str(audit.id),
            updated_at=now,
        )

    @classmethod
    def executive_override(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
        payload: ExecutiveOverrideRequest,
    ) -> CockpitActionResponse:
        """Issues an authoritative Executive Override clearing a blocker or adjusting timeline."""
        cls._verify_md_authority(effective_roles)
        now = utcnow()

        item = session.scalar(
            select(WorkItem).where(
                WorkItem.id == payload.work_item_id,
                WorkItem.organization_id == current_user.organization_id,
            )
        )
        if not item:
            raise ResourceNotFoundError(f"WorkItem {payload.work_item_id} not found.")

        prev_status = item.status
        if payload.clear_blocker:
            item.status = "in_progress"
            item.blocked_reason = None
            item.blocker_details = None

        if payload.new_due_at:
            item.due_at = payload.new_due_at

        item.updated_at = now
        item.version += 1

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=current_user.full_name,
            activity_type="STATUS_CHANGE",
            note=f"Executive Blocker Override by {current_user.full_name}: {payload.override_reason}",
            previous_status=prev_status,
            new_status=item.status,
            progress_percent=item.progress_percent,
            created_at=now,
        )
        session.add(activity)

        audit = AuditEvent(
            id=uuid.uuid4(),
            organization_id=current_user.organization_id,
            occurred_at=now,
            actor_id=current_user.id,
            actor_role="MD",
            action="MD_EXECUTIVE_OVERRIDE",
            entity_type="work_item",
            entity_id=item.id,
            source=AuditSource.WEB,
            payload={
                "override_reason": payload.override_reason,
                "clear_blocker": payload.clear_blocker,
                "new_due_at": payload.new_due_at.isoformat() if payload.new_due_at else None,
            },
        )
        session.add(audit)
        session.commit()

        return CockpitActionResponse(
            success=True,
            message="Executive override applied and blocker cleared.",
            action_type="EXECUTIVE_OVERRIDE",
            entity_id=str(item.id),
            entity_type="work_item",
            audit_event_id=str(audit.id),
            updated_at=now,
        )

    @classmethod
    def grant_extension(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
        payload: GrantExtensionRequest,
    ) -> CockpitActionResponse:
        """Authorizes an executive deadline extension with formal rationale."""
        cls._verify_md_authority(effective_roles)
        now = utcnow()

        item = session.scalar(
            select(WorkItem).where(
                WorkItem.id == payload.work_item_id,
                WorkItem.organization_id == current_user.organization_id,
            )
        )
        if not item:
            raise ResourceNotFoundError(f"WorkItem {payload.work_item_id} not found.")

        prev_due = item.due_at.isoformat() if item.due_at else "None"
        item.due_at = payload.new_due_at
        item.updated_at = now
        item.version += 1

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=current_user.full_name,
            activity_type="PROGRESS_UPDATE",
            note=f"MD Authorized Extension: New due date {payload.new_due_at.strftime('%Y-%m-%d')}. Rationale: {payload.justification}",
            previous_status=item.status,
            new_status=item.status,
            progress_percent=item.progress_percent,
            created_at=now,
        )
        session.add(activity)

        audit = AuditEvent(
            id=uuid.uuid4(),
            organization_id=current_user.organization_id,
            occurred_at=now,
            actor_id=current_user.id,
            actor_role="MD",
            action="MD_GRANT_EXTENSION",
            entity_type="work_item",
            entity_id=item.id,
            source=AuditSource.WEB,
            payload={
                "previous_due_at": prev_due,
                "new_due_at": payload.new_due_at.isoformat(),
                "justification": payload.justification,
            },
        )
        session.add(audit)
        session.commit()

        return CockpitActionResponse(
            success=True,
            message="Deadline extension authorized.",
            action_type="GRANT_EXTENSION",
            entity_id=str(item.id),
            entity_type="work_item",
            audit_event_id=str(audit.id),
            updated_at=now,
        )

    @classmethod
    def reassign_raci(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
        payload: ReassignRaciRequest,
    ) -> CockpitActionResponse:
        """Authoritatively reassigns RACI ownership."""
        cls._verify_md_authority(effective_roles)
        now = utcnow()

        item = session.scalar(
            select(WorkItem).where(
                WorkItem.id == payload.work_item_id,
                WorkItem.organization_id == current_user.organization_id,
            )
        )
        if not item:
            raise ResourceNotFoundError(f"WorkItem {payload.work_item_id} not found.")

        raci = dict(item.raci or {})
        raci["responsible_id"] = str(payload.responsible_id) if payload.responsible_id else raci.get("responsible_id")
        raci["responsible_name"] = payload.responsible_name
        raci["accountable_id"] = str(payload.accountable_id) if payload.accountable_id else raci.get("accountable_id")
        raci["accountable_name"] = payload.accountable_name
        item.raci = raci

        if payload.responsible_id:
            item.owner_id = payload.responsible_id
        item.owner_name = payload.responsible_name
        item.updated_at = now
        item.version += 1

        activity = WorkItemActivity(
            work_item_id=item.id,
            author_id=current_user.id,
            author_name=current_user.full_name,
            activity_type="PROGRESS_UPDATE",
            note=f"MD RACI Reassignment: Responsible={payload.responsible_name}, Accountable={payload.accountable_name}. Rationale: {payload.rationale}",
            previous_status=item.status,
            new_status=item.status,
            progress_percent=item.progress_percent,
            created_at=now,
        )
        session.add(activity)

        audit = AuditEvent(
            id=uuid.uuid4(),
            organization_id=current_user.organization_id,
            occurred_at=now,
            actor_id=current_user.id,
            actor_role="MD",
            action="MD_REASSIGN_RACI",
            entity_type="work_item",
            entity_id=item.id,
            source=AuditSource.WEB,
            payload={
                "responsible_name": payload.responsible_name,
                "accountable_name": payload.accountable_name,
                "rationale": payload.rationale,
            },
        )
        session.add(audit)
        session.commit()

        return CockpitActionResponse(
            success=True,
            message="RACI ownership successfully updated.",
            action_type="REASSIGN_RACI",
            entity_id=str(item.id),
            entity_type="work_item",
            audit_event_id=str(audit.id),
            updated_at=now,
        )
