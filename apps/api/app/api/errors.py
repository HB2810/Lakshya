"""Exception handlers producing RFC 9457 ``application/problem+json``.

API.md §1 and §2, SECURITY.md §5. Two properties matter:

* Every error carries a correlation ID, so an operator can find the matching log
  entry without the response containing any internal detail.
* No handler leaks a stack trace, SQL fragment, connection string or unhandled
  exception message.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.correlation import get_correlation_id
from app.core.errors import (
    PROBLEM_CONTENT_TYPE,
    PROBLEM_TYPE_BASE,
    ConflictError,
    LakshyaError,
    ServiceUnavailableError,
)
from app.modules.audit.redaction import RedactionError

logger = logging.getLogger("lakshya.api")


def register_exception_handlers(app: FastAPI) -> None:
    """Attach every handler to ``app``."""

    @app.exception_handler(LakshyaError)
    def handle_domain_error(request: Request, exc: LakshyaError) -> JSONResponse:
        correlation_id = get_correlation_id()
        if exc.status_code >= 500:
            logger.error("domain_error", extra={"code": exc.code}, exc_info=exc)
        else:
            logger.info(
                "request_rejected",
                extra={
                    "code": exc.code,
                    "status": exc.status_code,
                    "path": request.url.path,
                    "method": request.method,
                },
            )
        return _problem_response(
            exc.to_problem(instance=request.url.path, correlation_id=correlation_id),
            status_code=exc.status_code,
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        """Convert Pydantic errors into ``field_errors`` (API.md §1)."""
        field_errors: dict[str, list[str]] = {}
        for error in exc.errors():
            location = [str(part) for part in error.get("loc", ()) if part not in ("body",)]
            field = ".".join(location) or "body"
            field_errors.setdefault(field, []).append(str(error.get("msg", "Invalid value.")))

        return _problem_response(
            {
                "type": f"{PROBLEM_TYPE_BASE}/validation_failed",
                "title": "Validation failed",
                "status": 422,
                "detail": "The request content is not valid.",
                "instance": request.url.path,
                "code": "validation_failed",
                "field_errors": field_errors,
                "correlation_id": get_correlation_id(),
            },
            status_code=422,
        )

    @app.exception_handler(StarletteHTTPException)
    def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        """Render framework-raised errors (404 routing, 405) as problem+json."""
        code = _STATUS_CODES.get(exc.status_code, "http_error")
        return _problem_response(
            {
                "type": f"{PROBLEM_TYPE_BASE}/{code}",
                "title": _STATUS_TITLES.get(exc.status_code, "Request failed"),
                "status": exc.status_code,
                "detail": str(exc.detail) if exc.detail else None,
                "instance": request.url.path,
                "code": code,
                "correlation_id": get_correlation_id(),
            },
            status_code=exc.status_code,
            headers=dict(exc.headers or {}),
        )

    @app.exception_handler(RedactionError)
    def handle_redaction_error(request: Request, exc: RedactionError) -> JSONResponse:
        """An unclassified entity type reached the audit recorder.

        Reported as a server error, and the transaction has already been rolled
        back by the session dependency. Failing the mutation is correct: an
        audited change must not commit without its audit event (ADR-005).
        """
        logger.error("audit_redaction_error", exc_info=exc)
        return _problem_response(
            ServiceUnavailableError(
                "The request could not be recorded for audit and was not applied."
            ).to_problem(instance=request.url.path, correlation_id=get_correlation_id()),
            status_code=503,
        )

    @app.exception_handler(IntegrityError)
    def handle_integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
        """A database constraint rejected the write.

        The service layer checks these invariants first, so reaching here normally
        means a concurrent request won a race. The constraint name and SQL are
        logged, never returned.
        """
        logger.warning("integrity_error", extra={"path": request.url.path}, exc_info=exc)
        return _problem_response(
            ConflictError(
                "The request conflicts with the current state of the data. "
                "Re-read the resource and try again."
            ).to_problem(instance=request.url.path, correlation_id=get_correlation_id()),
            status_code=409,
        )

    @app.exception_handler(SQLAlchemyError)
    def handle_database_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.error("database_error", extra={"path": request.url.path}, exc_info=exc)
        return _problem_response(
            ServiceUnavailableError().to_problem(
                instance=request.url.path, correlation_id=get_correlation_id()
            ),
            status_code=503,
        )

    @app.exception_handler(Exception)
    def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.error("unhandled_error", extra={"path": request.url.path}, exc_info=exc)
        return _problem_response(
            {
                "type": f"{PROBLEM_TYPE_BASE}/internal_error",
                "title": "Internal server error",
                "status": 500,
                "detail": "The request could not be completed.",
                "instance": request.url.path,
                "code": "internal_error",
                "correlation_id": get_correlation_id(),
            },
            status_code=500,
        )


def _problem_response(
    problem: dict[str, Any],
    *,
    status_code: int,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    response_headers = dict(headers or {})
    response_headers.setdefault("X-Correlation-Id", str(problem.get("correlation_id", "")))
    return JSONResponse(
        status_code=status_code,
        content={key: value for key, value in problem.items() if value is not None},
        media_type=PROBLEM_CONTENT_TYPE,
        headers=response_headers,
    )


_STATUS_CODES = {
    400: "bad_request",
    401: "authentication_required",
    403: "permission_denied",
    404: "resource_not_found",
    405: "method_not_allowed",
    409: "conflict",
    412: "precondition_failed",
    413: "payload_too_large",
    415: "unsupported_media_type",
    422: "validation_failed",
    428: "precondition_required",
    429: "rate_limited",
    503: "service_unavailable",
}

_STATUS_TITLES = {
    400: "Bad request",
    401: "Authentication required",
    403: "Permission denied",
    404: "Resource not found",
    405: "Method not allowed",
    409: "Conflict",
    412: "Precondition failed",
    413: "Payload too large",
    415: "Unsupported media type",
    422: "Validation failed",
    428: "Precondition required",
    429: "Too many requests",
    503: "Service unavailable",
}
