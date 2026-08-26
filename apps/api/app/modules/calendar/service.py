"""Calendar domain service handling internal events, atomic outbox queueing, and audit logging."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, PermissionDeniedError, ResourceNotFoundError
from app.modules.access.authorization import AuthorizationService
from app.modules.audit.service import AuditActor, AuditRecorder, AuditSource
from app.modules.calendar.models import (
    CalendarEvent,
    CalendarOutboxStatus,
    CalendarProvider,
    CalendarSyncOutbox,
    CalendarSyncStatus,
    UserCalendarIntegration,
)
from app.modules.calendar.schemas import (
    CalendarEventCreate,
    CalendarEventUpdate,
    ConnectIntegrationRequest,
)
from app.modules.identity.models import User


class CalendarService:
    """Service layer for internal LAKSHYA calendar events, transactional outbox, and audit logging."""

    @staticmethod
    def create_event(db: Session, user: User, payload: CalendarEventCreate) -> CalendarEvent:
        """Create a new internal LAKSHYA calendar event with atomic audit and outbox enqueueing."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.view")

        if payload.end_time <= payload.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event end_time must be strictly after start_time",
            )

        # Check for user integration without triggering auth permission error
        integration = db.scalar(
            select(UserCalendarIntegration).where(
                UserCalendarIntegration.user_id == user.id,
                UserCalendarIntegration.is_active == True,
            )
        )

        # Scheduled meetings for non-instant events set status to SYNC_PENDING if integration active
        sync_status = (
            CalendarSyncStatus.SYNC_PENDING.value
            if (integration and integration.is_active and not payload.is_instant and payload.provider != CalendarProvider.LAKSHYA)
            else CalendarSyncStatus.NOT_SYNCED.value
        )

        event = CalendarEvent(
            organization_id=user.organization_id,
            user_id=user.id,
            meeting_id=payload.meeting_id,
            title=payload.title,
            description=payload.description,
            event_type=payload.event_type.value,
            start_time=payload.start_time,
            end_time=payload.end_time,
            timezone=payload.timezone,
            provider=payload.provider.value,
            sync_status=sync_status,
            version=1,
        )
        db.add(event)
        db.flush()

        # Deterministic outbox deduplication key
        idempotency_key = f"evt_{event.id}_create_v1"

        # Scheduled (non-instant) meetings enqueue outbox item if sync requested
        if sync_status == CalendarSyncStatus.SYNC_PENDING.value:
            # Check for existing idempotency key to prevent duplicates
            existing_outbox = db.scalar(
                select(CalendarSyncOutbox).where(
                    CalendarSyncOutbox.organization_id == user.organization_id,
                    CalendarSyncOutbox.payload["idempotency_key"].as_string() == idempotency_key,
                )
            )
            if not existing_outbox:
                outbox_item = CalendarSyncOutbox(
                    organization_id=user.organization_id,
                    event_type="CALENDAR_EVENT_CREATED",
                    payload={
                        "idempotency_key": idempotency_key,
                        "event_id": str(event.id),
                        "title": event.title,
                        "start_time": event.start_time.isoformat(),
                        "end_time": event.end_time.isoformat(),
                        "timezone": event.timezone,
                        "provider": event.provider,
                    },
                    status=CalendarOutboxStatus.PENDING.value,
                    attempts=0,
                    max_attempts=5,
                    next_attempt_at=datetime.now(timezone.utc),
                )
                db.add(outbox_item)

        # Atomic Audit Event
        recorder = AuditRecorder(db, source=AuditSource.API)
        recorder.record(
            action="calendar_event.created",
            entity_type="calendar_event",
            actor=AuditActor.user(user.id),
            organization_id=user.organization_id,
            entity_id=event.id,
            after={
                "id": str(event.id),
                "title": event.title,
                "event_type": event.event_type,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat(),
                "sync_status": event.sync_status,
            },
        )

        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def list_events(
        db: Session,
        user: User,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        event_type: str | None = None,
    ) -> Sequence[CalendarEvent]:
        """List calendar events enforcing tenant isolation and ownership/relationship scope."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.view")

        stmt = select(CalendarEvent).where(CalendarEvent.organization_id == user.organization_id)

        # Enforce relationship scope if user lacks org-wide scope
        if not auth_context.has_organization_scope("calendar.view"):
            stmt = stmt.where(CalendarEvent.user_id == user.id)

        if start_time:
            stmt = stmt.where(CalendarEvent.end_time >= start_time)
        if end_time:
            stmt = stmt.where(CalendarEvent.start_time <= end_time)
        if event_type:
            stmt = stmt.where(CalendarEvent.event_type == event_type)

        stmt = stmt.order_by(CalendarEvent.start_time.asc())
        return db.scalars(stmt).all()

    @staticmethod
    def get_event(db: Session, user: User, event_id: uuid.UUID) -> CalendarEvent:
        """Get calendar event by ID ensuring tenancy and ownership scope."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.view")

        stmt = select(CalendarEvent).where(
            CalendarEvent.id == event_id,
            CalendarEvent.organization_id == user.organization_id,
        )
        event = db.scalar(stmt)
        if not event:
            raise ResourceNotFoundError(f"Calendar event {event_id} not found")

        # Ownership / relationship authorization check
        if not auth_context.has_organization_scope("calendar.view") and event.user_id != user.id:
            raise PermissionDeniedError(f"Access denied to calendar event {event_id}")

        return event

    @staticmethod
    def update_event(
        db: Session,
        user: User,
        event_id: uuid.UUID,
        payload: CalendarEventUpdate,
        expected_version: int | None = None,
    ) -> CalendarEvent:
        """Update calendar event with optimistic concurrency validation and atomic audit logging."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.view")
        event = CalendarService.get_event(db, user, event_id)

        # Optimistic concurrency check
        if expected_version is not None and event.version != expected_version:
            raise ConflictError(
                f"Optimistic concurrency conflict for calendar event {event_id}: "
                f"expected version {expected_version}, current version is {event.version}"
            )

        before_snapshot = {
            "title": event.title,
            "description": event.description,
            "start_time": event.start_time.isoformat(),
            "end_time": event.end_time.isoformat(),
            "timezone": event.timezone,
            "version": event.version,
        }

        if payload.title is not None:
            event.title = payload.title
        if payload.description is not None:
            event.description = payload.description
        if payload.start_time is not None:
            event.start_time = payload.start_time
        if payload.end_time is not None:
            event.end_time = payload.end_time
        if payload.timezone is not None:
            event.timezone = payload.timezone

        if event.end_time <= event.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event end_time must be strictly after start_time",
            )

        event.version += 1

        after_snapshot = {
            "title": event.title,
            "description": event.description,
            "start_time": event.start_time.isoformat(),
            "end_time": event.end_time.isoformat(),
            "timezone": event.timezone,
            "version": event.version,
        }

        # Deterministic outbox update deduplication
        if event.sync_status in (CalendarSyncStatus.SYNCHRONIZED.value, CalendarSyncStatus.SYNC_PENDING.value):
            idempotency_key = f"evt_{event.id}_update_v{event.version}"
            outbox_item = CalendarSyncOutbox(
                organization_id=user.organization_id,
                event_type="CALENDAR_EVENT_UPDATED",
                payload={
                    "idempotency_key": idempotency_key,
                    "event_id": str(event.id),
                    "external_event_id": event.external_event_id,
                    "title": event.title,
                    "start_time": event.start_time.isoformat(),
                    "end_time": event.end_time.isoformat(),
                },
                status=CalendarOutboxStatus.PENDING.value,
                attempts=0,
                max_attempts=5,
                next_attempt_at=datetime.now(timezone.utc),
            )
            db.add(outbox_item)

        # Atomic Audit Log Event
        recorder = AuditRecorder(db, source=AuditSource.API)
        recorder.record(
            action="calendar_event.updated",
            entity_type="calendar_event",
            actor=AuditActor.user(user.id),
            organization_id=user.organization_id,
            entity_id=event.id,
            before=before_snapshot,
            after=after_snapshot,
        )

        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def list_outbox_items(
        db: Session,
        user: User,
        status_filter: str | None = None,
    ) -> Sequence[CalendarSyncOutbox]:
        """List outbox items for organization."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.manage_organization_integrations")

        stmt = select(CalendarSyncOutbox).where(CalendarSyncOutbox.organization_id == user.organization_id)
        if status_filter:
            stmt = stmt.where(CalendarSyncOutbox.status == status_filter)

        stmt = stmt.order_by(CalendarSyncOutbox.created_at.desc())
        return db.scalars(stmt).all()

    @staticmethod
    def get_user_integration(db: Session, user: User) -> UserCalendarIntegration | None:
        """Get active user calendar integration."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.manage_own_connections")

        stmt = select(UserCalendarIntegration).where(
            UserCalendarIntegration.user_id == user.id,
            UserCalendarIntegration.is_active == True,
        )
        return db.scalar(stmt)

    @staticmethod
    def connect_integration(
        db: Session,
        user: User,
        payload: ConnectIntegrationRequest,
    ) -> UserCalendarIntegration:
        """Disabled in Phase 3. Returns HTTP 501 Not Implemented per Phase 5 OAuth scope rule."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.manage_own_connections")

        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="External calendar provider OAuth integration is scheduled for Phase 5",
        )
