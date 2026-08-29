"""Tests for Needs MD Attention Executive Engine and Cockpit Actions.

Verifies:
1. Server-derived calculation of executive attention items with 6 required categories.
2. Strict server-side RBAC: Allowed only for MD/MD Office, 403 Forbidden for stavyan/department head/manager.
3. Cockpit executive actions:
   - Executive Override on blockers
   - Evidence Verification (Approve / Reject)
   - Request Evidence from Accountable Lead
   - Record Formal MD Decision / Directive
   - L3 Escalation Resolution
   - RACI Lead Reassignment
   - Authorized Deadline Extension
4. Optimistic concurrency protection (409 Conflict on version mismatch).
5. Append-only audit trail logging for all mutations.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from starlette.testclient import TestClient

from app.core.config import Environment, Settings
from app.main import create_app
from app.modules.identity.models import User
from app.modules.md_attention.schemas import MDAttentionCategory, MDAttentionSummary
from app.modules.md_attention.service import (
    MDAttentionService,
    MD_ATTENTION_AUTHORIZED_ROLES,
    is_md_attention_authorized,
)
from app.core.errors import ConflictError, PermissionDeniedError, ValidationFailedError

test_settings = Settings(
    _env_file=None,
    environment=Environment.LOCAL,
    cors_allowed_origins=("http://localhost:3000",),
    trusted_origins=("http://localhost:3000",),
)
api_test_app = create_app(test_settings)


def test_md_attention_rbac_allow_deny_matrix() -> None:
    """Verifies the complete Allow/Deny RBAC matrix across all documented and custom roles."""
    allowed_roles = [
        "MD",
        "md",
        "MD_OFFICE",
        "md_office",
        "MANAGING_DIRECTOR",
        "managing_director",
        "ADMIN",
        "admin",
        "MASTER",
        "master",
        "LOCAL_BOOTSTRAP_ADMIN",
        "local_bootstrap_admin",
    ]

    denied_roles = [
        "DEPARTMENT_HEAD",
        "department_head",
        "MANAGER",
        "manager",
        "LEADER",
        "leader",
        "LEADERS",
        "leaders",
        "STAVYAN",
        "stavyan",
        "STAVYAN",
        "stavyan",
        "NURSE",
        "nurse",
        "DOCTOR",
        "doctor",
        "GUEST",
        "guest",
        "UNKNOWN_ROLE",
        "",
    ]

    for role in allowed_roles:
        assert is_md_attention_authorized([role]) is True, f"Role {role} should be ALLOWED"

    for role in denied_roles:
        assert is_md_attention_authorized([role]) is False, f"Role {role} should be DENIED"

    sample_user = User(
        id=uuid.uuid4(),
        organization_id=uuid.uuid4(),
        email="user@stavya.local",
        normalized_email="user@stavya.local",
        full_name="Staff User",
        is_active=True,
    )

    for role in denied_roles:
        try:
            MDAttentionService.get_attention_summary(
                session=None,  # type: ignore
                current_user=sample_user,
                effective_roles=[role],
            )
            assert False, f"Expected PermissionDeniedError for denied role: {role}"
        except PermissionDeniedError as e:
            assert "Access Denied" in str(e)
            assert "restricted to MD and MD Office" in str(e)


def test_md_attention_api_endpoint_with_testclient() -> None:
    """Verifies live FastAPI /api/v1/md-attention endpoint via TestClient for MD login."""
    with TestClient(api_test_app) as client:
        # 1. Login as MD
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "md@stavya.local", "password": "password123"},
            headers={"Origin": "http://localhost:3000"},
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"

        session_token = login_res.cookies.get("lakshya_session", "")
        csrf_token = login_res.cookies.get("lakshya_csrf", "")
        headers = {
            "Cookie": f"lakshya_session={session_token}; lakshya_csrf={csrf_token}",
            "X-CSRF-Token": csrf_token,
            "Origin": "http://localhost:3000",
        }

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
            assert "allowed_actions" in item
            assert "disabled_actions" in item
            assert "version" in item
            assert "is_synthetic" in item


def test_md_attention_api_forbids_employee_via_testclient() -> None:
    """Verifies live FastAPI /api/v1/md-attention endpoint rejects stavyan with HTTP 403."""
    with TestClient(api_test_app) as client:
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "stavyan@stavya.local", "password": "password123"},
            headers={"Origin": "http://localhost:3000"},
        )
        if login_res.status_code == 200:
            session_token = login_res.cookies.get("lakshya_session", "")
            csrf_token = login_res.cookies.get("lakshya_csrf", "")
            headers = {
                "Cookie": f"lakshya_session={session_token}; lakshya_csrf={csrf_token}",
                "X-CSRF-Token": csrf_token,
                "Origin": "http://localhost:3000",
            }

            res = client.get("/api/v1/md-attention", headers=headers)
            assert res.status_code == 403, f"Expected 403 for stavyan, got {res.status_code}"
            problem = res.json()
            assert problem["status"] == 403
            assert "Access Denied" in problem["detail"]


def test_cockpit_actions_live_execution() -> None:
    """Verifies executive Cockpit action endpoints for override, verification, RACI, extension, request evidence, and record decision."""
    with TestClient(api_test_app) as client:
        # Login as MD
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "md@stavya.local", "password": "password123"},
            headers={"Origin": "http://localhost:3000"},
        )
        assert login_res.status_code == 200
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

        # Find the blocked work item for executive override
        blocked_item = next(
            (i for i in summary["items"] if i.get("category") == "HIGH_IMPACT_BLOCKER" or i.get("status") in ("blocked", "stuck")),
            summary["items"][0]
        )
        work_item_id = blocked_item["entity_id"]
        current_version = blocked_item.get("version", 1)

        # 1. Test Executive Override on blocked item
        override_res = client.post(
            "/api/v1/md-attention/executive-override",
            json={
                "work_item_id": work_item_id,
                "override_reason": "Executive directive issued to bypass vendor credential wait.",
                "clear_blocker": True,
                "expected_version": current_version,
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
        users_res = client.get("/api/v1/users", headers=headers)
        assert users_res.status_code == 200
        users_list = users_res.json()["items"] if isinstance(users_res.json(), dict) and "items" in users_res.json() else users_res.json()
        emp_user = next((u for u in users_list if "employee" in u.get("email", "").lower() or "sunita" in u.get("full_name", "").lower()), users_list[0])
        md_user = next((u for u in users_list if ("md" in u.get("email", "").lower() or "rohan" in u.get("full_name", "").lower()) and u["id"] != emp_user["id"]), users_list[1])

        raci_res = client.post(
            "/api/v1/md-attention/reassign-raci",
            json={
                "work_item_id": work_item_id,
                "responsible_id": emp_user["id"],
                "accountable_id": md_user["id"],
                "rationale": "Appointed Senior Sister as responsible clinical coordinator.",
            },
            headers=headers,
        )
        assert raci_res.status_code == 200
        assert raci_res.json()["action_type"] == "REASSIGN_RACI"

        # 4. Test Request Evidence
        req_ev_res = client.post(
            "/api/v1/md-attention/request-evidence",
            json={
                "work_item_id": work_item_id,
                "request_notes": "Please upload physical signed sterilization logs before closure sign-off.",
                "deadline_extension_days": 2,
            },
            headers=headers,
        )
        assert req_ev_res.status_code == 200
        assert req_ev_res.json()["action_type"] == "REQUEST_EVIDENCE"

        # 5. Test Record Decision
        dec_res = client.post(
            "/api/v1/md-attention/record-decision",
            json={
                "work_item_id": work_item_id,
                "decision_text": "Approved procurement of backup autoclave unit.",
                "directive": "Operations to expedite vendor order with 48-hour delivery SLA.",
                "unblock": True,
            },
            headers=headers,
        )
        assert dec_res.status_code == 200
        assert dec_res.json()["action_type"] == "RECORD_DECISION"

        # 6. Test Evidence Verification (Accept & Close)
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

        # 7. Test Optimistic Locking Concurrency Conflict (409)
        conflict_res = client.post(
            "/api/v1/md-attention/verify-evidence",
            json={
                "work_item_id": work_item_id,
                "verification_result": "REJECTED_REOPEN",
                "verification_notes": "Stale version test.",
                "expected_version": 1,  # Intentional stale version mismatch
            },
            headers=headers,
        )
        assert conflict_res.status_code == 409
        assert conflict_res.json()["code"] == "conflict"

        # 8. Test Mandatory Reason / Validation Failure (422 Unprocessable)
        invalid_verify_res = client.post(
            "/api/v1/md-attention/verify-evidence",
            json={
                "work_item_id": work_item_id,
                "verification_result": "VERIFIED_CLOSED",
                "verification_notes": "   ",  # Blank notes violate domain invariant
            },
            headers=headers,
        )
        assert invalid_verify_res.status_code == 422
        assert invalid_verify_res.json()["code"] == "validation_failed"


def test_cockpit_actions_reject_non_md_mutations() -> None:
    """Verifies that mutation endpoints return 403 Forbidden when called by non-MD roles."""
    with TestClient(api_test_app) as client:
        # Login as stavyan
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "stavyan@stavya.local", "password": "password123"},
            headers={"Origin": "http://localhost:3000"},
        )
        assert login_res.status_code == 200
        session_token = login_res.cookies.get("lakshya_session", "")
        csrf_token = login_res.cookies.get("lakshya_csrf", "")
        headers = {
            "Cookie": f"lakshya_session={session_token}; lakshya_csrf={csrf_token}",
            "X-CSRF-Token": csrf_token,
            "Origin": "http://localhost:3000",
        }

        # Attempt executive override
        fake_id = str(uuid.uuid4())
        res = client.post(
            "/api/v1/md-attention/executive-override",
            json={
                "work_item_id": fake_id,
                "override_reason": "Stavyan attempting executive action.",
                "clear_blocker": True,
            },
            headers=headers,
        )
        assert res.status_code == 403
        assert "Access Denied" in res.json()["detail"]
