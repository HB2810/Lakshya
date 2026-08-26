"""FastAPI router for LAKSHYA Calendar Engine & Sync Outbox."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Sequence

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentContext, RequestContext, get_db
from app.api.etag import require_if_match, set_etag
from app.modules.calendar.models import CalendarEventType, CalendarOutboxStatus
from app.modules.calendar.schemas import (
    CalendarEventCancel,
    CalendarEventCreate,
    CalendarEventResponse,
    CalendarEventUpdate,
    CalendarSyncOutboxResponse,
    ConnectIntegrationRequest,
    UserCalendarIntegrationResponse,
)
from app.modules.calendar.service import CalendarService

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/events", response_model=list[CalendarEventResponse])
def list_calendar_events(
    start_time: datetime | None = Query(default=None),
    end_time: datetime | None = Query(default=None),
    event_type: CalendarEventType | None = Query(default=None),
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> Sequence[CalendarEventResponse]:
    """Query LAKSHYA calendar events for user's organization."""
    return CalendarService.list_events(
        db=db,
        user=ctx.authenticated.user,
        start_time=start_time,
        end_time=end_time,
        event_type=event_type.value if event_type else None,
    )


@router.post("/events", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
def create_calendar_event(
    payload: CalendarEventCreate,
    response: Response,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CalendarEventResponse:
    """Create a new internal LAKSHYA calendar event."""
    event = CalendarService.create_event(db=db, user=ctx.authenticated.user, payload=payload)
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
    event = CalendarService.get_event(db=db, user=ctx.authenticated.user, event_id=event_id)
    set_etag(response, event.version)
    return event


@router.patch("/events/{event_id}", response_model=CalendarEventResponse)
def update_calendar_event(
    event_id: uuid.UUID,
    payload: CalendarEventUpdate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CalendarEventResponse:
    """Update existing calendar event with mandatory optimistic concurrency validation (If-Match ETag)."""
    expected_version = require_if_match(request)
    event = CalendarService.update_event(
        db=db,
        user=ctx.authenticated.user,
        event_id=event_id,
        payload=payload,
        expected_version=expected_version,
    )
    set_etag(response, event.version)
    return event


@router.post("/events/{event_id}/cancel", response_model=CalendarEventResponse)
def cancel_calendar_event(
    event_id: uuid.UUID,
    payload: CalendarEventCancel,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CalendarEventResponse:
    """Cancel existing calendar event with mandatory ETag check and audit trail."""
    expected_version = require_if_match(request)
    event = CalendarService.cancel_event(
        db=db,
        user=ctx.authenticated.user,
        event_id=event_id,
        payload=payload,
        expected_version=expected_version,
    )
    set_etag(response, event.version)
    return event


@router.get("/outbox", response_model=list[CalendarSyncOutboxResponse])
def list_calendar_outbox(
    status_filter: CalendarOutboxStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> Sequence[CalendarSyncOutboxResponse]:
    """List outbox items for calendar synchronization."""
    return CalendarService.list_outbox_items(
        db=db,
        user=ctx.authenticated.user,
        status_filter=status_filter.value if status_filter else None,
    )


@router.get("/integrations", response_model=UserCalendarIntegrationResponse | None)
def get_user_calendar_integration(
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> UserCalendarIntegrationResponse | None:
    """Get active user calendar integration."""
    return CalendarService.get_user_integration(db=db, user=ctx.authenticated.user)


@router.post("/integrations/connect", response_model=UserCalendarIntegrationResponse)
def connect_calendar_integration(
    payload: ConnectIntegrationRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> UserCalendarIntegrationResponse:
    """Disabled in Phase 3. Returns HTTP 501 Not Implemented per Phase 5 OAuth scope rule."""
    return CalendarService.connect_integration(db=db, user=ctx.authenticated.user, payload=payload)
