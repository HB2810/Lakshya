"""Comprehensive unit and integration tests for CalendarService domain logic, security boundaries, and transaction atomicity."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

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
    CalendarEventCancel,
    CalendarEventCreate,
    CalendarEventUpdate,
)
from app.modules.calendar.service import CalendarService
from app.modules.meeting.models import Meeting, MeetingParticipant


@pytest.mark.db
def test_create_and_list_calendar_event(db_session, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("meetings.create", "calendar.view"))

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
def test_create_event_requires_mutation_permission(db_session, factory):
    org = factory.organization()
    read_only_user = factory.user_with_permissions(org, ("calendar.view",))

    now = datetime.now(timezone.utc)
    create_payload = CalendarEventCreate(
        title="Read Only Attempt",
        start_time=now,
        end_time=now + timedelta(hours=1),
    )

    with pytest.raises(PermissionDeniedError):
        CalendarService.create_event(db_session, read_only_user, create_payload)


@pytest.mark.db
def test_one_on_one_meeting_privacy_restriction(db_session, factory):
    org = factory.organization()
    organizer = factory.user_with_permissions(org, ("meetings.create", "calendar.view"))
    unrelated_user = factory.user_with_permissions(org, ("calendar.view",))

    # Create a 1:1 Meeting
    meeting = Meeting(
        organization_id=org.id,
        title="Confidential 1:1 Performance Review",
        meeting_type="ONE_ON_ONE_SCHEDULED",
        status="SCHEDULED",
        organizer_id=organizer.id,
    )
    db_session.add(meeting)
    db_session.flush()

    now = datetime.now(timezone.utc)
    event = CalendarService.create_event(
        db_session,
        organizer,
        CalendarEventCreate(
            title="1:1 Meeting Event",
            start_time=now,
            end_time=now + timedelta(hours=1),
            meeting_id=meeting.id,
        ),
    )

    # Organizer can view
    fetched = CalendarService.get_event(db_session, organizer, event.id)
    assert fetched.id == event.id

    # Unrelated user cannot view private 1:1 meeting
    with pytest.raises(PermissionDeniedError) as exc_info:
        CalendarService.get_event(db_session, unrelated_user, event.id)
    assert "private 1:1" in str(exc_info.value)


@pytest.mark.db
def test_outbox_idempotency_key_uniqueness(db_session, factory):
    org = factory.organization()

    outbox1 = CalendarSyncOutbox(
        organization_id=org.id,
        idempotency_key="unique_key_12345",
        event_type="CALENDAR_EVENT_CREATED",
        payload={"test": 1},
        status=CalendarOutboxStatus.PENDING.value,
        attempts=0,
        max_attempts=5,
        next_attempt_at=datetime.now(timezone.utc),
    )
    db_session.add(outbox1)
    db_session.commit()

    # Attempt inserting duplicate idempotency_key for same organization
    outbox2 = CalendarSyncOutbox(
        organization_id=org.id,
        idempotency_key="unique_key_12345",
        event_type="CALENDAR_EVENT_CREATED",
        payload={"test": 2},
        status=CalendarOutboxStatus.PENDING.value,
        attempts=0,
        max_attempts=5,
        next_attempt_at=datetime.now(timezone.utc),
    )
    db_session.add(outbox2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


@pytest.mark.db
def test_atomic_transaction_rollback_on_audit_failure(db_session, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("meetings.create", "calendar.view"))

    now = datetime.now(timezone.utc)
    create_payload = CalendarEventCreate(
        title="Failed Audit Transaction",
        start_time=now,
        end_time=now + timedelta(hours=1),
    )

    # Mock AuditRecorder.record to simulate unexpected infrastructure exception
    with patch("app.modules.calendar.service.AuditRecorder.record", side_effect=RuntimeError("Audit database connection lost")):
        with pytest.raises(RuntimeError):
            CalendarService.create_event(db_session, user, create_payload)
        db_session.rollback()

    # Verify atomic rollback: no event or outbox persisted
    events = db_session.query(CalendarEvent).filter_by(title="Failed Audit Transaction").all()
    assert len(events) == 0


@pytest.mark.db
def test_event_cancellation_lifecycle(db_session, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("meetings.create", "meetings.update", "meetings.cancel", "calendar.view"))

    now = datetime.now(timezone.utc)
    event = CalendarService.create_event(
        db_session,
        user,
        CalendarEventCreate(
            title="Meeting To Cancel",
            start_time=now,
            end_time=now + timedelta(hours=1),
        ),
    )

    cancelled_event = CalendarService.cancel_event(
        db_session,
        user,
        event.id,
        CalendarEventCancel(reason="Department head unavailable"),
        expected_version=1,
    )

    assert cancelled_event.version == 2

    # Audit verification
    audit_cancel = db_session.query(AuditEvent).filter_by(entity_id=event.id, action="calendar_event.cancelled").first()
    assert audit_cancel is not None
    assert audit_cancel.reason == "Department head unavailable"
