"""Pydantic schemas for WorkItem API."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class BlockerDetailsSchema(BaseModel):
    reason: str
    need_description: str
    helped_by_person_or_dept: str | None = None
    urgency: str = "HIGH"
    reported_at: datetime | None = None


class RACISchema(BaseModel):
    responsible_id: str | None = None
    responsible_name: str | None = None
    accountable_id: str
    accountable_name: str
    consulted_ids: list[str] = Field(default_factory=list)
    consulted_names: list[str] = Field(default_factory=list)
    informed_ids: list[str] = Field(default_factory=list)
    informed_names: list[str] = Field(default_factory=list)


class EDCSchema(BaseModel):
    expected_outcome: str
    definition_of_done: str
    evidence_required: str | None = None
    completion_criteria: list[str] = Field(default_factory=list)


class DependencyItemSchema(BaseModel):
    id: str
    target_work_item_id: str
    target_title: str
    status: str = "READY"
    notes: str | None = None


class WorkItemActivityResponse(BaseModel):
    id: uuid.UUID
    work_item_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    activity_type: str
    note: str | None = None
    previous_status: str | None = None
    new_status: str | None = None
    progress_percent: int | None = None
    created_at: datetime


class WorkItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    priority: str = "medium"
    owner_id: uuid.UUID | None = None
    owner_name: str | None = None
    department_id: uuid.UUID | None = None
    department_name: str | None = None
    due_at: datetime | None = None
    parent_id: uuid.UUID | None = None
    origin_meeting_id: uuid.UUID | None = None
    source_type: str = "MANUAL"
    source_title: str | None = None
    raci: dict[str, Any] | None = None
    edc: dict[str, Any] | None = None


class WorkItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    owner_id: uuid.UUID | None = None
    owner_name: str | None = None
    department_id: uuid.UUID | None = None
    department_name: str | None = None
    due_at: datetime | None = None
    progress_percent: int | None = Field(default=None, ge=0, le=100)
    blocked_reason: str | None = None
    blocker_details: dict[str, Any] | None = None
    raci: dict[str, Any] | None = None
    edc: dict[str, Any] | None = None
    update_note: str | None = None


class EscalateRequest(BaseModel):
    reason: str
    level: str = "DIRECT_LEADER"  # DIRECT_LEADER, DEPARTMENT_HEAD, MANAGING_DIRECTOR
    escalated_to_id: uuid.UUID | None = None
    escalated_to_name: str | None = None


class EscalationResolveRequest(BaseModel):
    resolution_note: str


class EscalationResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    work_item_id: uuid.UUID
    level: str
    reason: str
    escalated_by_id: uuid.UUID
    escalated_by_name: str
    escalated_to_id: uuid.UUID
    escalated_to_name: str
    status: str
    resolution_note: str | None = None
    resolved_at: datetime | None = None
    created_at: datetime



class WorkItemResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    description: str | None = None
    parent_id: uuid.UUID | None = None
    status: str
    priority: str
    owner_id: uuid.UUID | None = None
    owner_name: str | None = None
    created_by: uuid.UUID
    department_id: uuid.UUID | None = None
    department_name: str | None = None
    due_at: datetime | None = None
    completed_at: datetime | None = None
    progress_percent: int = 0
    blocked_at: datetime | None = None
    blocked_reason: str | None = None
    blocker_details: dict[str, Any] | None = None
    raci: dict[str, Any] | None = None
    edc: dict[str, Any] | None = None
    origin_meeting_id: uuid.UUID | None = None
    source_type: str
    source_title: str | None = None
    activity_history: list[WorkItemActivityResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    version: int


class WorkItemListResponse(BaseModel):
    items: list[WorkItemResponse]
    total: int
