"""Pydantic schemas for the LAKSHYA Needs MD Attention domain & Cockpit actions."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class MDAttentionCategory(str, Enum):
    CRITICAL_OVERDUE = "CRITICAL_OVERDUE"
    HIGH_IMPACT_BLOCKER = "HIGH_IMPACT_BLOCKER"
    DECISION_AWAITING_AUTHORITY = "DECISION_AWAITING_AUTHORITY"
    EVIDENCE_AWAITING_VERIFICATION = "EVIDENCE_AWAITING_VERIFICATION"
    AT_RISK_MILESTONE = "AT_RISK_MILESTONE"
    REPEATED_DEFERRAL = "REPEATED_DEFERRAL"


class MDAttentionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category: MDAttentionCategory
    title: str
    source: str
    owner_name: str
    accountable_name: str
    department_name: str | None = None
    due_at: datetime | None = None
    due_age_days: int | None = None
    impact: str
    requested_action: str
    evidence_state: str
    audit_provenance: str
    why_included: str
    priority: str = "medium"
    entity_id: str
    entity_type: str = "work_item"
    escalation_id: str | None = None
    blocker_details: dict[str, Any] | None = None
    raci: dict[str, Any] | None = None
    edc: dict[str, Any] | None = None


class MDAttentionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_items: int = 0
    critical_overdue_count: int = 0
    high_impact_blocker_count: int = 0
    decision_awaiting_count: int = 0
    evidence_verification_count: int = 0
    at_risk_milestone_count: int = 0
    repeated_deferrals_count: int = 0
    items: list[MDAttentionItemResponse] = Field(default_factory=list)


# --- Cockpit Executive Action Schemas ---

class ResolveEscalationRequest(BaseModel):
    escalation_id: uuid.UUID
    decision: str = Field(..., description="'APPROVED', 'REJECTED', or 'DIRECTIVE_ISSUED'")
    directive_notes: str = Field(..., min_length=3)
    unblock_work_item: bool = True


class VerifyEvidenceRequest(BaseModel):
    work_item_id: uuid.UUID
    verification_result: str = Field(..., description="'VERIFIED_CLOSED' or 'REJECTED_REOPEN'")
    verification_notes: str = Field(..., min_length=3)


class ExecutiveOverrideRequest(BaseModel):
    work_item_id: uuid.UUID
    override_reason: str = Field(..., min_length=3)
    clear_blocker: bool = True
    new_due_at: datetime | None = None


class GrantExtensionRequest(BaseModel):
    work_item_id: uuid.UUID
    new_due_at: datetime
    justification: str = Field(..., min_length=3)


class ReassignRaciRequest(BaseModel):
    work_item_id: uuid.UUID
    responsible_id: uuid.UUID | None = None
    responsible_name: str
    accountable_id: uuid.UUID | None = None
    accountable_name: str
    rationale: str = Field(..., min_length=3)


class UpdateMilestoneStepRequest(BaseModel):
    priority_id: uuid.UUID
    step_number: int = Field(..., ge=1, le=10)
    status: str = Field(..., description="'IN_PROGRESS', 'COMPLETED', or 'AT_RISK'")
    verification_notes: str | None = None


class CockpitActionResponse(BaseModel):
    success: bool = True
    message: str
    action_type: str
    entity_id: str
    entity_type: str
    audit_event_id: str | None = None
    updated_at: datetime
