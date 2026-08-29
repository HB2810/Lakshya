"""In-memory SQLite database bootstrap for local testing without PostgreSQL.

Allows running and testing the full FastAPI backend locally even when no local
PostgreSQL server is running.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy import CheckConstraint, Engine, create_engine, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.modules.access.models
import app.modules.audit.models
import app.modules.calendar.models
import app.modules.identity.models
import app.modules.meeting.models
import app.modules.organization.models
import app.modules.strategy.models
from app.core.clock import utcnow
from app.core.config import Settings
from app.core.security import PASSWORD_ALGORITHM, PasswordHasherService
from app.db.base import Base
from app.modules.access.catalog import PERMISSION_CATALOG, ScopeType
from app.modules.access.models import Permission, Role, RoleAssignment, RolePermission
from app.modules.audit.models import AuditEvent
from app.modules.identity.models import CREDENTIAL_KIND_PASSWORD, Credential, User
from app.modules.organization.models import Department, DepartmentMembership, Organization, Position, PositionAssignment
from app.modules.strategy.models import QuarterlyPriority
from app.modules.strategy.service import DEFAULT_10_MILESTONE_TEMPLATES, StrategyService
from app.modules.strategy.schemas import MilestoneStepSchema
from app.modules.work_item.models import WorkItem, WorkItemActivity, WorkItemEscalation

logger = logging.getLogger("lakshya.memory_db")

BOOTSTRAP_ROLE_KEY = "local_bootstrap_admin"
DEFAULT_ORG_ID = uuid.UUID("00000000-0000-4000-8000-000000000001")


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_: Any, compiler: Any, **kw: Any) -> str:
    return "JSON"


def build_memory_engine_and_bootstrap(settings: Settings) -> Engine:
    """Build an in-memory SQLite database engine seeded with demo bootstrap data."""
    logger.info("Initializing in-memory SQLite database for offline testing...")

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )

    from sqlalchemy import event

    @event.listens_for(engine, "connect")
    def setup_sqlite_functions(dbapi_connection: Any, connection_record: Any) -> None:
        dbapi_connection.create_function("now", 0, lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))
        dbapi_connection.create_function("btrim", 1, lambda s: s.strip() if s is not None else None)

    # Filter out Postgres-specific CHECK constraints for SQLite table creation
    for table in Base.metadata.tables.values():
        table.constraints = {c for c in table.constraints if not isinstance(c, CheckConstraint)}

    Base.metadata.create_all(bind=engine)

    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with session_factory() as session:
        bootstrap_seed_data(session, settings)
        session.commit()

    logger.info("In-memory SQLite database initialized and seeded successfully.")
    return engine


def bootstrap_seed_data(session: Session, settings: Settings) -> None:
    """Seed permissions, roles, demo users and organization into SQLite."""
    now = utcnow()

    # 1. Seed Organization first
    org = Organization(
        id=DEFAULT_ORG_ID,
        name="Stavya Spine Hospital",
        slug="stavya-spine",
        timezone="Asia/Kolkata",
        is_active=True,
    )
    session.add(org)

    # 2. Seed Permissions Catalog
    permissions_by_key: dict[str, Permission] = {}
    for entry in PERMISSION_CATALOG:
        perm = Permission(
            id=uuid.uuid4(),
            key=entry.key,
            resource=entry.resource,
            action=entry.action,
            description=entry.description,
            created_at=now,
            updated_at=now,
        )
        session.add(perm)
        permissions_by_key[entry.key] = perm

    # 3. Seed Departments
    dept_spine = Department(id=uuid.uuid4(), organization_id=org.id, name="Spine Surgery & Clinical", code="SPINE", is_active=True, created_at=now, updated_at=now)
    dept_it = Department(id=uuid.uuid4(), organization_id=org.id, name="IT & Digital Health", code="IT", is_active=True, created_at=now, updated_at=now)
    dept_ops = Department(id=uuid.uuid4(), organization_id=org.id, name="Hospital Operations", code="OPS", is_active=True, created_at=now, updated_at=now)
    dept_mdoffice = Department(id=uuid.uuid4(), organization_id=org.id, name="MD Office Strategic Cell", code="MDOFFICE", is_active=True, created_at=now, updated_at=now)

    depts = [dept_spine, dept_it, dept_ops, dept_mdoffice]
    for d in depts:
        session.add(d)

    # 4. Seed Roles: MASTER, MD, LEADER, EMPLOYEE
    role_master = Role(id=uuid.uuid4(), organization_id=org.id, key="master", name="Master Administrator", is_active=True, created_at=now, updated_at=now)
    role_md = Role(id=uuid.uuid4(), organization_id=org.id, key="md", name="Managing Director", is_active=True, created_at=now, updated_at=now)
    role_leader = Role(id=uuid.uuid4(), organization_id=org.id, key="leader", name="Operational Leader", is_active=True, created_at=now, updated_at=now)
    role_employee = Role(id=uuid.uuid4(), organization_id=org.id, key="employee", name="Stavya Staff / Employee", is_active=True, created_at=now, updated_at=now)

    roles = [role_master, role_md, role_leader, role_employee]
    for r in roles:
        session.add(r)

    for perm in permissions_by_key.values():
        for r in roles:
            role_perm = RolePermission(
                id=uuid.uuid4(),
                role_id=r.id,
                permission_id=perm.id,
                created_at=now,
            )
            session.add(role_perm)

    # 5. Seed Users & Password Credentials
    hasher = PasswordHasherService(settings)
    password_hash = hasher.hash("password123")

    demo_users = [
        ("master@stavya.local", "Master System Admin", role_master, dept_mdoffice),
        ("md@stavya.local", "Dr. Mirant Dave (MD)", role_md, dept_mdoffice),
        ("leader@stavya.local", "Priyesh Shah (IT & Digital Health Lead)", role_leader, dept_it),
        ("employee@stavya.local", "Sister Sunita Rao (Senior Spine Nurse)", role_employee, dept_spine),
    ]

    created_users: dict[str, User] = {}
    for email_raw, name, user_role, user_dept in demo_users:
        user = User(
            id=uuid.uuid4(),
            organization_id=org.id,
            email=email_raw,
            normalized_email=email_raw.strip().lower(),
            full_name=name,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        session.add(user)
        created_users[email_raw] = user

        cred = Credential(
            id=uuid.uuid4(),
            organization_id=org.id,
            user_id=user.id,
            kind=CREDENTIAL_KIND_PASSWORD,
            algorithm=PASSWORD_ALGORITHM,
            password_hash=password_hash,
            is_active=True,
            password_updated_at=now,
            must_change_password=False,
            created_at=now,
            updated_at=now,
        )
        session.add(cred)

        assignment = RoleAssignment(
            id=uuid.uuid4(),
            organization_id=org.id,
            user_id=user.id,
            role_id=user_role.id,
            scope_type="organization" if user_role in (role_master, role_md) else "department",
            department_id=None if user_role in (role_master, role_md) else user_dept.id,
            effective_from=date(2026, 1, 1),
            effective_to=None,
            created_at=now,
            updated_at=now,
        )
        session.add(assignment)

        membership = DepartmentMembership(
            id=uuid.uuid4(),
            organization_id=org.id,
            user_id=user.id,
            department_id=user_dept.id,
            is_primary=True,
            started_on=date(2026, 1, 1),
            ended_on=None,
            created_at=now,
            updated_at=now,
        )
        session.add(membership)

    # 6. Seed Canonical Positions and Hierarchy for Org Chart Tree
    pos_md = Position(
        id=uuid.uuid4(),
        organization_id=org.id,
        department_id=dept_mdoffice.id,
        title="Managing Director & Consultant Spine Surgeon",
        code="MD-EXEC",
        is_leadership=True,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    session.add(pos_md)

    pos_it_lead = Position(
        id=uuid.uuid4(),
        organization_id=org.id,
        department_id=dept_it.id,
        title="Head of IT & Digital Health",
        code="IT-HEAD",
        reports_to_position_id=pos_md.id,
        is_leadership=True,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    session.add(pos_it_lead)

    pos_it_eng = Position(
        id=uuid.uuid4(),
        organization_id=org.id,
        department_id=dept_it.id,
        title="Systems & Medical IoT Engineer",
        code="IT-ENG",
        reports_to_position_id=pos_it_lead.id,
        is_leadership=False,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    session.add(pos_it_eng)

    pos_nurse = Position(
        id=uuid.uuid4(),
        organization_id=org.id,
        department_id=dept_spine.id,
        title="Senior Spine Nurse & OT Incharge",
        code="NRS-SR",
        reports_to_position_id=pos_md.id,
        is_leadership=False,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    session.add(pos_nurse)

    pos_admin = Position(
        id=uuid.uuid4(),
        organization_id=org.id,
        department_id=dept_mdoffice.id,
        title="Master System Administrator",
        code="SYS-ADMIN",
        reports_to_position_id=pos_md.id,
        is_leadership=True,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    session.add(pos_admin)

    # Assign Users to Positions
    pos_assignments = [
        (created_users["md@stavya.local"].id, pos_md.id),
        (created_users["leader@stavya.local"].id, pos_it_lead.id),
        (created_users["employee@stavya.local"].id, pos_nurse.id),
        (created_users["master@stavya.local"].id, pos_admin.id),
    ]

    for u_id, p_id in pos_assignments:
        asg = PositionAssignment(
            id=uuid.uuid4(),
            organization_id=org.id,
            user_id=u_id,
            position_id=p_id,
            started_on=date(2026, 1, 1),
            created_at=now,
            updated_at=now,
        )
        session.add(asg)

    # 7. Seed Canonical WorkItems with RACI, EDC, Dependencies, Escalation
    emp_user = created_users["employee@stavya.local"]
    ldr_user = created_users["leader@stavya.local"]
    md_user = created_users["md@stavya.local"]

    wi1 = WorkItem(
        id=uuid.uuid4(),
        organization_id=org.id,
        title="Spine Surgery OT-2 Barcode Scanner Driver Calibration",
        description="Verify high-speed 2D barcode scanner baud rates and configure COM3 port connection.",
        status="in_progress",
        priority="high",
        owner_id=emp_user.id,
        owner_name=emp_user.full_name,
        created_by=ldr_user.id,
        department_id=dept_it.id,
        department_name="IT & Digital Health",
        due_at=now,
        progress_percent=65,
        raci={
            "responsible_id": str(emp_user.id),
            "responsible_name": emp_user.full_name,
            "accountable_id": str(ldr_user.id),
            "accountable_name": ldr_user.full_name,
            "consulted_ids": [str(md_user.id)],
            "consulted_names": [md_user.full_name],
            "informed_ids": [],
            "informed_names": [],
        },
        edc={
            "expected_outcome": "Seamless scanning with 0% token lag in OT-2.",
            "definition_of_done": "100 consecutive implants scanned without serial buffer error.",
            "evidence_required": "Telemetry diagnostic logs exported to PACS archive.",
            "completion_criteria": ["Driver installed", "COM port mapped", "Speed test passed"],
        },
        created_at=now,
        updated_at=now,
        version=1,
    )
    session.add(wi1)

    wi2 = WorkItem(
        id=uuid.uuid4(),
        organization_id=org.id,
        title="Emergency Patient Smart Token Routing Rule Exception",
        description="Blocked due to missing vendor firmware license key for token LED displays.",
        status="blocked",
        priority="urgent",
        owner_id=ldr_user.id,
        owner_name=ldr_user.full_name,
        created_by=md_user.id,
        department_id=dept_it.id,
        department_name="IT & Digital Health",
        due_at=now,
        progress_percent=30,
        blocked_at=now,
        blocked_reason="Missing vendor firmware activation credentials from OEM provider.",
        blocker_details={
            "reason": "Missing vendor license key",
            "needDescription": "Need OEM unlock key or purchase invoice validation from Biomedical Head.",
            "helpedByPersonOrDept": "Biomedical & Purchase Dept",
            "urgency": "URGENT",
            "reportedAt": now.isoformat(),
        },
        raci={
            "responsible_id": str(ldr_user.id),
            "responsible_name": ldr_user.full_name,
            "accountable_id": str(md_user.id),
            "accountable_name": md_user.full_name,
            "consulted_ids": [],
            "consulted_names": [],
            "informed_ids": [str(emp_user.id)],
            "informed_names": [emp_user.full_name],
        },
        created_at=now,
        updated_at=now,
        version=1,
    )
    session.add(wi2)

    # 8. Seed Strategic Priorities with 10-Milestone Delivery Stepper
    milestones = [MilestoneStepSchema(**m) for m in DEFAULT_10_MILESTONE_TEMPLATES]
    qp1 = QuarterlyPriority(
        id=uuid.uuid4(),
        organization_id=org.id,
        title="Spine Surgery Infection Rate Reduction & Digital OT Protocol",
        expected_outcome=StrategyService._dump_milestones(
            milestones,
            {
                "reporting_authority": "Managing Director",
                "department": "Spine Surgery & Operations",
                "description": "Achieve 0% surgical site infection rate across OT-1 and OT-2 via digital sterile verification.",
                "target_date": "2026-09-30",
            },
        ),
        owner_id=md_user.id,
        proposer_id=md_user.id,
        fy_start_year=2026,
        quarter="Q3",
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )
    session.add(qp1)

    # 9. Seed Sample Audit Events
    evt1 = AuditEvent(
        id=uuid.uuid4(),
        organization_id=org.id,
        occurred_at=now,
        action="work_item.created",
        entity_type="work_item",
        entity_id=wi1.id,
        actor_type="user",
        actor_user_id=ldr_user.id,
        actor_label=None,
        source="api",
        correlation_id="corr-init-001",
        reason="Initial setup of OT-2 barcode scanning assignment",
        after_state={"title": wi1.title, "priority": wi1.priority, "status": wi1.status},
        created_at=now,
    )
    session.add(evt1)

    evt2 = AuditEvent(
        id=uuid.uuid4(),
        organization_id=org.id,
        occurred_at=now,
        action="work_item.escalated",
        entity_type="work_item",
        entity_id=wi2.id,
        actor_type="user",
        actor_user_id=ldr_user.id,
        actor_label=None,
        source="api",
        correlation_id="corr-init-002",
        reason="Missing OEM firmware license activation key",
        before_state={"status": "in_progress"},
        after_state={"status": "blocked", "urgency": "URGENT"},
        created_at=now,
    )
    session.add(evt2)
