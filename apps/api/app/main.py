"""LAKSHYA API application factory.

ARCHITECTURE.md §2: a modular monolith exposing the API as its own process. The
worker/scheduler process shares this codebase but is introduced by the automation
phase (ADR-004), so nothing here starts background work.

Migrations are never run at startup (DATABASE.md §9, ARCHITECTURE.md §14). The
readiness probe *reports* schema state; applying it is a controlled release step.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.errors import register_exception_handlers
from app.api.health import router as health_router
from app.api.middleware import (
    BodySizeLimitMiddleware,
    CorrelationIdMiddleware,
    SecurityHeadersMiddleware,
)
from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging
from app.core.rate_limit import FixedWindowRateLimiter
from app.core.security import PasswordHasherService
from app.db.session import build_engine, build_session_factory
from app.modules.identity.telemetry import build_security_telemetry_writer

logger = logging.getLogger("lakshya")

DESCRIPTION = """\
LAKSHYA — MD Office Management Operating System (Stavya Spine).

**Phase 2 foundation.** This API exposes identity, organization, access control
(RBAC) and the audit foundation only. Tasks, commitments, meetings, decisions,
priorities, milestones, escalations, notifications, automation and AI are later
phases and are intentionally absent.

Authentication uses opaque, database-backed sessions in a `Secure`, `HttpOnly`,
`SameSite=Lax` cookie. State-changing requests require the `X-CSRF-Token` header
matching the CSRF cookie, plus a trusted `Origin`/`Referer`.

Authorization is data-driven: a request is allowed when an active role assignment
grants the permission at a scope that covers the resource. A freshly migrated
database grants nothing to anybody — the Stavya permission matrix is not yet
approved (see `docs/business-rules/RBAC.md`).
"""


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the ASGI application."""
    resolved = settings or get_settings()
    configure_logging(resolved)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        """Own the process-wide resources.

        The engine, session factory, password hasher and login rate limiter are
        created once and shared. The Argon2 hasher in particular is expensive to
        configure, and the rate limiter must be a single instance or its counters
        would reset on every request.
        """
        try:
            engine = build_engine(resolved)
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("SELECT 1"))
        except Exception as exc:
            if resolved.environment.is_local:
                logger.warning(
                    "postgresql_unavailable_falling_back_to_in_memory_db",
                    extra={"error": str(exc)},
                )
                from app.db.memory_bootstrap import build_memory_engine_and_bootstrap
                engine = build_memory_engine_and_bootstrap(resolved)
            else:
                raise
        app.state.settings = resolved
        app.state.engine = engine
        session_factory = build_session_factory(engine)
        app.state.session_factory = session_factory
        # ADR-007: one application-scoped writer sharing this Engine and
        # pool. It must never create an Engine of its own.
        app.state.security_telemetry_writer = build_security_telemetry_writer(session_factory)
        app.state.password_hasher = PasswordHasherService(resolved)
        app.state.login_rate_limiter = FixedWindowRateLimiter(
            max_attempts=resolved.login_rate_limit_attempts,
            window_seconds=resolved.login_rate_limit_window_seconds,
        )
        logger.info(
            "api_started",
            extra={"environment": resolved.environment.value, "version": __version__},
        )
        try:
            yield
        finally:
            engine.dispose()
            logger.info("api_stopped")

    app = FastAPI(
        title="LAKSHYA API",
        version=__version__,
        description=DESCRIPTION,
        lifespan=lifespan,
        # Interactive docs are useful locally and harmless in production only
        # after a documentation-exposure decision; they are disabled outside
        # local development rather than assumed acceptable.
        docs_url="/docs" if resolved.environment.is_local else None,
        redoc_url=None,
        openapi_url="/openapi.json" if resolved.environment.is_local else None,
    )

    # Middleware runs in reverse registration order, so the correlation ID is
    # established first and is therefore available to every later layer,
    # including the error handlers.
    app.add_middleware(BodySizeLimitMiddleware, max_bytes=resolved.max_request_body_bytes)
    app.add_middleware(SecurityHeadersMiddleware, settings=resolved)

    if resolved.cors_allowed_origins:
        # Deny-by-default: with no configured origins the middleware is not
        # installed at all, so no cross-origin browser access is possible.
        # Credentials are allowed because authentication is cookie-based, which
        # is exactly why wildcard origins are rejected in the settings layer.
        app.add_middleware(
            CORSMiddleware,
            allow_origins=list(resolved.cors_allowed_origins),
            allow_credentials=True,
            allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Content-Type", resolved.csrf_header_name, "If-Match"],
            expose_headers=["ETag", "X-Correlation-Id"],
            max_age=600,
        )

    app.add_middleware(CorrelationIdMiddleware)

    register_exception_handlers(app)

    # Operational probes stay unversioned: an orchestrator should not have to
    # track the API version to know whether a replica is alive.
    app.include_router(health_router)
    app.include_router(api_router, prefix=resolved.api_prefix)

    return app


app = create_app()
