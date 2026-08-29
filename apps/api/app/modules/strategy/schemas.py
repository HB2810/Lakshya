"""Pydantic schemas for Strategy & Priority Domain."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class MilestoneStepSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    step_number: int = Field(..., ge=1, le=10, description="Step number 1 through 10")
    title: str = Field(..., max_length=255)
    description: str | None = None
    owner_name: str = "Assigned Lead"
    target_date: str | None = None
    completed_at: datetime | None = None
    status: str = Field(default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED, BLOCKED
    key_deliverable: str | None = None
    verification_notes: str | None = None


class MilestoneStepUpdate(BaseModel):
    status: str  # PENDING, IN_PROGRESS, COMPLETED, BLOCKED
    verification_notes: str | None = None
    completed_at: datetime | None = None


class QuarterlyPriorityCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = None
    reporting_authority: str = "Managing Director"
    department: str = "Hospital Operations"
    quarter: str = "Q3"  # Q1, Q2, Q3, Q4
    fy_start_year: int = 2026
    owner_id: uuid.UUID | None = None
    milestones: list[MilestoneStepSchema] | None = None


class QuarterlyPriorityUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    reporting_authority: str | None = None
    department: str | None = None
    owner_id: uuid.UUID | None = None


class QuarterlyPriorityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    year: int
    quarter: str
    title: str
    description: str | None = None
    strategic_objective: str | None = None
    reporting_authority: str
    department: str
    status: str
    progress_percent: int
    current_step: int
    target_date: str
    milestones: list[MilestoneStepSchema]
    created_at: datetime
    updated_at: datetime
    version: int


class StrategicDirectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    fy_start_year: int
    title: str
    purpose: str | None = None
    expected_outcome: str | None = None
    status: str
    health_status: str
    quarterly_priorities: list[QuarterlyPriorityResponse] = []
