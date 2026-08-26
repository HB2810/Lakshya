"""Authentication routes.

API.md "Authentication". Implemented in Phase 2:

* ``POST /auth/login``            — create a browser session
* ``POST /auth/logout``           — revoke the current session
* ``GET  /auth/me``               — current identity, roles and capabilities
* ``POST /auth/password/change``  — change own password, revoke other sessions

Not implemented: ``/auth/password/reset-request`` and ``/auth/password/reset``.
Both need an approved delivery channel and token policy, which are
REQUIRES BUSINESS DECISION (API.md §6, SECURITY.md §3); shipping a reset flow
would mean inventing that policy. SSO/OIDC routes are added only after the
identity-provider decision.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.cookies import clear_session_cookies, set_session_cookies
from app.api.deps import (
    CurrentContextPendingPasswordChange,
    RequestContext,
    get_authentication_service,
    get_db,
    get_request_metadata,
    get_settings_dependency,
)
from app.core.config import Settings
from app.core.errors import RateLimitedError, ValidationFailedError
from app.core.rate_limit import FixedWindowRateLimiter
from app.core.text import normalize_email
from app.modules.access.authorization import AuthorizationContext, AuthorizationService
from app.modules.identity.models import User, UserSession
from app.modules.identity.schemas import (
    CurrentUserResponse,
    LoginRequest,
    PasswordChangeRequest,
    SessionSummary,
    UserResponse,
)
from app.modules.identity.service import AuthenticationService, RequestMetadata
from app.modules.organization.models import Organization

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/login",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK,
    summary="Create a browser session",
)
def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_settings_dependency),
    authentication: AuthenticationService = Depends(get_authentication_service),
    metadata: RequestMetadata = Depends(get_request_metadata),
) -> CurrentUserResponse:
    """Authenticate and issue an opaque session cookie.

    Anonymous and rate limited. Every failure returns the same generic ``401``, so
    accounts cannot be enumerated (SECURITY.md §3).

    No CSRF token is required here: there is no session to protect yet. This
    response *establishes* the CSRF token that later state-changing requests must
    echo in ``X-CSRF-Token``.
    """
    limiter = _login_rate_limiter(request)
    account_key = f"account:{normalize_email(payload.email)}"
    for key in (f"ip:{metadata.ip_address or 'unknown'}", account_key):
        decision = limiter.check(key)
        if not decision.allowed:
            raise RateLimitedError(retry_after_seconds=decision.retry_after_seconds)

    issued = authentication.login(
        email=payload.email,
        password=payload.password,
        organization_slug=payload.organization_slug,
        metadata=metadata,
        existing_session_token=request.cookies.get(settings.session_cookie_name),
    )

    # Clear this account's counter so a user who mistyped is not penalised
    # afterwards. The per-IP counter is kept, so a host grinding through many
    # accounts stays limited.
    limiter.reset(account_key)

    user = session.get(User, issued.session.user_id)
    assert user is not None  # noqa: S101 - the session was just issued for this user
    credential = authentication.active_credential(user)
    authorization = AuthorizationService(session).load_context(user)

    set_session_cookies(response, issued, settings)
    return _build_current_user(
        session,
        user=user,
        session_record=issued.session,
        authorization=authorization,
        must_change_password=bool(credential and credential.must_change_password),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke the current session",
)
def logout(
    response: Response,
    context: RequestContext = CurrentContextPendingPasswordChange,
    authentication: AuthenticationService = Depends(get_authentication_service),
) -> Response:
    """Revoke the current session server-side and clear the cookies.

    Authenticated and CSRF-protected: a forged logout is a real nuisance attack,
    so it is treated like any other state change.
    """
    authentication.logout(context.authenticated, context.metadata)
    clear_session_cookies(response, context.settings)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    summary="Current identity, roles and effective capabilities",
)
def me(
    context: RequestContext = CurrentContextPendingPasswordChange,
) -> CurrentUserResponse:
    """Return the caller's identity and effective capabilities.

    Available during a forced password change so the client can discover
    ``must_change_password`` and route the user to the change form.
    """
    return _build_current_user(
        context.session,
        user=context.authenticated.user,
        session_record=context.authenticated.session,
        authorization=context.authorization,
        must_change_password=context.must_change_password,
    )


@router.post(
    "/password/change",
    response_model=CurrentUserResponse,
    summary="Change own password and revoke other sessions",
)
def change_password(
    response: Response,
    payload: PasswordChangeRequest,
    context: RequestContext = CurrentContextPendingPasswordChange,
    authentication: AuthenticationService = Depends(get_authentication_service),
) -> CurrentUserResponse:
    """Change the caller's password.

    Requires the current password as re-authentication. Every session is revoked
    and a fresh one issued, so a stolen cookie stops working the moment the
    password changes (ADR-002 session rotation).

    Only a minimum length is enforced. Composition rules, breached-password
    screening and reuse limits are TODO REQUIRES BUSINESS DECISION
    (SECURITY.md §3) and are not invented here.
    """
    settings = context.settings
    if len(payload.new_password) < settings.password_min_length:
        raise ValidationFailedError(
            f"The new password must be at least {settings.password_min_length} characters.",
            field_errors={"new_password": ["Too short."]},
        )
    if payload.new_password == payload.current_password:
        raise ValidationFailedError(
            "The new password must differ from the current password.",
            field_errors={"new_password": ["Must differ from the current password."]},
        )

    issued = authentication.change_password(
        context.authenticated,
        current_password=payload.current_password,
        new_password=payload.new_password,
        metadata=context.metadata,
    )
    set_session_cookies(response, issued, settings)

    return _build_current_user(
        context.session,
        user=context.authenticated.user,
        session_record=issued.session,
        authorization=context.authorization,
        must_change_password=False,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _login_rate_limiter(request: Request) -> FixedWindowRateLimiter:
    limiter: FixedWindowRateLimiter = request.app.state.login_rate_limiter
    return limiter


def _build_current_user(
    session: Session,
    *,
    user: User,
    session_record: UserSession,
    authorization: AuthorizationContext,
    must_change_password: bool,
) -> CurrentUserResponse:
    """Assemble the ``/auth/me`` payload.

    ``permissions`` is a convenience for client affordances only; the server
    re-checks every action (RBAC.md §1: "frontend controls are usability only").
    """
    organization = session.get(Organization, user.organization_id)
    assert organization is not None  # noqa: S101 - foreign key guarantees this

    # Same effective-date semantics as the permissions below: a future-dated or
    # expired assignment is not a role the caller currently holds.
    role_keys = AuthorizationService(session).load_effective_role_keys(user)

    return CurrentUserResponse(
        user=UserResponse.from_model(user),
        organization_id=organization.id,
        organization_slug=organization.slug,
        session=SessionSummary(
            id=session_record.id,
            issued_at=session_record.issued_at,
            expires_at=session_record.expires_at,
            last_activity_at=session_record.last_activity_at,
        ),
        roles=role_keys,
        permissions=sorted(authorization.permission_keys),
        department_ids=_sorted_ids(authorization.member_department_ids),
        must_change_password=must_change_password,
    )


def _sorted_ids(values: frozenset[uuid.UUID]) -> list[uuid.UUID]:
    return sorted(values, key=str)
