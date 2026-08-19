"""Password hashing and opaque token primitives.

ADR-002 / SECURITY.md §3:

* Local credentials use Argon2id with upgrade-on-login rehashing.
* Session identifiers are high-entropy opaque random tokens. Only a hash is
  stored server-side.

Design note on hashing choice: passwords are low-entropy secrets and require a
memory-hard KDF (Argon2id). Session and CSRF tokens are 256-bit random values,
so a single SHA-256 is the correct lookup hash — a slow KDF there would only add
latency to every authenticated request without adding meaningful resistance.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from dataclasses import dataclass

from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import Settings

# 32 random bytes = 256 bits of entropy, URL-safe encoded.
_TOKEN_BYTES = 32

PASSWORD_ALGORITHM = "argon2id"  # noqa: S105 - algorithm name, not a credential


@dataclass(frozen=True)
class IssuedToken:
    """A freshly minted opaque token.

    ``value`` is returned to the client exactly once (in a cookie) and is never
    persisted. ``hashed`` is what the database stores.
    """

    value: str
    hashed: str


class PasswordHashError(RuntimeError):
    """A stored password hash could not be parsed."""


class PasswordHasherService:
    """Argon2id hashing with configurable, benchmarkable parameters."""

    def __init__(self, settings: Settings) -> None:
        self._hasher = PasswordHasher(
            time_cost=settings.argon2_time_cost,
            memory_cost=settings.argon2_memory_cost_kib,
            parallelism=settings.argon2_parallelism,
            hash_len=settings.argon2_hash_length,
            salt_len=settings.argon2_salt_length,
            type=Type.ID,
        )

    def hash(self, password: str) -> str:
        """Return an Argon2id encoded hash. The plaintext is never stored."""
        return self._hasher.hash(password)

    def verify(self, password_hash: str, password: str) -> bool:
        """Return True when ``password`` matches ``password_hash``.

        A malformed stored hash is reported as a failure to the caller rather
        than raising into the request path, so a single corrupt credential row
        cannot be distinguished from a wrong password by an attacker.
        """
        try:
            return self._hasher.verify(password_hash, password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False

    def needs_rehash(self, password_hash: str) -> bool:
        """True when the stored hash uses weaker parameters than configured.

        Drives upgrade-on-login (SECURITY.md §3).
        """
        try:
            return self._hasher.check_needs_rehash(password_hash)
        except InvalidHashError as exc:  # pragma: no cover - corrupt stored hash
            raise PasswordHashError("stored password hash is not a valid Argon2 hash") from exc


def generate_opaque_token() -> IssuedToken:
    """Mint a 256-bit opaque token and its lookup hash."""
    value = secrets.token_urlsafe(_TOKEN_BYTES)
    return IssuedToken(value=value, hashed=hash_opaque_token(value))


def hash_opaque_token(value: str) -> str:
    """Return the stable lookup hash for an opaque token.

    Base64url of SHA-256, so the stored value is fixed length and contains no
    part of the original token.
    """
    digest = hashlib.sha256(value.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


def tokens_equal(left: str, right: str) -> bool:
    """Constant-time comparison for token and CSRF checks."""
    return hmac.compare_digest(left.encode("utf-8"), right.encode("utf-8"))
