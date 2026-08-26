"""Calendar module request and response schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CalendarEventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    event_type: str = Field(default="LAKSHYA_MEETING", max_length=50)
    start_time: datetime
    end_time: datetime
    timezone: str = Field(default="Asia/Kolkata", max_length=50)
    meeting_id: uuid.UUID | None = None
    provider: str = Field(default="LAKSHYA", max_length=50)


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    timezone: str | None = None
    sync_status: str | None = None


class CalendarEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    meeting_id: uuid.UUID | None = None
    title: str
    description: str | None = None
    event_type: str
    start_time: datetime
    end_time: datetime
    timezone: str
    provider: str
    external_event_id: str | None = None
    external_calendar_id: str | None = None
    sync_status: str
    last_synced_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CalendarSyncOutboxResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    event_type: str
    payload: dict[str, Any]
    status: str
    attempts: int
    max_attempts: int
    last_error: str | None = None
    next_attempt_at: datetime | None = None
    created_at: datetime
    processed_at: datetime | None = None


class UserCalendarIntegrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    provider: str
    account_email: str
    is_active: bool
    calendar_id: str
    last_sync_at: datetime | None = None
    created_at: datetime


class ConnectIntegrationRequest(BaseModel):
    provider: str = Field(default="GOOGLE", max_length=50)
    auth_code: str = Field(..., min_length=1)
    redirect_uri: str = Field(..., min_length=1)
