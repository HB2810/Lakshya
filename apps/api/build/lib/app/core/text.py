"""Deterministic text normalisation used by unique constraints.

DATABASE.md §2: ``users`` has a "unique normalized email per organization".
Normalisation must be deterministic and stable, because the value is persisted
in a column backed by a unique index.
"""

from __future__ import annotations

import re
import unicodedata

_WHITESPACE = re.compile(r"\s+")
_SLUG_INVALID = re.compile(r"[^a-z0-9]+")


def normalize_email(email: str) -> str:
    """Return the canonical form used for uniqueness and lookup.

    Case folding and NFKC normalisation only. Provider-specific rules (Gmail
    dot-stripping, ``+`` tags) are deliberately NOT applied: they differ between
    providers and would merge addresses that a hospital mail system treats as
    distinct people.
    """
    collapsed = _WHITESPACE.sub("", unicodedata.normalize("NFKC", email))
    return collapsed.casefold()


def normalize_name(value: str) -> str:
    """Collapse internal whitespace and trim a human-entered name."""
    return _WHITESPACE.sub(" ", unicodedata.normalize("NFKC", value)).strip()


def slugify(value: str) -> str:
    """Return a lowercase ``a-z0-9-`` slug."""
    ascii_form = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower()
    )
    return _SLUG_INVALID.sub("-", ascii_form).strip("-")
