"""Redaction allow-list for audit before/after snapshots.

SECURITY.md §6: "Use redaction allow-lists for before/after audit data and
structured logging." §6 also states that credentials, reset/session tokens and
provider secrets "never appear in logs, audit payloads or analytics".

Two independent controls, deliberately layered:

1. **Allow-list (primary).** For each audited entity type, only the field names
   listed here may appear in a snapshot. A field nobody has classified is
   dropped, so adding a sensitive column to a model cannot leak it into audit.
2. **Deny-list (backstop).** Any key whose name looks like secret material is
   removed even if an allow-list mistakenly includes it.

Order matters: the deny-list runs last, so it wins.
"""

from __future__ import annotations

import re
import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

#: Entity types recognised by the audit recorder, with the fields that may be
#: captured. ``credentials`` and ``sessions`` appear with *no* mutable field
#: content at all: their state changes are audited as actions, never as values.
AUDIT_FIELD_ALLOWLIST: dict[str, frozenset[str]] = {
    "organization": frozenset({"name", "slug", "timezone", "is_active", "archived_at", "version"}),
    "department": frozenset(
        {
            "name",
            "code",
            "parent_department_id",
            "is_active",
            "archived_at",
            "version",
        }
    ),
    "department_membership": frozenset(
        {"user_id", "department_id", "is_primary", "started_on", "ended_on", "note"}
    ),
    "user": frozenset(
        {
            "full_name",
            "email",
            "normalized_email",
            "is_active",
            "disabled_at",
            "disabled_reason",
            "version",
        }
    ),
    "calendar_event": frozenset(
        {
            "id",
            "title",
            "description",
            "event_type",
            "start_time",
            "end_time",
            "timezone",
            "provider",
            "sync_status",
            "reason",
            "version",
        }
    ),
    "role": frozenset({"key", "name", "description", "is_active", "template_key", "version"}),
    "role_permission": frozenset({"role_id", "permission_key"}),
    "role_assignment": frozenset(
        {
            "user_id",
            "role_id",
            "role_key",
            "scope_type",
            "department_id",
            "effective_from",
            "effective_to",
            "revoked_at",
            "revoked_reason",
        }
    ),
    "position": frozenset(
        {
            "title",
            "code",
            "department_id",
            "reports_to_position_id",
            "is_leadership",
            "is_active",
            "version",
        }
    ),
    "position_assignment": frozenset(
        {
            "user_id",
            "position_id",
            "department_id",
            "is_primary",
            "started_on",
            "ended_on",
            "transfer_reason",
        }
    ),
    "work_item": frozenset(
        {
            "title",
            "description",
            "priority",
            "status",
            "owner_id",
            "department_id",
            "progress_percent",
            "blocked_reason",
            "blocked_at",
            "version",
        }
    ),
    # Calendar events and integrations
    "calendar_event": frozenset(
        {
            "title",
            "description",
            "start_time",
            "end_time",
            "event_type",
            "status",
            "sync_status",
            "version",
        }
    ),
    "user_calendar_integration": frozenset(
        {
            "user_id",
            "provider",
            "account_email",
            "is_active",
            "sync_enabled",
            "sync_window_days",
        }
    ),

    # Strategy and operational priorities
    "quarterly_priority": frozenset(
        {
            "title",
            "quarter",
            "fy_start_year",
            "owner_id",
            "proposer_id",
            "status",
            "target_date",
            "department",
            "reporting_authority",
            "step_number",
            "verification_notes",
        }
    ),

    # Authentication events record the account and session identity plus
    # non-secret session metadata. No hash, no token, no password field is
    # listed, so none can be captured.
    "credential": frozenset({"user_id", "kind", "algorithm", "is_active", "must_change_password"}),
    "session": frozenset(
        {
            "user_id",
            "expires_at",
            "revoked_at",
            "revoked_reason",
            "ip_address",
            "user_agent",
            # Bulk revocation records how many sessions actually transitioned,
            # never their identifiers or tokens.
            "revoked_session_count",
        }
    ),
}

#: Backstop patterns. Applied to every key at every nesting depth.
_FORBIDDEN_KEY_PATTERN = re.compile(
    r"(?i)(password|passwd|secret|token|credential_value|csrf|cookie|authorization|api_key|private_key|salt|hash)"
)

#: Keys that match the backstop pattern by name but carry no secret value.
#: Kept as an explicit, reviewable list rather than a cleverer regex.
_FORBIDDEN_PATTERN_EXEMPTIONS = frozenset({"must_change_password", "password_updated_at"})

REDACTED_MARKER = "[redacted]"

#: Nested payloads deeper than this are truncated rather than walked, bounding
#: both storage and the cost of redaction.
_MAX_DEPTH = 4


class RedactionError(ValueError):
    """Raised when an unknown entity type is audited.

    Failing closed is intentional: a new entity type must be classified before
    its values can be recorded, rather than defaulting to "capture everything".
    """


def redact_snapshot(entity_type: str, values: dict[str, Any] | None) -> dict[str, Any] | None:
    """Return the audit-safe projection of ``values`` for ``entity_type``."""
    if values is None:
        return None

    allowed = AUDIT_FIELD_ALLOWLIST.get(entity_type)
    if allowed is None:
        raise RedactionError(
            f"entity type {entity_type!r} has no audit field allow-list; add one to "
            "AUDIT_FIELD_ALLOWLIST before auditing its values"
        )

    projected = {key: _normalise(value, depth=0) for key, value in values.items() if key in allowed}
    stripped: dict[str, Any] = _strip_forbidden(projected, depth=0)
    return stripped


def _is_forbidden_key(key: Any) -> bool:
    """True when a key name suggests secret material."""
    name = str(key)
    if name in _FORBIDDEN_PATTERN_EXEMPTIONS:
        return False
    return bool(_FORBIDDEN_KEY_PATTERN.search(name))


def _strip_forbidden(value: Any, *, depth: int) -> Any:
    """Remove keys that look like secret material, at any depth."""
    if depth > _MAX_DEPTH:
        return REDACTED_MARKER
    if isinstance(value, dict):
        return {
            key: _strip_forbidden(item, depth=depth + 1)
            for key, item in value.items()
            if not _is_forbidden_key(key)
        }
    if isinstance(value, list):
        return [_strip_forbidden(item, depth=depth + 1) for item in value]
    return value


def _normalise(value: Any, *, depth: int) -> Any:
    """Convert a value into something JSONB can store deterministically."""
    if depth > _MAX_DEPTH:
        return REDACTED_MARKER
    if value is None or isinstance(value, bool | int | float | str):
        return value
    if isinstance(value, uuid.UUID | Decimal):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {str(key): _normalise(item, depth=depth + 1) for key, item in value.items()}
    if isinstance(value, list | tuple | set):
        return [_normalise(item, depth=depth + 1) for item in value]
    return str(value)


def diff_snapshots(
    before: dict[str, Any] | None, after: dict[str, Any] | None
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """Reduce a pair of snapshots to the fields that actually changed.

    ADR-005 requires previous/new values. Storing only the delta keeps audit rows
    small and makes "what changed" obvious to a reviewer, while still satisfying
    "previous/new values are retained where applicable".
    """
    if before is None or after is None:
        return before, after

    changed_keys = {key for key in set(before) | set(after) if before.get(key) != after.get(key)}
    if not changed_keys:
        return None, None
    return (
        {key: before.get(key) for key in sorted(changed_keys)},
        {key: after.get(key) for key in sorted(changed_keys)},
    )
