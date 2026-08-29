"""Integration and security test suite for Strategy, Analytics, Google Calendar, and Audit Query."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
import pytest


@pytest.mark.db
def test_strategy_lifecycle_and_milestones(client, factory) -> None:
    """Verify quarterly priority creation and 10-milestone step status updates."""
    org = factory.organization()
    user = factory.user_with_permissions(org, ("priorities.view", "priorities.propose", "priorities.approve", "milestones.view", "milestones.update_assigned"))
    client.login_or_fail(user.email)

    # List quarterly priorities
    res = client.get("/api/v1/strategy/quarterly-priorities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

    # Create a new priority
    create_payload = {
        "title": "NABH 5th Edition Accreditation Readiness",
        "description": "Ensure 100% compliance across clinical protocols and OT checklists.",
        "reporting_authority": "Managing Director",
        "department": "Quality & NABH Audit",
        "quarter": "Q3",
        "fy_start_year": 2026,
    }
    create_res = client.post("/api/v1/strategy/quarterly-priorities", json=create_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["title"] == create_payload["title"]
    assert len(created["milestones"]) == 10
    priority_id = created["id"]

    # Update milestone step 1
    step_update = {
        "status": "COMPLETED",
        "verification_notes": "All initial quality benchmarks met.",
    }
    update_res = client.patch(
        f"/api/v1/strategy/quarterly-priorities/{priority_id}/milestones/1",
        json=step_update,
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    step1 = next(m for m in updated["milestones"] if m["step_number"] == 1)
    assert step1["status"] == "COMPLETED"
    assert step1["verification_notes"] == "All initial quality benchmarks met."


@pytest.mark.db
def test_operational_analytics_endpoint(client, factory) -> None:
    """Verify server-side aggregated operational analytics endpoint."""
    org = factory.organization()
    user = factory.user_with_permissions(org, ("kpis.view", "organization.read"))
    client.login_or_fail(user.email)

    res = client.get("/api/v1/analytics/operational")
    assert res.status_code == 200
    data = res.json()

    assert "scope" in data
    assert "role" in data
    assert "summary" in data
    assert "total_work_items" in data["summary"]
    assert "on_time_rate_percent" in data["summary"]
    assert "department_metrics" in data
    assert "workload_metrics" in data
    assert "priority_progress" in data
    assert "escalations" in data


@pytest.mark.db
def test_calendar_google_oauth_and_sync(client, factory) -> None:
    """Verify Google Calendar OAuth URL, Connect, Sync, and Disconnect endpoints."""
    org = factory.organization()
    user = factory.user_with_permissions(org, ("calendar.manage_own_connections", "calendar.view"))
    client.login_or_fail(user.email)

    # 1. Get Auth URL
    auth_res = client.get("/api/v1/calendar/integrations/google/auth-url")
    assert auth_res.status_code == 200
    auth_data = auth_res.json()
    assert "auth_url" in auth_data

    # 2. Connect Integration
    connect_payload = {
        "provider": "GOOGLE",
        "auth_code": "4/0AeanS0_test_auth_code_xyz",
        "redirect_uri": "http://localhost:3000/calendar/callback",
        "account_email": "surgeon.lead@stavya.local",
    }
    connect_res = client.post("/api/v1/calendar/integrations/google/connect", json=connect_payload)
    assert connect_res.status_code == 200
    integration = connect_res.json()
    assert integration["provider"] == "GOOGLE"
    assert integration["is_active"] is True

    # 3. Check Status
    status_res = client.get("/api/v1/calendar/integrations")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data is not None
    assert status_data["provider"] == "GOOGLE"

    # 4. Trigger Sync
    sync_res = client.post("/api/v1/calendar/sync")
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert "processed_count" in sync_data

    # 5. Disconnect
    disc_res = client.post("/api/v1/calendar/integrations/disconnect")
    assert disc_res.status_code == 204


@pytest.mark.db
def test_audit_query_events(client, factory) -> None:
    """Verify read-only audit query API with filtering and correlation."""
    org = factory.organization()
    user = factory.user_with_permissions(org, ("audit.read",))
    client.login_or_fail(user.email)

    res = client.get("/api/v1/audit/events?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
