"""Comprehensive unit and integration tests for CalendarService domain logic and security boundaries."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.errors import ConflictError, PermissionDeniedError, ResourceNotFoundError
from app.modules.audit.models import AuditEvent
from app.modules.calendar.models import (
    CalendarEvent,
    CalendarEventType,
    CalendarOutboxStatus,
    CalendarProvider,
    CalendarSyncOutbox,
    CalendarSyncStatus,
)
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
        event_type=CalendarEventType.LAKSHYA_MEETING,
        start_time=now,
        end_time=now + timedelta(hours=1),
        timezone="Asia/Kolkata",
    )

    event = CalendarService.create_event(db_session, user, create_payload)
    assert event.id is not None
    assert event.title == "Weekly OPD Operational Review"
    assert event.organization_id == org.id
    assert event.user_id == user.id
    assert event.version == 1

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
def test_invalid_iana_timezone_raises_validation_error():
    now = datetime.now(timezone.utc)
    with pytest.raises(ValidationError) as exc_info:
        CalendarEventCreate(
            title="Bad Timezone Event",
            start_time=now,
            end_time=now + timedelta(hours=1),
            timezone="Mars/Olympus_Mons",
        )
    assert "Invalid IANA timezone name" in str(exc_info.value)


@pytest.mark.db
def test_naive_datetime_raises_validation_error():
    naive_dt = datetime(2026, 8, 26, 10, 0, 0)
    with pytest.raises(ValidationError) as exc_info:
        CalendarEventCreate(
            title="Naive Timezone Event",
            start_time=naive_dt,
            end_time=naive_dt + timedelta(hours=1),
        )
    assert "Timestamp must be timezone-aware" in str(exc_info.value)


@pytest.mark.db
def test_permission_denial_for_unauthorized_user(db_session, factory):
    org = factory.organization()
    unauthorized_user = factory.user(org)

    now = datetime.now(timezone.utc)
    create_payload = CalendarEventCreate(
        title="Unauthorized Event Attempt",
        start_time=now,
        end_time=now + timedelta(hours=1),
    )

    with pytest.raises(PermissionDeniedError):
        CalendarService.create_event(db_session, unauthorized_user, create_payload)


@pytest.mark.db
def test_cross_organization_isolation(db_session, factory):
    org_a = factory.organization()
    user_a = factory.user_with_permissions(org_a, ("calendar.view",))

    org_b = factory.organization()
    user_b = factory.user_with_permissions(org_b, ("calendar.view",))

    now = datetime.now(timezone.utc)
    event_a = CalendarService.create_event(
        db_session,
        user_a,
        CalendarEventCreate(
            title="Org A Private Event",
            start_time=now,
            end_time=now + timedelta(hours=1),
        ),
    )

    events_b = CalendarService.list_events(db_session, user_b)
    assert not any(e.id == event_a.id for e in events_b)

    with pytest.raises(ResourceNotFoundError):
        CalendarService.get_event(db_session, user_b, event_a.id)


@pytest.mark.db
def test_instant_meeting_outbox_exclusion(db_session, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("calendar.view", "calendar.manage_own_connections"))

    now = datetime.now(timezone.utc)
    instant_payload = CalendarEventCreate(
        title="Instant 1:1 Operations Briefing",
        start_time=now,
        end_time=now + timedelta(minutes=30),
        is_instant=True,
        provider=CalendarProvider.GOOGLE,
    )

    event = CalendarService.create_event(db_session, user, instant_payload)
    assert event.sync_status == CalendarSyncStatus.NOT_SYNCED.value

    # Verify 0 outbox queue items were inserted
    outbox_items = db_session.query(CalendarSyncOutbox).filter_by(organization_id=org.id).all()
    assert len(outbox_items) == 0


@pytest.mark.db
def test_atomic_audit_logging_on_create_and_update(db_session, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("calendar.view",))

    now = datetime.now(timezone.utc)
    event = CalendarService.create_event(
        db_session,
        user,
        CalendarEventCreate(
            title="Audited Strategic Review",
            start_time=now,
            end_time=now + timedelta(hours=1),
        ),
    )

    audit_create = db_session.query(AuditEvent).filter_by(entity_id=event.id, action="calendar_event.created").first()
    assert audit_create is not None
    assert audit_create.organization_id == org.id

    # Update event and verify update audit event
    updated_event = CalendarService.update_event(
        db_session,
        user,
        event.id,
        CalendarEventUpdate(title="Audited Strategic Review (Updated)"),
    )
    assert updated_event.version == 2

    audit_update = db_session.query(AuditEvent).filter_by(entity_id=event.id, action="calendar_event.updated").first()
    assert audit_update is not None
    assert audit_update.before_state["title"] == "Audited Strategic Review"
    assert audit_update.after_state["title"] == "Audited Strategic Review (Updated)"


@pytest.mark.db
def test_optimistic_concurrency_conflict(db_session, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("calendar.view",))

    now = datetime.now(timezone.utc)
    event = CalendarService.create_event(
        db_session,
        user,
        CalendarEventCreate(
            title="Concurrent Event",
            start_time=now,
            end_time=now + timedelta(hours=1),
        ),
    )

    # Passing stale expected_version=99 raises ConflictError
    with pytest.raises(ConflictError) as exc_info:
        CalendarService.update_event(
            db_session,
            user,
            event.id,
            CalendarEventUpdate(title="Stale Update"),
            expected_version=99,
        )
    assert "Optimistic concurrency conflict" in str(exc_info.value)


@pytest.mark.db
def test_connect_integration_returns_501_in_phase_3(db_session, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("calendar.view", "calendar.manage_own_connections"))

    connect_req = ConnectIntegrationRequest(
        provider=CalendarProvider.GOOGLE,
        auth_code="mock_auth_code_12345",
        redirect_uri="http://localhost:3000/calendar/oauth/callback",
    )

    with pytest.raises(HTTPException) as exc_info:
        CalendarService.connect_integration(db_session, user, connect_req)
    assert exc_info.value.status_code == 501
    assert "Phase 5" in str(exc_info.value.detail)
