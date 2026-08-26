"""Rate limiter, ETag parsing, text normalisation and log scrubbing."""

from __future__ import annotations

import logging

import pytest
from fastapi import Request

from app.api.etag import format_etag, require_if_match
from app.core.errors import PreconditionRequiredError, ValidationFailedError
from app.core.logging import JsonFormatter, scrub
from app.core.rate_limit import FixedWindowRateLimiter
from app.core.text import normalize_email, normalize_name, slugify


class TestRateLimiter:
    def test_allows_up_to_the_limit(self) -> None:
        limiter = FixedWindowRateLimiter(max_attempts=3, window_seconds=60)
        assert [limiter.check("key").allowed for _ in range(3)] == [True, True, True]

    def test_blocks_beyond_the_limit(self) -> None:
        limiter = FixedWindowRateLimiter(max_attempts=2, window_seconds=60)
        limiter.check("key")
        limiter.check("key")
        decision = limiter.check("key")
        assert not decision.allowed
        assert decision.retry_after_seconds > 0

    def test_keys_are_independent(self) -> None:
        """A limit on one account must not lock out another."""
        limiter = FixedWindowRateLimiter(max_attempts=1, window_seconds=60)
        assert limiter.check("account:a").allowed
        assert limiter.check("account:b").allowed
        assert not limiter.check("account:a").allowed

    def test_reset_clears_a_key(self) -> None:
        limiter = FixedWindowRateLimiter(max_attempts=1, window_seconds=60)
        limiter.check("key")
        limiter.reset("key")
        assert limiter.check("key").allowed

    def test_tracked_keys_are_bounded(self) -> None:
        """Rotating keys must not grow memory without limit.

        Otherwise the rate limiter itself becomes a memory-exhaustion vector: an
        attacker churning source addresses would grow the map unboundedly.
        """
        limiter = FixedWindowRateLimiter(max_attempts=1, window_seconds=600, max_tracked_keys=500)
        for index in range(5_000):
            limiter.check(f"key-{index}")
        assert limiter.tracked_key_count <= 500

    def test_recently_used_keys_survive_eviction(self) -> None:
        """An active counter must not be evicted by unrelated key churn."""
        limiter = FixedWindowRateLimiter(max_attempts=1, window_seconds=600, max_tracked_keys=50)
        limiter.check("account:under-attack")
        for index in range(200):
            limiter.check(f"noise-{index}")
            # Keep touching the key under test so it stays most-recently-used.
            decision = limiter.check("account:under-attack")
            assert not decision.allowed, "the active counter was evicted and reset"


class TestEtag:
    @staticmethod
    def _request(headers: dict[str, str]) -> Request:
        return Request(
            {
                "type": "http",
                "method": "PATCH",
                "path": "/api/v1/departments/x",
                "headers": [
                    (key.lower().encode(), value.encode()) for key, value in headers.items()
                ],
            }
        )

    def test_format(self) -> None:
        assert format_etag(7) == '"7"'

    def test_parses_strong_tag(self) -> None:
        assert require_if_match(self._request({"If-Match": '"12"'})) == 12

    def test_parses_weak_tag(self) -> None:
        assert require_if_match(self._request({"If-Match": 'W/"3"'})) == 3

    def test_missing_header_is_428(self) -> None:
        """A silent last-write-wins update is exactly what If-Match prevents."""
        with pytest.raises(PreconditionRequiredError):
            require_if_match(self._request({}))

    def test_wildcard_is_rejected(self) -> None:
        with pytest.raises(ValidationFailedError, match="not accepted"):
            require_if_match(self._request({"If-Match": "*"}))

    def test_garbage_is_rejected(self) -> None:
        with pytest.raises(ValidationFailedError, match="must be an entity tag"):
            require_if_match(self._request({"If-Match": "not-a-tag"}))


class TestTextNormalisation:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("Person@Example.COM", "person@example.com"),
            ("  person@example.com  ", "person@example.com"),
            ("PERSON@EXAMPLE.COM", "person@example.com"),
        ],
    )
    def test_email_normalisation(self, raw: str, expected: str) -> None:
        assert normalize_email(raw) == expected

    def test_provider_specific_rules_are_not_applied(self) -> None:
        """Dot-stripping and ``+`` tags differ per provider; merging them would
        collide two people a hospital mail system treats as distinct."""
        assert normalize_email("first.last@example.com") != normalize_email("firstlast@example.com")
        assert normalize_email("person+opd@example.com") != normalize_email("person@example.com")

    def test_name_whitespace_is_collapsed(self) -> None:
        assert normalize_name("  Dr.   Priya    Sharma  ") == "Dr. Priya Sharma"

    @pytest.mark.parametrize(
        ("raw", "expected"),
        [("Stavya Spine", "stavya-spine"), ("MD Office!", "md-office"), ("A  B", "a-b")],
    )
    def test_slugify(self, raw: str, expected: str) -> None:
        assert slugify(raw) == expected


class TestLogScrubbing:
    @pytest.mark.parametrize(
        "message",
        [
            "login failed password=hunter2",
            "authorization: Bearer abc.def.ghi",
            "token=deadbeef",
            "secret=classified",
        ],
    )
    def test_secret_assignments_are_scrubbed(self, message: str) -> None:
        scrubbed = scrub(message)
        assert "[redacted]" in scrubbed
        for leak in ("hunter2", "abc.def.ghi", "deadbeef", "classified"):
            assert leak not in scrubbed

    def test_database_password_is_scrubbed(self) -> None:
        scrubbed = scrub(
            "connecting to postgresql+psycopg://lakshya:s3cretvalue@db.internal:5432/lakshya"
        )
        assert "s3cretvalue" not in scrubbed
        assert "[redacted]" in scrubbed

    def test_formatter_scrubs_the_message(self) -> None:
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg="attempt with password=leaked-value",
            args=(),
            exc_info=None,
        )
        output = JsonFormatter().format(record)
        assert "leaked-value" not in output
        assert "[redacted]" in output

    def test_formatter_scrubs_extra_string_fields(self) -> None:
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg="event",
            args=(),
            exc_info=None,
        )
        record.detail = "token=should-not-appear"
        output = JsonFormatter().format(record)
        assert "should-not-appear" not in output
