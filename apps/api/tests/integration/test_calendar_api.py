"""HTTP API integration tests for LAKSHYA Calendar Engine endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.modules.calendar.schemas import CalendarEventType, CalendarProvider


@pytest.mark.db
def test_calendar_unauthenticated_access_denied(client):
    response = client.raw.get("/api/v1/calendar/events")
    assert response.status_code == 401


@pytest.mark.db
def test_calendar_patch_missing_if_match_returns_428(client, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("meetings.create", "meetings.update", "calendar.view"))
    client.login_or_fail(user.email)

    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/calendar/events",
        json={
            "title": "API Test Event",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
            "timezone": "Asia/Kolkata",
            "event_type": "LAKSHYA_MEETING",
            "provider": "LAKSHYA",
        },
    )
    assert create_res.status_code == 201, create_res.text
    event_id = create_res.json()["id"]

    # PATCH without If-Match header raises 428 Precondition Required
    patch_res = client.patch(
        f"/api/v1/calendar/events/{event_id}",
        json={"title": "Updated Title Without ETag"},
    )
    assert patch_res.status_code == 428


@pytest.mark.db
def test_calendar_patch_wildcard_if_match_returns_422(client, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("meetings.create", "meetings.update", "calendar.view"))
    client.login_or_fail(user.email)

    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/calendar/events",
        json={
            "title": "API Test Event 2",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
            "timezone": "Asia/Kolkata",
        },
    )
    assert create_res.status_code == 201
    event_id = create_res.json()["id"]

    # PATCH with wildcard If-Match: * raises 422
    patch_res = client.patch(
        f"/api/v1/calendar/events/{event_id}",
        headers={"If-Match": "*"},
        json={"title": "Updated Title Wildcard"},
    )
    assert patch_res.status_code == 422


@pytest.mark.db
def test_calendar_patch_stale_if_match_returns_409(client, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("meetings.create", "meetings.update", "calendar.view"))
    client.login_or_fail(user.email)

    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/calendar/events",
        json={
            "title": "API Test Event 3",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
        },
    )
    assert create_res.status_code == 201
    event_id = create_res.json()["id"]

    # PATCH with stale version ETag "99" returns 409 Conflict
    patch_res = client.patch(
        f"/api/v1/calendar/events/{event_id}",
        etag='"99"',
        json={"title": "Updated Stale Title"},
    )
    assert patch_res.status_code == 409


@pytest.mark.db
def test_calendar_patch_valid_if_match_updates_and_returns_etag(client, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("meetings.create", "meetings.update", "calendar.view"))
    client.login_or_fail(user.email)

    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/calendar/events",
        json={
            "title": "API Test Event 4",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
        },
    )
    assert create_res.status_code == 201
    etag = create_res.headers["ETag"]
    event_id = create_res.json()["id"]

    # PATCH with valid ETag succeeded
    patch_res = client.patch(
        f"/api/v1/calendar/events/{event_id}",
        etag=etag,
        json={"title": "Updated API Title"},
    )
    assert patch_res.status_code == 200
    assert patch_res.headers["ETag"] == '"2"'
    assert patch_res.json()["title"] == "Updated API Title"


@pytest.mark.db
def test_calendar_connect_integration_success(client, factory):
    org = factory.organization()
    user = factory.user_with_permissions(org, ("calendar.manage_own_connections",))
    client.login_or_fail(user.email)

    res = client.post(
        "/api/v1/calendar/integrations/connect",
        json={
            "provider": "GOOGLE",
            "auth_code": "mock_code_12345",
            "redirect_uri": "http://localhost:3000/oauth",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["provider"] == "GOOGLE"
    assert data["is_active"] is True
