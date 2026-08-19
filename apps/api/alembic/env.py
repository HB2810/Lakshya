"""Alembic environment.

The database URL comes from the environment (``LAKSHYA_MIGRATION_DATABASE_URL``,
falling back to ``LAKSHYA_DATABASE_URL``), never from ``alembic.ini``, so no
credential is ever committed (SECURITY.md §8).

SECURITY.md §9 recommends separate migration and API database roles: the
migration role owns the schema and holds DDL rights, the API role does not. Set
``LAKSHYA_MIGRATION_DATABASE_URL`` to the migration role and
``LAKSHYA_DB_APP_ROLE`` to the API role's name so migration ``0003`` can revoke
write access to the audit table from it.
"""

from __future__ import annotations

from logging.config import fileConfig

from sqlalchemy import create_engine, pool

from alembic import context
from app.core.config import get_settings

# Importing this module registers every mapped table on ``Base.metadata``, which
# is what autogenerate compares against the live database.
from app.db.models import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _resolve_url() -> str:
    """Resolve the migration database URL.

    The URL is deliberately kept OUT of ``alembic.ini``'s configparser section.
    ``Config.set_main_option`` writes through ``configparser`` with basic
    interpolation enabled, where ``%`` introduces a token — so a correctly
    percent-encoded password (``St%40...`` for a password containing ``@``) raises
    ``ValueError: invalid interpolation syntax`` before a connection is ever
    attempted. Passing the URL as a plain string avoids that class of failure
    entirely, for every character that needs encoding.

    Precedence:

    1. ``config.attributes["sqlalchemy_url"]`` — the test harness and any
       programmatic caller. ``attributes`` is a plain dict, so no interpolation.
    2. ``sqlalchemy.url`` in ``alembic.ini``, if an operator set one by hand.
    3. ``LAKSHYA_MIGRATION_DATABASE_URL``, falling back to ``LAKSHYA_DATABASE_URL``.
    """
    override = config.attributes.get("sqlalchemy_url")
    if override:
        return str(override)
    from_ini = config.get_main_option("sqlalchemy.url", default=None)
    if from_ini:
        return from_ini
    return get_settings().effective_migration_database_url


def _include_object(
    obj: object, name: str | None, type_: str, reflected: bool, compare_to: object
) -> bool:
    """Keep autogenerate focused on LAKSHYA's own objects."""
    if type_ == "table" and name == "alembic_version":
        return False
    return True


def run_migrations_offline() -> None:
    """Emit SQL to stdout without connecting.

    Used to produce a reviewable script for a controlled production release
    (DATABASE.md §9).
    """
    context.configure(
        url=_resolve_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
        include_object=_include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Apply migrations against a live database."""
    connectable = create_engine(_resolve_url(), poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            include_object=_include_object,
            # One transaction for the whole upgrade: a failed migration leaves no
            # partially applied schema behind.
            transaction_per_migration=False,
        )
        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
