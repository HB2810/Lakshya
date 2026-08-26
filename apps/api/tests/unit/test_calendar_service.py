"""Unit tests for CalendarService domain logic."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.modules.calendar.schemas import (
    CalendarEventCreate,
    CalendarEventUpdate,
    ConnectIntegrationRequest,
)
from app.modules.calendar.service import CalendarService


@pytest.mark.db
def test_create_and_list_calendar_event(db_session, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("calendar.view", "calendar.manage_own_connections"))

    now = datetime.now(timezone.utc)
    create_payload = CalendarEventCreate(
        title="Weekly OPD Operational Review",
        description="Review OPD patient intake and flow metrics",
        event_type="LAKSHYA_MEETING",
        start_time=now,
        end_time=now + timedelta(hours=1),
        timezone="Asia/Kolkata",
    )

    event = CalendarService.create_event(db_session, user, create_payload)
    assert event.id is not None
    assert event.title == "Weekly OPD Operational Review"
    assert event.organization_id == org.id
    assert event.user_id == user.id

    events = CalendarService.list_events(db_session, user)
    assert len(events) >= 1
    assert any(e.id == event.id for e in events)


@pytest.mark.db
def test_create_event_invalid_end_time_raises_400(db_session, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("calendar.view",))

    now = datetime.now(timezone.utc)
    invalid_payload = CalendarEventCreate(
        title="Invalid Time Event",
        start_time=now,
        end_time=now - timedelta(minutes=30),
    )

    with pytest.raises(HTTPException) as exc_info:
        CalendarService.create_event(db_session, user, invalid_payload)
    assert exc_info.value.status_code == 400


@pytest.mark.db
def test_connect_calendar_integration(db_session, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("calendar.view", "calendar.manage_own_connections"))

    connect_req = ConnectIntegrationRequest(
        provider="GOOGLE",
        auth_code="mock_auth_code_12345",
        redirect_uri="http://localhost:3000/calendar/oauth/callback",
    )

    integration = CalendarService.connect_integration(db_session, user, connect_req)
    assert integration.id is not None
    assert integration.user_id == user.id
    assert integration.provider == "GOOGLE"
    assert integration.is_active is True

    fetched = CalendarService.get_user_integration(db_session, user)
    assert fetched is not None
    assert fetched.id == integration.id
