"""FastAPI router for LAKSHYA Calendar Engine & Sync Outbox."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Sequence

from fastapi import APIRouter, Depends, Header, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentContext, RequestContext, get_db
from app.api.etag import set_etag
from app.core.errors import ValidationFailedError
from app.modules.calendar.schemas import (
    CalendarEventCreate,
    CalendarEventResponse,
    CalendarEventUpdate,
    CalendarSyncOutboxResponse,
    ConnectIntegrationRequest,
    UserCalendarIntegrationResponse,
)
from app.modules.calendar.service import CalendarService

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _parse_if_match(if_match: str | None) -> int | None:
    if not if_match:
        return None
    candidate = if_match.strip()
    if candidate == "*":
        raise ValidationFailedError("If-Match: * is not accepted. Supply the exact ETag version.")
    cleaned = candidate.strip('W/"')
    if not cleaned.isdigit():
        raise ValidationFailedError(f"Invalid ETag header format: '{if_match}'")
    return int(cleaned)


@router.get("/events", response_model=list[CalendarEventResponse])
def list_calendar_events(
    start_time: datetime | None = Query(default=None),
    end_time: datetime | None = Query(default=None),
    event_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> Sequence[CalendarEventResponse]:
    """Query LAKSHYA calendar events for user's organization."""
    return CalendarService.list_events(
        db=db,
        user=ctx.user,
        start_time=start_time,
        end_time=end_time,
        event_type=event_type,
    )


@router.post("/events", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
def create_calendar_event(
    payload: CalendarEventCreate,
    response: Response,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CalendarEventResponse:
    """Create a new internal LAKSHYA calendar event."""
    event = CalendarService.create_event(db=db, user=ctx.user, payload=payload)
    set_etag(response, event.version)
    return event


@router.get("/events/{event_id}", response_model=CalendarEventResponse)
def get_calendar_event(
    event_id: uuid.UUID,
    response: Response,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CalendarEventResponse:
    """Get calendar event by ID."""
    event = CalendarService.get_event(db=db, user=ctx.user, event_id=event_id)
    set_etag(response, event.version)
    return event


@router.patch("/events/{event_id}", response_model=CalendarEventResponse)
def update_calendar_event(
    event_id: uuid.UUID,
    payload: CalendarEventUpdate,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CalendarEventResponse:
    """Update existing calendar event with optimistic concurrency validation."""
    expected_version = _parse_if_match(if_match)
    event = CalendarService.update_event(
        db=db,
        user=ctx.user,
        event_id=event_id,
        payload=payload,
        expected_version=expected_version,
    )
    set_etag(response, event.version)
    return event


@router.get("/outbox", response_model=list[CalendarSyncOutboxResponse])
def list_calendar_outbox(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> Sequence[CalendarSyncOutboxResponse]:
    """List outbox items for calendar synchronization."""
    return CalendarService.list_outbox_items(db=db, user=ctx.user, status_filter=status_filter)


@router.get("/integrations", response_model=UserCalendarIntegrationResponse | None)
def get_user_calendar_integration(
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> UserCalendarIntegrationResponse | None:
    """Get active user calendar integration."""
    return CalendarService.get_user_integration(db=db, user=ctx.user)


@router.post("/integrations/connect", response_model=UserCalendarIntegrationResponse)
def connect_calendar_integration(
    payload: ConnectIntegrationRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> UserCalendarIntegrationResponse:
    """Disabled in Phase 3. Returns HTTP 501 Not Implemented per Phase 5 OAuth scope rule."""
    return CalendarService.connect_integration(db=db, user=ctx.user, payload=payload)
