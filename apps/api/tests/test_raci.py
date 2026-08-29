"""Focused backend tests for LAKSHYA RACI governance, scoping, and audit."""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import select

from app.modules.access.catalog import RACI_MANAGE, ScopeType
from app.modules.access.models import Permission, RolePermission
from app.modules.audit.models import AuditEvent


@pytest.mark.db
def test_raci_separation_and_mutual_exclusivity_validation(client, factory, session) -> None:
    """RACI validation must enforce single R and A, R != A, and mutual exclusivity across roles."""
    org = factory.organization()
    dept = factory.department(org)

    actor = factory.user_with_permissions(org, (RACI_MANAGE,), department=dept)
    user_a = factory.user(org)
    user_b = factory.user(org)
    user_c = factory.user(org)
    factory.membership(dept, user_a)
    factory.membership(dept, user_b)
    factory.membership(dept, user_c)

    client.login_or_fail(actor.email)
    work_item = factory.work_item(org, owner=actor, department=dept)

    # 1. Test R == A (422)
    res = client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(user_a.id),
            "accountable_id": str(user_a.id),
            "reason": "Assigning same person to R and A",
        },
    )
    assert res.status_code == 422
    assert "different people" in res.text

    # 2. Test Role Overlap: R is also in C (422)
    res = client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(user_a.id),
            "accountable_id": str(user_b.id),
            "consulted_ids": [str(user_a.id)],
            "consultation_expectation": "Review protocols",
            "reason": "Overlap test between R and C",
        },
    )
    assert res.status_code == 422
    assert "multiple RACI roles" in res.text or "One person cannot hold multiple" in res.text

    # 3. Test C without consultation expectation (422)
    res = client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(user_a.id),
            "accountable_id": str(user_b.id),
            "consulted_ids": [str(user_c.id)],
            "reason": "Missing consultation expectation",
        },
    )
    assert res.status_code == 422
    assert "consultation expectation" in res.text

    # 4. Test I without information cadence (422)
    res = client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(user_a.id),
            "accountable_id": str(user_b.id),
            "informed_ids": [str(user_c.id)],
            "reason": "Missing information cadence",
        },
    )
    assert res.status_code == 422
    assert "information cadence" in res.text

    # 5. Test Short / Empty Reason (422)
    res = client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(user_a.id),
            "accountable_id": str(user_b.id),
            "reason": "fix",  # < 5 chars
        },
    )
    assert res.status_code == 422


@pytest.mark.db
def test_raci_active_same_organization_user_check(client, factory) -> None:
    """All RACI assignees must be active users within the caller's organization."""
    org1 = factory.organization()
    org2 = factory.organization()

    actor = factory.user_with_permissions(org1, (RACI_MANAGE,))
    user_other_org = factory.user(org2)
    inactive_user = factory.user(org1, is_active=False)
    random_id = uuid.uuid4()

    client.login_or_fail(actor.email)
    work_item = factory.work_item(org1, owner=actor)

    # 1. Other organization user (422)
    res = client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(actor.id),
            "accountable_id": str(user_other_org.id),
            "reason": "Cross-organization test assignment",
        },
    )
    assert res.status_code == 422
    assert "not active users in your organization" in res.text

    # 2. Inactive user (422)
    res = client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(actor.id),
            "accountable_id": str(inactive_user.id),
            "reason": "Inactive user test assignment",
        },
    )
    assert res.status_code == 422

    # 3. Non-existent UUID (422)
    res = client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(actor.id),
            "accountable_id": str(random_id),
            "reason": "Non-existent user assignment",
        },
    )
    assert res.status_code == 422


@pytest.mark.db
def test_generic_patch_blocks_raci_and_owner_mutation(client, factory) -> None:
    """Generic PATCH must reject any attempt to modify raci, owner_id, or owner_name."""
    org = factory.organization()
    actor = factory.user_with_permissions(org, (RACI_MANAGE,))
    other_user = factory.user(org)

    client.login_or_fail(actor.email)
    work_item = factory.work_item(org, owner=actor)

    # 1. Attempt to mutate owner_id via PATCH (422)
    res = client.patch(
        f"/api/v1/work_items/{work_item.id}",
        json={"owner_id": str(other_user.id)},
    )
    assert res.status_code == 422
    assert "RACI and owner assignments cannot be changed via generic PATCH" in res.text

    # 2. Attempt to mutate owner_name via PATCH (422)
    res = client.patch(
        f"/api/v1/work_items/{work_item.id}",
        json={"owner_name": "New Owner Name"},
    )
    assert res.status_code == 422

    # 3. Attempt to mutate raci via PATCH (422)
    res = client.patch(
        f"/api/v1/work_items/{work_item.id}",
        json={"raci": {"responsible_id": str(other_user.id)}},
    )
    assert res.status_code == 422


@pytest.mark.db
def test_atomic_put_raci_syncs_owner_and_records_activity_and_audit(
    client, factory, session
) -> None:
    """PUT /api/v1/work_items/{id}/raci replaces RACI, syncs owner, logs activity + audit."""
    org = factory.organization()
    dept = factory.department(org)
    actor = factory.user_with_permissions(org, (RACI_MANAGE,), department=dept)
    resp_user = factory.user(org, full_name="Dr. Sunita Clinical Lead")
    acc_user = factory.user(org, full_name="Dr. Rohan Department Head")
    consult_user = factory.user(org, full_name="Quality Auditor")
    inform_user = factory.user(org, full_name="Compliance Officer")

    factory.membership(dept, resp_user)
    factory.membership(dept, acc_user)
    factory.membership(dept, consult_user)
    factory.membership(dept, inform_user)

    client.login_or_fail(actor.email)
    work_item = factory.work_item(
        org, owner=actor, department=dept, title="Sterile Processing Protocol"
    )

    payload = {
        "responsible_id": str(resp_user.id),
        "accountable_id": str(acc_user.id),
        "consulted_ids": [str(consult_user.id)],
        "informed_ids": [str(inform_user.id)],
        "consultation_expectation": "Consult on microbiological spore count thresholds.",
        "information_cadence": "Weekly summary report on Friday 5 PM.",
        "reason": "Realigning clinical accountability for NABH sterile compliance.",
    }

    res = client.put(f"/api/v1/work_items/{work_item.id}/raci", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Verify RACI structure
    raci = data["raci"]
    assert raci["responsible_id"] == str(resp_user.id)
    assert raci["responsible_name"] == "Dr. Sunita Clinical Lead"
    assert raci["accountable_id"] == str(acc_user.id)
    assert raci["accountable_name"] == "Dr. Rohan Department Head"
    assert raci["consulted_ids"] == [str(consult_user.id)]
    assert raci["consulted_names"] == ["Quality Auditor"]
    assert raci["informed_ids"] == [str(inform_user.id)]
    assert raci["informed_names"] == ["Compliance Officer"]
    assert raci["consultation_expectation"] == payload["consultation_expectation"]
    assert raci["information_cadence"] == payload["information_cadence"]

    # Verify Owner Synchronization: owner is set to Responsible
    assert data["owner_id"] == str(resp_user.id)
    assert data["owner_name"] == "Dr. Sunita Clinical Lead"

    # Verify activity history returned in response
    assert len(data["activity_history"]) > 0
    raci_act = next(a for a in data["activity_history"] if a["activity_type"] == "RACI_CHANGE")
    assert "RACI updated" in raci_act["note"]
    assert payload["reason"] in raci_act["note"]

    # Verify append-only AuditEvent in database
    audit_evt = session.scalar(
        select(AuditEvent).where(
            AuditEvent.organization_id == org.id,
            AuditEvent.action == "work_item.raci.update",
            AuditEvent.entity_id == work_item.id,
        )
    )
    assert audit_evt is not None
    assert audit_evt.reason == payload["reason"]
    assert audit_evt.after["owner_id"] == str(resp_user.id)


@pytest.mark.db
def test_scoped_raci_manage_authorization_enforcement(client, factory, session) -> None:
    """raci.manage must be scoped: department-scoped actor can only assign within scope."""
    org = factory.organization()
    dept_spine = factory.department(org, name="Spine Surgery")
    dept_cardio = factory.department(org, name="Cardiology")

    # Leader with department-scoped raci.manage in dept_spine
    leader = factory.user(org, full_name="Spine Leader")
    role_dept_manage = factory.role(org, "spine_lead")
    perm_raci_manage = session.scalar(select(Permission).where(Permission.key == RACI_MANAGE))
    session.add(RolePermission(role_id=role_dept_manage.id, permission_id=perm_raci_manage.id))
    factory.membership(dept_spine, leader)
    factory.assignment(
        leader, role_dept_manage, scope_type=ScopeType.DEPARTMENT, department=dept_spine
    )

    # Department colleague in Spine
    spine_colleague = factory.user(org, full_name="Sister Sunita")
    factory.membership(dept_spine, spine_colleague)

    # Outside user in Cardiology
    cardio_user = factory.user(org, full_name="Cardio Doctor")
    factory.membership(dept_cardio, cardio_user)

    client.login_or_fail(leader.email)
    work_item = factory.work_item(org, owner=leader, department=dept_spine)

    # 1. Valid department-scoped assignment: R=spine_colleague, A=leader (200)
    res_valid = client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(spine_colleague.id),
            "accountable_id": str(leader.id),
            "reason": "Delegating OT checklist execution within Spine department.",
        },
    )
    assert res_valid.status_code == 200

    # 2. Invalid scoped assignment: R=cardio_user (outside dept) -> 403
    res_invalid_r = client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(cardio_user.id),
            "accountable_id": str(leader.id),
            "reason": "Cross-department assignment attempt without scope.",
        },
    )
    assert res_invalid_r.status_code == 403
    assert "Scoped RACI authorization violation" in res_invalid_r.text

    # 3. Unauthorized user without raci.manage (e.g. employee) -> 403
    employee = factory.user(org, full_name="Staff Nurse")
    factory.membership(dept_spine, employee)
    client.login_or_fail(employee.email)

    emp_item = factory.work_item(org, owner=employee, department=dept_spine)
    res_unauth = client.put(
        f"/api/v1/work_items/{emp_item.id}/raci",
        json={
            "responsible_id": str(employee.id),
            "accountable_id": str(leader.id),
            "reason": "Employee attempting to manage RACI without grant.",
        },
    )
    assert res_unauth.status_code == 403
    assert "Permission 'raci.manage' is required" in res_unauth.text


@pytest.mark.db
def test_consulted_and_informed_roles_do_not_widen_visibility(client, factory) -> None:
    """Assigning a user as C or I must NOT widen task visibility to confidential items."""
    org = factory.organization()
    dept_mdoffice = factory.department(org, name="MD Office")
    dept_spine = factory.department(org, name="Spine Surgery")

    md_user = factory.user_with_permissions(org, (RACI_MANAGE,), department=dept_mdoffice)
    acc_user = factory.user(org, full_name="Executive Assistant")
    factory.membership(dept_mdoffice, acc_user)

    # Employee in different department
    emp = factory.user(org, full_name="Spine Nurse")
    factory.membership(dept_spine, emp)

    # Create confidential MD Office work item and assign emp to Consulted
    client.login_or_fail(md_user.email)
    work_item = factory.work_item(
        org, owner=md_user, department=dept_mdoffice, title="Confidential Executive Audit"
    )

    client.put(
        f"/api/v1/work_items/{work_item.id}/raci",
        json={
            "responsible_id": str(md_user.id),
            "accountable_id": str(acc_user.id),
            "consulted_ids": [str(emp.id)],
            "consultation_expectation": "Provide OT schedule feedback.",
            "reason": "Adding nurse as consulted on executive schedule.",
        },
    )

    # Now login as employee: strict task isolation must deny access (403)
    client.login_or_fail(emp.email)

    res_get = client.get(f"/api/v1/work_items/{work_item.id}")
    assert res_get.status_code == 403
    assert "Access forbidden" in res_get.text

    # List work items must not include the item
    res_list = client.get("/api/v1/work_items")
    assert res_list.status_code == 200
    item_ids = [item["id"] for item in res_list.json()]
    assert str(work_item.id) not in item_ids


@pytest.mark.db
def test_work_item_creation_with_raci_syncs_owner_and_validates(client, factory) -> None:
    """POST /api/v1/work_items with RACI validates invariants and synchronizes owner."""
    org = factory.organization()
    dept = factory.department(org)
    actor = factory.user_with_permissions(org, (RACI_MANAGE,), department=dept)
    resp_user = factory.user(org, full_name="Dr. Responsible")
    acc_user = factory.user(org, full_name="Dr. Accountable")
    factory.membership(dept, resp_user)
    factory.membership(dept, acc_user)

    client.login_or_fail(actor.email)

    # 1. Invalid RACI on create (R == A) -> 422
    invalid_create = client.post(
        "/api/v1/work_items",
        json={
            "title": "Invalid Task",
            "department_id": str(dept.id),
            "raci": {
                "responsible_id": str(resp_user.id),
                "accountable_id": str(resp_user.id),
            },
        },
    )
    assert invalid_create.status_code == 422

    # 2. Valid RACI on create -> 201, owner synced
    valid_create = client.post(
        "/api/v1/work_items",
        json={
            "title": "Sterile Audit Task",
            "department_id": str(dept.id),
            "raci": {
                "responsible_id": str(resp_user.id),
                "accountable_id": str(acc_user.id),
            },
        },
    )
    assert valid_create.status_code == 201
    created_data = valid_create.json()
    assert created_data["owner_id"] == str(resp_user.id)
    assert created_data["owner_name"] == "Dr. Responsible"
    assert created_data["raci"]["accountable_id"] == str(acc_user.id)
    assert created_data["raci"]["accountable_name"] == "Dr. Accountable"
