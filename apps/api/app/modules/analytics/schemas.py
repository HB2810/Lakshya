"""Pydantic schemas for Operational Analytics Domain."""

from __future__ import annotations

import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AnalyticsSummary(BaseModel):
    total_work_items: int = 0
    active_count: int = 0
    completed_count: int = 0
    blocked_count: int = 0
    overdue_count: int = 0
    escalated_count: int = 0
    on_time_rate_percent: int = 100
    avg_resolution_days: float = 0.0


class DepartmentMetric(BaseModel):
    department_id: str
    department_name: str
    active_count: int = 0
    completed_count: int = 0
    blocked_count: int = 0
    overdue_count: int = 0
    completion_rate_percent: int = 0


class KeyDistributionItem(BaseModel):
    key: str
    label: str
    count: int = 0


class WorkloadMetric(BaseModel):
    user_id: str
    user_name: str
    department_name: str | None = None
    role: str | None = None
    active_count: int = 0
    completed_count: int = 0
    blocked_count: int = 0


class PriorityProgressMetric(BaseModel):
    priority_id: str
    title: str
    quarter: str
    year: int
    progress_percent: int = 0
    current_step: int = 1
    status: str = "ACTIVE"


class EscalationSummary(BaseModel):
    total_escalations: int = 0
    pending_count: int = 0
    resolved_count: int = 0
    avg_resolution_hours: float = 0.0


class OperationalAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scope: str  # "ORGANIZATION", "DEPARTMENT_TEAM", "INDIVIDUAL"
    role: str
    summary: AnalyticsSummary
    department_metrics: list[DepartmentMetric] = []
    status_distribution: list[KeyDistributionItem] = []
    priority_distribution: list[KeyDistributionItem] = []
    workload_metrics: list[WorkloadMetric] = []
    priority_progress: list[PriorityProgressMetric] = []
    escalations: EscalationSummary
