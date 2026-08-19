"""Domain error hierarchy and RFC 9457 ``application/problem+json`` responses.

API.md §1: errors use ``type``, ``title``, ``status``, ``detail``, ``instance``,
``code``, ``field_errors`` and ``correlation_id`` as applicable.

API.md §2: return ``401`` when there is no valid authentication, ``403`` for a
known but disallowed action, and ``404`` when revealing that a resource exists
would leak inaccessible data.

SECURITY.md §5: no stack traces, secrets or internal details in responses.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.core.security_effects import SecurityEffect

PROBLEM_CONTENT_TYPE = "application/problem+json"

# Documentation base for the ``type`` member. It is a stable identifier, not a
# live URL that must resolve.
PROBLEM_TYPE_BASE = "https://lakshya.stavyaspine.internal/problems"


class LakshyaError(Exception):
    """Base class for errors that map to a deliberate HTTP response."""

    status_code: int = 500
    code: str = "internal_error"
    title: str = "Internal server error"

    def __init__(
        self,
        detail: str | None = None,
        *,
        code: str | None = None,
        field_errors: dict[str, list[str]] | None = None,
        headers: dict[str, str] | None = None,
        security_effects: tuple[SecurityEffect, ...] | None = None,
    ) -> None:
        self.detail = detail or self.title
        if code is not None:
            self.code = code
        self.field_errors = field_errors or {}
        self.headers = headers or {}
        #: Allow-listed security facts that must survive this request's rollback
        #: (ADR-007). Internal only: :meth:`to_problem` builds its payload from an
        #: explicit field list, so an effect can never reach the client.
        self.security_effects: tuple[SecurityEffect, ...] = tuple(security_effects or ())
        super().__init__(self.detail)

    def to_problem(self, *, instance: str, correlation_id: str) -> dict[str, Any]:
        problem: dict[str, Any] = {
            "type": f"{PROBLEM_TYPE_BASE}/{self.code}",
            "title": self.title,
            "status": self.status_code,
            "detail": self.detail,
            "instance": instance,
            "code": self.code,
            "correlation_id": correlation_id,
        }
        if self.field_errors:
            problem["field_errors"] = self.field_errors
        return problem


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------


class AuthenticationRequiredError(LakshyaError):
    """No valid session was presented."""

    status_code = 401
    code = "authentication_required"
    title = "Authentication required"


class AuthenticationFailedError(LakshyaError):
    """Credentials were rejected.

    SECURITY.md §3 requires a generic failure message: the caller must not learn
    whether the account exists, is disabled, or simply used a wrong password.
    """

    status_code = 401
    code = "authentication_failed"
    title = "Authentication failed"

    def __init__(
        self,
        detail: str | None = None,
        *,
        security_effects: tuple[SecurityEffect, ...] | None = None,
    ) -> None:
        super().__init__(
            detail or "The supplied credentials are not valid.",
            security_effects=security_effects,
        )


# ---------------------------------------------------------------------------
# Authorization
# ---------------------------------------------------------------------------


class PermissionDeniedError(LakshyaError):
    """The actor is authenticated but the action is not permitted."""

    status_code = 403
    code = "permission_denied"
    title = "Permission denied"

    def __init__(
        self,
        detail: str | None = None,
        *,
        permission: str | None = None,
        code: str | None = None,
    ) -> None:
        self.permission = permission
        super().__init__(detail or "You do not have permission to perform this action.", code=code)


class CsrfValidationError(LakshyaError):
    """A state-changing cookie-authenticated request failed CSRF validation."""

    status_code = 403
    code = "csrf_validation_failed"
    title = "CSRF validation failed"


# ---------------------------------------------------------------------------
# Resources
# ---------------------------------------------------------------------------


class ResourceNotFoundError(LakshyaError):
    """The resource does not exist, or exists outside the caller's scope.

    Used for both cases on purpose. Distinguishing them would confirm the
    existence of records the caller may not see (API.md §2).
    """

    status_code = 404
    code = "resource_not_found"
    title = "Resource not found"

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail or "The requested resource was not found.")


class ValidationFailedError(LakshyaError):
    """Request content is well formed but violates a domain invariant."""

    status_code = 422
    code = "validation_failed"
    title = "Validation failed"


class ConflictError(LakshyaError):
    """The request conflicts with the current state of the resource."""

    status_code = 409
    code = "conflict"
    title = "Conflict"


class PreconditionRequiredError(LakshyaError):
    """An ``If-Match`` header is mandatory for this mutation (API.md §1)."""

    status_code = 428
    code = "precondition_required"
    title = "Precondition required"

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(
            detail or "This request requires an If-Match header carrying the current ETag."
        )


class PreconditionFailedError(LakshyaError):
    """The supplied ``If-Match`` does not match the current version."""

    status_code = 412
    code = "precondition_failed"
    title = "Precondition failed"

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail or "The resource was modified by another request.")


class RateLimitedError(LakshyaError):
    """Too many attempts from this caller."""

    status_code = 429
    code = "rate_limited"
    title = "Too many requests"

    def __init__(
        self, detail: str | None = None, *, retry_after_seconds: int | None = None
    ) -> None:
        headers = (
            {"Retry-After": str(retry_after_seconds)} if retry_after_seconds is not None else None
        )
        super().__init__(
            detail or "Too many attempts. Please wait before trying again.",
            headers=headers,
        )


class ServiceUnavailableError(LakshyaError):
    """A dependency required to serve the request is unavailable."""

    status_code = 503
    code = "service_unavailable"
    title = "Service unavailable"
