"""Engine and session lifecycle.

ARCHITECTURE.md §5: "Use synchronous or asynchronous SQLAlchemy consistently
after a measured prototype; do not mix styles casually."

Phase 2 uses **synchronous** SQLAlchemy 2.x throughout (application, Alembic,
tests and the local bootstrap script) so there is exactly one style in the
codebase. FastAPI runs synchronous path operations in its worker threadpool.

ARCHITECTURE.md §5 also requires that a use case "establish the transaction,
load scoped entities, check permissions and invariants, mutate state, append
audit data ... then commit atomically". :func:`get_session` provides exactly one
transaction per request: it commits on success and rolls back on any exception,
so a failed audit insert aborts its business mutation (ADR-005).
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings


def build_engine(settings: Settings, *, url: str | None = None) -> Engine:
    """Create a configured PostgreSQL engine."""
    connect_args: dict[str, Any] = {
        # Bound every statement so a pathological query cannot hold a
        # connection indefinitely (SECURITY.md §10).
        "options": f"-c statement_timeout={settings.db_statement_timeout_ms}",
        "application_name": "lakshya-api",
    }
    return create_engine(
        url or settings.database_url,
        echo=settings.db_echo,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_pre_ping=True,
        future=True,
        connect_args=connect_args,
    )


def build_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Create the session factory.

    ``expire_on_commit=False`` lets a route serialise the object it just wrote
    without issuing another SELECT after the transaction has closed.
    """
    return sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        class_=Session,
    )


@contextmanager
def session_scope(session_factory: sessionmaker[Session]) -> Iterator[Session]:
    """Run a unit of work in one transaction.

    Commits on success, rolls back on any exception. Used by the request
    dependency, the bootstrap script and tests.
    """
    session = session_factory()
    try:
        yield session
        session.commit()
    except BaseException:
        session.rollback()
        raise
    finally:
        session.close()
