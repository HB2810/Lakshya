"""Security, isolation, transfer, and IDOR integration tests for Leader & WorkItems."""

from __future__ import annotations

import uuid
from datetime import date
import pytest
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.modules.access.authorization import AuthorizationContext
from app.modules.access.catalog import (
    ORGANIZATION_READ,
    ScopeType,
)

from app.modules.audit.service import AuditActor, AuditRecorder
from app.modules.organization.models import Position, PositionAssignment
from app.modules.organization.service import PositionService
from app.modules.work_item.models import WorkItem, WorkItemEscalation
from app.modules.work_item.schemas import (
    EscalateRequest,
    EscalationResolveRequest,
    WorkItemCreate,
    WorkItemUpdate,
)
from app.modules.work_item.service import WorkItemService
from tests.conftest import TEST_PASSWORD, ApiClient, Factory

pytestmark = pytest.mark.db


class TestLeaderSecurityAndIsolation:

    def test_leader_a_cannot_access_leader_b_subordinate_task(
        self, factory: Factory, db_session: Session
    ) -> None:
        """Leader A cannot read or mutate Leader B's subordinate tasks (403/IDOR protection)."""
        org = factory.organization(slug="sec-lead-1")
        dept_ortho = factory.department(org, name="Orthopedics")
        dept_neuro = factory.department(org, name="Neurology")

        leader_a = factory.user(org, email="lead_a@example.com", full_name="Dr. Ortho Lead")
        sub_a = factory.user(org, email="sub_a@example.com", full_name="Ortho Resident")

        leader_b = factory.user(org, email="lead_b@example.com", full_name="Dr. Neuro Lead")
        sub_b = factory.user(org, email="sub_b@example.com", full_name="Neuro Resident")

        pos_a = Position(organization_id=org.id, department_id=dept_ortho.id, title="Ortho Chief", is_leadership=True)
        pos_b = Position(organization_id=org.id, department_id=dept_neuro.id, title="Neuro Chief", is_leadership=True)
        db_session.add_all([pos_a, pos_b])
        db_session.flush()

        pos_sub_a = Position(organization_id=org.id, department_id=dept_ortho.id, title="Ortho Junior", reports_to_position_id=pos_a.id)
        pos_sub_b = Position(organization_id=org.id, department_id=dept_neuro.id, title="Neuro Junior", reports_to_position_id=pos_b.id)
        db_session.add_all([pos_sub_a, pos_sub_b])
        db_session.flush()

        today = utcnow().date()
        db_session.add(PositionAssignment(organization_id=org.id, user_id=leader_a.id, position_id=pos_a.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=sub_a.id, position_id=pos_sub_a.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=leader_b.id, position_id=pos_b.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=sub_b.id, position_id=pos_sub_b.id, started_on=today))
        db_session.flush()

        # Neuro Junior creates task
        task_b = WorkItemService.create_work_item(
            session=db_session,
            payload=WorkItemCreate(title="Brain MRI Protocol", priority="high", raci={"R": [str(sub_b.id)]}),
            current_user=sub_b,
        )

        pos_service = PositionService(db_session, AuditRecorder(db_session))
        leader_a_subs = pos_service.get_subordinate_user_ids(org.id, leader_a.id)
        leader_b_subs = pos_service.get_subordinate_user_ids(org.id, leader_b.id)

        # Leader B can view task_b
        item = WorkItemService.get_work_item(
            session=db_session,
            work_item_id=task_b.id,
            current_user=leader_b,
            effective_roles=["LEADER"],
            user_department_ids=[dept_neuro.id],
            subordinate_user_ids=leader_b_subs,
        )
        assert item.id == task_b.id

        # Leader A attempting to get task_b must raise 403
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            WorkItemService.get_work_item(
                session=db_session,
                work_item_id=task_b.id,
                current_user=leader_a,
                effective_roles=["LEADER"],
                user_department_ids=[dept_ortho.id],
                subordinate_user_ids=leader_a_subs,
            )
        assert exc.value.status_code == 403

    def test_leader_inbox_and_escalation_resolution(
        self, factory: Factory, db_session: Session
    ) -> None:
        """Subordinate escalates task -> appears in Leader inbox -> Leader resolves and unblocks."""
        org = factory.organization(slug="sec-esc-inbox")
        dept = factory.department(org, name="Anesthesia")

        leader = factory.user(org, email="anes_lead@example.com", full_name="Chief Anesthesiologist")
        staff = factory.user(org, email="anes_staff@example.com", full_name="Resident Doctor")

        pos_lead = Position(organization_id=org.id, department_id=dept.id, title="Chief Anesthetist", is_leadership=True)
        db_session.add(pos_lead)
        db_session.flush()

        pos_staff = Position(organization_id=org.id, department_id=dept.id, title="Junior Resident", reports_to_position_id=pos_lead.id)
        db_session.add(pos_staff)
        db_session.flush()

        today = utcnow().date()
        db_session.add(PositionAssignment(organization_id=org.id, user_id=leader.id, position_id=pos_lead.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=staff.id, position_id=pos_staff.id, started_on=today))
        db_session.flush()

        task = WorkItemService.create_work_item(
            session=db_session,
            payload=WorkItemCreate(title="Ventilator Gas Shortage", priority="urgent"),
            current_user=staff,
        )

        # Escalate
        esc = WorkItemService.escalate_work_item(
            session=db_session,
            work_item_id=task.id,
            payload=EscalateRequest(level="DIRECT_LEADER", reason="Cylinder valve defective"),
            current_user=staff,
            effective_roles=["STAVYAN"],
            user_department_ids=[dept.id],
        )
        assert esc.escalated_to_id == leader.id

        # Leader checks inbox
        inbox = WorkItemService.list_inbox_escalations(session=db_session, current_user=leader)
        assert len(inbox) == 1
        assert inbox[0].id == esc.id

        # Leader resolves escalation
        resolved = WorkItemService.resolve_escalation(
            session=db_session,
            escalation_id=esc.id,
            resolution_note="Backup gas cylinder manifold activated.",
            current_user=leader,
        )
        assert resolved.status == "RESOLVED"

        # Task is now in_progress and unblocked
        refreshed = db_session.get(WorkItem, task.id)
        assert refreshed.status == "in_progress"
        assert refreshed.blocked_reason is None

    def test_completion_verification_gate(
        self, factory: Factory, db_session: Session
    ) -> None:
        """Formal work item verified by Leader transitions to completed with verification audit."""
        org = factory.organization(slug="sec-verify-1")
        dept = factory.department(org, name="Quality Assurance")

        auditor = factory.user(org, email="lead_qa@example.com", full_name="QA Lead")
        nurse = factory.user(org, email="nurse_qa@example.com", full_name="Nurse Inspector")

        pos_lead = Position(organization_id=org.id, department_id=dept.id, title="QA Manager", is_leadership=True)
        db_session.add(pos_lead)
        db_session.flush()

        pos_nurse = Position(organization_id=org.id, department_id=dept.id, title="Auditor", reports_to_position_id=pos_lead.id)
        db_session.add(pos_nurse)
        db_session.flush()

        today = utcnow().date()
        db_session.add(PositionAssignment(organization_id=org.id, user_id=auditor.id, position_id=pos_lead.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=nurse.id, position_id=pos_nurse.id, started_on=today))
        db_session.flush()

        task = WorkItemService.create_work_item(
            session=db_session,
            payload=WorkItemCreate(
                title="NABH Compliance Fire Drill",
                priority="high",
                edc={"definition_of_done": "Report signed by safety officer"},
            ),
            current_user=nurse,
        )

        pos_service = PositionService(db_session, AuditRecorder(db_session))
        subs = pos_service.get_subordinate_user_ids(org.id, auditor.id)

        # Leader verifies task
        verified = WorkItemService.verify_work_item(
            session=db_session,
            work_item_id=task.id,
            current_user=auditor,
            effective_roles=["LEADER"],
            user_department_ids=[dept.id],
            subordinate_user_ids=subs,
            verification_note="Reviewed drill logs. All clear.",
        )
        assert verified.status == "completed"
        assert verified.progress_percent == 100

    def test_scoped_org_tree_endpoint(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """Scoped org chart endpoint returns strictly the caller's position subtree."""
        org = factory.organization(slug="sec-scoped-tree", name="Stavya Spine Center")
        dept_spine = factory.department(org, name="Spine Surgery")
        dept_pharm = factory.department(org, name="Pharmacy")

        leader = factory.user(org, email="spine_head@example.com", password=TEST_PASSWORD, full_name="Dr. Spine Head")
        role = factory.role(org, permissions=(ORGANIZATION_READ,))
        factory.assign(leader, role, scope=ScopeType.ORGANIZATION)

        resident = factory.user(org, email="spine_res@example.com", full_name="Dr. Resident")
        pharm_lead = factory.user(org, email="pharm_head@example.com", full_name="Chief Pharmacist")

        pos_spine_head = Position(organization_id=org.id, department_id=dept_spine.id, title="Spine HOD", is_leadership=True)
        pos_pharm_head = Position(organization_id=org.id, department_id=dept_pharm.id, title="Pharmacy HOD", is_leadership=True)
        db_session.add_all([pos_spine_head, pos_pharm_head])
        db_session.flush()

        pos_resident = Position(organization_id=org.id, department_id=dept_spine.id, title="Spine Fellow", reports_to_position_id=pos_spine_head.id)
        db_session.add(pos_resident)
        db_session.flush()

        today = utcnow().date()
        db_session.add(PositionAssignment(organization_id=org.id, user_id=leader.id, position_id=pos_spine_head.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=resident.id, position_id=pos_resident.id, started_on=today))
        db_session.add(PositionAssignment(organization_id=org.id, user_id=pharm_lead.id, position_id=pos_pharm_head.id, started_on=today))
        db_session.commit()

        client.login_or_fail("spine_head@example.com")
        res = client.get("/api/v1/organizations/tree/scoped")
        assert res.status_code == 200
        data = res.json()
        assert len(data["root_nodes"]) == 1
        root = data["root_nodes"][0]
        assert root["title"] == "Spine HOD"
        assert len(root["subordinates"]) == 1
        assert root["subordinates"][0]["title"] == "Spine Fellow"
