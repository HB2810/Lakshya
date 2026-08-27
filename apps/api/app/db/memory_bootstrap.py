"""In-memory SQLite database bootstrap for local testing without PostgreSQL.

Allows running and testing the full FastAPI backend locally even when no local
PostgreSQL server is running.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date
from typing import Any

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

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


def build_memory_engine_and_bootstrap(settings: Settings) -> Engine:
    """Build an in-memory SQLite database engine seeded with demo bootstrap data."""
    logger.info("Initializing in-memory SQLite database for offline testing...")
    
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )

    Base.metadata.create_all(bind=engine)
    
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with session_factory() as session:
        bootstrap_seed_data(session, settings)
        session.commit()

    logger.info("In-memory SQLite database initialized and seeded successfully.")
    return engine


def bootstrap_seed_data(session: Session, settings: Settings) -> None:
    """Seed permissions, roles, demo users and organization into SQLite."""
    # 1. Seed Permissions Catalog
    permissions_by_key: dict[str, Permission] = {}
    for entry in PERMISSION_CATALOG:
        perm = Permission(
            id=uuid.uuid4(),
            key=entry.key,
            description=entry.description,
            created_at=utcnow(),
        )
        session.add(perm)
        permissions_by_key[entry.key] = perm

    # 2. Seed Bootstrap Admin Role
    role = Role(
        id=uuid.uuid4(),
        key=BOOTSTRAP_ROLE_KEY,
        name="Local Bootstrap Admin",
        description="Development role holding all permissions for local testing.",
        created_at=utcnow(),
    )
    session.add(role)

    for perm in permissions_by_key.values():
        role_perm = RolePermission(
            id=uuid.uuid4(),
            role_id=role.id,
            permission_id=perm.id,
            granted_at=utcnow(),
        )
        session.add(role_perm)

    # 3. Seed Organization
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

    # 4. Seed Departments
    depts = [
        Department(id=uuid.uuid4(), organization_id=org.id, name="MD Office", slug="md-office", created_at=utcnow(), updated_at=utcnow(), version=1),
        Department(id=uuid.uuid4(), organization_id=org.id, name="Clinical Operations", slug="clinical-ops", created_at=utcnow(), updated_at=utcnow(), version=1),
        Department(id=uuid.uuid4(), organization_id=org.id, name="Administration", slug="admin", created_at=utcnow(), updated_at=utcnow(), version=1),
        Department(id=uuid.uuid4(), organization_id=org.id, name="IT & Systems", slug="it-systems", created_at=utcnow(), updated_at=utcnow(), version=1),
    ]
    for d in depts:
        session.add(d)

    # 5. Seed Users & Password Credentials
    hasher = PasswordHasherService(settings)
    password_hash = hasher.hash_password("password123")

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
            email=email_clean,
            full_name=name,
            is_active=True,
            created_at=utcnow(),
            updated_at=utcnow(),
            version=1,
        )
        session.add(user)

        cred = Credential(
            id=uuid.uuid4(),
            user_id=user.id,
            kind=CREDENTIAL_KIND_PASSWORD,
            algorithm=PASSWORD_ALGORITHM,
            secret_hash=password_hash,
            must_change_password=False,
            created_at=utcnow(),
            updated_at=utcnow(),
        )
        session.add(cred)

        # Assign bootstrap admin role
        assignment = RoleAssignment(
            id=uuid.uuid4(),
            user_id=user.id,
            role_id=role.id,
            scope_type=ScopeType.ORGANIZATION,
            scope_department_id=None,
            assigned_at=utcnow(),
        )
        session.add(assignment)

        # Department Membership
        membership = DepartmentMembership(
            id=uuid.uuid4(),
            user_id=user.id,
            department_id=depts[0].id,
            effective_from=date(2026, 1, 1),
            effective_to=None,
            created_at=utcnow(),
        )
        session.add(membership)
