"""Negative tests for :class:`SecurityEffect` construction (ADR-007, Fix 4).

The telemetry writer is the one component allowed to commit outside the request
transaction. Its safety rests on effects being impossible to construct in a shape
the writer would then act on incorrectly — so the validation is tested directly,
including through the raw constructor, not only through the classmethods.
"""

from __future__ import annotations

import uuid
from dataclasses import FrozenInstanceError
from datetime import datetime, timedelta, timezone

import pytest

from app.core.security_effects import (
    CORRELATION_ID_MAX_LENGTH,
    IP_ADDRESS_MAX_LENGTH,
    REASON_ABSOLUTE_EXPIRY,
    REASON_IDLE_TIMEOUT,
    REASON_INVALID_PASSWORD,
    REASON_UNKNOWN_ACCOUNT,
    USER_AGENT_MAX_LENGTH,
    SecurityEffect,
    SecurityEffectError,
    SecurityEffectKind,
)

NOW = datetime(2026, 8, 18, 12, 0, tzinfo=timezone.utc)
ORG = uuid.uuid4()
USER = uuid.uuid4()
CREDENTIAL = uuid.uuid4()
SESSION = uuid.uuid4()


def _valid(kind: SecurityEffectKind) -> dict[str, object]:
    """Minimum valid field set for each kind."""
    base: dict[str, object] = {
        "kind": kind,
        "correlation_id": "corr-1",
        "occurred_at": NOW,
    }
    if kind is SecurityEffectKind.LOGIN_FAILURE:
        return {**base, "reason_code": REASON_UNKNOWN_ACCOUNT}
    if kind is SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER:
        return {
            **base,
            "reason_code": REASON_INVALID_PASSWORD,
            "organization_id": ORG,
            "target_user_id": USER,
            "credential_id": CREDENTIAL,
        }
    if kind is SecurityEffectKind.SESSION_REVOCATION:
        return {
            **base,
            "reason_code": REASON_IDLE_TIMEOUT,
            "organization_id": ORG,
            "target_user_id": USER,
            "session_id": SESSION,
        }
    return {
        **base,
        "reason_code": REASON_ABSOLUTE_EXPIRY,
        "organization_id": ORG,
        "target_user_id": USER,
    }


class TestValidConstruction:
    @pytest.mark.parametrize("kind", list(SecurityEffectKind))
    def test_every_kind_has_a_constructible_minimum(self, kind: SecurityEffectKind) -> None:
        effect = SecurityEffect(**_valid(kind))  # type: ignore[arg-type]
        assert effect.kind is kind

    def test_effects_are_immutable(self) -> None:
        effect = SecurityEffect(**_valid(SecurityEffectKind.SESSION_REVOCATION))  # type: ignore[arg-type]
        with pytest.raises(FrozenInstanceError):
            effect.organization_id = uuid.uuid4()  # type: ignore[misc]


class TestRequiredTenantIdentifiers:
    """Fix 3: a state-changing effect must carry the tenant its UPDATE constrains."""

    @pytest.mark.parametrize(
        ("kind", "missing"),
        [
            (SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER, "credential_id"),
            (SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER, "organization_id"),
            (SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER, "target_user_id"),
            (SecurityEffectKind.SESSION_REVOCATION, "session_id"),
            (SecurityEffectKind.SESSION_REVOCATION, "organization_id"),
            (SecurityEffectKind.SESSION_REVOCATION, "target_user_id"),
            (SecurityEffectKind.USER_SESSION_REVOCATION, "organization_id"),
            (SecurityEffectKind.USER_SESSION_REVOCATION, "target_user_id"),
        ],
    )
    def test_missing_required_field_is_rejected(
        self, kind: SecurityEffectKind, missing: str
    ) -> None:
        fields = _valid(kind)
        fields[missing] = None
        with pytest.raises(SecurityEffectError, match=missing):
            SecurityEffect(**fields)  # type: ignore[arg-type]


class TestForbiddenFields:
    """Fix 4: an identifier the handler ignores must not be carried at all."""

    @pytest.mark.parametrize(
        ("kind", "field", "value"),
        [
            (SecurityEffectKind.LOGIN_FAILURE, "credential_id", CREDENTIAL),
            (SecurityEffectKind.LOGIN_FAILURE, "session_id", SESSION),
            (SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER, "session_id", SESSION),
            (SecurityEffectKind.SESSION_REVOCATION, "credential_id", CREDENTIAL),
            (SecurityEffectKind.USER_SESSION_REVOCATION, "credential_id", CREDENTIAL),
            (SecurityEffectKind.USER_SESSION_REVOCATION, "session_id", SESSION),
        ],
    )
    def test_irrelevant_field_is_rejected(
        self, kind: SecurityEffectKind, field: str, value: uuid.UUID
    ) -> None:
        fields = _valid(kind)
        fields[field] = value
        with pytest.raises(SecurityEffectError, match=field):
            SecurityEffect(**fields)  # type: ignore[arg-type]


class TestConsistency:
    def test_target_user_without_organization_is_rejected(self) -> None:
        """A resolved account always belongs to a known organization."""
        with pytest.raises(SecurityEffectError, match="organization_id"):
            SecurityEffect(
                kind=SecurityEffectKind.LOGIN_FAILURE,
                reason_code=REASON_UNKNOWN_ACCOUNT,
                correlation_id="corr-1",
                occurred_at=NOW,
                target_user_id=USER,
            )

    def test_unknown_account_may_carry_neither(self) -> None:
        effect = SecurityEffect.login_failure(
            reason_code=REASON_UNKNOWN_ACCOUNT, correlation_id="corr-1", occurred_at=NOW
        )
        assert effect.organization_id is None
        assert effect.target_user_id is None


class TestReasonAllowList:
    @pytest.mark.parametrize(
        ("kind", "reason"),
        [
            # A revocation reason on a login effect, and vice versa.
            (SecurityEffectKind.LOGIN_FAILURE, REASON_IDLE_TIMEOUT),
            (SecurityEffectKind.SESSION_REVOCATION, REASON_INVALID_PASSWORD),
            (SecurityEffectKind.USER_SESSION_REVOCATION, REASON_UNKNOWN_ACCOUNT),
            (SecurityEffectKind.LOGIN_FAILURE, "arbitrary_reason"),
        ],
    )
    def test_reason_outside_the_kind_allow_list_is_rejected(
        self, kind: SecurityEffectKind, reason: str
    ) -> None:
        fields = _valid(kind)
        fields["reason_code"] = reason
        with pytest.raises(SecurityEffectError, match="allow-listed"):
            SecurityEffect(**fields)  # type: ignore[arg-type]


class TestCorrelationId:
    @pytest.mark.parametrize(
        ("value", "label"),
        [
            ("", "empty"),
            ("x" * (CORRELATION_ID_MAX_LENGTH + 1), "too long"),
            ("has spaces", "space"),
            ("has/slash", "slash"),
            ("<script>", "markup"),
            ("nul\x00byte", "nul byte"),
        ],
        ids=["empty", "too-long", "space", "slash", "markup", "nul"],
    )
    def test_unsafe_correlation_id_is_rejected(self, value: str, label: str) -> None:
        fields = _valid(SecurityEffectKind.LOGIN_FAILURE)
        fields["correlation_id"] = value
        with pytest.raises(SecurityEffectError, match="correlation_id"):
            SecurityEffect(**fields)  # type: ignore[arg-type]

    def test_maximum_length_is_accepted(self) -> None:
        fields = _valid(SecurityEffectKind.LOGIN_FAILURE)
        fields["correlation_id"] = "a" * CORRELATION_ID_MAX_LENGTH
        assert SecurityEffect(**fields).correlation_id  # type: ignore[arg-type]


class TestScalarTypes:
    def test_naive_timestamp_is_rejected(self) -> None:
        """A naive value compared against timestamptz is a silent correctness bug."""
        fields = _valid(SecurityEffectKind.LOGIN_FAILURE)
        fields["occurred_at"] = datetime(2026, 8, 18, 12, 0)
        with pytest.raises(SecurityEffectError, match="timezone-aware"):
            SecurityEffect(**fields)  # type: ignore[arg-type]

    def test_non_datetime_timestamp_is_rejected(self) -> None:
        fields = _valid(SecurityEffectKind.LOGIN_FAILURE)
        fields["occurred_at"] = "2026-08-18T12:00:00Z"
        with pytest.raises(SecurityEffectError, match="datetime"):
            SecurityEffect(**fields)  # type: ignore[arg-type]

    @pytest.mark.parametrize(
        "field", ["organization_id", "target_user_id", "credential_id", "session_id"]
    )
    def test_string_identifier_is_rejected(self, field: str) -> None:
        """A string that merely looks like a UUID is not accepted as one."""
        kind = (
            SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER
            if field == "credential_id"
            else SecurityEffectKind.SESSION_REVOCATION
        )
        fields = _valid(kind)
        fields[field] = str(uuid.uuid4())
        with pytest.raises(SecurityEffectError, match="uuid.UUID"):
            SecurityEffect(**fields)  # type: ignore[arg-type]

    def test_non_kind_is_rejected(self) -> None:
        fields = _valid(SecurityEffectKind.LOGIN_FAILURE)
        fields["kind"] = "login_failure"
        with pytest.raises(SecurityEffectError, match="SecurityEffectKind"):
            SecurityEffect(**fields)  # type: ignore[arg-type]


class TestMetadataBounds:
    @pytest.mark.parametrize(
        ("field", "limit"),
        [("ip_address", IP_ADDRESS_MAX_LENGTH), ("user_agent", USER_AGENT_MAX_LENGTH)],
    )
    def test_oversized_metadata_is_rejected(self, field: str, limit: int) -> None:
        fields = _valid(SecurityEffectKind.LOGIN_FAILURE)
        fields[field] = "x" * (limit + 1)
        with pytest.raises(SecurityEffectError, match=field):
            SecurityEffect(**fields)  # type: ignore[arg-type]


class TestNoSecretFields:
    def test_the_model_has_no_field_for_credential_material(self) -> None:
        """Structural guarantee: secrets cannot travel this path.

        Nothing to redact at write time because there is nowhere to put a secret
        in the first place.
        """
        fields = set(SecurityEffect.__dataclass_fields__)
        for forbidden in (
            "password",
            "password_hash",
            "token",
            "session_token",
            "csrf_token",
            "csrf_token_hash",
            "token_hash",
            "secret",
            "email",
            "table",
            "sql",
        ):
            assert forbidden not in fields

    def test_unknown_keyword_is_rejected(self) -> None:
        """A dataclass takes no extra keywords, so no SQL or table can be smuggled in."""
        with pytest.raises(TypeError):
            SecurityEffect(  # type: ignore[call-arg]
                kind=SecurityEffectKind.LOGIN_FAILURE,
                reason_code=REASON_UNKNOWN_ACCOUNT,
                correlation_id="corr-1",
                occurred_at=NOW,
                table_name="audit_events",
            )


class TestMonotonicInputs:
    def test_older_and_newer_timestamps_are_both_constructible(self) -> None:
        """The monotonic guarantee lives in SQL; the model just carries the value."""
        older = SecurityEffect.credential_failure_counter(
            credential_id=CREDENTIAL,
            correlation_id="corr-old",
            occurred_at=NOW - timedelta(minutes=5),
            organization_id=ORG,
            target_user_id=USER,
        )
        newer = SecurityEffect.credential_failure_counter(
            credential_id=CREDENTIAL,
            correlation_id="corr-new",
            occurred_at=NOW,
            organization_id=ORG,
            target_user_id=USER,
        )
        assert older.occurred_at < newer.occurred_at
