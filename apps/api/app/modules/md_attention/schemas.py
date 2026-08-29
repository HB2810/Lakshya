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
    original_due_at: datetime | None = None
    due_age_days: int | None = None
    deferral_count: int = 0
    deferral_history: list[dict[str, Any]] = Field(default_factory=list)
    impact: str
    requested_action: str
    requested_decision: str | None = None
    evidence_state: str
    evidence_list: list[dict[str, Any]] = Field(default_factory=list)
    activity_history: list[dict[str, Any]] = Field(default_factory=list)
    audit_provenance: str
    why_included: str
    priority: str = "medium"
    status: str = "todo"
    description: str | None = None
    version: int = 1
    entity_id: str
    entity_type: str = "work_item"
    escalation_id: str | None = None
    blocker_details: dict[str, Any] | None = None
    raci: dict[str, Any] | None = None
    edc: dict[str, Any] | None = None
    is_synthetic: bool = False
    allowed_actions: list[str] = Field(default_factory=list)
    disabled_actions: dict[str, str] = Field(default_factory=dict)


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
    expected_version: int | None = None


class VerifyEvidenceRequest(BaseModel):
    work_item_id: uuid.UUID
    verification_result: str = Field(..., description="'VERIFIED_CLOSED' or 'REJECTED_REOPEN'")
    verification_notes: str = Field(..., min_length=3)
    expected_version: int | None = None


class RequestEvidenceRequest(BaseModel):
    work_item_id: uuid.UUID
    request_notes: str = Field(..., min_length=3)
    deadline_extension_days: int | None = None
    expected_version: int | None = None


class RecordDecisionRequest(BaseModel):
    work_item_id: uuid.UUID
    decision_text: str = Field(..., min_length=3)
    directive: str = Field(..., min_length=3)
    unblock: bool = True
    expected_version: int | None = None


class ExecutiveOverrideRequest(BaseModel):
    work_item_id: uuid.UUID
    override_reason: str = Field(..., min_length=3)
    clear_blocker: bool = True
    new_due_at: datetime | None = None
    expected_version: int | None = None


class GrantExtensionRequest(BaseModel):
    work_item_id: uuid.UUID
    new_due_at: datetime
    justification: str = Field(..., min_length=3)
    expected_version: int | None = None


class ReassignRaciRequest(BaseModel):
    work_item_id: uuid.UUID
    responsible_id: uuid.UUID
    responsible_name: str | None = None
    accountable_id: uuid.UUID
    accountable_name: str | None = None
    rationale: str = Field(..., min_length=3)
    expected_version: int | None = None


class UpdateMilestoneStepRequest(BaseModel):
    priority_id: uuid.UUID
    step_number: int = Field(..., ge=1, le=10)
    status: str = Field(..., description="'IN_PROGRESS', 'COMPLETED', or 'AT_RISK'")
    verification_notes: str | None = None
    expected_version: int | None = None


class CockpitActionResponse(BaseModel):
    success: bool = True
    message: str
    action_type: str
    entity_id: str
    entity_type: str
    audit_event_id: str | None = None
    updated_at: datetime
