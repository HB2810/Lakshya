"""Seed all 4 persona users and standard demo data into the PostgreSQL database."""

import uuid
from datetime import date, datetime, timezone
from sqlalchemy import select
from app.core.config import get_settings
from app.core.security import PASSWORD_ALGORITHM, PasswordHasherService
from app.db.session import build_engine, build_session_factory
from app.modules.identity.models import CREDENTIAL_KIND_PASSWORD, Credential, User
from app.modules.access.models import Role, RoleAssignment, Permission, RolePermission
from app.modules.access.catalog import PERMISSION_CATALOG
from app.modules.organization.models import Organization, Department, DepartmentMembership
from app.modules.work_item.models import WorkItem
from app.modules.strategy.models import QuarterlyPriority
from app.modules.strategy.service import DEFAULT_10_MILESTONE_TEMPLATES, StrategyService
from app.modules.strategy.schemas import MilestoneStepSchema

def seed_database() -> None:
    settings = get_settings()
    engine = build_engine(settings)
    SessionFactory = build_session_factory(engine)
    now = datetime.now(timezone.utc)
    hasher = PasswordHasherService(settings)
    password_hash = hasher.hash("password123")

    with SessionFactory() as session:
        # 1. Organization
        org = session.scalar(select(Organization).where(Organization.slug == "stavya-spine"))
        if not org:
            org = session.scalar(select(Organization).limit(1))
        if not org:
            org = Organization(
                id=uuid.uuid4(),
                name="Stavya Spine Hospital",
                slug="stavya-spine",
                timezone="Asia/Kolkata",
                is_active=True,
            )
            session.add(org)
            session.flush()

        # 2. Departments
        dept_spine = session.scalar(select(Department).where(Department.organization_id == org.id, Department.code == "SPINE"))
        if not dept_spine:
            dept_spine = Department(id=uuid.uuid4(), organization_id=org.id, name="Spine Surgery & Clinical", code="SPINE", is_active=True)
            session.add(dept_spine)
        
        dept_it = session.scalar(select(Department).where(Department.organization_id == org.id, Department.code == "IT"))
        if not dept_it:
            dept_it = Department(id=uuid.uuid4(), organization_id=org.id, name="IT & Digital Health", code="IT", is_active=True)
            session.add(dept_it)

        dept_ops = session.scalar(select(Department).where(Department.organization_id == org.id, Department.code == "OPS"))
        if not dept_ops:
            dept_ops = Department(id=uuid.uuid4(), organization_id=org.id, name="Hospital Operations", code="OPS", is_active=True)
            session.add(dept_ops)

        dept_mdoffice = session.scalar(select(Department).where(Department.organization_id == org.id, Department.code == "MDOFFICE"))
        if not dept_mdoffice:
            dept_mdoffice = Department(id=uuid.uuid4(), organization_id=org.id, name="MD Office Strategic Cell", code="MDOFFICE", is_active=True)
            session.add(dept_mdoffice)

        session.flush()

        # 3. Roles and Permissions
        permissions_in_db = {p.key: p for p in session.scalars(select(Permission)).all()}
        for pdef in PERMISSION_CATALOG:
            if pdef.key not in permissions_in_db:
                perm = Permission(key=pdef.key, resource=pdef.resource, action=pdef.action, description=pdef.description)
                session.add(perm)
                permissions_in_db[pdef.key] = perm
        session.flush()

        roles_config = [
            ("master", "Master Administrator"),
            ("md", "Managing Director"),
            ("leader", "Operational Leader"),
            ("employee", "Stavya Staff / Employee"),
            ("local_bootstrap_admin", "Local Bootstrap Admin"),
        ]
        roles_map: dict[str, Role] = {}
        for rkey, rname in roles_config:
            r = session.scalar(select(Role).where(Role.organization_id == org.id, Role.key == rkey))
            if not r:
                r = Role(id=uuid.uuid4(), organization_id=org.id, key=rkey, name=rname, is_active=True)
                session.add(r)
                session.flush()
            roles_map[rkey] = r

        # Grant permissions to roles
        all_perms = list(permissions_in_db.values())
        for perm in all_perms:
            for rkey in ("master", "md", "local_bootstrap_admin"):
                role_obj = roles_map[rkey]
                existing_rp = session.scalar(
                    select(RolePermission).where(RolePermission.role_id == role_obj.id, RolePermission.permission_id == perm.id)
                )
                if not existing_rp:
                    session.add(RolePermission(role_id=role_obj.id, permission_id=perm.id))
        session.flush()

        # 4. Users to seed
        demo_users_data = [
            ("md@stavya.local", "Dr. Rohan Sharma (MD)", "md", dept_mdoffice),
            ("leader@stavya.local", "Priyesh Shah (IT & Digital Health Lead)", "leader", dept_it),
            ("employee@stavya.local", "Sister Sunita Rao (Senior Spine Nurse)", "employee", dept_spine),
            ("master@stavya.local", "Master System Admin", "master", dept_mdoffice),
            ("md@stavyaspine.com", "Managing Director", "md", dept_mdoffice),
        ]

        created_users: dict[str, User] = {}
        for email, full_name, role_key, dept in demo_users_data:
            user = session.scalar(select(User).where(User.organization_id == org.id, User.normalized_email == email.lower()))
            if not user:
                user = User(
                    id=uuid.uuid4(),
                    organization_id=org.id,
                    email=email,
                    normalized_email=email.lower(),
                    full_name=full_name,
                    is_active=True,
                )
                session.add(user)
                session.flush()

            # Set password credential
            cred = session.scalar(select(Credential).where(Credential.user_id == user.id, Credential.kind == CREDENTIAL_KIND_PASSWORD))
            if not cred:
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
                )
                session.add(cred)
            else:
                cred.password_hash = password_hash
                cred.is_active = True

            # Assign Role
            role_to_assign = roles_map[role_key]
            assignment = session.scalar(select(RoleAssignment).where(RoleAssignment.user_id == user.id, RoleAssignment.role_id == role_to_assign.id))
            if not assignment:
                assignment = RoleAssignment(
                    id=uuid.uuid4(),
                    organization_id=org.id,
                    user_id=user.id,
                    role_id=role_to_assign.id,
                    scope_type="organization" if role_key in ("master", "md") else "department",
                    department_id=None if role_key in ("master", "md") else dept.id,
                    effective_from=date(2026, 1, 1),
                )
                session.add(assignment)

            # Also assign local_bootstrap_admin to MD / Master
            if role_key in ("master", "md"):
                boot_role = roles_map["local_bootstrap_admin"]
                b_assign = session.scalar(select(RoleAssignment).where(RoleAssignment.user_id == user.id, RoleAssignment.role_id == boot_role.id))
                if not b_assign:
                    session.add(RoleAssignment(
                        id=uuid.uuid4(),
                        organization_id=org.id,
                        user_id=user.id,
                        role_id=boot_role.id,
                        scope_type="organization",
                        effective_from=date(2026, 1, 1),
                    ))

            # Department Membership
            dm = session.scalar(select(DepartmentMembership).where(DepartmentMembership.user_id == user.id, DepartmentMembership.department_id == dept.id))
            if not dm:
                session.add(DepartmentMembership(
                    id=uuid.uuid4(),
                    organization_id=org.id,
                    user_id=user.id,
                    department_id=dept.id,
                    is_primary=True,
                    started_on=date(2026, 1, 1),
                ))
            created_users[email] = user

        session.flush()

        # 5. Strategic Priority Demo Data
        qp = session.scalar(select(QuarterlyPriority).where(QuarterlyPriority.organization_id == org.id).limit(1))
        if not qp:
            milestones = [MilestoneStepSchema(**m) for m in DEFAULT_10_MILESTONE_TEMPLATES]
            qp = QuarterlyPriority(
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
                owner_id=created_users["md@stavya.local"].id,
                proposer_id=created_users["md@stavya.local"].id,
                fy_start_year=2026,
                quarter="Q3",
                status="ACTIVE",
            )
            session.add(qp)

        session.commit()
        print("Successfully seeded demo users into PostgreSQL database:")
        for email in created_users:
            print(f" - {email} (Password: password123 / 1234)")

if __name__ == "__main__":
    seed_database()
