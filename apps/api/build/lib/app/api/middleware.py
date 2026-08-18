"""HTTP middleware: correlation IDs, security headers and body-size limits."""

from __future__ import annotations

import logging
import time
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import Settings
from app.core.correlation import (
    CORRELATION_HEADER,
    get_correlation_id,
    reset_correlation_id,
    sanitize_correlation_id,
    set_correlation_id,
)
from app.core.errors import PROBLEM_CONTENT_TYPE, PROBLEM_TYPE_BASE

logger = logging.getLogger("lakshya.access")

Dispatch = Callable[[Request], Awaitable[Response]]


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Assign a correlation ID to every request and echo it in the response.

    ARCHITECTURE.md §11 requires a request/correlation ID on audit events;
    API.md §2 requires one on error responses. An inbound value is accepted for
    tracing continuity but sanitised first — it ends up in log output and audit
    rows, so it is never trusted verbatim.
    """

    async def dispatch(self, request: Request, call_next: Dispatch) -> Response:
        correlation_id = sanitize_correlation_id(request.headers.get(CORRELATION_HEADER))
        token = set_correlation_id(correlation_id)
        started = time.perf_counter()
        try:
            response = await call_next(request)
        finally:
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            reset_correlation_id(token)

        response.headers[CORRELATION_HEADER] = correlation_id
        logger.info(
            "request_completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
                "correlation_id": correlation_id,
            },
        )
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Apply the response headers required by SECURITY.md §9.

    The CSP is restrictive because this process serves a JSON API and its own
    OpenAPI documentation, nothing else. HSTS is sent only when cookies are
    already marked ``Secure``, i.e. when the deployment is on HTTPS — sending it
    from a plain-HTTP development server would pin the developer's browser to a
    scheme the server does not speak.
    """

    def __init__(self, app: object, settings: Settings) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self._settings = settings

    async def dispatch(self, request: Request, call_next: Dispatch) -> Response:
        response = await call_next(request)
        headers = response.headers

        headers.setdefault("X-Content-Type-Options", "nosniff")
        headers.setdefault("X-Frame-Options", "DENY")
        headers.setdefault("Referrer-Policy", "no-referrer")
        headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
        headers.setdefault(
            "Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        )
        # Responses are per-user; a shared cache must never keep them.
        headers.setdefault("Cache-Control", "no-store")

        if self._settings.session_cookie_secure:
            headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response


class BodyTooLargeError(Exception):
    """Raised from the wrapped ``receive`` when a streamed body exceeds the limit.

    Internal control flow only. It never reaches the client: the middleware
    catches it and emits ``413``.
    """


class BodySizeLimitMiddleware:
    """Reject oversized request bodies (SECURITY.md §5: "Limit body size").

    Implemented as **pure ASGI** rather than ``BaseHTTPMiddleware``, because the
    limit has to be enforced on the ``receive`` channel itself.

    Two layers:

    1. ``Content-Length`` is checked before the body is read at all. That is the
       cheap path and refuses a declared-oversized request immediately.
    2. The ``receive`` callable is wrapped and counts bytes as they arrive. This
       is what catches a request with **no** ``Content-Length`` — an HTTP/1.1
       ``Transfer-Encoding: chunked`` upload, or HTTP/2, where the header is
       optional. Checking only the header would let such a request stream an
       unbounded body straight into the application.

    Counting happens per chunk and aborts as soon as the running total crosses
    the limit, so an oversized body is never fully assembled. A client that
    understates ``Content-Length`` is caught by the same counter.
    """

    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        self.app = app
        self._max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        raw_length = Request(scope).headers.get("content-length")
        if raw_length is not None:
            try:
                declared = int(raw_length)
            except ValueError:
                await self._respond(
                    scope, receive, send, "The Content-Length header is not a number.", 400
                )
                return
            if declared > self._max_bytes:
                await self._respond(scope, receive, send, self._too_large_detail(), 413)
                return

        received = 0
        exceeded = False
        response_started = False
        replacement_sent = False

        async def counting_receive() -> Message:
            nonlocal received, exceeded
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > self._max_bytes:
                    # Abort before the application sees the chunk that crossed
                    # the limit, so nothing oversized is ever assembled.
                    exceeded = True
                    raise BodyTooLargeError
            return message

        async def send_wrapper(message: Message) -> None:
            nonlocal response_started, replacement_sent
            if exceeded:
                # FastAPI catches *any* exception raised while reading the body
                # and turns it into its own generic "error parsing the body" 400.
                # That means BodyTooLargeError never reaches the except clause
                # below — it has already been converted into a response by the
                # time it leaves the application. So the response is replaced
                # here instead: the reason for the failure is known precisely,
                # and 413 is the honest status for it.
                if message["type"] == "http.response.start" and not replacement_sent:
                    replacement_sent = True
                    await self._respond(scope, receive, send, self._too_large_detail(), 413)
                return
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, counting_receive, send_wrapper)
        except BodyTooLargeError:
            # Reached only when the application lets the exception propagate
            # rather than converting it, which a non-FastAPI ASGI app may do.
            if response_started or replacement_sent:
                logger.warning(
                    "request body exceeded the limit after the response had started",
                    extra={"path": scope.get("path", "")},
                )
                return
            await self._respond(scope, receive, send, self._too_large_detail(), 413)

    def _too_large_detail(self) -> str:
        return f"The request body exceeds the {self._max_bytes} byte limit."

    async def _respond(
        self, scope: Scope, receive: Receive, send: Send, detail: str, status_code: int
    ) -> None:
        code = "payload_too_large" if status_code == 413 else "bad_request"
        response = JSONResponse(
            status_code=status_code,
            media_type=PROBLEM_CONTENT_TYPE,
            content={
                "type": f"{PROBLEM_TYPE_BASE}/{code}",
                "title": "Payload too large" if status_code == 413 else "Bad request",
                "status": status_code,
                "detail": detail,
                "instance": Request(scope).url.path,
                "code": code,
                "correlation_id": get_correlation_id(),
            },
        )
        await response(scope, receive, send)
