"""Request correlation identifiers.

ARCHITECTURE.md §11 requires a request/correlation ID on every audit event, and
API.md §2 requires it on every error response. The ID lives in a context
variable so services and the audit recorder can read it without threading it
through every function signature.
"""

from __future__ import annotations

import uuid
from contextvars import ContextVar, Token

_correlation_id: ContextVar[str | None] = ContextVar("lakshya_correlation_id", default=None)

# Inbound header is accepted for tracing continuity but never trusted as data:
# it is length-limited and sanitised before use.
CORRELATION_HEADER = "X-Correlation-Id"
_MAX_LENGTH = 64
_ALLOWED = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.")


def new_correlation_id() -> str:
    return str(uuid.uuid4())


def sanitize_correlation_id(value: str | None) -> str:
    """Return a safe correlation ID derived from an untrusted header value."""
    if not value:
        return new_correlation_id()
    cleaned = "".join(char for char in value.strip() if char in _ALLOWED)[:_MAX_LENGTH]
    return cleaned or new_correlation_id()


def set_correlation_id(value: str) -> Token[str | None]:
    return _correlation_id.set(value)


def reset_correlation_id(token: Token[str | None]) -> None:
    _correlation_id.reset(token)


def get_correlation_id() -> str:
    """Return the current correlation ID, generating one outside a request."""
    value = _correlation_id.get()
    if value is None:
        value = new_correlation_id()
        _correlation_id.set(value)
    return value
