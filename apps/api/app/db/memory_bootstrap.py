"""In-memory SQLite database bootstrap for local testing without PostgreSQL.

Allows running and testing the full FastAPI backend locally even when no local
PostgreSQL server is running.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date
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
from app.core.text import normalize_email
from app.db.base import Base
from app.modules.access.catalog import PERMISSION_CATALOG, ScopeType
from app.modules.access.models import Permission, Role, RoleAssignment, RolePermission
from app.modules.identity.models import CREDENTIAL_KIND_PASSWORD, Credential, User
from app.modules.organization.models import Department, DepartmentMembership, Organization

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

    from datetime import datetime, timezone
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
    # 1. Seed Organization first
    org = Organization(
        id=DEFAULT_ORG_ID,
        name="Stavya Spine Hospital",
        slug="stavya-spine",
        timezone="Asia/Kolkata",
        created_at=utcnow(),
        updated_at=utcnow(),
        version=1,
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
            created_at=utcnow(),
            updated_at=utcnow(),
        )
        session.add(perm)
        permissions_by_key[entry.key] = perm

    # 3. Seed Bootstrap Admin Role
    role = Role(
        id=uuid.uuid4(),
        organization_id=org.id,
        key=BOOTSTRAP_ROLE_KEY,
        name="Local Bootstrap Admin",
        description="Development role holding all permissions for local testing.",
        is_system_template=False,
        is_active=True,
        created_at=utcnow(),
        updated_at=utcnow(),
        version=1,
    )
    session.add(role)

    for perm in permissions_by_key.values():
        role_perm = RolePermission(
            id=uuid.uuid4(),
            role_id=role.id,
            permission_id=perm.id,
            created_at=utcnow(),
        )
        session.add(role_perm)

    # 4. Seed Departments
    depts = [
        Department(id=uuid.uuid4(), organization_id=org.id, name="MD Office", code="MDO", is_active=True, created_at=utcnow(), updated_at=utcnow()),
        Department(id=uuid.uuid4(), organization_id=org.id, name="Clinical Operations", code="CLIN", is_active=True, created_at=utcnow(), updated_at=utcnow()),
        Department(id=uuid.uuid4(), organization_id=org.id, name="Administration", code="ADM", is_active=True, created_at=utcnow(), updated_at=utcnow()),
        Department(id=uuid.uuid4(), organization_id=org.id, name="IT & Systems", code="IT", is_active=True, created_at=utcnow(), updated_at=utcnow()),
    ]
    for d in depts:
        session.add(d)

    # 5. Seed Users & Password Credentials
    hasher = PasswordHasherService(settings)
    password_hash = hasher.hash("password123")

    demo_users_data = [
        ("md@stavya.local", "Het Bhatt (MD)"),
        ("mdoffice@stavya.local", "MD Office Executive"),
        ("admin@stavya.local", "Local Bootstrap Admin"),
        ("depthead@stavya.local", "Department Head"),
        ("manager@stavya.local", "Operations Manager"),
    ]

    for email_raw, name in demo_users_data:
        email_clean = normalize_email(email_raw)
        user = User(
            id=uuid.uuid4(),
            organization_id=org.id,
            email=email_raw,
            normalized_email=email_clean,
            full_name=name,
            is_active=True,
            created_at=utcnow(),
            updated_at=utcnow(),
            version=1,
        )
        session.add(user)

        cred = Credential(
            id=uuid.uuid4(),
            organization_id=org.id,
            user_id=user.id,
            kind=CREDENTIAL_KIND_PASSWORD,
            algorithm=PASSWORD_ALGORITHM,
            password_hash=password_hash,
            password_updated_at=utcnow(),
            must_change_password=False,
            is_active=True,
            created_at=utcnow(),
            updated_at=utcnow(),
        )
        session.add(cred)

        # Assign bootstrap admin role
        assignment = RoleAssignment(
            id=uuid.uuid4(),
            organization_id=org.id,
            user_id=user.id,
            role_id=role.id,
            scope_type="organization",
            department_id=None,
            effective_from=date(2026, 1, 1),
            effective_to=None,
            created_at=utcnow(),
            updated_at=utcnow(),
        )
        session.add(assignment)

        # Department Membership
        membership = DepartmentMembership(
            id=uuid.uuid4(),
            organization_id=org.id,
            user_id=user.id,
            department_id=depts[0].id,
            started_on=date(2026, 1, 1),
            ended_on=None,
            created_at=utcnow(),
            updated_at=utcnow(),
        )
        session.add(membership)
