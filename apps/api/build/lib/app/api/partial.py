"""Partial-update helper.

``PATCH`` must distinguish three cases:

* field absent   → leave unchanged
* field ``null``  → clear the optional column
* field present  → set the value

Pydantic records which keys the client actually sent in ``model_fields_set``, so
``provided`` maps an absent field to the service layer's ``UNSET`` marker and a
present one (including ``null``) to its value.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from app.core.sentinels import UNSET


def provided(payload: BaseModel, field: str) -> Any:
    """Return the submitted value for ``field``, or :data:`UNSET`."""
    if field not in payload.model_fields_set:
        return UNSET
    return getattr(payload, field)


def any_provided(payload: BaseModel, *fields: str) -> bool:
    """True when the client sent at least one of ``fields``."""
    return any(field in payload.model_fields_set for field in fields)
