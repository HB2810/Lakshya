"""Migration correctness.

ARCHITECTURE.md §15: "Migration upgrade/downgrade and schema checks once
migrations begin." DATABASE.md §9 requires reviewed, deterministic migrations.

The parity test below is the important one: it proves the hand-written migration
and the SQLAlchemy models describe the *same* schema. Without it, a model change
without a matching migration would pass every other test — the models would be
right and the database wrong.
"""

from __future__ import annotations

import pytest
from sqlalchemy import Engine, inspect, text

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from app.core.config import Settings
from app.db.models import Base
from tests.conftest import API_DIR

pytestmark = pytest.mark.db

EXPECTED_TABLES = {
    "organizations",
    "departments",
    "department_memberships",
    "users",
    "credentials",
    "sessions",
    "permissions",
    "roles",
    "role_permissions",
    "role_assignments",
    "audit_events",
    "meetings",
    "meeting_participants",
    "meeting_agendas",
    "meeting_checkins",
    "meeting_headlines",
    "calendar_events",
    "calendar_sync_outbox",
    "user_calendar_integrations",
    "annual_goals",
    "quarterly_priorities",
    "monthly_priorities",
    "weekly_milestones",
    "o_and_o_items",
    "kpi_definitions",
    "kpi_values",
}


def _alembic_config(url: str) -> Config:
    config = Config(str(API_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(API_DIR / "alembic"))
    # ``attributes`` bypasses configparser, whose basic interpolation treats the
    # ``%`` of a percent-encoded password as a token and raises before connecting.
    config.attributes["sqlalchemy_url"] = url
    return config


def test_all_expected_tables_exist(engine: Engine) -> None:
    """The V0.1 identity/access tables from DATABASE.md §2, plus audit and meeting/strategy."""
    tables = set(inspect(engine).get_table_names())
    assert EXPECTED_TABLES <= tables


def test_no_future_module_tables_exist(engine: Engine) -> None:
    """Phase 2 must not create schema for later phases."""
    tables = set(inspect(engine).get_table_names())
    premature = tables & {
        "tasks",
        "commitments",
        "decisions",
        "objectives",
        "quarterly_directions",
        "raci_assignments",
        "task_dependencies",
        "stuck_items",
        "escalations",
        "notifications",
        "automation_rules",
        "domain_outbox",
        "scheduled_jobs",
    }
    assert premature == set(), f"tables for later phases already exist: {premature}"


def test_schema_matches_the_models(engine: Engine) -> None:
    """The migrated database and ``Base.metadata`` must agree exactly.

    A non-empty diff means a model was changed without a matching migration (or
    the reverse), which is the failure mode that silently breaks production while
    every unit test still passes.
    """
    with engine.connect() as connection:
        context = MigrationContext.configure(
            connection,
            opts={
                "compare_type": True,
                "compare_server_default": True,
                "include_object": lambda obj, name, type_, reflected, compare_to: not (
                    type_ == "table" and name == "alembic_version"
                ),
            },
        )
        differences = compare_metadata(context, Base.metadata)

    assert differences == [], f"schema drift between migrations and models: {differences}"


def test_migration_head_is_recorded(engine: Engine) -> None:
    with engine.connect() as connection:
        revision = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
    assert revision == "0007"



def test_permission_catalog_is_seeded(engine: Engine) -> None:
    from app.modules.access.catalog import PERMISSION_KEYS

    with engine.connect() as connection:
        keys = set(connection.execute(text("SELECT key FROM permissions")).scalars())
    assert keys == PERMISSION_KEYS


def test_role_templates_are_seeded_without_permissions(engine: Engine) -> None:
    """The central Phase 2 guarantee, asserted against the real database."""
    with engine.connect() as connection:
        templates = list(
            connection.execute(
                text("SELECT key FROM roles WHERE is_system_template AND organization_id IS NULL")
            ).scalars()
        )
        granted = connection.execute(
            text(
                """
                SELECT count(*) FROM role_permissions rp
                JOIN roles r ON r.id = rp.role_id
                WHERE r.is_system_template
                """
            )
        ).scalar_one()

    assert set(templates) == {"md", "md_office", "department_head", "manager", "stavyan"}
    assert granted == 0, "a persona template has seeded permissions (ADR-006 forbids this)"


def test_audit_append_only_trigger_exists(engine: Engine) -> None:
    with engine.connect() as connection:
        trigger = connection.execute(
            text(
                """
                SELECT tgname FROM pg_trigger
                WHERE tgrelid = 'audit_events'::regclass AND NOT tgisinternal
                """
            )
        ).scalar_one_or_none()
    assert trigger == "trg_audit_events_append_only"


def test_downgrade_and_upgrade_round_trip(engine: Engine, settings: Settings) -> None:
    """A migration that cannot be reversed cannot be rolled back in an incident.

    Runs last-ish by design and re-applies ``head`` afterwards, so the session
    schema is restored for any test that follows.
    """
    config = _alembic_config(settings.database_url)

    command.downgrade(config, "base")
    with engine.connect() as connection:
        remaining = set(inspect(connection).get_table_names()) & EXPECTED_TABLES
    assert remaining == set(), f"downgrade left tables behind: {remaining}"

    command.upgrade(config, "head")
    with engine.connect() as connection:
        restored = set(inspect(connection).get_table_names())
    assert EXPECTED_TABLES <= restored
