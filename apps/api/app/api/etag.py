"""``ETag`` / ``If-Match`` handling for optimistic concurrency.

API.md §1: "Mutable resources expose an ``ETag``/version. Update requests use
``If-Match``; stale writes return ``412``."

The ``ETag`` is the resource's integer ``version`` rendered as a strong entity
tag, so a client never has to know it is an integer.
"""

from __future__ import annotations

import re

from fastapi import Request, Response

from app.core.errors import PreconditionRequiredError, ValidationFailedError

_ETAG_PATTERN = re.compile(r'^(?:W/)?"(\d+)"$')


def format_etag(version: int) -> str:
    """Render a resource version as a strong entity tag."""
    return f'"{version}"'


def set_etag(response: Response, version: int) -> None:
    response.headers["ETag"] = format_etag(version)


def require_if_match(request: Request) -> int:
    """Parse a mandatory ``If-Match`` header into a version number.

    A missing header returns ``428 Precondition Required`` rather than silently
    performing a last-write-wins update: an update that can clobber a concurrent
    change without the client noticing is exactly what this header prevents.
    ``If-Match: *`` is rejected for the same reason — it asserts only that the
    resource exists.
    """
    raw = request.headers.get("if-match")
    if not raw:
        raise PreconditionRequiredError()

    candidate = raw.strip()
    if candidate == "*":
        raise ValidationFailedError(
            "If-Match: * is not accepted. Supply the ETag returned by the last read."
        )

    match = _ETAG_PATTERN.match(candidate)
    if match is None:
        raise ValidationFailedError(
            "If-Match must be an entity tag previously returned by this API, "
            'for example: If-Match: "3"'
        )
    return int(match.group(1))
