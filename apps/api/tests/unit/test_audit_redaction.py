"""Audit payloads must never carry secret material.

SECURITY.md §6: "Credentials, reset/session tokens and provider secrets never
appear in logs, audit payloads or analytics."

Both layers are tested: the allow-list (a field nobody classified is dropped) and
the deny-list backstop (a secret-looking key is removed even if an allow-list
mistakenly names it).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

import pytest

from app.modules.audit.redaction import (
    AUDIT_FIELD_ALLOWLIST,
    RedactionError,
    diff_snapshots,
    redact_snapshot,
)


class TestAllowList:
    def test_unlisted_fields_are_dropped(self) -> None:
        """Adding a column to a model cannot leak it into audit."""
        result = redact_snapshot(
            "user",
            {"full_name": "A Person", "some_new_internal_column": "should not appear"},
        )
        assert result == {"full_name": "A Person"}

    def test_unknown_entity_type_fails_closed(self) -> None:
        """A new entity must be classified before its values can be recorded."""
        with pytest.raises(RedactionError, match="no audit field allow-list"):
            redact_snapshot("some_future_entity", {"field": "value"})

    def test_none_snapshot_passes_through(self) -> None:
        assert redact_snapshot("user", None) is None

    def test_no_allowlist_names_a_secret_field(self) -> None:
        """Structural guard over the whole allow-list.

        Catches a future edit that adds, say, ``password_hash`` to an entity's
        allow-list, without relying on anyone remembering to add a test for it.
        """
        forbidden_markers = ("password", "token", "csrf", "secret", "salt", "hash", "cookie")
        documented_exemptions = {"must_change_password", "password_updated_at"}

        offenders = [
            f"{entity_type}.{field}"
            for entity_type, fields in AUDIT_FIELD_ALLOWLIST.items()
            for field in fields
            if field not in documented_exemptions
            and any(marker in field for marker in forbidden_markers)
        ]
        assert offenders == [], f"allow-listed fields look like secret material: {offenders}"


class TestDenyListBackstop:
    @pytest.mark.parametrize(
        "field",
        [
            "password",
            "password_hash",
            "token_hash",
            "csrf_token_hash",
            "session_token",
            "api_key",
            "client_secret",
        ],
    )
    def test_secret_shaped_keys_never_survive(self, field: str) -> None:
        result = redact_snapshot("session", {field: "super-secret-value", "user_id": uuid.uuid4()})
        assert result is not None
        assert field not in result
        assert "super-secret-value" not in str(result)

    def test_nested_secret_keys_are_stripped(self) -> None:
        result = redact_snapshot(
            "user",
            {"full_name": {"nested": {"password": "leak", "safe": "kept"}}},
        )
        assert result is not None
        assert "leak" not in str(result)
        assert "kept" in str(result)

    def test_benign_lookalike_is_preserved(self) -> None:
        """``must_change_password`` is a flag, not a secret."""
        result = redact_snapshot("credential", {"must_change_password": True})
        assert result == {"must_change_password": True}


class TestCredentialAndSessionSnapshots:
    def test_credential_snapshot_cannot_carry_a_hash(self) -> None:
        result = redact_snapshot(
            "credential",
            {
                "user_id": uuid.uuid4(),
                "algorithm": "argon2id",
                "password_hash": "$argon2id$v=19$m=65536,t=3,p=2$abc$def",
            },
        )
        assert result is not None
        assert "password_hash" not in result
        assert "$argon2id$" not in str(result)

    def test_session_snapshot_cannot_carry_tokens(self) -> None:
        result = redact_snapshot(
            "session",
            {
                "user_id": uuid.uuid4(),
                "token_hash": "abc123",
                "csrf_token_hash": "def456",
                "ip_address": "127.0.0.1",
            },
        )
        assert result is not None
        assert set(result) == {"user_id", "ip_address"}


class TestNormalisation:
    def test_values_are_json_serialisable(self) -> None:
        """JSONB storage needs primitives, not Python objects."""
        identifier = uuid.uuid4()
        moment = datetime(2026, 8, 17, 12, 30, tzinfo=timezone.utc)
        result = redact_snapshot(
            "department_membership",
            {"user_id": identifier, "started_on": date(2026, 8, 1), "ended_on": moment},
        )
        assert result == {
            "user_id": str(identifier),
            "started_on": "2026-08-01",
            "ended_on": moment.isoformat(),
        }

    def test_deep_nesting_is_truncated(self) -> None:
        """Bounds storage and redaction cost (SECURITY.md §5)."""
        deep: dict[str, object] = {"level": "bottom"}
        for _ in range(12):
            deep = {"level": deep}
        result = redact_snapshot("user", {"full_name": deep})
        assert "[redacted]" in str(result)


class TestDiff:
    def test_only_changed_fields_are_kept(self) -> None:
        before, after = diff_snapshots(
            {"name": "Old", "code": "X", "is_active": True},
            {"name": "New", "code": "X", "is_active": True},
        )
        assert before == {"name": "Old"}
        assert after == {"name": "New"}

    def test_identical_snapshots_produce_no_payload(self) -> None:
        assert diff_snapshots({"name": "Same"}, {"name": "Same"}) == (None, None)

    def test_creation_and_deletion_snapshots_pass_through(self) -> None:
        assert diff_snapshots(None, {"name": "New"}) == (None, {"name": "New"})
        assert diff_snapshots({"name": "Gone"}, None) == ({"name": "Gone"}, None)
