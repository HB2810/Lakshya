"""Verify the production-like database role separation (SECURITY.md §9).

Ordinary local development runs a **single** ``lakshya`` role that both migrates
and serves. That is documented as development-only. It also means the intended
production separation — a migration role that owns the schema and a runtime role
that cannot perform DDL or touch audit history — is never exercised by the normal
suite, so a regression in it would go unnoticed until deployment.

This module closes that gap without imposing the two-role setup on every
developer. It is **skipped unless both role URLs are configured**:

    psql -U postgres -h localhost -v ON_ERROR_STOP=1 \\
         -f infra/postgres/production-like-roles.sql

    LAKSHYA_PRODLIKE_MIGRATION_URL=postgresql+psycopg://lakshya_migrator:...@localhost:5432/lakshya_prodlike
    LAKSHYA_PRODLIKE_RUNTIME_URL=postgresql+psycopg://lakshya_runtime:...@localhost:5432/lakshya_prodlike

Then run migrations against it once, as the migration role, before running these
tests. The README documents the full sequence.
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import ProgrammingError

pytestmark = pytest.mark.db

MIGRATION_URL_VAR = "LAKSHYA_PRODLIKE_MIGRATION_URL"
RUNTIME_URL_VAR = "LAKSHYA_PRODLIKE_RUNTIME_URL"

#: Tables the runtime role must be able to read and write.
_DML_TABLES = (
    "organizations",
    "departments",
    "department_memberships",
    "users",
    "credentials",
    "sessions",
    "roles",
    "role_permissions",
    "role_assignments",
)


def _url(variable: str) -> str:
    value = os.environ.get(variable)
    if not value:
        pytest.skip(
            f"{variable} is not set; the production-like role separation is not "
            "provisioned in this environment (see infra/postgres/production-like-roles.sql)."
        )
    return value


@pytest.fixture(scope="module")
def migration_engine() -> Iterator[Engine]:
    engine = create_engine(_url(MIGRATION_URL_VAR), future=True)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture(scope="module")
def runtime_engine() -> Iterator[Engine]:
    engine = create_engine(_url(RUNTIME_URL_VAR), future=True)
    try:
        yield engine
    finally:
        engine.dispose()


class TestRoleIdentity:
    def test_the_two_roles_are_distinct_and_unprivileged(self, runtime_engine: Engine) -> None:
        with runtime_engine.connect() as connection:
            row = connection.execute(
                text(
                    "SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls "
                    "FROM pg_roles WHERE rolname = current_user"
                )
            ).one()
        name, is_super, createdb, createrole, bypassrls = row
        assert name != "lakshya_migrator"
        assert not is_super
        assert not createdb
        assert not createrole
        assert not bypassrls

    def test_migration_role_owns_the_schema(self, migration_engine: Engine) -> None:
        with migration_engine.connect() as connection:
            owner = connection.execute(
                text("SELECT pg_get_userbyid(nspowner) FROM pg_namespace WHERE nspname = 'public'")
            ).scalar_one()
            current = connection.execute(text("SELECT current_user")).scalar_one()
        assert owner == current

    def test_runtime_role_owns_no_tables(self, runtime_engine: Engine) -> None:
        """SECURITY.md §9: "Application roles do not own schemas"."""
        with runtime_engine.connect() as connection:
            owned = connection.execute(
                text(
                    "SELECT count(*) FROM pg_tables "
                    "WHERE schemaname = 'public' AND tableowner = current_user"
                )
            ).scalar_one()
            schema_owner = connection.execute(
                text("SELECT pg_get_userbyid(nspowner) FROM pg_namespace WHERE nspname = 'public'")
            ).scalar_one()
            current = connection.execute(text("SELECT current_user")).scalar_one()
        assert owned == 0
        assert schema_owner != current


class TestRuntimeRoleCapabilities:
    def test_runtime_role_has_the_dml_it_needs(self, runtime_engine: Engine) -> None:
        with runtime_engine.connect() as connection:
            for table in _DML_TABLES:
                for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE"):
                    granted = connection.execute(
                        text("SELECT has_table_privilege(current_user, :t, :p)"),
                        {"t": table, "p": privilege},
                    ).scalar_one()
                    assert granted, f"runtime role is missing {privilege} on {table}"

    def test_runtime_role_may_append_audit_but_not_rewrite_it(self, runtime_engine: Engine) -> None:
        """ADR-005: the runtime role cannot update or delete audit rows."""
        with runtime_engine.connect() as connection:
            privileges = {
                privilege: connection.execute(
                    text("SELECT has_table_privilege(current_user, 'audit_events', :p)"),
                    {"p": privilege},
                ).scalar_one()
                for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE")
            }
        assert privileges["SELECT"] is True
        assert privileges["INSERT"] is True
        assert privileges["UPDATE"] is False
        assert privileges["DELETE"] is False

    def test_runtime_role_cannot_perform_ddl(self, runtime_engine: Engine) -> None:
        """No DDL rights: a compromised API cannot reshape the schema."""
        with runtime_engine.connect() as connection, pytest.raises(ProgrammingError):
            connection.execute(text("CREATE TABLE prodlike_ddl_probe (id integer)"))

    def test_runtime_role_cannot_drop_the_audit_trigger(self, runtime_engine: Engine) -> None:
        """The append-only protection cannot be removed by the role it constrains."""
        with runtime_engine.connect() as connection, pytest.raises(ProgrammingError):
            connection.execute(text("DROP TRIGGER trg_audit_events_append_only ON audit_events"))


class TestAppendOnlyStillEnforced:
    def test_trigger_is_installed(self, runtime_engine: Engine) -> None:
        with runtime_engine.connect() as connection:
            present = connection.execute(
                text(
                    "SELECT count(*) FROM pg_trigger "
                    "WHERE NOT tgisinternal AND tgrelid = 'audit_events'::regclass "
                    "AND tgname = 'trg_audit_events_append_only'"
                )
            ).scalar_one()
        assert present == 1

    def test_even_the_migration_role_cannot_rewrite_audit_history(
        self, migration_engine: Engine
    ) -> None:
        """The trigger holds regardless of privilege.

        The migration role owns the table, so the GRANT layer does not stop it.
        This is exactly why ADR-005 is enforced by a trigger as well: privileges
        alone would leave audit history mutable by whoever owns the schema.
        """
        with migration_engine.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO audit_events (id, occurred_at, action, entity_type, "
                    "actor_type, source, correlation_id, payload_schema_version, created_at) "
                    "VALUES (gen_random_uuid(), now(), 'auth.login.failed', 'user', "
                    "'anonymous', 'api', 'prodlike-probe', 1, now())"
                )
            )

        with migration_engine.connect() as connection:
            with pytest.raises(ProgrammingError):
                connection.execute(
                    text("UPDATE audit_events SET action = 'tampered' WHERE correlation_id = :c"),
                    {"c": "prodlike-probe"},
                )
            connection.rollback()
            with pytest.raises(ProgrammingError):
                connection.execute(
                    text("DELETE FROM audit_events WHERE correlation_id = :c"),
                    {"c": "prodlike-probe"},
                )
            connection.rollback()

        # Clean up through the documented maintenance escape hatch, which proves
        # the hatch works and leaves the verification database reusable.
        with migration_engine.begin() as connection:
            connection.execute(text("SET LOCAL lakshya.audit_maintenance = 'on'"))
            connection.execute(
                text("DELETE FROM audit_events WHERE correlation_id = :c"),
                {"c": "prodlike-probe"},
            )


class TestMigrationRoleCapabilities:
    def test_migration_role_can_perform_ddl(self, migration_engine: Engine) -> None:
        with migration_engine.begin() as connection:
            connection.execute(text("CREATE TABLE prodlike_ddl_check (id integer)"))
            connection.execute(text("DROP TABLE prodlike_ddl_check"))

    def test_schema_is_at_head(self, migration_engine: Engine) -> None:
        with migration_engine.connect() as connection:
            revision = connection.execute(
                text("SELECT version_num FROM alembic_version")
            ).scalar_one()
        assert revision == "0003"
