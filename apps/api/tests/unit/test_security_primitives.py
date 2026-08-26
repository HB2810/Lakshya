"""Password hashing and opaque token primitives (SECURITY.md §3)."""

from __future__ import annotations

import pytest

from app.core.config import Environment, Settings
from app.core.security import (
    PASSWORD_ALGORITHM,
    PasswordHasherService,
    generate_opaque_token,
    hash_opaque_token,
    tokens_equal,
)


@pytest.fixture()
def settings() -> Settings:
    return Settings(
        _env_file=None,
        environment=Environment.LOCAL,
        argon2_time_cost=1,
        argon2_memory_cost_kib=8192,
        argon2_parallelism=1,
    )


@pytest.fixture()
def hasher(settings: Settings) -> PasswordHasherService:
    return PasswordHasherService(settings)


class TestPasswordHashing:
    def test_hash_is_argon2id(self, hasher: PasswordHasherService) -> None:
        assert PASSWORD_ALGORITHM == "argon2id"
        assert hasher.hash("a-local-test-password").startswith("$argon2id$")

    def test_hash_does_not_contain_the_plaintext(self, hasher: PasswordHasherService) -> None:
        password = "a-very-distinctive-plaintext-value"
        assert password not in hasher.hash(password)

    def test_hashes_are_salted_and_therefore_unique(self, hasher: PasswordHasherService) -> None:
        password = "identical-password"
        assert hasher.hash(password) != hasher.hash(password)

    def test_correct_password_verifies(self, hasher: PasswordHasherService) -> None:
        assert hasher.verify(hasher.hash("right-password"), "right-password")

    def test_wrong_password_fails(self, hasher: PasswordHasherService) -> None:
        assert not hasher.verify(hasher.hash("right-password"), "wrong-password")

    def test_malformed_stored_hash_reports_failure_without_raising(
        self, hasher: PasswordHasherService
    ) -> None:
        """A corrupt credential row must look like a wrong password.

        Raising here would let an attacker distinguish "corrupt row" from "wrong
        password" by the response class.
        """
        assert not hasher.verify("not-an-argon2-hash", "anything")

    def test_needs_rehash_detects_weaker_parameters(self, settings: Settings) -> None:
        """Drives upgrade-on-login."""
        weak = PasswordHasherService(
            settings.model_copy(update={"argon2_time_cost": 1, "argon2_memory_cost_kib": 8192})
        )
        strong = PasswordHasherService(
            settings.model_copy(update={"argon2_time_cost": 4, "argon2_memory_cost_kib": 16384})
        )
        weak_hash = weak.hash("password-to-upgrade")

        assert strong.needs_rehash(weak_hash)
        assert not weak.needs_rehash(weak_hash)
        # The old hash still verifies, so the upgrade is transparent to the user.
        assert strong.verify(weak_hash, "password-to-upgrade")


class TestOpaqueTokens:
    def test_tokens_are_unique(self) -> None:
        values = {generate_opaque_token().value for _ in range(200)}
        assert len(values) == 200

    def test_token_has_high_entropy(self) -> None:
        """256 bits, URL-safe encoded — at least 40 characters."""
        assert len(generate_opaque_token().value) >= 40

    def test_stored_hash_does_not_reveal_the_token(self) -> None:
        issued = generate_opaque_token()
        assert issued.value not in issued.hashed
        assert issued.hashed != issued.value

    def test_hash_is_deterministic(self) -> None:
        """Required for lookup by hash."""
        issued = generate_opaque_token()
        assert hash_opaque_token(issued.value) == issued.hashed

    def test_hash_length_fits_the_column(self) -> None:
        """``sessions.token_hash`` is ``String(64)``."""
        assert len(generate_opaque_token().hashed) <= 64

    def test_different_tokens_hash_differently(self) -> None:
        assert hash_opaque_token("token-a") != hash_opaque_token("token-b")

    def test_constant_time_comparison(self) -> None:
        assert tokens_equal("same-value", "same-value")
        assert not tokens_equal("same-value", "other-value")
        assert not tokens_equal("same-value", "same-value-longer")
