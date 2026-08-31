"""Organization isolation and IDOR prevention.

SECURITY.md §2 lists "insecure direct object reference" and "cross-department
leakage" as primary threats. SECURITY.md §4: "Never trust user-provided
organization_id or department_id."

Every test here substitutes a real identifier from another organization or
department and asserts the caller cannot reach it.
"""

from __future__ import annotations

import uuid
from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.access.catalog import (
    DEPARTMENT_CREATE,
    DEPARTMENT_READ,
    DEPARTMENT_UPDATE,
    ORGANIZATION_READ,
    ROLE_ASSIGN,
    ROLE_READ,
    USER_CREATE,
    USER_READ,
    USER_UPDATE,
)
from app.modules.organization.models import Department, DepartmentMembership
from tests.conftest import ApiClient, Factory

pytestmark = pytest.mark.db
class TestOrganizationFoundation:
    def test_positions_can_exist_vacant_or_occupied(self, factory: Factory, db_session: Session) -> None:
        from app.core.clock import utcnow
        from app.modules.access.authorization import AuthorizationContext
        from app.modules.audit.service import AuditRecorder
        from app.modules.organization.models import Position, PositionAssignment
        from app.modules.organization.service import PositionService

        org = factory.organization(slug="org-pos-1")
        dept = factory.department(org, name="Spine Surgery")
        user = factory.user(org, email="surgeon@example.com", full_name="Dr. Mehta")

        # Create vacant position
        pos = Position(
            organization_id=org.id,
            department_id=dept.id,
            title="Junior Spine Consultant",
            code="JSC-01",
            is_leadership=False,
        )
        db_session.add(pos)
        db_session.flush()

        pos_service = PositionService(db_session, AuditRecorder(db_session))
        ctx = AuthorizationContext(
            user_id=user.id,
            organization_id=org.id,
            grants=(),
            member_department_ids=frozenset([dept.id]),
        )

        positions = pos_service.list_positions(ctx)
        assert len(positions) == 1
        assert positions[0].title == "Junior Spine Consultant"
        assert positions[0].current_occupant_id is None

        # Assign occupant (now occupied)
        assign = PositionAssignment(
            organization_id=org.id,
            user_id=user.id,
            position_id=pos.id,
            is_primary=True,
            started_on=utcnow().date(),
        )
        db_session.add(assign)
        db_session.flush()

        positions = pos_service.list_positions(ctx)
        assert len(positions) == 1
        assert positions[0].current_occupant_id == user.id
        assert positions[0].current_occupant_name == "Dr. Mehta"

    def test_reporting_chain_and_subordinate_scope(self, factory: Factory, db_session: Session) -> None:
        from app.core.clock import utcnow
        from app.modules.access.authorization import AuthorizationContext
        from app.modules.audit.service import AuditRecorder
        from app.modules.organization.models import Position, PositionAssignment
        from app.modules.organization.service import PositionService

        org = factory.organization(slug="org-rep-1")
        dept = factory.department(org, name="Orthopedics")

        md_user = factory.user(org, email="md_rep@example.com", full_name="Dr. MD")
        hod_user = factory.user(org, email="hod_rep@example.com", full_name="Dr. HOD")
        nurse_user = factory.user(org, email="nurse_rep@example.com", full_name="Nurse Alice")

        # MD Position
        md_pos = Position(
            organization_id=org.id,
            department_id=dept.id,
            title="Managing Director",
            is_leadership=True,
        )
        db_session.add(md_pos)
        db_session.flush()

        # HOD Position (reports to MD)
        hod_pos = Position(
            organization_id=org.id,
            department_id=dept.id,
            title="Department Head",
            reports_to_position_id=md_pos.id,
            is_leadership=True,
        )
        db_session.add(hod_pos)
        db_session.flush()

        # Nurse Position (reports to HOD)
        nurse_pos = Position(
            organization_id=org.id,
            department_id=dept.id,
            title="OT Staff Nurse",
            reports_to_position_id=hod_pos.id,
            is_leadership=False,
        )
        db_session.add(nurse_pos)
        db_session.flush()

        # Assign people
        today = utcnow().date()
        db_session.add(PositionAssignment(organization_id=org.id, user_id=md_user.id, position_id=md_pos.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=hod_user.id, position_id=hod_pos.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=nurse_user.id, position_id=nurse_pos.id, started_on=today))
        db_session.flush()

        pos_service = PositionService(db_session, AuditRecorder(db_session))
        ctx = AuthorizationContext(
            user_id=nurse_user.id,
            organization_id=org.id,
            grants=(),
            member_department_ids=frozenset([dept.id]),
        )

        # 1. Reporting Chain for Nurse
        chain = pos_service.get_user_reporting_chain(ctx, nurse_user.id)
        assert len(chain) == 3
        assert chain[0]["position_title"] == "OT Staff Nurse"
        assert chain[0]["occupant_name"] == "Nurse Alice"
        assert chain[1]["position_title"] == "Department Head"
        assert chain[1]["occupant_name"] == "Dr. HOD"
        assert chain[2]["position_title"] == "Managing Director"
        assert chain[2]["occupant_name"] == "Dr. MD"

        # 2. Subordinates for HOD
        hod_subs = pos_service.get_subordinate_user_ids(org.id, hod_user.id)
        assert hod_subs == {nurse_user.id}

        # 3. Subordinates for MD
        md_subs = pos_service.get_subordinate_user_ids(org.id, md_user.id)
        assert md_subs == {hod_user.id, nurse_user.id}

    def test_single_transfer_mutation_and_audit(self, factory: Factory, db_session: Session) -> None:
        from app.modules.access.authorization import AuthorizationContext
        from app.modules.audit.service import AuditActor, AuditRecorder
        from app.modules.organization.models import Position, PositionAssignment
        from app.modules.organization.service import PositionService

        org = factory.organization(slug="org-trans-1")
        dept_icu = factory.department(org, name="ICU")
        dept_opd = factory.department(org, name="OPD")

        nurse = factory.user(org, email="nurse_bob@example.com", full_name="Nurse Bob")
        admin_actor = AuditActor.system("integration-test")

        pos_icu = Position(organization_id=org.id, department_id=dept_icu.id, title="ICU Nurse")
        pos_opd = Position(organization_id=org.id, department_id=dept_opd.id, title="OPD Nurse")
        db_session.add_all([pos_icu, pos_opd])
        db_session.flush()

        # Initial assignment in ICU
        day1 = date(2026, 1, 1)
        db_session.add(PositionAssignment(organization_id=org.id, user_id=nurse.id, position_id=pos_icu.id, started_on=day1))
        db_session.flush()

        # Perform Transfer to OPD
        day2 = date(2026, 3, 1)
        pos_service = PositionService(db_session, AuditRecorder(db_session))
        ctx = AuthorizationContext(
            user_id=nurse.id,
            organization_id=org.id,
            grants=(),
            member_department_ids=frozenset([dept_icu.id]),
        )

        new_assign = pos_service.transfer_person(
            ctx,
            user_id=nurse.id,
            new_position_id=pos_opd.id,
            started_on=day2,
            transfer_reason="Shift to OPD rotation",
            actor=admin_actor,
        )

        assert new_assign.position_id == pos_opd.id
        assert new_assign.started_on == day2
        assert new_assign.is_current is True

        # Verify old assignment ended
        from sqlalchemy import select
        old_assigns = list(db_session.execute(
            select(PositionAssignment).where(
                PositionAssignment.user_id == nurse.id,
                PositionAssignment.position_id == pos_icu.id,
            )
        ).scalars())
        assert len(old_assigns) == 1
        assert old_assigns[0].ended_on == day2
        assert old_assigns[0].is_current is False

    def test_work_item_ownership_retained_and_leader_visibility_switches_on_transfer(
        self, factory: Factory, db_session: Session
    ) -> None:
        from app.core.clock import utcnow
        from app.modules.access.authorization import AuthorizationContext
        from app.modules.audit.service import AuditActor, AuditRecorder
        from app.modules.organization.models import Position, PositionAssignment
        from app.modules.organization.service import PositionService
        from app.modules.work_item.models import WorkItem
        from app.modules.work_item.schemas import WorkItemCreate
        from app.modules.work_item.service import WorkItemService

        org = factory.organization(slug="org-work-trans")
        dept_icu = factory.department(org, name="ICU")
        dept_opd = factory.department(org, name="OPD")

        leader_icu = factory.user(org, email="leader_icu@example.com", full_name="ICU Leader")
        leader_opd = factory.user(org, email="leader_opd@example.com", full_name="OPD Leader")
        nurse = factory.user(org, email="nurse_carol@example.com", full_name="Nurse Carol")

        pos_lead_icu = Position(organization_id=org.id, department_id=dept_icu.id, title="ICU Incharge", is_leadership=True)
        pos_lead_opd = Position(organization_id=org.id, department_id=dept_opd.id, title="OPD Incharge", is_leadership=True)
        db_session.add_all([pos_lead_icu, pos_lead_opd])
        db_session.flush()

        pos_nurse_icu = Position(organization_id=org.id, department_id=dept_icu.id, title="ICU Staff", reports_to_position_id=pos_lead_icu.id)
        pos_nurse_opd = Position(organization_id=org.id, department_id=dept_opd.id, title="OPD Staff", reports_to_position_id=pos_lead_opd.id)
        db_session.add_all([pos_nurse_icu, pos_nurse_opd])
        db_session.flush()

        today = utcnow().date()
        db_session.add(PositionAssignment(organization_id=org.id, user_id=leader_icu.id, position_id=pos_lead_icu.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=leader_opd.id, position_id=pos_lead_opd.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=nurse.id, position_id=pos_nurse_icu.id, started_on=today))
        db_session.flush()

        # Nurse creates task while in ICU
        task = WorkItemService.create_work_item(
            session=db_session,
            payload=WorkItemCreate(title="Patient Charting Protocol", priority="high", raci={"R": [str(nurse.id)]}),
            current_user=nurse,
        )

        pos_service = PositionService(db_session, AuditRecorder(db_session))

        # Check visibility before transfer: ICU Leader sees it, OPD Leader does NOT
        icu_subs = pos_service.get_subordinate_user_ids(org.id, leader_icu.id)
        opd_subs = pos_service.get_subordinate_user_ids(org.id, leader_opd.id)

        icu_tasks = WorkItemService.list_work_items(
            session=db_session,
            current_user=leader_icu,
            effective_roles=["LEADER"],
            user_department_ids=[],
            subordinate_user_ids=icu_subs,
        )
        opd_tasks = WorkItemService.list_work_items(
            session=db_session,
            current_user=leader_opd,
            effective_roles=["LEADER"],
            user_department_ids=[],
            subordinate_user_ids=opd_subs,
        )

        assert any(t.id == task.id for t in icu_tasks)
        assert not any(t.id == task.id for t in opd_tasks)

        # Execute Transfer: Carol moves to OPD Staff
        ctx_nurse = AuthorizationContext(
            user_id=nurse.id,
            organization_id=org.id,
            grants=(),
            member_department_ids=frozenset([dept_icu.id]),
        )
        pos_service.transfer_person(
            ctx_nurse,
            user_id=nurse.id,
            new_position_id=pos_nurse_opd.id,
            started_on=today,
            actor=AuditActor.system("test"),
        )

        # Check visibility after transfer:
        # Task owner is STILL Carol (not rewritten)
        refreshed_task = db_session.get(WorkItem, task.id)
        assert refreshed_task.owner_id == nurse.id

        # New subordinate scopes
        icu_subs_after = pos_service.get_subordinate_user_ids(org.id, leader_icu.id)
        opd_subs_after = pos_service.get_subordinate_user_ids(org.id, leader_opd.id)

        icu_tasks_after = WorkItemService.list_work_items(
            session=db_session,
            current_user=leader_icu,
            effective_roles=["LEADER"],
            user_department_ids=[],
            subordinate_user_ids=icu_subs_after,
        )
        opd_tasks_after = WorkItemService.list_work_items(
            session=db_session,
            current_user=leader_opd,
            effective_roles=["LEADER"],
            user_department_ids=[],
            subordinate_user_ids=opd_subs_after,
        )

        # ICU Leader no longer sees Carol's task; OPD Leader sees it dynamically from org hierarchy!
        assert not any(t.id == task.id for t in icu_tasks_after)
        assert any(t.id == task.id for t in opd_tasks_after)

    def test_contextual_escalation_derives_manager_from_org_graph(
        self, factory: Factory, db_session: Session
    ) -> None:
        from app.core.clock import utcnow
        from app.modules.organization.models import Position, PositionAssignment
        from app.modules.work_item.schemas import EscalateRequest, WorkItemCreate
        from app.modules.work_item.service import WorkItemService

        org = factory.organization(slug="org-esc-1")
        dept = factory.department(org, name="Pharmacy")

        mgr = factory.user(org, email="pharm_mgr@example.com", full_name="Pharmacy Manager")
        staff = factory.user(org, email="pharm_staff@example.com", full_name="Staff Pharmacist")

        pos_mgr = Position(organization_id=org.id, department_id=dept.id, title="Chief Pharmacist", is_leadership=True)
        db_session.add(pos_mgr)
        db_session.flush()

        pos_staff = Position(organization_id=org.id, department_id=dept.id, title="Junior Pharmacist", reports_to_position_id=pos_mgr.id)
        db_session.add(pos_staff)
        db_session.flush()


        today = utcnow().date()
        db_session.add(PositionAssignment(organization_id=org.id, user_id=mgr.id, position_id=pos_mgr.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=staff.id, position_id=pos_staff.id, started_on=today))
        db_session.flush()

        task = WorkItemService.create_work_item(
            session=db_session,
            payload=WorkItemCreate(title="Narcotics Inventory Reconcile", priority="urgent"),
            current_user=staff,
        )

        # Escalate without providing escalated_to_id explicitly
        escalation = WorkItemService.escalate_work_item(
            session=db_session,
            work_item_id=task.id,
            payload=EscalateRequest(level="DIRECT_LEADER", reason="Discrepancy in stock count"),
            current_user=staff,
            effective_roles=["STAVYAN"],
            user_department_ids=[dept.id],
        )

        # Dynamic resolution should target mgr.id (Pharmacy Manager)
        assert escalation.escalated_to_id == mgr.id
        assert escalation.escalated_to_name == "Pharmacy Manager"

    def test_organization_tree_api_endpoint(self, client: ApiClient, factory: Factory, db_session: Session) -> None:
        from app.core.clock import utcnow
        from app.modules.access.catalog import ORGANIZATION_READ, ScopeType
        from app.modules.organization.models import Position, PositionAssignment
        from tests.conftest import TEST_PASSWORD

        org = factory.organization(slug="org-tree-api", name="Stavya Spine Center")
        dept = factory.department(org, name="Spine OPD")

        md = factory.user(org, email="md_tree@example.com", password=TEST_PASSWORD, full_name="Dr. Chief")
        role = factory.role(org, permissions=(ORGANIZATION_READ,))
        factory.assign(md, role, scope=ScopeType.ORGANIZATION)

        doc = factory.user(org, email="doc_tree@example.com", full_name="Dr. Spine Specialist")

        pos_chief = Position(organization_id=org.id, department_id=dept.id, title="Medical Director", is_leadership=True)
        db_session.add(pos_chief)
        db_session.flush()

        pos_doc = Position(organization_id=org.id, department_id=dept.id, title="Specialist Surgeon", reports_to_position_id=pos_chief.id)
        db_session.add(pos_doc)
        db_session.flush()


        today = utcnow().date()
        db_session.add(PositionAssignment(organization_id=org.id, user_id=md.id, position_id=pos_chief.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=doc.id, position_id=pos_doc.id, started_on=today))
        db_session.commit()

        client.login_or_fail("md_tree@example.com")
        res = client.get("/api/v1/organizations/tree")
        assert res.status_code == 200
        data = res.json()
        assert data["organization_name"] == "Stavya Spine Center"
        assert len(data["root_nodes"]) == 1
        root = data["root_nodes"][0]
        assert root["title"] == "Medical Director"
        assert root["current_occupant"]["full_name"] == "Dr. Chief"
        assert len(root["subordinates"]) == 1
        sub = root["subordinates"][0]
        assert sub["title"] == "Specialist Surgeon"
        assert sub["current_occupant"]["full_name"] == "Dr. Spine Specialist"




class TestOrganizationIsolation:


    def test_organization_endpoint_returns_only_the_callers_tenant(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """There is no by-id organization route, so this is the whole surface."""
        mine = factory.organization(slug="mine", name="My Organization")
        factory.organization(slug="theirs", name="Their Organization")
        factory.user_with_permissions(mine, (ORGANIZATION_READ,), email="me@example.com")
        client.login_or_fail("me@example.com")

        body = client.get("/api/v1/organizations/current").json()
        assert body["id"] == str(mine.id)
        assert body["name"] == "My Organization"

    def test_departments_of_another_organization_are_invisible(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine2")
        theirs = factory.organization(slug="theirs2")
        my_department = factory.department(mine, name="My Department")
        their_department = factory.department(theirs, name="Their Department")
        factory.user_with_permissions(mine, (DEPARTMENT_READ,), email="me2@example.com")
        client.login_or_fail("me2@example.com")

        listed = client.get("/api/v1/departments").json()
        assert [item["id"] for item in listed["items"]] == [str(my_department.id)]

        # Identifier substitution with a real, existing identifier.
        assert client.get(f"/api/v1/departments/{their_department.id}").status_code == 404

    def test_users_of_another_organization_are_invisible(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine3")
        theirs = factory.organization(slug="theirs3")
        their_user = factory.user(theirs, email="them@example.com")
        me = factory.user_with_permissions(mine, (USER_READ,), email="me3@example.com")
        client.login_or_fail("me3@example.com")

        visible = {item["id"] for item in client.get("/api/v1/users").json()["items"]}
        assert visible == {str(me.id)}
        assert client.get(f"/api/v1/users/{their_user.id}").status_code == 404

    def test_cannot_update_another_organizations_department(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine4")
        theirs = factory.organization(slug="theirs4")
        their_department = factory.department(theirs, name="Untouchable")
        factory.user_with_permissions(
            mine, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="me4@example.com"
        )
        client.login_or_fail("me4@example.com")

        response = client.patch(
            f"/api/v1/departments/{their_department.id}", json={"name": "Hijacked"}, etag='"1"'
        )
        assert response.status_code == 404

        # And it really was not modified.
        factory.session.expire_all()
        stored = factory.session.get(Department, their_department.id)
        assert stored is not None
        assert stored.name == "Untouchable"

    def test_cannot_parent_a_department_into_another_organization(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine5")
        theirs = factory.organization(slug="theirs5")
        their_department = factory.department(theirs)
        factory.user_with_permissions(
            mine, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="me5@example.com"
        )
        client.login_or_fail("me5@example.com")

        response = client.post(
            "/api/v1/departments",
            json={"name": "Sneaky", "parent_department_id": str(their_department.id)},
        )
        assert response.status_code == 422
        assert "parent_department_id" in response.json()["field_errors"]

    def test_cannot_assign_a_role_to_another_organizations_user(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine6")
        theirs = factory.organization(slug="theirs6")
        their_user = factory.user(theirs, email="them6@example.com")
        my_role = factory.role(mine, permissions=(DEPARTMENT_READ,), key="my_role")
        factory.user_with_permissions(
            mine, (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ), email="me6@example.com"
        )
        client.login_or_fail("me6@example.com")

        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(their_user.id),
                "role_id": str(my_role.id),
                "scope_type": "organization",
            },
        )
        assert response.status_code == 422
        assert "user_id" in response.json()["field_errors"]

    def test_cannot_assign_another_organizations_role(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine7")
        theirs = factory.organization(slug="theirs7")
        their_role = factory.role(theirs, permissions=(DEPARTMENT_READ,), key="their_role")
        my_user = factory.user(mine, email="mine7-target@example.com")
        factory.user_with_permissions(
            mine, (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ), email="me7@example.com"
        )
        client.login_or_fail("me7@example.com")

        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(my_user.id),
                "role_id": str(their_role.id),
                "scope_type": "organization",
            },
        )
        assert response.status_code == 422
        assert "role_id" in response.json()["field_errors"]

    def test_cannot_scope_an_assignment_to_another_organizations_department(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine8")
        theirs = factory.organization(slug="theirs8")
        their_department = factory.department(theirs)
        my_user = factory.user(mine, email="mine8-target@example.com")
        my_role = factory.role(mine, permissions=(DEPARTMENT_READ,), key="my_role8")
        factory.user_with_permissions(
            mine, (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ), email="me8@example.com"
        )
        client.login_or_fail("me8@example.com")

        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(my_user.id),
                "role_id": str(my_role.id),
                "scope_type": "department",
                "department_id": str(their_department.id),
            },
        )
        assert response.status_code == 422
        assert "department_id" in response.json()["field_errors"]

    def test_cannot_add_a_membership_in_another_organizations_department(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine9")
        theirs = factory.organization(slug="theirs9")
        their_department = factory.department(theirs)
        my_user = factory.user(mine, email="mine9-target@example.com")
        factory.user_with_permissions(mine, (USER_READ, USER_UPDATE), email="me9@example.com")
        client.login_or_fail("me9@example.com")

        response = client.post(
            f"/api/v1/users/{my_user.id}/department-memberships",
            json={"department_id": str(their_department.id)},
        )
        assert response.status_code == 422

    def test_random_identifiers_are_indistinguishable_from_foreign_ones(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """A 404 for both means substitution reveals nothing about existence."""
        mine = factory.organization(slug="mine10")
        theirs = factory.organization(slug="theirs10")
        their_department = factory.department(theirs)
        factory.user_with_permissions(mine, (DEPARTMENT_READ,), email="me10@example.com")
        client.login_or_fail("me10@example.com")

        foreign = client.get(f"/api/v1/departments/{their_department.id}")
        nonexistent = client.get(f"/api/v1/departments/{uuid.uuid4()}")

        assert foreign.status_code == nonexistent.status_code == 404
        assert foreign.json()["detail"] == nonexistent.json()["detail"]

    def test_created_resources_belong_to_the_callers_organization(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """The body cannot choose a tenant, so creation always lands in-scope."""
        mine = factory.organization(slug="mine11")
        theirs = factory.organization(slug="theirs11")
        factory.user_with_permissions(
            mine, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="me11@example.com"
        )
        client.login_or_fail("me11@example.com")

        # An extra organization_id is rejected outright by the request schema.
        rejected = client.post(
            "/api/v1/departments",
            json={"name": "Injected", "organization_id": str(theirs.id)},
        )
        assert rejected.status_code == 422

        created = client.post("/api/v1/departments", json={"name": "Legitimate"})
        assert created.status_code == 201
        assert created.json()["organization_id"] == str(mine.id)


class TestDatabaseLevelIsolation:
    """The composite foreign keys must hold even if service code is bypassed."""

    def test_department_cannot_be_parented_across_organizations_in_sql(
        self, factory: Factory, db_session: Session
    ) -> None:
        mine = factory.organization(slug="sql1")
        theirs = factory.organization(slug="sql2")
        their_department = factory.department(theirs)
        db_session.commit()

        rogue = Department(
            organization_id=mine.id,
            name="Rogue",
            parent_department_id=their_department.id,
        )
        db_session.add(rogue)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()

    def test_membership_cannot_cross_organizations_in_sql(
        self, factory: Factory, db_session: Session
    ) -> None:
        mine = factory.organization(slug="sql3")
        theirs = factory.organization(slug="sql4")
        my_user = factory.user(mine, email="sql3@example.com")
        their_department = factory.department(theirs)
        db_session.commit()

        rogue = DepartmentMembership(
            organization_id=mine.id,
            user_id=my_user.id,
            department_id=their_department.id,
            started_on=date.today(),
        )
        db_session.add(rogue)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()


class TestUserProvisioningScope:
    def test_provisioned_user_lands_in_the_callers_organization(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="prov1")
        factory.user_with_permissions(
            mine, (USER_READ, USER_CREATE), email="provisioner@example.com"
        )
        client.login_or_fail("provisioner@example.com")

        response = client.post(
            "/api/v1/users",
            json={
                "full_name": "New Colleague",
                "email": "new.colleague@example.com",
                "initial_password": "a-temporary-local-password",
            },
        )
        assert response.status_code == 201
        assert response.json()["organization_id"] == str(mine.id)

    def test_same_email_may_exist_in_two_organizations(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Uniqueness is per organization (DATABASE.md §2)."""
        first = factory.organization(slug="prov2")
        second = factory.organization(slug="prov3")
        factory.user(second, email="shared.address@example.com")
        factory.user_with_permissions(
            first, (USER_READ, USER_CREATE), email="provisioner2@example.com"
        )
        client.login_or_fail("provisioner2@example.com")

        response = client.post(
            "/api/v1/users",
            json={"full_name": "Same Address", "email": "shared.address@example.com"},
        )
        assert response.status_code == 201

    def test_duplicate_email_within_an_organization_is_rejected(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization(slug="prov4")
        factory.user(organization, email="taken@example.com")
        factory.user_with_permissions(
            organization, (USER_READ, USER_CREATE), email="provisioner3@example.com"
        )
        client.login_or_fail("provisioner3@example.com")

        response = client.post(
            "/api/v1/users", json={"full_name": "Duplicate", "email": "TAKEN@example.com"}
        )
        assert response.status_code == 409

    def test_provisioned_account_has_no_authority(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Creating a user must never confer a role."""
        organization = factory.organization(slug="prov5")
        factory.user_with_permissions(
            organization, (USER_READ, USER_CREATE), email="provisioner4@example.com"
        )
        client.login_or_fail("provisioner4@example.com")

        client.post(
            "/api/v1/users",
            json={
                "full_name": "Fresh Account",
                "email": "fresh@example.com",
                "initial_password": "a-temporary-local-password",
            },
        )

        client.raw.cookies.clear()
        client.login_or_fail("fresh@example.com", "a-temporary-local-password")
        body = client.get("/api/v1/auth/me").json()
        assert body["permissions"] == []
        assert body["roles"] == []
        # An administrator-chosen password must be replaced before use.
        assert body["must_change_password"] is True


class TestDepartmentMembershipHistory:
    def test_ending_a_membership_preserves_the_row(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """DOMAIN_MODEL.md §3: transfers must retain history."""
        organization = factory.organization(slug="hist1")
        department = factory.department(organization, name="Radiology")
        target = factory.user(organization, email="transferred@example.com")
        factory.user_with_permissions(
            organization,
            (USER_READ, USER_UPDATE, DEPARTMENT_READ),
            email="hr@example.com",
        )
        client.login_or_fail("hr@example.com")

        created = client.post(
            f"/api/v1/users/{target.id}/department-memberships",
            json={"department_id": str(department.id), "is_primary": True},
        )
        assert created.status_code == 201
        membership_id = created.json()["id"]

        ended = client.post(
            f"/api/v1/users/{target.id}/department-memberships/{membership_id}:end",
            json={"reason": "moved to another department"},
        )
        assert ended.status_code == 200
        assert ended.json()["ended_on"] is not None

        history = client.get(f"/api/v1/users/{target.id}/department-memberships").json()
        assert [item["id"] for item in history] == [membership_id]

        current = client.get(
            f"/api/v1/users/{target.id}/department-memberships?current_only=true"
        ).json()
        assert current == []

    def test_duplicate_active_membership_is_rejected(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization(slug="hist2")
        department = factory.department(organization)
        target = factory.user(organization, email="dupmember@example.com")
        factory.user_with_permissions(
            organization,
            (USER_READ, USER_UPDATE, DEPARTMENT_READ),
            email="hr2@example.com",
        )
        client.login_or_fail("hr2@example.com")

        body = {"department_id": str(department.id)}
        assert (
            client.post(f"/api/v1/users/{target.id}/department-memberships", json=body).status_code
            == 201
        )
        assert (
            client.post(f"/api/v1/users/{target.id}/department-memberships", json=body).status_code
            == 409
        )


class TestDepartmentArchival:
    def test_department_with_active_members_cannot_be_archived(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization(slug="arch1")
        department = factory.department(organization, name="Occupied")
        factory.user(organization, email="occupant@example.com", departments=(department,))
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="archiver@example.com"
        )
        client.login_or_fail("archiver@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        response = client.patch(
            f"/api/v1/departments/{department.id}", json={"is_active": False}, etag=etag
        )
        assert response.status_code == 409
        assert "active memberships" in response.json()["detail"]

    def test_empty_department_can_be_archived(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization(slug="arch2")
        department = factory.department(organization, name="Empty")
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="archiver2@example.com"
        )
        client.login_or_fail("archiver2@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        response = client.patch(
            f"/api/v1/departments/{department.id}", json={"is_active": False}, etag=etag
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False
        assert response.json()["archived_at"] is not None

    def test_archived_department_name_can_be_reused(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization(slug="arch3")
        department = factory.department(organization, name="Recycled")
        factory.user_with_permissions(
            organization,
            (DEPARTMENT_READ, DEPARTMENT_UPDATE, DEPARTMENT_CREATE),
            email="archiver3@example.com",
        )
        client.login_or_fail("archiver3@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        client.patch(f"/api/v1/departments/{department.id}", json={"is_active": False}, etag=etag)

        assert client.post("/api/v1/departments", json={"name": "Recycled"}).status_code == 201

    def test_duplicate_active_department_name_is_rejected(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization(slug="arch4")
        factory.department(organization, name="Radiology")
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="dup@example.com"
        )
        client.login_or_fail("dup@example.com")

        assert client.post("/api/v1/departments", json={"name": "radiology"}).status_code == 409


class TestHierarchyCycles:
    def test_a_cycle_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        """API.md requires cycle prevention; the DB check only blocks self-parenting."""
        organization = factory.organization(slug="cycle1")
        grandparent = factory.department(organization, name="Level 1")
        parent = factory.department(organization, name="Level 2", parent=grandparent)
        child = factory.department(organization, name="Level 3", parent=parent)
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="cycler@example.com"
        )
        client.login_or_fail("cycler@example.com")

        etag = client.get(f"/api/v1/departments/{grandparent.id}").headers["ETag"]
        response = client.patch(
            f"/api/v1/departments/{grandparent.id}",
            json={"parent_department_id": str(child.id)},
            etag=etag,
        )
        assert response.status_code == 422
        assert "parent_department_id" in response.json()["field_errors"]

    def test_self_parenting_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization(slug="cycle2")
        department = factory.department(organization, name="Alone")
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="selfer@example.com"
        )
        client.login_or_fail("selfer@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        response = client.patch(
            f"/api/v1/departments/{department.id}",
            json={"parent_department_id": str(department.id)},
            etag=etag,
        )
        assert response.status_code == 422
