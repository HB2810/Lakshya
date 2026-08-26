"""FastAPI router for LAKSHYA Calendar Engine & Sync Outbox."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Sequence

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentContext, RequestContext, get_db
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
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CalendarEventResponse:
    """Create a new internal or external calendar event."""
    return CalendarService.create_event(db=db, user=ctx.user, payload=payload)


@router.get("/events/{event_id}", response_model=CalendarEventResponse)
def get_calendar_event(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CalendarEventResponse:
    """Get calendar event by ID."""
    return CalendarService.get_event(db=db, user=ctx.user, event_id=event_id)


@router.patch("/events/{event_id}", response_model=CalendarEventResponse)
def update_calendar_event(
    event_id: uuid.UUID,
    payload: CalendarEventUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CalendarEventResponse:
    """Update existing calendar event."""
    return CalendarService.update_event(db=db, user=ctx.user, event_id=event_id, payload=payload)


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
    """Connect external calendar provider integration."""
    return CalendarService.connect_integration(db=db, user=ctx.user, payload=payload)
