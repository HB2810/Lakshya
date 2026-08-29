"""Pydantic schemas for the Audit Event Query API."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID | None = None
    occurred_at: datetime
    action: str
    entity_type: str
    entity_id: uuid.UUID | None = None
    actor_type: str
    actor_user_id: uuid.UUID | None = None
    actor_name: str | None = None
    actor_label: str | None = None
    source: str
    correlation_id: str
    causation_id: str | None = None
    reason: str | None = None
    before_state: dict[str, Any] | None = None
    after_state: dict[str, Any] | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime


class AuditListResponse(BaseModel):
    items: list[AuditEventResponse]
    total: int
    limit: int
    offset: int
