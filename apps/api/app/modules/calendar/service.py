"""Calendar domain service handling events, outbox queueing, and provider integrations."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.access.authorization import AuthorizationService
from app.modules.identity.models import User
from app.modules.calendar.models import (
    CalendarEvent,
    CalendarSyncOutbox,
    UserCalendarIntegration,
)
from app.modules.calendar.schemas import (
    CalendarEventCreate,
    CalendarEventUpdate,
    ConnectIntegrationRequest,
)


class CalendarService:
    """Service layer for calendar events, sync outbox, and integrations."""

    @staticmethod
    def create_event(db: Session, user: User, payload: CalendarEventCreate) -> CalendarEvent:
        """Create a new calendar event within user's organization."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.view")

        if payload.end_time <= payload.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event end_time must be strictly after start_time",
            )

        # Check for provider integration
        integration = CalendarService.get_user_integration(db, user)
        sync_status = "SYNC_PENDING" if (integration and integration.is_active and payload.provider != "LAKSHYA") else "NOT_SYNCED"

        event = CalendarEvent(
            organization_id=user.organization_id,
            user_id=user.id,
            meeting_id=payload.meeting_id,
            title=payload.title,
            description=payload.description,
            event_type=payload.event_type,
            start_time=payload.start_time,
            end_time=payload.end_time,
            timezone=payload.timezone,
            provider=payload.provider,
            sync_status=sync_status,
        )
        db.add(event)
        db.flush()

        # Insert outbox item if scheduled for external sync
        if sync_status == "SYNC_PENDING":
            outbox_item = CalendarSyncOutbox(
                organization_id=user.organization_id,
                event_type="CALENDAR_EVENT_CREATED",
                payload={
                    "event_id": str(event.id),
                    "title": event.title,
                    "start_time": event.start_time.isoformat(),
                    "end_time": event.end_time.isoformat(),
                    "timezone": event.timezone,
                    "provider": event.provider,
                },
                status="PENDING",
            )
            db.add(outbox_item)

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
        """List calendar events in user's organization."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.view")

        stmt = select(CalendarEvent).where(CalendarEvent.organization_id == user.organization_id)

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
        """Get event by ID ensuring tenancy scope."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.view")

        stmt = select(CalendarEvent).where(
            CalendarEvent.id == event_id,
            CalendarEvent.organization_id == user.organization_id,
        )
        event = db.scalar(stmt)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Calendar event not found",
            )
        return event

    @staticmethod
    def update_event(
        db: Session,
        user: User,
        event_id: uuid.UUID,
        payload: CalendarEventUpdate,
    ) -> CalendarEvent:
        """Update an existing calendar event."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.view")
        event = CalendarService.get_event(db, user, event_id)

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
        if payload.sync_status is not None:
            event.sync_status = payload.sync_status

        if event.end_time <= event.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event end_time must be strictly after start_time",
            )

        event.version += 1

        # Enqueue outbox item if synced
        if event.sync_status in ("SYNCHRONIZED", "SYNC_PENDING"):
            outbox_item = CalendarSyncOutbox(
                organization_id=user.organization_id,
                event_type="CALENDAR_EVENT_UPDATED",
                payload={
                    "event_id": str(event.id),
                    "external_event_id": event.external_event_id,
                    "title": event.title,
                    "start_time": event.start_time.isoformat(),
                    "end_time": event.end_time.isoformat(),
                },
                status="PENDING",
            )
            db.add(outbox_item)

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
        """Connect or update user Google Calendar OAuth integration."""
        auth_context = AuthorizationService(db).load_context(user)
        auth_context.require("calendar.manage_own_connections")

        stmt = select(UserCalendarIntegration).where(
            UserCalendarIntegration.user_id == user.id,
            UserCalendarIntegration.provider == payload.provider,
        )
        integration = db.scalar(stmt)

        if not integration:
            integration = UserCalendarIntegration(
                user_id=user.id,
                provider=payload.provider,
                encrypted_refresh_token="mock_encrypted_token_gsuite",
                account_email=f"{user.email}",
                calendar_id="primary",
                is_active=True,
            )
            db.add(integration)
        else:
            integration.encrypted_refresh_token = "mock_encrypted_token_gsuite"
            integration.is_active = True

        db.commit()
        db.refresh(integration)
        return integration
