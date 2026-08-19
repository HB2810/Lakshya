"""Request dependencies: the security and validation pipeline.

API.md §2 defines the order every protected request follows:

    authenticate session
    -> verify CSRF for unsafe methods
    -> resolve organization
    -> load role/scope grants
    -> query the resource within scope
    -> check action and transition policy
    -> validate invariants
    -> mutate
    -> audit/outbox
    -> commit

The first four steps live here, in :class:`RequestContextProvider`. Everything
after them is the module services' job. Composing the first four into a single
dependency means a route cannot accidentally authenticate without also validating
CSRF, or read grants without pinning the organization.
"""

from __future__ import annotations

from collections.abc import Callable, Iterator
from dataclasses import dataclass
from urllib.parse import urlsplit

from fastapi import Depends, Request
from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, get_settings
from app.core.errors import (
    AuthenticationRequiredError,
    CsrfValidationError,
    PermissionDeniedError,
)
from app.core.security import PasswordHasherService, hash_opaque_token, tokens_equal
from app.modules.access.authorization import AuthorizationContext, AuthorizationService
from app.modules.access.service import PermissionCatalogService, RoleService
from app.modules.audit.models import AuditSource
from app.modules.audit.service import AuditActor, AuditRecorder
from app.modules.identity.service import (
    AuthenticatedSession,
    AuthenticationService,
    RequestMetadata,
)
from app.modules.identity.telemetry import SecurityTelemetryWriter
from app.modules.identity.user_service import UserService
from app.modules.organization.service import DepartmentService, OrganizationService

#: Methods that do not change state and therefore need no CSRF token.
SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})


# ---------------------------------------------------------------------------
# Application-scoped resources
# ---------------------------------------------------------------------------


def get_settings_dependency(request: Request) -> Settings:
    """Return the settings this application instance was built with.

    Read from ``app.state`` rather than the process-wide singleton so an
    application created with explicit settings (as the tests do) is served by
    those settings throughout the request.
    """
    settings: Settings | None = getattr(request.app.state, "settings", None)
    return settings or get_settings()


def get_engine(request: Request) -> Engine:
    engine: Engine = request.app.state.engine
    return engine


def get_session_factory(request: Request) -> sessionmaker[Session]:
    factory: sessionmaker[Session] = request.app.state.session_factory
    return factory


def get_password_hasher(request: Request) -> PasswordHasherService:
    hasher: PasswordHasherService = request.app.state.password_hasher
    return hasher


def get_security_telemetry_writer(request: Request) -> SecurityTelemetryWriter:
    """The application-scoped ADR-007 writer, built once in the lifespan."""
    writer: SecurityTelemetryWriter = request.app.state.security_telemetry_writer
    return writer


def get_db(
    request: Request,
    session_factory: sessionmaker[Session] = Depends(get_session_factory),
) -> Iterator[Session]:
    """One transaction per request, plus the ADR-007 security-telemetry boundary.

    Success path (unchanged, and ADR-005 still holds): the route returns, the
    single transaction commits, so a business mutation and its audit event commit
    together or not at all.

    Rejection path (ADR-007): the exception rolls this transaction back, which is
    correct for ordinary work but would also discard the security facts that
    exist *because* the request was rejected. Those facts travel on the exception
    as allow-listed :class:`SecurityEffect` intents, and are persisted here in a
    separate short transaction.

    The ordering below is the whole point and is not incidental:

    1. ``rollback()`` — the rejected request's work is discarded first, so no
       ordinary mutation can leak into the security transaction.
    2. ``close()`` — the connection returns to the pool *before* the writer asks
       for one. One rejection therefore never holds two pooled connections (a
       pool of size one still works), and the writer never waits on row locks
       this transaction was holding.
    3. ``persist()`` — the independent transaction commits state and audit
       together.
    4. ``raise`` — the original exception continues untouched, so the client sees
       exactly the same generic ``401``.

    A telemetry failure is swallowed by the writer: it logs at high severity and
    returns. Rejection must never become acceptance, and must never become a
    ``500`` either, which would leak an operational distinction.
    """
    session = session_factory()
    try:
        yield session
        session.commit()
    except BaseException as exc:
        session.rollback()
        session.close()

        effects = getattr(exc, "security_effects", ())
        if effects:
            get_security_telemetry_writer(request).persist(effects)
        raise
    finally:
        # Idempotent: already closed on the rejection path.
        session.close()


# ---------------------------------------------------------------------------
# Per-request primitives
# ---------------------------------------------------------------------------


def get_request_metadata(request: Request) -> RequestMetadata:
    """Client metadata for audit only.

    ``X-Forwarded-For`` is intentionally NOT consulted: it is attacker-controlled
    unless a trusted proxy is known to overwrite it, and this value is used for
    audit and rate limiting, never for authorization. Configure the deployment's
    proxy handling before trusting a forwarded address.
    """
    client_host = request.client.host if request.client else None
    return RequestMetadata(
        ip_address=client_host,
        user_agent=request.headers.get("user-agent"),
    )


def get_audit_recorder(session: Session = Depends(get_db)) -> AuditRecorder:
    return AuditRecorder(session, source=AuditSource.API)


def get_authentication_service(
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dependency),
    hasher: PasswordHasherService = Depends(get_password_hasher),
    audit: AuditRecorder = Depends(get_audit_recorder),
) -> AuthenticationService:
    return AuthenticationService(session, settings, hasher, audit)


# ---------------------------------------------------------------------------
# Authenticated request context
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class RequestContext:
    """Everything a protected route needs about the caller."""

    session: Session
    settings: Settings
    authenticated: AuthenticatedSession
    authorization: AuthorizationContext
    audit: AuditRecorder
    actor: AuditActor
    metadata: RequestMetadata
    must_change_password: bool


def build_request_context_dependency(
    *, allow_pending_password_change: bool = False
) -> Callable[..., RequestContext]:
    """Build the dependency that resolves the authenticated request context.

    ``allow_pending_password_change`` marks the few routes that must stay usable
    while a forced password change is outstanding: reading your own identity,
    changing the password and logging out.

    A closure rather than a callable class: FastAPI resolves a dependency's type
    hints through the callable's ``__globals__``, which a class *instance* does
    not have. With an instance, ``request: Request`` would silently degrade into
    an unresolved forward reference and be treated as a query parameter.
    """

    def dependency(
        request: Request,
        session: Session = Depends(get_db),
        settings: Settings = Depends(get_settings_dependency),
        authentication: AuthenticationService = Depends(get_authentication_service),
        audit: AuditRecorder = Depends(get_audit_recorder),
        metadata: RequestMetadata = Depends(get_request_metadata),
    ) -> RequestContext:
        session_token = request.cookies.get(settings.session_cookie_name)
        if not session_token:
            raise AuthenticationRequiredError("No session cookie was presented.")

        authenticated = authentication.resolve_session(session_token)

        if request.method.upper() not in SAFE_METHODS:
            _verify_origin(request, settings)
            _verify_csrf_token(request, settings, authenticated)

        authorization = AuthorizationService(session).load_context(authenticated.user)

        credential = authentication.active_credential(authenticated.user)
        must_change_password = bool(credential and credential.must_change_password)
        if must_change_password and not allow_pending_password_change:
            # Interim security control, not a Stavya business rule: an
            # administrator-set password must be replaced before the account can
            # do anything else. Documented in
            # docs/implementation/PHASE2_FOUNDATION.md.
            raise PermissionDeniedError(
                "A password change is required before using this endpoint.",
                code="password_change_required",
            )

        return RequestContext(
            session=session,
            settings=settings,
            authenticated=authenticated,
            authorization=authorization,
            audit=audit,
            actor=AuditActor.user(
                authenticated.user.id,
                ip_address=metadata.ip_address,
                user_agent=metadata.user_agent,
            ),
            metadata=metadata,
            must_change_password=must_change_password,
        )

    return dependency


#: Standard dependency for protected routes.
CurrentContext = Depends(build_request_context_dependency())

#: For the three routes that remain available during a forced password change.
CurrentContextPendingPasswordChange = Depends(
    build_request_context_dependency(allow_pending_password_change=True)
)


def _verify_origin(request: Request, settings: Settings) -> None:
    """Validate ``Origin``, falling back to ``Referer``.

    SECURITY.md §3: "Unsafe methods require a CSRF token plus Origin/Referer
    checking." A request with neither header is rejected: a modern browser always
    sends ``Origin`` on a cross-origin state-changing request, so the absence of
    both is not a case worth accommodating.
    """
    if not settings.trusted_origins:
        raise CsrfValidationError(
            "No trusted origins are configured, so state-changing requests are refused."
        )

    origin = request.headers.get("origin")
    if origin:
        if origin not in settings.trusted_origins:
            raise CsrfValidationError("The request Origin is not trusted.")
        return

    referer = request.headers.get("referer")
    if referer:
        parts = urlsplit(referer)
        if not parts.scheme or not parts.netloc:
            raise CsrfValidationError("The request Referer is not a valid URL.")
        if f"{parts.scheme}://{parts.netloc}" not in settings.trusted_origins:
            raise CsrfValidationError("The request Referer is not trusted.")
        return

    raise CsrfValidationError("A state-changing request must carry an Origin or Referer header.")


def _verify_csrf_token(
    request: Request, settings: Settings, authenticated: AuthenticatedSession
) -> None:
    """Validate the double-submit CSRF token against the session row.

    The header value is compared against ``sessions.csrf_token_hash``, not merely
    against the cookie. Comparing header to cookie alone would accept a token an
    attacker injected into both (for example from a sibling subdomain); binding to
    the session record does not.
    """
    header_token = request.headers.get(settings.csrf_header_name)
    if not header_token:
        raise CsrfValidationError(
            f"The {settings.csrf_header_name} header is required for this request."
        )

    cookie_token = request.cookies.get(settings.csrf_cookie_name)
    if not cookie_token or not tokens_equal(cookie_token, header_token):
        raise CsrfValidationError("The CSRF token does not match the CSRF cookie.")

    if not tokens_equal(hash_opaque_token(header_token), authenticated.session.csrf_token_hash):
        raise CsrfValidationError("The CSRF token does not belong to this session.")


# ---------------------------------------------------------------------------
# Service dependencies
# ---------------------------------------------------------------------------


def get_organization_service(
    session: Session = Depends(get_db),
    audit: AuditRecorder = Depends(get_audit_recorder),
) -> OrganizationService:
    return OrganizationService(session, audit)


def get_department_service(
    session: Session = Depends(get_db),
    audit: AuditRecorder = Depends(get_audit_recorder),
) -> DepartmentService:
    return DepartmentService(session, audit)


def get_user_service(
    session: Session = Depends(get_db),
    audit: AuditRecorder = Depends(get_audit_recorder),
    hasher: PasswordHasherService = Depends(get_password_hasher),
    authentication: AuthenticationService = Depends(get_authentication_service),
) -> UserService:
    return UserService(session, audit, hasher, authentication)


def get_role_service(
    session: Session = Depends(get_db),
    audit: AuditRecorder = Depends(get_audit_recorder),
    authentication: AuthenticationService = Depends(get_authentication_service),
) -> RoleService:
    return RoleService(session, audit, authentication)


def get_permission_catalog_service(
    session: Session = Depends(get_db),
) -> PermissionCatalogService:
    return PermissionCatalogService(session)
