"""Calendar module request and response schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.calendar.models import (
    CalendarEventType,
    CalendarOutboxStatus,
    CalendarProvider,
    CalendarSyncStatus,
)


class CalendarEventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    event_type: CalendarEventType = Field(default=CalendarEventType.LAKSHYA_MEETING)
    start_time: datetime
    end_time: datetime
    timezone: str = Field(default="Asia/Kolkata", max_length=50)
    meeting_id: uuid.UUID | None = None
    provider: CalendarProvider = Field(default=CalendarProvider.LAKSHYA)

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Title cannot be blank or whitespace-only")
        return cleaned

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip() or None


    @field_validator("timezone")
    @classmethod
    def validate_iana_timezone(cls, v: str) -> str:
        try:
            ZoneInfo(v)
        except (ZoneInfoNotFoundError, ValueError, TypeError):
            raise ValueError(f"Invalid IANA timezone name: '{v}'")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_tz_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError("Timestamp must be timezone-aware (e.g. ISO 8601 with UTC offset or Z)")
        return v


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    start_time: datetime | None = None
    end_time: datetime | None = None
    timezone: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Title cannot be blank or whitespace-only")
        return cleaned

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip() or None


    @field_validator("timezone")
    @classmethod
    def validate_iana_timezone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            ZoneInfo(v)
        except (ZoneInfoNotFoundError, ValueError, TypeError):
            raise ValueError(f"Invalid IANA timezone name: '{v}'")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_tz_aware(cls, v: datetime | None) -> datetime | None:
        if v is not None and (v.tzinfo is None or v.tzinfo.utcoffset(v) is None):
            raise ValueError("Timestamp must be timezone-aware (e.g. ISO 8601 with UTC offset or Z)")
        return v


class CalendarEventCancel(BaseModel):
    reason: str = Field(..., min_length=3, max_length=1000)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Cancellation reason cannot be blank")
        return cleaned


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
    version: int
    created_at: datetime
    updated_at: datetime


class CalendarSyncOutboxResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    idempotency_key: str
    event_type: str
    payload: dict[str, Any]
    status: str
    attempts: int
    max_attempts: int
    last_error: str | None = None
    next_attempt_at: datetime | None = None
    created_at: datetime


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
    provider: CalendarProvider = Field(default=CalendarProvider.GOOGLE)
    auth_code: str = Field(..., min_length=1)
    redirect_uri: str = Field(..., min_length=1)
    account_email: str | None = None


class GoogleAuthUrlResponse(BaseModel):
    auth_url: str
    is_simulated: bool = False


class CalendarSyncTriggerResponse(BaseModel):
    processed_count: int
    success_count: int
    failed_count: int
    message: str
