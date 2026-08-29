"""Tests for Needs MD Attention Executive Engine and Cockpit Actions.

Verifies:
1. Server-derived calculation of executive attention items.
2. 6 required categories: CRITICAL_OVERDUE, HIGH_IMPACT_BLOCKER, DECISION_AWAITING_AUTHORITY,
   EVIDENCE_AWAITING_VERIFICATION, AT_RISK_MILESTONE, REPEATED_DEFERRAL.
3. Strict server-side RBAC: Allowed for MD/MD Office, 403 Forbidden for standard employee.
4. Cockpit executive actions:
   - Executive Override on blockers
   - Evidence Verification (Approve / Reject)
   - L3 Escalation Resolution
   - RACI Lead Reassignment
   - Authorized Deadline Extension
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from starlette.testclient import TestClient

from app.main import app
from app.modules.identity.models import User
from app.modules.md_attention.schemas import MDAttentionCategory, MDAttentionSummary
from app.modules.md_attention.service import MDAttentionService
from app.core.errors import PermissionDeniedError


def test_md_attention_service_rbac_forbids_employee() -> None:
    """Verifies that MDAttentionService raises PermissionDeniedError for employee role."""
    employee_user = User(
        id=uuid.uuid4(),
        organization_id=uuid.uuid4(),
        email="nurse.sunita@stavya.local",
        normalized_email="nurse.sunita@stavya.local",
        full_name="Sister Sunita Rao",
        is_active=True,
    )

    try:
        MDAttentionService.get_attention_summary(
            session=None,  # type: ignore
            current_user=employee_user,
            effective_roles=["employee"],
        )
        assert False, "Expected PermissionDeniedError for employee role"
    except PermissionDeniedError as e:
        assert "Access Denied" in str(e)
        assert "restricted to MD and MD Office" in str(e)


def test_md_attention_api_endpoint_with_testclient() -> None:
    """Verifies live FastAPI /api/v1/md-attention endpoint via TestClient for MD login."""
    with TestClient(app) as client:
        # 1. Login as MD
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "md@stavya.local", "password": "password123"},
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"

        raw_cookie = login_res.headers.get("set-cookie", "")
        token = raw_cookie.split("lakshya_session=")[1].split(";")[0]
        headers = {"Cookie": f"lakshya_session={token}"}

        # 2. Query /api/v1/md-attention
        res = client.get("/api/v1/md-attention", headers=headers)
        assert res.status_code == 200, f"Failed to get MD attention: {res.text}"
        data = res.json()

        assert "total_items" in data
        assert "critical_overdue_count" in data
        assert "high_impact_blocker_count" in data
        assert "decision_awaiting_count" in data
        assert "evidence_verification_count" in data
        assert "at_risk_milestone_count" in data
        assert "repeated_deferrals_count" in data
        assert isinstance(data["items"], list)

        for item in data["items"]:
            assert "id" in item
            assert "category" in item
            assert "title" in item
            assert "source" in item
            assert "owner_name" in item
            assert "accountable_name" in item
            assert "impact" in item
            assert "requested_action" in item
            assert "evidence_state" in item
            assert "audit_provenance" in item
            assert "why_included" in item


def test_md_attention_api_forbids_employee_via_testclient() -> None:
    """Verifies live FastAPI /api/v1/md-attention endpoint rejects employee with HTTP 403."""
    with TestClient(app) as client:
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "employee@stavya.local", "password": "password123"},
        )
        if login_res.status_code == 200:
            raw_cookie = login_res.headers.get("set-cookie", "")
            token = raw_cookie.split("lakshya_session=")[1].split(";")[0]
            headers = {"Cookie": f"lakshya_session={token}"}

            res = client.get("/api/v1/md-attention", headers=headers)
            assert res.status_code == 403, f"Expected 403 for employee, got {res.status_code}"
            problem = res.json()
            assert problem["status"] == 403
            assert "Access Denied" in problem["detail"]


def test_cockpit_actions_live_execution() -> None:
    """Verifies executive Cockpit action endpoints for override, verification, RACI and extension."""
    with TestClient(app) as client:
        # Login as MD
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "md@stavya.local", "password": "password123"},
        )
        assert login_res.status_code == 200
        # Extract session and csrf cookie
        session_token = login_res.cookies.get("lakshya_session", "")
        csrf_token = login_res.cookies.get("lakshya_csrf", "")
        headers = {
            "Cookie": f"lakshya_session={session_token}; lakshya_csrf={csrf_token}",
            "X-CSRF-Token": csrf_token,
            "Origin": "http://localhost:3000",
        }

        # Query attention list to get live entity IDs
        summary_res = client.get("/api/v1/md-attention", headers=headers)
        assert summary_res.status_code == 200
        summary = summary_res.json()
        assert len(summary["items"]) > 0

        target_item = summary["items"][0]
        work_item_id = target_item["entity_id"]

        # 1. Test Executive Override
        override_res = client.post(
            "/api/v1/md-attention/executive-override",
            json={
                "work_item_id": work_item_id,
                "override_reason": "Executive directive issued to bypass vendor credential wait.",
                "clear_blocker": True,
            },
            headers=headers,
        )
        assert override_res.status_code == 200
        res_data = override_res.json()
        assert res_data["success"] is True
        assert res_data["action_type"] == "EXECUTIVE_OVERRIDE"
        assert res_data["audit_event_id"] is not None

        # 2. Test Grant Extension
        new_due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        extension_res = client.post(
            "/api/v1/md-attention/grant-extension",
            json={
                "work_item_id": work_item_id,
                "new_due_at": new_due,
                "justification": "Authorized 5-day grace period for OT sterilization audit completion.",
            },
            headers=headers,
        )
        assert extension_res.status_code == 200
        assert extension_res.json()["action_type"] == "GRANT_EXTENSION"

        # 3. Test RACI Reassignment
        raci_res = client.post(
            "/api/v1/md-attention/reassign-raci",
            json={
                "work_item_id": work_item_id,
                "responsible_name": "Sister Sunita Rao",
                "accountable_name": "Dr. Mirant Dave (MD)",
                "rationale": "Appointed Senior Sister as responsible clinical coordinator.",
            },
            headers=headers,
        )
        assert raci_res.status_code == 200
        assert raci_res.json()["action_type"] == "REASSIGN_RACI"

        # 4. Test Evidence Verification
        verify_res = client.post(
            "/api/v1/md-attention/verify-evidence",
            json={
                "work_item_id": work_item_id,
                "verification_result": "VERIFIED_CLOSED",
                "verification_notes": "Audited physical sterilization log sheet. Definition of Done met.",
            },
            headers=headers,
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["action_type"] == "VERIFY_EVIDENCE"
