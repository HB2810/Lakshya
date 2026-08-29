"""Strategy domain service layer.

Manages Strategic Directions, Quarterly Priorities, and 10-Milestone Delivery Stepper
with RBAC enforcement and append-only audit trails.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import ResourceNotFoundError
from app.modules.access.authorization import AuthorizationService
from app.modules.audit.service import AuditActor, AuditRecorder, AuditSource
from app.modules.identity.models import User
from app.modules.strategy.models import AnnualGoal, QuarterlyPriority
from app.modules.strategy.schemas import (
    MilestoneStepSchema,
    MilestoneStepUpdate,
    QuarterlyPriorityCreate,
    QuarterlyPriorityResponse,
    QuarterlyPriorityUpdate,
)

DEFAULT_10_MILESTONE_TEMPLATES = [
    {
        "step_number": 1,
        "title": "Executive Charter & Clinical Stakeholder Kickoff",
        "description": "Align MD Office, department heads, and operational leadership on target metrics.",
        "owner_name": "Department Head",
        "target_date": "2026-07-10",
        "status": "COMPLETED",
        "key_deliverable": "Signed Project Charter & KPI Targets Document",
        "verification_notes": "Approved in Executive Council.",
    },
    {
        "step_number": 2,
        "title": "Baseline Workflow & Patient Journey Audit",
        "description": "Comprehensive time-motion study of department workflow and bottlenecks.",
        "owner_name": "Operations Lead",
        "target_date": "2026-07-20",
        "status": "COMPLETED",
        "key_deliverable": "Detailed Operational Bottleneck Analysis Report",
        "verification_notes": "Baseline metrics established.",
    },
    {
        "step_number": 3,
        "title": "Process Redesign & Architecture Protocol Specification",
        "description": "Technical and operational protocol definition for improved outcomes.",
        "owner_name": "Lead Coordinator",
        "target_date": "2026-07-31",
        "status": "COMPLETED",
        "key_deliverable": "Standard Operating Protocols & System Specs",
        "verification_notes": "Cross-department alignment completed.",
    },
    {
        "step_number": 4,
        "title": "Resource Allocation & Equipment / Tooling Deployment",
        "description": "Procurement and setup of required clinical tools, digital scanners, or resources.",
        "owner_name": "Resource Lead",
        "target_date": "2026-08-15",
        "status": "COMPLETED",
        "key_deliverable": "All Resource Checkpoints Deployed",
        "verification_notes": "Equipment calibrated and verified.",
    },
    {
        "step_number": 5,
        "title": "Pilot Rollout in Primary Department Unit",
        "description": "Initial live test deployment with target cohort and initial monitoring.",
        "owner_name": "Unit Supervisor",
        "target_date": "2026-08-28",
        "status": "IN_PROGRESS",
        "key_deliverable": "Live Pilot Telemetry & Success Rate > 99%",
        "verification_notes": "Currently active.",
    },
    {
        "step_number": 6,
        "title": "Mid-Cycle Quality & Compliance Review",
        "description": "Audit quality metrics, safety checklist adherence, and clinical compliance.",
        "owner_name": "Quality Incharge",
        "target_date": "2026-09-05",
        "status": "PENDING",
        "key_deliverable": "Mid-Term Compliance Verification Report",
        "verification_notes": None,
    },
    {
        "step_number": 7,
        "title": "Hospital-Wide Staff Training & Nursing SOP Rollout",
        "description": "Execute structured training for all involved staff, attendants, and coordinators.",
        "owner_name": "Training & Nursing Head",
        "target_date": "2026-09-12",
        "status": "PENDING",
        "key_deliverable": "100% Staff Certification & SOP Distribution",
        "verification_notes": None,
    },
    {
        "step_number": 8,
        "title": "Full Operational Integration Across Units",
        "description": "Expand protocol across all surgical suites, wards, and outpatient clinics.",
        "owner_name": "Operations Head",
        "target_date": "2026-09-20",
        "status": "PENDING",
        "key_deliverable": "Hospital-Wide System Activation",
        "verification_notes": None,
    },
    {
        "step_number": 9,
        "title": "Executive Stress-Testing & Resilience Verification",
        "description": "Simulate peak patient surge volume and failover resilience checks.",
        "owner_name": "IT & Operations Team",
        "target_date": "2026-09-25",
        "status": "PENDING",
        "key_deliverable": "Zero-Downtime Resilience Audit Report",
        "verification_notes": None,
    },
    {
        "step_number": 10,
        "title": "Final Outcome Measurement, MD Sign-Off & Governance Handoff",
        "description": "Synthesize final outcome data and obtain formal MD Executive sign-off.",
        "owner_name": "Managing Director",
        "target_date": "2026-09-30",
        "status": "PENDING",
        "key_deliverable": "Final Strategic Outcome Report & MD Sign-Off",
        "verification_notes": None,
    },
]


class StrategyService:
    """Service layer for managing Strategic Priorities and 10-Milestone Stepper."""

    @staticmethod
    def _parse_milestones(expected_outcome: str | None) -> list[MilestoneStepSchema]:
        """Deserialize milestones from expected_outcome JSON or return default templates."""
        if not expected_outcome:
            return [MilestoneStepSchema(**m) for m in DEFAULT_10_MILESTONE_TEMPLATES]

        try:
            data = json.loads(expected_outcome)
            if isinstance(data, dict) and "milestones" in data:
                return [MilestoneStepSchema(**m) for m in data["milestones"]]
            elif isinstance(data, list):
                return [MilestoneStepSchema(**m) for m in data]
        except Exception:
            pass

        return [MilestoneStepSchema(**m) for m in DEFAULT_10_MILESTONE_TEMPLATES]

    @staticmethod
    def _dump_milestones(milestones: list[MilestoneStepSchema], extra_meta: dict[str, Any] | None = None) -> str:
        payload = extra_meta or {}
        payload["milestones"] = [m.model_dump(mode="json") for m in milestones]
        return json.dumps(payload)

    @classmethod
    def _to_response(cls, item: QuarterlyPriority) -> QuarterlyPriorityResponse:
        milestones = cls._parse_milestones(item.expected_outcome)
        completed_count = sum(1 for m in milestones if m.status == "COMPLETED")
        progress_percent = int((completed_count / max(len(milestones), 1)) * 100)
        
        # Determine current active step (first non-completed step or last step)
        current_step = 10
        for m in sorted(milestones, key=lambda x: x.step_number):
            if m.status != "COMPLETED":
                current_step = m.step_number
                break

        # Extract extra meta from json if present
        reporting_authority = "Managing Director"
        department = "Spine Surgery & Operations"
        target_date = "2026-09-30"
        description = item.title

        if item.expected_outcome:
            try:
                raw = json.loads(item.expected_outcome)
                if isinstance(raw, dict):
                    reporting_authority = raw.get("reporting_authority", reporting_authority)
                    department = raw.get("department", department)
                    target_date = raw.get("target_date", target_date)
                    description = raw.get("description", description)
            except Exception:
                pass

        return QuarterlyPriorityResponse(
            id=item.id,
            organization_id=item.organization_id,
            year=item.fy_start_year,
            quarter=item.quarter,
            title=item.title,
            description=description,
            strategic_objective=item.title,
            reporting_authority=reporting_authority,
            department=department,
            status=item.status,
            progress_percent=progress_percent,
            current_step=current_step,
            target_date=target_date,
            milestones=milestones,
            created_at=item.created_at,
            updated_at=item.updated_at,
            version=item.version,
        )

    @classmethod
    def list_quarterly_priorities(
        cls,
        session: Session,
        current_user: User,
        year: int | None = None,
        quarter: str | None = None,
    ) -> list[QuarterlyPriorityResponse]:
        """List quarterly priorities within authenticated organization."""
        stmt = select(QuarterlyPriority).where(
            QuarterlyPriority.organization_id == current_user.organization_id
        )
        if year:
            stmt = stmt.where(QuarterlyPriority.fy_start_year == year)
        if quarter:
            stmt = stmt.where(QuarterlyPriority.quarter == quarter)

        stmt = stmt.order_by(QuarterlyPriority.created_at.desc())
        records = session.scalars(stmt).all()
        return [cls._to_response(r) for r in records]

    @classmethod
    def get_quarterly_priority(
        cls,
        session: Session,
        current_user: User,
        priority_id: uuid.UUID,
    ) -> QuarterlyPriorityResponse:
        record = session.scalar(
            select(QuarterlyPriority).where(
                QuarterlyPriority.id == priority_id,
                QuarterlyPriority.organization_id == current_user.organization_id,
            )
        )
        if not record:
            raise ResourceNotFoundError(f"QuarterlyPriority {priority_id} not found")
        return cls._to_response(record)

    @classmethod
    def create_quarterly_priority(
        cls,
        session: Session,
        current_user: User,
        payload: QuarterlyPriorityCreate,
    ) -> QuarterlyPriorityResponse:
        """Create a new Quarterly Priority with initialized 10-milestone stepper."""
        auth_context = AuthorizationService(session).load_context(current_user)
        effective_roles = auth_context.effective_roles
        is_authorized = any(r in ("md", "leader", "master", "department_head", "manager") for r in effective_roles)
        if not is_authorized and not (
            auth_context.has_organization_scope("priorities.propose")
            or auth_context.has_organization_scope("priorities.approve")
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create quarterly priorities",
            )

        milestones = payload.milestones or [MilestoneStepSchema(**m) for m in DEFAULT_10_MILESTONE_TEMPLATES]
        extra_meta = {
            "reporting_authority": payload.reporting_authority,
            "department": payload.department,
            "description": payload.description or payload.title,
            "target_date": f"{payload.fy_start_year}-09-30",
        }
        outcome_json = cls._dump_milestones(milestones, extra_meta)

        record = QuarterlyPriority(
            organization_id=current_user.organization_id,
            title=payload.title,
            expected_outcome=outcome_json,
            owner_id=payload.owner_id or current_user.id,
            proposer_id=current_user.id,
            fy_start_year=payload.fy_start_year,
            quarter=payload.quarter,
            status="ACTIVE",
        )
        session.add(record)
        session.flush()

        # Audit Event
        AuditRecorder(session, source=AuditSource.API).record(
            action="strategy.priority.created",
            entity_type="quarterly_priority",
            actor=AuditActor.user(current_user.id),
            organization_id=current_user.organization_id,
            entity_id=record.id,
            after={
                "id": str(record.id),
                "title": record.title,
                "quarter": record.quarter,
                "year": record.fy_start_year,
                "status": record.status,
            },
        )
        session.commit()
        session.refresh(record)
        return cls._to_response(record)

    @classmethod
    def update_milestone_step(
        cls,
        session: Session,
        current_user: User,
        priority_id: uuid.UUID,
        step_number: int,
        payload: MilestoneStepUpdate,
    ) -> QuarterlyPriorityResponse:
        """Advance or update the verification status of a specific milestone step."""
        record = session.scalar(
            select(QuarterlyPriority).where(
                QuarterlyPriority.id == priority_id,
                QuarterlyPriority.organization_id == current_user.organization_id,
            )
        )
        if not record:
            raise ResourceNotFoundError(f"QuarterlyPriority {priority_id} not found")

        milestones = cls._parse_milestones(record.expected_outcome)
        target_step = next((m for m in milestones if m.step_number == step_number), None)
        if not target_step:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Milestone step {step_number} not found in priority",
            )

        old_status = target_step.status
        target_step.status = payload.status
        if payload.verification_notes is not None:
            target_step.verification_notes = payload.verification_notes
        if payload.status == "COMPLETED" and not target_step.completed_at:
            target_step.completed_at = utcnow()

        # Preserve extra metadata
        extra_meta = {}
        if record.expected_outcome:
            try:
                raw = json.loads(record.expected_outcome)
                if isinstance(raw, dict):
                    extra_meta = {k: v for k, v in raw.items() if k != "milestones"}
            except Exception:
                pass

        record.expected_outcome = cls._dump_milestones(milestones, extra_meta)
        record.version += 1
        session.flush()

        # Record Audit Trail
        AuditRecorder(session, source=AuditSource.API).record(
            action="strategy.milestone.updated",
            entity_type="quarterly_priority",
            actor=AuditActor.user(current_user.id),
            organization_id=current_user.organization_id,
            entity_id=record.id,
            before={"step_number": step_number, "status": old_status},
            after={
                "step_number": step_number,
                "status": target_step.status,
                "verification_notes": target_step.verification_notes,
            },
        )
        session.commit()
        session.refresh(record)
        return cls._to_response(record)
