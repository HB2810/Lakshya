"""Liveness and readiness probes.

ARCHITECTURE.md §14 requires "health/readiness checks". They are unauthenticated
and unversioned, because an orchestrator probes them before any application
concern exists. Neither reveals configuration, credentials or schema detail.

Separation of concerns between the two:

* ``/health`` — is this process alive? No dependency is touched, so a database
  outage does not cause the orchestrator to kill otherwise healthy replicas.
* ``/ready`` — can this process serve traffic? Verifies the database and that
  migrations have been applied. Returns ``503`` when not ready.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel
from sqlalchemy import Engine, text
from sqlalchemy.exc import SQLAlchemyError

from app import __version__
from app.api.deps import get_engine

router = APIRouter(tags=["operations"])


class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str


class ReadinessCheck(BaseModel):
    name: str
    status: Literal["ok", "error"]
    detail: str | None = None


class ReadinessResponse(BaseModel):
    status: Literal["ready", "not_ready"]
    version: str
    checks: list[ReadinessCheck]
    schema_revision: str | None = None


@router.get("/health", response_model=HealthResponse, summary="Liveness probe")
def health() -> HealthResponse:
    """Report that the process is running. Touches no dependency."""
    return HealthResponse(status="ok", version=__version__)


@router.get("/ready", response_model=ReadinessResponse, summary="Readiness probe")
def ready(response: Response, engine: Engine = Depends(get_engine)) -> ReadinessResponse:
    """Report whether this process can serve requests."""
    checks: list[ReadinessCheck] = []
    revision: str | None = None

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            checks.append(ReadinessCheck(name="database", status="ok"))

            # Migrations are a controlled release step, never automatic
            # (DATABASE.md §9). Readiness therefore *reports* schema state
            # instead of repairing it: a replica whose schema is missing must not
            # take traffic, and must not migrate on its own either.
            revision = connection.execute(
                text("SELECT version_num FROM alembic_version LIMIT 1")
            ).scalar_one_or_none()
            if revision is None:
                checks.append(
                    ReadinessCheck(
                        name="migrations",
                        status="error",
                        detail="No Alembic revision is recorded. Run 'alembic upgrade head'.",
                    )
                )
            else:
                checks.append(ReadinessCheck(name="migrations", status="ok"))
    except SQLAlchemyError as exc:
        # Only the exception class is reported. The message can contain the
        # connection string (SECURITY.md §5: no internal detail in responses).
        checks.append(
            ReadinessCheck(
                name="database",
                status="error",
                detail=f"Database is unavailable ({type(exc).__name__}).",
            )
        )

    ready_now = all(check.status == "ok" for check in checks)
    if not ready_now:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return ReadinessResponse(
        status="ready" if ready_now else "not_ready",
        version=__version__,
        checks=checks,
        schema_revision=revision,
    )
