"""Shared sentinel values.

``UNSET`` must be a single process-wide object: the services compare with
``is not UNSET``, so a per-module copy would make every absent field look like a
supplied one.
"""

from __future__ import annotations

from typing import Any, Final


class _Unset:
    """Singleton marker for "no value supplied"."""

    __slots__ = ()

    def __repr__(self) -> str:  # pragma: no cover - diagnostics only
        return "UNSET"

    def __bool__(self) -> bool:
        return False


#: Typed as ``Any`` so a service signature can declare ``name: str | Any = UNSET``
#: without every call site needing a union type.
UNSET: Final[Any] = _Unset()
