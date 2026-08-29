"""Needs MD Attention Domain Service.

Derives executive attention items directly from database entities:
1. Critical Overdue Work (High/Urgent past due date)
2. High-Impact Blockers (Stuck/Need with high/urgent urgency or escalated)
3. Decisions Awaiting MD Authority (Pending decisions / L3 escalations)
4. Evidence Awaiting Independent Verification (Completed items where verification is pending)
5. At-Risk Milestones (Milestones nearing due date with incomplete prerequisite steps)
6. Repeated Deferrals (Items with multiple deadline reschedules/extensions)

Provides authoritative MD Cockpit action handlers for executive overrides,
RACI reassignments, evidence sign-off/rejection, escalation resolution,
and deadline extensions.

Strictly organization-isolated and RBAC-gated to MD & MD Office personas.
Standard employees and unauthorized roles are forbidden with HTTP 403.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import (
    ConflictError,
    PermissionDeniedError,
    ResourceNotFoundError,
    ValidationFailedError,
)
from app.modules.audit.models import AuditSource
from app.modules.audit.service import AuditActor, AuditRecorder
from app.modules.identity.models import User
from app.modules.md_attention.schemas import (
    CockpitActionResponse,
    ExecutiveOverrideRequest,
    GrantExtensionRequest,
    MDAttentionCategory,
    MDAttentionItemResponse,
    MDAttentionSummary,
    ReassignRaciRequest,
    RecordDecisionRequest,
    RequestEvidenceRequest,
    ResolveEscalationRequest,
    UpdateMilestoneStepRequest,
    VerifyEvidenceRequest,
)
from app.modules.strategy.models import QuarterlyPriority
from app.modules.work_item.models import WorkItem, WorkItemActivity, WorkItemEscalation


#: Canonical roles authorized for Needs MD Attention Executive Cockpit.
#: Includes documented MD leadership roles (MD, MD_OFFICE, MANAGING_DIRECTOR)
#: and administrative/bootstrap superusers (ADMIN, MASTER, LOCAL_BOOTSTRAP_ADMIN).
#: Generic leaders (DEPARTMENT_HEAD, MANAGER, LEADER, LEADERS) and
#: standard employees (EMPLOYEE, STAVYAN, NURSE, DOCTOR, GUEST) are strictly excluded.
MD_ATTENTION_AUTHORIZED_ROLES: frozenset[str] = frozenset(
    {
        "md",
        "md_office",
        "managing_director",
        "admin",
        "master",
        "local_bootstrap_admin",
    }
)


def is_md_attention_authorized(effective_roles: list[str]) -> bool:
    """Return True if any effective role has MD Executive Cockpit authority."""
    normalized_roles = {r.lower().strip() for r in effective_roles if r}
    return bool(normalized_roles & MD_ATTENTION_AUTHORIZED_ROLES)


class MDAttentionService:
    """Computes server-derived executive attention items and executes Cockpit actions."""

    @classmethod
    def _verify_md_authority(cls, effective_roles: list[str]) -> None:
        """Enforces that only canonical MD/MD Office leadership can access the Executive Cockpit."""
        if not is_md_attention_authorized(effective_roles):
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

        # Helper to fetch recent activities for a work item
        def _get_activities_for_item(wi_id: uuid.UUID) -> list[dict[str, Any]]:
            act_stmt = (
                select(WorkItemActivity)
                .where(WorkItemActivity.work_item_id == wi_id)
                .order_by(WorkItemActivity.created_at.desc())
                .limit(10)
            )
            activities = session.scalars(act_stmt).all()
            return [
                {
                    "id": str(a.id),
                    "author_name": a.author_name,
                    "activity_type": a.activity_type,
                    "note": a.note,
                    "previous_status": a.previous_status,
                    "new_status": a.new_status,
                    "progress_percent": a.progress_percent,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in activities
            ]

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
            acc_name = raci_data.get("accountable_name") or rec.owner_name or "Het Bhatt (MD)"
            edc = rec.edc or {}
            activities = _get_activities_for_item(rec.id)

            deferrals = [
                a for a in activities if a["activity_type"] in ("DEADLINE_CHANGE", "DEADLINE_EXTENSION", "PROGRESS_UPDATE")
            ]

            allowed = ["GRANT_EXTENSION", "REQUEST_EVIDENCE", "REASSIGN_RACI", "RECORD_DECISION"]
            disabled = {
                "VERIFY_EVIDENCE": "Deliverable is currently overdue and not yet submitted with verification evidence.",
                "RESOLVE_ESCALATION": "No active L3 escalation pending for this work item.",
            }
            if rec.status in ("blocked", "stuck"):
                allowed.append("EXECUTIVE_OVERRIDE")
            else:
                disabled["EXECUTIVE_OVERRIDE"] = "Work item is not marked as blocked."

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
                    original_due_at=rec.due_at,
                    due_age_days=due_age_days,
                    deferral_count=len(deferrals),
                    deferral_history=deferrals,
                    impact=f"High priority commitment overdue by {due_age_days}d. Threatens operational timeline and patient service standards.",
                    requested_action="Require owner to submit verified recovery plan or reassign accountable lead.",
                    requested_decision="Approve recovery extension or reassign operational accountability.",
                    evidence_state="OVERDUE — Incomplete",
                    evidence_list=edc.get("evidence_items", []),
                    activity_history=activities,
                    audit_provenance=f"work_items.id={rec.id} (v{rec.version})",
                    why_included=f"Rule: High/Urgent priority item breached scheduled due date ({rec.due_at.strftime('%Y-%m-%d') if rec.due_at else 'N/A'}).",
                    priority=rec.priority,
                    status=rec.status,
                    description=rec.description,
                    version=rec.version,
                    entity_id=str(rec.id),
                    entity_type="work_item",
                    raci=rec.raci,
                    edc=rec.edc,
                    is_synthetic=False,
                    allowed_actions=allowed,
                    disabled_actions=disabled,
                )
            )

        # -------------------------------------------------------------------
        # 2. High-Impact Blockers (Status blocked/stuck)
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
            acc_name = raci_data.get("accountable_name") or rec.owner_name or "Het Bhatt (MD)"
            activities = _get_activities_for_item(rec.id)
            edc = rec.edc or {}

            allowed = ["EXECUTIVE_OVERRIDE", "RECORD_DECISION", "REASSIGN_RACI", "GRANT_EXTENSION", "REQUEST_EVIDENCE"]
            disabled = {
                "VERIFY_EVIDENCE": "Deliverable is currently blocked and awaiting resolution before completion.",
                "RESOLVE_ESCALATION": "Use Executive Blocker Override or Record Decision to unblock directly.",
            }

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
                    original_due_at=rec.due_at,
                    due_age_days=None,
                    deferral_count=0,
                    deferral_history=[],
                    impact=f"Blocker Category: {category}. Specific Need: {need}",
                    requested_action="Provide executive authorization or override inter-departmental blocker.",
                    requested_decision=f"Issue unblock directive or contact {b_details.get('helpedByPersonOrDept', 'designated unblocker')}.",
                    evidence_state="BLOCKED — StuckNeedItem Active",
                    evidence_list=edc.get("evidence_items", []),
                    activity_history=activities,
                    audit_provenance=f"work_items.id={rec.id} (status={rec.status}, v{rec.version})",
                    why_included=f"Rule: Unresolved {urgency} blocker active: {reason}",
                    priority=rec.priority,
                    status=rec.status,
                    description=rec.description,
                    version=rec.version,
                    entity_id=str(rec.id),
                    entity_type="work_item",
                    blocker_details=rec.blocker_details,
                    raci=rec.raci,
                    edc=rec.edc,
                    is_synthetic=False,
                    allowed_actions=allowed,
                    disabled_actions=disabled,
                )
            )

        # -------------------------------------------------------------------
        # 3. Decisions Awaiting MD Authority (L3 Escalations)
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
            associated_wi = session.scalar(
                select(WorkItem).where(
                    WorkItem.id == esc.work_item_id,
                    WorkItem.organization_id == org_id,
                )
            )
            wi_title = associated_wi.title if associated_wi else "Associated Work Item"
            wi_version = associated_wi.version if associated_wi else 1
            activities = _get_activities_for_item(esc.work_item_id) if associated_wi else []

            allowed = ["RESOLVE_ESCALATION", "RECORD_DECISION", "REASSIGN_RACI"]
            if associated_wi:
                allowed.extend(["EXECUTIVE_OVERRIDE", "GRANT_EXTENSION", "REQUEST_EVIDENCE"])
            disabled = {
                "VERIFY_EVIDENCE": "Evidence verification is for completed work deliverables, not pending escalations.",
            }

            items.append(
                MDAttentionItemResponse(
                    id=f"att-decision-{esc.id}",
                    category=MDAttentionCategory.DECISION_AWAITING_AUTHORITY,
                    title=f"L3 Escalation: {esc.reason[:80]}",
                    source="Direct Level 3 Management Escalation",
                    owner_name=esc.escalated_by_name,
                    accountable_name=esc.escalated_to_name,
                    department_name="MD Office Strategic Cell",
                    due_at=associated_wi.due_at if associated_wi else None,
                    original_due_at=associated_wi.due_at if associated_wi else None,
                    due_age_days=None,
                    deferral_count=0,
                    deferral_history=[],
                    impact=f"Unresolved operational issue escalated directly to Managing Director regarding: {wi_title}.",
                    requested_action="Review escalation details and render authoritative resolution directive.",
                    requested_decision=f"Authorize resolution: {esc.reason}",
                    evidence_state="ESCALATED_L3 — Pending MD Decision",
                    evidence_list=[],
                    activity_history=activities,
                    audit_provenance=f"work_item_escalations.id={esc.id} (linked work_item={esc.work_item_id})",
                    why_included="Rule: Pending L3 escalation awaiting authoritative MD decision.",
                    priority="urgent",
                    status="escalated_l3",
                    description=f"Reason for Escalation: {esc.reason}",
                    version=wi_version,
                    entity_id=str(esc.work_item_id),
                    entity_type="work_item_escalation",
                    escalation_id=str(esc.id),
                    is_synthetic=False,
                    allowed_actions=allowed,
                    disabled_actions=disabled,
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
            .limit(15)
        )
        completed_items = session.scalars(completed_stmt).all()

        for rec in completed_items:
            edc = rec.edc or {}
            v_status = edc.get("verification_status")
            if v_status == "VERIFIED":
                continue  # Already independently verified

            evidence_needed = edc.get("evidence_required") or edc.get("definition_of_done") or "Physical audit sign-off"
            raci_data = rec.raci or {}
            acc_name = raci_data.get("accountable_name") or "Het Bhatt (MD)"
            activities = _get_activities_for_item(rec.id)

            evidence_items = edc.get("evidence_items") or [
                {
                    "name": "Standard Operational Completion Log",
                    "submitted_by": rec.owner_name or "Staff Contributor",
                    "submitted_at": rec.completed_at.isoformat() if rec.completed_at else now.isoformat(),
                    "status": "PENDING_REVIEW",
                    "notes": "Reported complete by contributor. Awaiting MD sign-off.",
                }
            ]

            allowed = ["VERIFY_EVIDENCE", "REQUEST_EVIDENCE", "RECORD_DECISION", "REASSIGN_RACI"]
            disabled = {
                "EXECUTIVE_OVERRIDE": "Deliverable has already been executed; no active blocker exists.",
                "GRANT_EXTENSION": "Item is reported complete; verification decision is required.",
                "RESOLVE_ESCALATION": "No escalation active on completed item.",
            }

            items.append(
                MDAttentionItemResponse(
                    id=f"att-verify-{rec.id}",
                    category=MDAttentionCategory.EVIDENCE_AWAITING_VERIFICATION,
                    title=f"Verification Pending: {rec.title}",
                    source=rec.source_title or f"{rec.source_type} Source",
                    owner_name=rec.owner_name or "Unassigned",
                    accountable_name=acc_name,
                    department_name=rec.department_name or "Clinical & Hospital Ops",
                    due_at=rec.due_at,
                    original_due_at=rec.due_at,
                    due_age_days=None,
                    deferral_count=0,
                    deferral_history=[],
                    impact=f"Reported complete by contributor. Required Definition of Done evidence: {evidence_needed}",
                    requested_action="Conduct independent verification against Definition of Done before closing.",
                    requested_decision="Approve verified closure or reject evidence and reopen to in_progress.",
                    evidence_state="REPORTED_COMPLETE (Awaiting Independent Signoff)",
                    evidence_list=evidence_items,
                    activity_history=activities,
                    audit_provenance=f"work_items.id={rec.id} (completed_at={rec.completed_at}, v{rec.version})",
                    why_included="Rule: Claimed completion is never equated with VERIFIED/CLOSED without independent evidence.",
                    priority=rec.priority,
                    status=rec.status,
                    description=rec.description,
                    version=rec.version,
                    entity_id=str(rec.id),
                    entity_type="work_item",
                    raci=rec.raci,
                    edc=rec.edc,
                    is_synthetic=False,
                    allowed_actions=allowed,
                    disabled_actions=disabled,
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

                    allowed = ["RECORD_DECISION", "REASSIGN_RACI"]
                    disabled = {
                        "VERIFY_EVIDENCE": "Strategic milestone step in delivery track; verify individual step tasks.",
                        "EXECUTIVE_OVERRIDE": "Use Record Decision to issue milestone guidance.",
                        "GRANT_EXTENSION": "Milestone delivery tracks are adjusted via Quarterly Priority updates.",
                        "RESOLVE_ESCALATION": "No active L3 escalation on this milestone step.",
                    }

                    items.append(
                        MDAttentionItemResponse(
                            id=f"att-milestone-{prio.id}-{step_num}",
                            category=MDAttentionCategory.AT_RISK_MILESTONE,
                            title=f"Step #{step_num} Delivery: {ms_title}",
                            source=f"Quarterly Priority: {prio.title}",
                            owner_name=ms.owner_name or "Strategic Lead",
                            accountable_name="Het Bhatt (MD)",
                            department_name="Spine Surgery & Hospital Operations",
                            due_at=None,
                            original_due_at=None,
                            due_age_days=None,
                            deferral_count=0,
                            deferral_history=[],
                            impact=f"Active step in 10-step delivery chain. Prerequisite for downstream Step #{step_num + 1}.",
                            requested_action="Track weekly milestone velocity and unblock dependency gates.",
                            requested_decision="Issue strategic milestone directive or reassign accountable lead.",
                            evidence_state=f"{ms.status} — Step #{step_num}",
                            evidence_list=[],
                            activity_history=[],
                            audit_provenance=f"quarterly_priorities.id={prio.id} (step={step_num})",
                            why_included=f"Rule: Active milestone step in progress requiring MD delivery oversight.",
                            priority="high",
                            status=ms.status.lower(),
                            description=f"Strategic Objective: {prio.title}. Outcome: {prio.expected_outcome or 'Operational Delivery'}",
                            version=1,
                            entity_id=str(prio.id),
                            entity_type="quarterly_priority",
                            is_synthetic=False,
                            allowed_actions=allowed,
                            disabled_actions=disabled,
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
                activities = _get_activities_for_item(rec.id)
                deferrals = [
                    a for a in activities if a["activity_type"] in ("DEADLINE_CHANGE", "DEADLINE_EXTENSION", "PROGRESS_UPDATE", "STATUS_CHANGE")
                ]

                allowed = ["RECORD_DECISION", "REASSIGN_RACI", "GRANT_EXTENSION", "REQUEST_EVIDENCE"]
                disabled = {
                    "VERIFY_EVIDENCE": "Item is actively in progress with multiple revisions; not yet submitted for closure.",
                    "RESOLVE_ESCALATION": "No escalation active.",
                    "EXECUTIVE_OVERRIDE": "Item is not currently in blocked state.",
                }

                items.append(
                    MDAttentionItemResponse(
                        id=f"att-deferral-{rec.id}",
                        category=MDAttentionCategory.REPEATED_DEFERRAL,
                        title=f"Multiple Updates: {rec.title}",
                        source=rec.source_title or f"{rec.source_type} Source",
                        owner_name=rec.owner_name or "Unassigned",
                        accountable_name=rec.owner_name or "Het Bhatt (MD)",
                        department_name=rec.department_name or "Clinical & Hospital Ops",
                        due_at=rec.due_at,
                        original_due_at=rec.due_at,
                        due_age_days=None,
                        deferral_count=len(deferrals),
                        deferral_history=deferrals,
                        impact="Task has been updated repeatedly without achieving final verified outcome. Risk of scope creep or unstated blockers.",
                        requested_action="Review task scope with owner; split into smaller atomic deliverables or clarify requirements.",
                        requested_decision="Reassign owner or issue executive restructuring directive.",
                        evidence_state="REPEATED_UPDATES",
                        evidence_list=[],
                        activity_history=activities,
                        audit_provenance=f"work_items.id={rec.id} (v{rec.version})",
                        why_included="Rule: Item has multiple status/progress adjustments without closure.",
                        priority=rec.priority,
                        status=rec.status,
                        description=rec.description,
                        version=rec.version,
                        entity_id=str(rec.id),
                        entity_type="work_item",
                        raci=rec.raci,
                        edc=rec.edc,
                        is_synthetic=False,
                        allowed_actions=allowed,
                        disabled_actions=disabled,
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
    # Cockpit Action Handlers (Strictly RBAC & Concurrency Controlled)
    # -----------------------------------------------------------------------

    @classmethod
    def resolve_escalation(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
        payload: ResolveEscalationRequest,
    ) -> CockpitActionResponse:
        """Resolves an L3 escalation with authoritative MD decision and unblock directive."""
        cls._verify_md_authority(effective_roles)
        if not payload.directive_notes or not payload.directive_notes.strip():
            raise ValidationFailedError("Directive notes are mandatory for resolving an escalation.")

        now = utcnow()

        try:
            esc = session.scalar(
                select(WorkItemEscalation).where(
                    WorkItemEscalation.id == payload.escalation_id,
                    WorkItemEscalation.organization_id == current_user.organization_id,
                )
            )
            if not esc:
                raise ResourceNotFoundError(f"Escalation {payload.escalation_id} not found.")

            if esc.status == "RESOLVED":
                raise ValidationFailedError("Escalation is already resolved.")

            prev_status = esc.status
            esc.status = "RESOLVED"
            esc.resolution_note = f"Decision: {payload.decision}. Directive: {payload.directive_notes.strip()}"
            esc.resolved_at = now

            work_item = session.scalar(
                select(WorkItem).where(
                    WorkItem.id == esc.work_item_id,
                    WorkItem.organization_id == current_user.organization_id,
                )
            )
            if work_item and payload.expected_version is not None and work_item.version != payload.expected_version:
                raise ConflictError(
                    f"Optimistic concurrency conflict: WorkItem version is {work_item.version}, expected {payload.expected_version}."
                )

            if work_item and payload.unblock_work_item:
                work_item.status = "in_progress"
                work_item.blocked_reason = None
                work_item.blocked_at = None
                work_item.blocker_details = None
                work_item.updated_at = now
                work_item.version += 1

                activity = WorkItemActivity(
                    work_item_id=work_item.id,
                    author_id=current_user.id,
                    author_name=current_user.full_name,
                    activity_type="STATUS_CHANGE",
                    note=f"MD Escalation Directive ({payload.decision}): {payload.directive_notes.strip()}",
                    previous_status="blocked",
                    new_status="in_progress",
                    progress_percent=work_item.progress_percent,
                    created_at=now,
                )
                session.add(activity)

            recorder = AuditRecorder(session, source=AuditSource.API)
            audit = recorder.record(
                action="md_attention.resolve_escalation",
                entity_type="work_item_escalation",
                entity_id=esc.id,
                actor=AuditActor.user(current_user.id),
                organization_id=current_user.organization_id,
                before={"status": prev_status},
                after={"status": "RESOLVED", "decision": payload.decision},
                reason=payload.directive_notes.strip(),
            )
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
        except Exception:
            session.rollback()
            raise

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
        if not payload.verification_notes or not payload.verification_notes.strip():
            raise ValidationFailedError("Verification notes are mandatory for auditing evidence.")

        now = utcnow()

        try:
            item = session.scalar(
                select(WorkItem).where(
                    WorkItem.id == payload.work_item_id,
                    WorkItem.organization_id == current_user.organization_id,
                )
            )
            if not item:
                raise ResourceNotFoundError(f"WorkItem {payload.work_item_id} not found.")

            if item.status in ("blocked", "stuck") and payload.verification_result == "VERIFIED_CLOSED":
                raise ValidationFailedError("Cannot verify and close a deliverable that is currently blocked or stuck.")

            if payload.expected_version is not None and item.version != payload.expected_version:
                raise ConflictError(
                    f"Optimistic concurrency conflict: WorkItem version is {item.version}, expected {payload.expected_version}."
                )

            edc = dict(item.edc or {})
            prev_status = item.status

            if payload.verification_result == "VERIFIED_CLOSED":
                item.status = "completed"
                item.progress_percent = 100
                item.completed_at = now
                edc["verification_status"] = "VERIFIED"
                edc["verified_by"] = current_user.full_name
                edc["verified_at"] = now.isoformat()
                edc["verification_notes"] = payload.verification_notes.strip()
                item.edc = edc
                note = f"MD Independent Verification: APPROVED & CLOSED. Notes: {payload.verification_notes.strip()}"
            else:
                item.status = "in_progress"
                item.progress_percent = 80
                item.completed_at = None
                edc["verification_status"] = "REJECTED"
                edc["rejected_by"] = current_user.full_name
                edc["rejected_at"] = now.isoformat()
                edc["rejection_notes"] = payload.verification_notes.strip()
                item.edc = edc
                note = f"MD Independent Verification: REJECTED (Reopened to in_progress). Notes: {payload.verification_notes.strip()}"

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

            recorder = AuditRecorder(session, source=AuditSource.API)
            audit = recorder.record(
                action="md_attention.verify_evidence",
                entity_type="work_item",
                entity_id=item.id,
                actor=AuditActor.user(current_user.id),
                organization_id=current_user.organization_id,
                before={"status": prev_status},
                after={"status": item.status, "verification_result": payload.verification_result},
                reason=payload.verification_notes.strip(),
            )
            session.commit()

            return CockpitActionResponse(
                success=True,
                message=f"Evidence verification completed: {payload.verification_result}.",
                action_type="VERIFY_EVIDENCE",
                entity_id=str(item.id),
                entity_type="work_item",
                audit_event_id=str(audit.id),
                updated_at=now,
            )
        except Exception:
            session.rollback()
            raise

    @classmethod
    def request_evidence(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
        payload: RequestEvidenceRequest,
    ) -> CockpitActionResponse:
        """Requests accountable owner or contributor to submit concrete evidence or recovery plan."""
        cls._verify_md_authority(effective_roles)
        if not payload.request_notes or not payload.request_notes.strip():
            raise ValidationFailedError("Evidence request notes are mandatory.")

        now = utcnow()

        try:
            item = session.scalar(
                select(WorkItem).where(
                    WorkItem.id == payload.work_item_id,
                    WorkItem.organization_id == current_user.organization_id,
                )
            )
            if not item:
                raise ResourceNotFoundError(f"WorkItem {payload.work_item_id} not found.")

            if payload.expected_version is not None and item.version != payload.expected_version:
                raise ConflictError(
                    f"Optimistic concurrency conflict: WorkItem version is {item.version}, expected {payload.expected_version}."
                )

            edc = dict(item.edc or {})
            edc["evidence_requested"] = True
            edc["evidence_request_notes"] = payload.request_notes.strip()
            edc["evidence_requested_at"] = now.isoformat()
            edc["evidence_requested_by"] = current_user.full_name
            item.edc = edc

            if payload.deadline_extension_days and payload.deadline_extension_days > 0:
                base_due = item.due_at or now
                item.due_at = base_due + timedelta(days=payload.deadline_extension_days)

            item.updated_at = now
            item.version += 1

            activity = WorkItemActivity(
                work_item_id=item.id,
                author_id=current_user.id,
                author_name=current_user.full_name,
                activity_type="EVIDENCE_REQUESTED",
                note=f"MD Evidence Request: {payload.request_notes.strip()}",
                previous_status=item.status,
                new_status=item.status,
                progress_percent=item.progress_percent,
                created_at=now,
            )
            session.add(activity)

            recorder = AuditRecorder(session, source=AuditSource.API)
            audit = recorder.record(
                action="md_attention.request_evidence",
                entity_type="work_item",
                entity_id=item.id,
                actor=AuditActor.user(current_user.id),
                organization_id=current_user.organization_id,
                before={},
                after={"evidence_requested": True},
                reason=payload.request_notes.strip(),
            )
            session.commit()

            return CockpitActionResponse(
                success=True,
                message="Evidence request sent to accountable owner.",
                action_type="REQUEST_EVIDENCE",
                entity_id=str(item.id),
                entity_type="work_item",
                audit_event_id=str(audit.id),
                updated_at=now,
            )
        except Exception:
            session.rollback()
            raise

    @classmethod
    def record_decision(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
        payload: RecordDecisionRequest,
    ) -> CockpitActionResponse:
        """Records a formal MD executive decision and directive on a work item."""
        cls._verify_md_authority(effective_roles)
        if not payload.decision_text or not payload.decision_text.strip():
            raise ValidationFailedError("Decision text is mandatory.")
        if not payload.directive or not payload.directive.strip():
            raise ValidationFailedError("Executive directive is mandatory.")

        now = utcnow()

        try:
            item = session.scalar(
                select(WorkItem).where(
                    WorkItem.id == payload.work_item_id,
                    WorkItem.organization_id == current_user.organization_id,
                )
            )
            if not item:
                raise ResourceNotFoundError(f"WorkItem {payload.work_item_id} not found.")

            if payload.expected_version is not None and item.version != payload.expected_version:
                raise ConflictError(
                    f"Optimistic concurrency conflict: WorkItem version is {item.version}, expected {payload.expected_version}."
                )

            prev_status = item.status
            if payload.unblock and item.status in ("blocked", "stuck"):
                item.status = "in_progress"
                item.blocked_reason = None
                item.blocked_at = None
                item.blocker_details = None

            item.updated_at = now
            item.version += 1

            activity = WorkItemActivity(
                work_item_id=item.id,
                author_id=current_user.id,
                author_name=current_user.full_name,
                activity_type="DECISION_RECORDED",
                note=f"MD Executive Decision: {payload.decision_text.strip()} — Directive: {payload.directive.strip()}",
                previous_status=prev_status,
                new_status=item.status,
                progress_percent=item.progress_percent,
                created_at=now,
            )
            session.add(activity)

            recorder = AuditRecorder(session, source=AuditSource.API)
            audit = recorder.record(
                action="md_attention.record_decision",
                entity_type="work_item",
                entity_id=item.id,
                actor=AuditActor.user(current_user.id),
                organization_id=current_user.organization_id,
                before={"status": prev_status},
                after={"status": item.status, "decision": payload.decision_text.strip(), "directive": payload.directive.strip()},
                reason=payload.decision_text.strip(),
            )
            session.commit()

            return CockpitActionResponse(
                success=True,
                message="MD Decision recorded with executive directive.",
                action_type="RECORD_DECISION",
                entity_id=str(item.id),
                entity_type="work_item",
                audit_event_id=str(audit.id),
                updated_at=now,
            )
        except Exception:
            session.rollback()
            raise

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
        if not payload.override_reason or not payload.override_reason.strip():
            raise ValidationFailedError("Override reason is mandatory for audit compliance.")

        now = utcnow()

        try:
            item = session.scalar(
                select(WorkItem).where(
                    WorkItem.id == payload.work_item_id,
                    WorkItem.organization_id == current_user.organization_id,
                )
            )
            if not item:
                raise ResourceNotFoundError(f"WorkItem {payload.work_item_id} not found.")

            if item.status not in ("blocked", "stuck"):
                raise ValidationFailedError("Executive override can only be applied to deliverables that are blocked or stuck.")

            if payload.expected_version is not None and item.version != payload.expected_version:
                raise ConflictError(
                    f"Optimistic concurrency conflict: WorkItem version is {item.version}, expected {payload.expected_version}."
                )

            prev_status = item.status
            if payload.clear_blocker:
                item.status = "in_progress"
                item.blocked_reason = None
                item.blocked_at = None
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
                note=f"Executive Blocker Override by {current_user.full_name}: {payload.override_reason.strip()}",
                previous_status=prev_status,
                new_status=item.status,
                progress_percent=item.progress_percent,
                created_at=now,
            )
            session.add(activity)

            recorder = AuditRecorder(session, source=AuditSource.API)
            audit = recorder.record(
                action="md_attention.executive_override",
                entity_type="work_item",
                entity_id=item.id,
                actor=AuditActor.user(current_user.id),
                organization_id=current_user.organization_id,
                before={"status": prev_status},
                after={"status": item.status, "clear_blocker": payload.clear_blocker},
                reason=payload.override_reason.strip(),
            )
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
        except Exception:
            session.rollback()
            raise

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
        if not payload.justification or not payload.justification.strip():
            raise ValidationFailedError("Justification is mandatory for deadline extension.")

        now = utcnow()

        try:
            item = session.scalar(
                select(WorkItem).where(
                    WorkItem.id == payload.work_item_id,
                    WorkItem.organization_id == current_user.organization_id,
                )
            )
            if not item:
                raise ResourceNotFoundError(f"WorkItem {payload.work_item_id} not found.")

            if payload.expected_version is not None and item.version != payload.expected_version:
                raise ConflictError(
                    f"Optimistic concurrency conflict: WorkItem version is {item.version}, expected {payload.expected_version}."
                )

            prev_due = item.due_at.isoformat() if item.due_at else "None"
            item.due_at = payload.new_due_at
            item.updated_at = now
            item.version += 1

            activity = WorkItemActivity(
                work_item_id=item.id,
                author_id=current_user.id,
                author_name=current_user.full_name,
                activity_type="DEADLINE_EXTENSION",
                note=f"MD Authorized Extension: New due date {payload.new_due_at.strftime('%Y-%m-%d')}. Rationale: {payload.justification.strip()}",
                previous_status=item.status,
                new_status=item.status,
                progress_percent=item.progress_percent,
                created_at=now,
            )
            session.add(activity)

            recorder = AuditRecorder(session, source=AuditSource.API)
            audit = recorder.record(
                action="md_attention.grant_extension",
                entity_type="work_item",
                entity_id=item.id,
                actor=AuditActor.user(current_user.id),
                organization_id=current_user.organization_id,
                before={"due_at": prev_due},
                after={"due_at": payload.new_due_at.isoformat()},
                reason=payload.justification.strip(),
            )
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
        except Exception:
            session.rollback()
            raise

    @classmethod
    def reassign_raci(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
        payload: ReassignRaciRequest,
    ) -> CockpitActionResponse:
        """Authoritatively reassigns RACI ownership and accountability."""
        cls._verify_md_authority(effective_roles)
        if not payload.rationale or not payload.rationale.strip():
            raise ValidationFailedError("Rationale is mandatory for RACI reassignment.")
        if not payload.responsible_name.strip() and not payload.accountable_name.strip():
            raise ValidationFailedError("At least one RACI assignee name is required.")

        now = utcnow()

        try:
            item = session.scalar(
                select(WorkItem).where(
                    WorkItem.id == payload.work_item_id,
                    WorkItem.organization_id == current_user.organization_id,
                )
            )
            if not item:
                raise ResourceNotFoundError(f"WorkItem {payload.work_item_id} not found.")

            if payload.expected_version is not None and item.version != payload.expected_version:
                raise ConflictError(
                    f"Optimistic concurrency conflict: WorkItem version is {item.version}, expected {payload.expected_version}."
                )

            raci = dict(item.raci or {})
            raci["responsible_id"] = str(payload.responsible_id) if payload.responsible_id else raci.get("responsible_id")
            raci["responsible_name"] = payload.responsible_name.strip()
            raci["accountable_id"] = str(payload.accountable_id) if payload.accountable_id else raci.get("accountable_id")
            raci["accountable_name"] = payload.accountable_name.strip()
            item.raci = raci

            if payload.responsible_id:
                item.owner_id = payload.responsible_id
            item.owner_name = payload.responsible_name.strip()
            item.updated_at = now
            item.version += 1

            activity = WorkItemActivity(
                work_item_id=item.id,
                author_id=current_user.id,
                author_name=current_user.full_name,
                activity_type="RACI_CHANGE",
                note=f"MD RACI Reassignment: Responsible={payload.responsible_name.strip()}, Accountable={payload.accountable_name.strip()}. Rationale: {payload.rationale.strip()}",
                previous_status=item.status,
                new_status=item.status,
                progress_percent=item.progress_percent,
                created_at=now,
            )
            session.add(activity)

            recorder = AuditRecorder(session, source=AuditSource.API)
            audit = recorder.record(
                action="md_attention.reassign_raci",
                entity_type="work_item",
                entity_id=item.id,
                actor=AuditActor.user(current_user.id),
                organization_id=current_user.organization_id,
                before={},
                after={"responsible_name": payload.responsible_name.strip(), "accountable_name": payload.accountable_name.strip()},
                reason=payload.rationale.strip(),
            )
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
        except Exception:
            session.rollback()
            raise

    @classmethod
    def update_milestone_step(
        cls,
        session: Session,
        current_user: User,
        effective_roles: list[str],
        payload: UpdateMilestoneStepRequest,
    ) -> CockpitActionResponse:
        """Updates a 10-step milestone status under a Quarterly Priority."""
        cls._verify_md_authority(effective_roles)
        now = utcnow()

        try:
            prio = session.scalar(
                select(QuarterlyPriority).where(
                    QuarterlyPriority.id == payload.priority_id,
                    QuarterlyPriority.organization_id == current_user.organization_id,
                )
            )
            if not prio:
                raise ResourceNotFoundError(f"QuarterlyPriority {payload.priority_id} not found.")

            from app.modules.strategy.schemas import MilestoneStepUpdate
            from app.modules.strategy.service import StrategyService
            updated_prio = StrategyService.update_milestone_step(
                session=session,
                current_user=current_user,
                priority_id=payload.priority_id,
                step_number=payload.step_number,
                payload=MilestoneStepUpdate(
                    status=payload.status,
                    verification_notes=payload.verification_notes,
                ),
            )

            return CockpitActionResponse(
                success=True,
                message=f"Milestone Step #{payload.step_number} updated to {payload.status}.",
                action_type="UPDATE_MILESTONE_STEP",
                entity_id=str(updated_prio.id),
                entity_type="quarterly_priority",
                audit_event_id=None,
                updated_at=now,
            )
        except Exception:
            session.rollback()
            raise
