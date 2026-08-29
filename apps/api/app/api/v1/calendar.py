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
    CalendarSyncTriggerResponse,
    ConnectIntegrationRequest,
    GoogleAuthUrlResponse,
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
) -> list[CalendarEventResponse]:
    """Query LAKSHYA calendar events for user's organization."""
    events = CalendarService.list_events(
        db=db,
        user=ctx.authenticated.user,
        start_time=start_time,
        end_time=end_time,
        event_type=event_type.value if event_type else None,
    )
    return [CalendarEventResponse.model_validate(e) for e in events]


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
    return CalendarEventResponse.model_validate(event)


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
    return CalendarEventResponse.model_validate(event)


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
    return CalendarEventResponse.model_validate(event)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_calendar_event(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> Response:
    """Delete a calendar event with audit trail."""
    CalendarService.delete_event(db=db, user=ctx.authenticated.user, event_id=event_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    return CalendarEventResponse.model_validate(event)


@router.get("/outbox", response_model=list[CalendarSyncOutboxResponse])
def list_calendar_outbox(
    status_filter: CalendarOutboxStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> list[CalendarSyncOutboxResponse]:
    """List outbox items for calendar synchronization."""
    items = CalendarService.list_outbox_items(
        db=db,
        user=ctx.authenticated.user,
        status_filter=status_filter.value if status_filter else None,
    )
<<<<<<< HEAD
    return [CalendarSyncOutboxResponse.model_validate(i) for i in items]
=======
    return [CalendarSyncOutboxResponse.model_validate(item) for item in items]
>>>>>>> origin/main


@router.get("/integrations", response_model=UserCalendarIntegrationResponse | None)
def get_user_calendar_integration(
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> UserCalendarIntegrationResponse | None:
    """Get active user calendar integration."""
    integration = CalendarService.get_user_integration(db=db, user=ctx.authenticated.user)
    return UserCalendarIntegrationResponse.model_validate(integration) if integration else None
<<<<<<< HEAD


@router.get("/integrations/google/auth-url", response_model=GoogleAuthUrlResponse)
def get_google_auth_url(
    ctx: RequestContext = CurrentContext,
) -> GoogleAuthUrlResponse:
    """Get Google OAuth 2.0 authorization URL."""
    data = CalendarService.get_google_auth_url(user=ctx.authenticated.user)
    return GoogleAuthUrlResponse(**data)
=======
>>>>>>> origin/main


@router.post("/integrations/connect", response_model=UserCalendarIntegrationResponse)
@router.post("/integrations/google/connect", response_model=UserCalendarIntegrationResponse)
def connect_google_calendar_integration(
    payload: ConnectIntegrationRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> UserCalendarIntegrationResponse:
<<<<<<< HEAD
    """Connect Google Calendar with OAuth credentials."""
    integration = CalendarService.connect_integration(db=db, user=ctx.authenticated.user, payload=payload)
    return UserCalendarIntegrationResponse.model_validate(integration)


@router.post("/integrations/disconnect", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def disconnect_calendar_integration(
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> Response:
    """Disconnect active external calendar integration."""
    CalendarService.disconnect_integration(db=db, user=ctx.authenticated.user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/sync", response_model=CalendarSyncTriggerResponse)
def trigger_calendar_sync(
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CalendarSyncTriggerResponse:
    """Trigger processing of sync outbox items with external calendar provider."""
    data = CalendarService.trigger_sync(db=db, user=ctx.authenticated.user)
    return CalendarSyncTriggerResponse(**data)
=======
    """Disabled in Phase 3. Returns HTTP 501 Not Implemented per Phase 5 OAuth scope rule."""
    integration = CalendarService.connect_integration(db=db, user=ctx.authenticated.user, payload=payload)
    return UserCalendarIntegrationResponse.model_validate(integration)
>>>>>>> origin/main
