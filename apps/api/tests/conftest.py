"""Shared test fixtures.

Database-backed tests run against **real PostgreSQL**, never SQLite
(ARCHITECTURE.md §15: "Database tests against real PostgreSQL, not SQLite"). The
domain depends on partial unique indexes, composite foreign keys, JSONB, ``~``
regex checks and row-level triggers, none of which SQLite can express — a SQLite
suite would pass while the production schema behaved differently.

Set ``LAKSHYA_TEST_DATABASE_URL`` to a throwaway database. Without it, tests
marked ``db`` are skipped and only the pure-logic tests run.

The schema is created by running the real Alembic migrations, so every
integration test also exercises the migration path.
"""

from __future__ import annotations

import os
import uuid
from collections.abc import Iterator
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Engine, select, text
from sqlalchemy.orm import Session, sessionmaker

from alembic import command
from alembic.config import Config
from app.core.config import Environment, Settings, read_env_file_value
from app.core.security import PASSWORD_ALGORITHM, PasswordHasherService
from app.core.text import normalize_email
from app.db.session import build_engine, build_session_factory
from app.main import create_app
from app.modules.access.catalog import ScopeType
from app.modules.access.models import Permission, Role, RoleAssignment, RolePermission
from app.modules.identity.models import CREDENTIAL_KIND_PASSWORD, Credential, User
from app.modules.identity.telemetry import (
    build_security_telemetry_writer,
)
from app.modules.organization.models import Department, DepartmentMembership, Organization

API_DIR = Path(__file__).resolve().parents[1]

TEST_ORIGIN = "http://localhost:3000"
TEST_PASSWORD = "correct-horse-battery-staple"

#: Tables emptied between tests. ``permissions`` and the system role templates are
#: reference data created by migration 0003 and are deliberately preserved.
_TRUNCATE_TABLES = (
    "audit_events",
    "sessions",
    "credentials",
    "position_assignments",
    "positions",
    "department_memberships",
    "role_assignments",
    "role_permissions",
    "departments",
    "users",
    "calendar_events",
    "calendar_sync_outbox",
    "user_calendar_integrations",
    "meeting_headlines",
    "meeting_checkins",
    "meeting_agendas",
    "meeting_participants",
    "meetings",
    "o_and_o_items",
    "kpi_values",
    "kpi_definitions",
    "weekly_milestones",
    "monthly_priorities",
    "quarterly_priorities",
    "annual_goals",
)



def resolve_test_database_url() -> str | None:
    """Find the test database URL.

    The process environment wins, so CI and one-off overrides keep working. When
    it is absent the repository ``.env`` files are consulted, because ``pytest``
    runs from ``apps/api`` while ``.env`` lives at the repository root — without
    this, a developer with a correctly configured ``.env`` would see every
    database-backed test skip silently and mistake that for a passing run.
    """
    return os.environ.get("LAKSHYA_TEST_DATABASE_URL") or read_env_file_value(
        "LAKSHYA_TEST_DATABASE_URL"
    )


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    """Skip ``db`` tests when no test database is configured."""
    if resolve_test_database_url():
        return
    skip = pytest.mark.skip(
        reason="No test database configured (LAKSHYA_TEST_DATABASE_URL); "
        "PostgreSQL-backed tests skipped."
    )
    for item in items:
        if "db" in item.keywords:
            item.add_marker(skip)


# ---------------------------------------------------------------------------
# Settings and engine
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def test_database_url() -> str:
    url = resolve_test_database_url()
    if not url:
        pytest.skip("No test database configured (LAKSHYA_TEST_DATABASE_URL).")
    return url


@pytest.fixture(scope="session")
def settings(test_database_url: str) -> Settings:
    """Test settings built explicitly, ignoring any developer ``.env``.

    Argon2 cost parameters are lowered to the library minimum: the suite verifies
    *that* hashing and upgrade-on-login work, not how slow they are, and
    production parameters would add seconds to every login test.
    """
    return Settings(
        _env_file=None,
        environment=Environment.LOCAL,
        debug=False,
        log_level="warning",
        database_url=test_database_url,
        session_cookie_secure=False,
        cors_allowed_origins=(TEST_ORIGIN,),
        trusted_origins=(TEST_ORIGIN,),
        argon2_time_cost=1,
        argon2_memory_cost_kib=8192,
        argon2_parallelism=1,
        password_min_length=12,
        session_absolute_lifetime_minutes=60,
        session_idle_timeout_minutes=30,
        login_rate_limit_attempts=1000,
        login_rate_limit_window_seconds=60,
        allow_local_bootstrap=False,
    )


@pytest.fixture(scope="session")
def engine(settings: Settings) -> Iterator[Engine]:
    """Migrate the test database once per session, then hand out an engine."""
    engine = build_engine(settings)

    alembic_config = Config(str(API_DIR / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(API_DIR / "alembic"))
    # Passed via ``attributes`` (a plain dict), not ``set_main_option``: the
    # latter writes through configparser, which treats ``%`` in a percent-encoded
    # password as interpolation syntax and raises before connecting.
    alembic_config.attributes["sqlalchemy_url"] = settings.database_url

    # Start from a known-empty schema so a leftover database cannot mask a broken
    # migration.
    with engine.begin() as connection:
        connection.execute(text("DROP SCHEMA public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))

    command.upgrade(alembic_config, "head")

    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture(scope="session")
def session_factory(engine: Engine) -> sessionmaker[Session]:
    return build_session_factory(engine)


@pytest.fixture(autouse=True)
def clean_database(request: pytest.FixtureRequest) -> Iterator[None]:
    """Empty the tenant tables around each database-backed test."""
    if "db" not in request.keywords:
        yield
        return

    engine: Engine = request.getfixturevalue("engine")
    _truncate(engine)
    yield
    _truncate(engine)


def _truncate(engine: Engine) -> None:
    with engine.begin() as connection:
        connection.execute(text(f"TRUNCATE {', '.join(_TRUNCATE_TABLES)} CASCADE"))
        # Keep the seeded system templates; drop organization-specific roles.
        connection.execute(text("DELETE FROM roles WHERE organization_id IS NOT NULL"))
        connection.execute(text("DELETE FROM organizations"))


@pytest.fixture()
def db_session(session_factory: sessionmaker[Session]) -> Iterator[Session]:
    """A session for direct arrangement and assertion in tests."""
    session = session_factory()
    try:
        yield session
        session.commit()
    finally:
        session.close()


@pytest.fixture()
def hasher(settings: Settings) -> PasswordHasherService:
    return PasswordHasherService(settings)


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------


@pytest.fixture()
def client(settings: Settings, engine: Engine) -> Iterator[ApiClient]:
    """A ``TestClient`` wired to the test engine, wrapped for CSRF handling."""
    app = create_app(settings)
    with TestClient(app, base_url="http://localhost:8000") as raw:
        # The lifespan built its own engine from the same URL; replace it so the
        # suite has a single pool and truncation is immediately visible.
        app.state.engine.dispose()
        app.state.engine = engine
        session_factory = build_session_factory(engine)
        app.state.session_factory = session_factory
        # The ADR-007 writer captured the lifespan's factory, which is bound to
        # the engine just disposed. Rebind it, so the security transaction really
        # does share the one pool the test asserts against.
        app.state.security_telemetry_writer = build_security_telemetry_writer(session_factory)
        yield ApiClient(raw, app, settings)


class ApiClient:
    """Test client that supplies the CSRF header and ``Origin`` automatically.

    Every state-changing request needs a trusted ``Origin`` plus an
    ``X-CSRF-Token`` matching the CSRF cookie. Doing that by hand in every test
    would obscure what each test is actually asserting — and the tests that check
    CSRF *enforcement* deliberately use :attr:`raw` to bypass this helper.
    """

    def __init__(self, raw: TestClient, app: FastAPI, settings: Settings) -> None:
        self.raw = raw
        #: The application instance, so a test can reach ``app.state`` with a
        #: precise type (``TestClient.app`` is typed only as an ASGI callable).
        self.app = app
        self.settings = settings

    # -- Authentication ---------------------------------------------------

    def login(
        self,
        email: str,
        password: str = TEST_PASSWORD,
        organization_slug: str | None = None,
    ) -> Any:
        body: dict[str, Any] = {"email": email, "password": password}
        if organization_slug is not None:
            body["organization_slug"] = organization_slug
        return self.raw.post("/api/v1/auth/login", json=body, headers={"Origin": TEST_ORIGIN})

    def login_or_fail(self, email: str, password: str = TEST_PASSWORD) -> Any:
        response = self.login(email, password)
        assert response.status_code == 200, response.text
        return response

    @property
    def csrf_token(self) -> str | None:
        return self.raw.cookies.get(self.settings.csrf_cookie_name)

    @property
    def session_cookie(self) -> str | None:
        return self.raw.cookies.get(self.settings.session_cookie_name)

    def _unsafe_headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        headers = {"Origin": TEST_ORIGIN}
        token = self.csrf_token
        if token:
            headers[self.settings.csrf_header_name] = token
        if extra:
            headers.update(extra)
        return headers

    # -- Verbs ------------------------------------------------------------

    def get(self, url: str, **kwargs: Any) -> Any:
        return self.raw.get(url, **kwargs)

    def post(self, url: str, *, headers: dict[str, str] | None = None, **kwargs: Any) -> Any:
        return self.raw.post(url, headers=self._unsafe_headers(headers), **kwargs)

    def patch(
        self,
        url: str,
        *,
        etag: str | None = None,
        headers: dict[str, str] | None = None,
        **kwargs: Any,
    ) -> Any:
        extra = dict(headers or {})
        if etag is not None:
            extra["If-Match"] = etag
        return self.raw.patch(url, headers=self._unsafe_headers(extra), **kwargs)

    def delete(self, url: str, *, headers: dict[str, str] | None = None, **kwargs: Any) -> Any:
        return self.raw.request("DELETE", url, headers=self._unsafe_headers(headers), **kwargs)


# ---------------------------------------------------------------------------
# Domain factories
# ---------------------------------------------------------------------------


class Factory:
    """Arrange domain rows directly, bypassing authorization.

    Tests need a starting state that the API itself cannot create yet (there is no
    approved grant on a fresh database). Writing that state through the models is
    honest about it; going through the API with a hidden bypass would not be.
    """

    def __init__(self, session: Session, hasher: PasswordHasherService) -> None:
        self.session = session
        self.hasher = hasher

    def organization(
        self, *, slug: str | None = None, name: str | None = None, is_active: bool = True
    ) -> Organization:
        suffix = uuid.uuid4().hex[:8]
        organization = Organization(
            name=name or f"Organization {suffix}",
            slug=slug or f"org-{suffix}",
            timezone="Asia/Kolkata",
            is_active=is_active,
        )
        self.session.add(organization)
        self.session.flush()
        return organization

    def department(
        self,
        organization: Organization,
        *,
        name: str | None = None,
        code: str | None = None,
        parent: Department | None = None,
        is_active: bool = True,
    ) -> Department:
        suffix = uuid.uuid4().hex[:8]
        department = Department(
            organization_id=organization.id,
            name=name or f"Department {suffix}",
            code=code,
            parent_department_id=parent.id if parent else None,
            is_active=is_active,
        )
        self.session.add(department)
        self.session.flush()
        return department

    def user(
        self,
        organization: Organization,
        *,
        email: str | None = None,
        full_name: str = "Test User",
        password: str | None = TEST_PASSWORD,
        is_active: bool = True,
        must_change_password: bool = False,
        departments: tuple[Department, ...] = (),
    ) -> User:
        from app.core.clock import utcnow

        address = email or f"user-{uuid.uuid4().hex[:10]}@example.com"
        user = User(
            organization_id=organization.id,
            full_name=full_name,
            email=address,
            normalized_email=normalize_email(address),
            is_active=is_active,
            disabled_at=None if is_active else utcnow(),
        )
        self.session.add(user)
        self.session.flush()

        if password is not None:
            self.session.add(
                Credential(
                    organization_id=organization.id,
                    user_id=user.id,
                    kind=CREDENTIAL_KIND_PASSWORD,
                    password_hash=self.hasher.hash(password),
                    algorithm=PASSWORD_ALGORITHM,
                    password_updated_at=utcnow(),
                    must_change_password=must_change_password,
                )
            )

        for index, department in enumerate(departments):
            self.session.add(
                DepartmentMembership(
                    organization_id=organization.id,
                    user_id=user.id,
                    department_id=department.id,
                    is_primary=index == 0,
                    started_on=date.today() - timedelta(days=1),
                )
            )
        self.session.flush()
        return user

    def role(
        self,
        organization: Organization,
        *,
        key: str | None = None,
        permissions: tuple[str, ...] = (),
        is_active: bool = True,
    ) -> Role:
        suffix = uuid.uuid4().hex[:8]
        role = Role(
            organization_id=organization.id,
            key=key or f"role_{suffix}",
            name=f"Role {suffix}",
            is_system_template=False,
            is_active=is_active,
        )
        self.session.add(role)
        self.session.flush()
        for permission_key in permissions:
            permission = self.session.execute(
                select(Permission).where(Permission.key == permission_key)
            ).scalar_one()
            self.session.add(RolePermission(role_id=role.id, permission_id=permission.id))
        self.session.flush()
        return role

    def assign(
        self,
        user: User,
        role: Role,
        *,
        scope: ScopeType = ScopeType.ORGANIZATION,
        department: Department | None = None,
        effective_from: date | None = None,
        effective_to: date | None = None,
    ) -> RoleAssignment:
        assignment = RoleAssignment(
            organization_id=user.organization_id,
            user_id=user.id,
            role_id=role.id,
            scope_type=scope.value,
            department_id=department.id if department else None,
            effective_from=effective_from or (date.today() - timedelta(days=1)),
            effective_to=effective_to,
        )
        self.session.add(assignment)
        self.session.flush()
        return assignment

    def user_with_permissions(
        self,
        organization: Organization,
        permissions: tuple[str, ...],
        *,
        scope: ScopeType = ScopeType.ORGANIZATION,
        department: Department | None = None,
        email: str | None = None,
        departments: tuple[Department, ...] = (),
    ) -> User:
        """Create a user holding ``permissions`` at ``scope`` — the common setup."""
        user = self.user(organization, email=email, departments=departments)
        role = self.role(organization, permissions=permissions)
        self.assign(user, role, scope=scope, department=department)
        self.session.commit()
        return user


@pytest.fixture()
def factory(db_session: Session, hasher: PasswordHasherService) -> Factory:
    return Factory(db_session, hasher)
