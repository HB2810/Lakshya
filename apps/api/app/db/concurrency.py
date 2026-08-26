"""Optimistic concurrency helpers shared by the write use cases.

API.md §1: "Mutable resources expose an ``ETag``/version. Update requests use
``If-Match``; stale writes return ``412``."

The pattern used everywhere in LAKSHYA is:

1. ``lock_for_update`` — take a row lock so concurrent updates serialise.
2. ``assert_version`` — compare the caller's ``If-Match`` against the row.
3. mutate, ``version += 1``, audit, commit.

Locking before comparing is what makes this correct rather than merely
optimistic: without the lock, two requests could both read version 3, both pass
the comparison and both write version 4.
"""

from __future__ import annotations

import uuid
from typing import TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import PreconditionFailedError
from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


def lock_for_update(session: Session, model: type[ModelT], entity_id: uuid.UUID) -> ModelT | None:
    """Load one row with ``SELECT ... FOR UPDATE``, or ``None``."""
    return session.execute(
        select(model).where(model.id == entity_id).with_for_update()  # type: ignore[attr-defined]
    ).scalar_one_or_none()


def assert_version(current: int, expected: int) -> None:
    """Raise ``412`` when the caller's ``If-Match`` version is stale."""
    if current != expected:
        raise PreconditionFailedError(
            f"The resource is at version {current}; the request supplied {expected}."
        )
