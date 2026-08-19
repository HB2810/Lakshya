"""UTC clock.

DATABASE.md §1: timestamps are UTC ``timestamptz``. Organization timezone is a
presentation/business-calendar concern, never a storage concern.

All application code reads the current time through :func:`utcnow` so tests can
reason about time without patching :mod:`datetime` globally.
"""

from __future__ import annotations

from datetime import datetime, timezone


def utcnow() -> datetime:
    """Return the current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def as_utc(value: datetime) -> datetime:
    """Normalise a datetime to timezone-aware UTC.

    PostgreSQL returns ``timestamptz`` values as aware datetimes, but a value
    that has travelled through a naive code path is treated as UTC rather than
    silently compared against an aware datetime (which raises).
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
