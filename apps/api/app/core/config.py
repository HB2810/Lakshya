"""Typed, fail-fast application settings.

SECURITY.md §8: "Configuration starts in a typed, fail-fast settings layer.
Production refuses debug mode, default secrets, insecure cookie settings or
permissive CORS."

Every setting is read from the environment with the ``LAKSHYA_`` prefix.
"""

from __future__ import annotations

import functools
import os
from enum import Enum
from pathlib import Path
from typing import Annotated, Any
from urllib.parse import urlsplit

from pydantic import Field, ValidationInfo, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

# Values that must never appear in a non-local environment. The settings layer
# refuses to start rather than run with a committed placeholder.
_PLACEHOLDER_FRAGMENTS = ("change-me", "changeme", "placeholder", "example", "postgres:postgres")

#: The exact development URL compiled into :attr:`Settings.database_url` below.
#: Reaching a non-local environment with this value means configuration was never
#: supplied, which must fail loudly rather than connect somewhere unintended.
DEVELOPMENT_DATABASE_URL = "postgresql+psycopg://lakshya:lakshya@localhost:5432/lakshya_dev"

#: Hosts that mean "this machine". A deployed API reaching one of these is almost
#: always leftover development configuration. It is permitted only when an
#: operator sets ``LAKSHYA_ALLOW_LOCAL_DATABASE_ENDPOINT=true`` deliberately, for
#: a deployment that genuinely reaches PostgreSQL through a loopback proxy.
_LOOPBACK_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "[::1]"})


class Environment(str, Enum):
    """Deployment environment. Drives the production safety assertions."""

    LOCAL = "local"
    STAGING = "staging"
    PRODUCTION = "production"

    @property
    def is_local(self) -> bool:
        return self is Environment.LOCAL

    @property
    def is_production(self) -> bool:
        return self is Environment.PRODUCTION


# Repository layout: <repo>/apps/api/app/core/config.py
_API_DIR = Path(__file__).resolve().parents[2]
_REPO_ROOT = _API_DIR.parents[1]

#: Env files consulted at startup in local development, lowest precedence first.
#:
#: These are ABSOLUTE paths, derived from this module's location rather than the
#: working directory. A relative ``.env`` resolves against the current directory,
#: so running ``alembic`` or ``pytest`` from ``apps/api`` — which is where they
#: are meant to run — would silently miss the repository-root ``.env`` and fall
#: back to the in-code defaults, connecting to the wrong database instead of
#: failing loudly.
#:
#: ``apps/api/.env`` is second so a developer can override one setting for the
#: API without editing the shared root file.
#:
#: Because the paths follow the module, behaviour is identical for a Windows
#: checkout, a pytest run from ``apps/api``, and a container image where the code
#: lives at ``/srv/lakshya-api``. In a container neither file normally exists and
#: configuration arrives entirely from the process environment.
ENV_FILES: tuple[Path, ...] = (_REPO_ROOT / ".env", _API_DIR / ".env")

#: Environment variable naming the deployment environment. Read directly from the
#: process, before pydantic-settings builds the model, because it decides whether
#: repository ``.env`` files may be consulted at all.
ENVIRONMENT_VAR = "LAKSHYA_ENVIRONMENT"


def _environment_from_process() -> str:
    return os.environ.get(ENVIRONMENT_VAR, Environment.LOCAL.value).strip().lower()


def active_env_files() -> tuple[Path, ...]:
    """Return the env files pydantic-settings may load.

    **Staging and production never load a repository ``.env``.** A deployed
    process takes configuration from the process environment or an approved
    secret manager (SECURITY.md §8). Silently picking up a file baked into an
    image, or left on a shared host, is exactly how a development credential
    reaches production. Local development keeps the convenience of ``.env``.
    """
    if _environment_from_process() == Environment.LOCAL.value:
        return ENV_FILES
    return ()


def read_env_file_value(key: str) -> str | None:
    """Return a raw value for ``key`` from :data:`ENV_FILES`, or ``None``.

    For configuration that is not a :class:`Settings` field — currently only
    ``LAKSHYA_TEST_DATABASE_URL``, which belongs to the test harness rather than
    the application. Later files win, matching :data:`ENV_FILES` precedence. The
    process environment still takes priority; callers check it first.
    """
    found: str | None = None
    for env_file in ENV_FILES:
        if not env_file.is_file():
            continue
        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, _, value = line.partition("=")
            if name.strip() == key:
                found = value.strip().strip('"').strip("'")
    return found


def _is_development_database_url(value: str) -> bool:
    """True when the URL is the committed development default.

    Compared on credential and target rather than as a whole string, so a
    trailing option or a different driver spelling cannot slip past it.
    """
    reference = urlsplit(DEVELOPMENT_DATABASE_URL)
    candidate = urlsplit(value)
    return (
        candidate.username == reference.username
        and candidate.password == reference.password
        and (candidate.hostname or "") == (reference.hostname or "")
        and candidate.path == reference.path
    )


def _is_loopback_endpoint(value: str) -> bool:
    """True when the URL targets this machine."""
    return (urlsplit(value).hostname or "").strip().lower() in _LOOPBACK_HOSTS


class Settings(BaseSettings):
    """Application configuration.

    Validation is deliberately strict: an invalid or unsafe combination raises
    at import time instead of producing a silently insecure runtime.
    """

    model_config = SettingsConfigDict(
        env_prefix="LAKSHYA_",
        env_file=active_env_files(),
        env_file_encoding="utf-8",
        extra="ignore",
        frozen=True,
    )

    # -- Runtime ----------------------------------------------------------
    environment: Environment = Environment.LOCAL
    debug: bool = False
    log_level: str = "info"
    api_prefix: str = "/api/v1"

    # -- Database ---------------------------------------------------------
    # PostgreSQL only. SQLite is rejected by validation: the domain relies on
    # PostgreSQL types, partial indexes and constraint behaviour (DATABASE.md).
    database_url: str = DEVELOPMENT_DATABASE_URL
    migration_database_url: str | None = None
    db_app_role: str | None = None
    db_pool_size: int = Field(default=5, ge=1, le=50)
    db_max_overflow: int = Field(default=5, ge=0, le=50)
    db_statement_timeout_ms: int = Field(default=15_000, ge=1_000, le=120_000)
    db_echo: bool = False

    #: Escape hatch for a deployment whose database genuinely is reached over
    #: loopback (a sidecar or socket proxy). Must be set deliberately.
    allow_local_database_endpoint: bool = False

    # -- Sessions ---------------------------------------------------------
    session_cookie_name: str = "lakshya_session"
    csrf_cookie_name: str = "lakshya_csrf"
    csrf_header_name: str = "X-CSRF-Token"
    session_cookie_secure: bool = True
    session_cookie_path: str = "/"
    session_absolute_lifetime_minutes: int = Field(default=720, ge=5, le=10_080)
    session_idle_timeout_minutes: int = Field(default=60, ge=5, le=10_080)

    # -- HTTP -------------------------------------------------------------
    # ``NoDecode`` stops pydantic-settings from JSON-decoding these values before
    # validation. Without it, the documented comma-separated form
    # (``LAKSHYA_TRUSTED_ORIGINS=http://a,http://b``) fails to parse, because a
    # tuple field makes the source attempt ``json.loads`` first. The
    # ``mode="before"`` validator below owns the parsing instead.
    cors_allowed_origins: Annotated[tuple[str, ...], NoDecode] = ()
    trusted_origins: Annotated[tuple[str, ...], NoDecode] = ()
    max_request_body_bytes: int = Field(default=256 * 1024, ge=1024, le=10 * 1024 * 1024)

    # -- Password hashing (Argon2id) --------------------------------------
    argon2_time_cost: int = Field(default=3, ge=1, le=20)
    argon2_memory_cost_kib: int = Field(default=65_536, ge=8_192, le=1_048_576)
    argon2_parallelism: int = Field(default=2, ge=1, le=16)
    argon2_hash_length: int = Field(default=32, ge=16, le=128)
    argon2_salt_length: int = Field(default=16, ge=16, le=64)

    # Password policy beyond a minimum length (breached-password screening,
    # rotation, composition) is REQUIRES BUSINESS DECISION — SECURITY.md §3.
    password_min_length: int = Field(default=12, ge=8, le=256)
    password_max_length: int = Field(default=256, ge=64, le=4096)

    # -- Login rate limiting ----------------------------------------------
    # In-process limiter. A shared store is required before the API is scaled
    # horizontally (SECURITY.md §10).
    login_rate_limit_attempts: int = Field(default=10, ge=1, le=1000)
    login_rate_limit_window_seconds: int = Field(default=300, ge=10, le=86_400)

    # -- Local development bootstrap --------------------------------------
    # Guards app/scripts/bootstrap_local.py. Never enable outside local.
    allow_local_bootstrap: bool = False

    # -- Validation -------------------------------------------------------

    @field_validator("database_url", "migration_database_url")
    @classmethod
    def _require_postgresql(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not value.startswith(("postgresql://", "postgresql+psycopg://")):
            raise ValueError(
                "LAKSHYA requires PostgreSQL. Use a "
                "'postgresql+psycopg://' URL; SQLite is not supported."
            )
        return value

    @field_validator("cors_allowed_origins", "trusted_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: Any) -> Any:
        """Accept a comma-separated environment string or a real sequence."""
        if isinstance(value, str):
            return tuple(item.strip() for item in value.split(",") if item.strip())
        return value

    @field_validator("cors_allowed_origins", "trusted_origins")
    @classmethod
    def _reject_wildcard_origins(
        cls, value: tuple[str, ...], info: ValidationInfo
    ) -> tuple[str, ...]:
        for origin in value:
            if origin == "*" or origin.startswith("*"):
                raise ValueError(
                    f"{info.field_name} must not contain a wildcard. CORS is deny-by-default "
                    "and credentialed cross-origin requests require explicit origins."
                )
            if not origin.startswith(("http://", "https://")):
                raise ValueError(f"{info.field_name} entries must include a scheme: {origin!r}")
        return value

    @field_validator("log_level")
    @classmethod
    def _normalise_log_level(cls, value: str) -> str:
        allowed = {"critical", "error", "warning", "info", "debug"}
        normalised = value.strip().lower()
        if normalised not in allowed:
            raise ValueError(f"log_level must be one of {sorted(allowed)}")
        return normalised

    @model_validator(mode="after")
    def _enforce_environment_safety(self) -> Settings:
        """Refuse unsafe configuration outside local development."""
        if self.environment.is_local:
            return self

        problems: list[str] = []

        if self.debug:
            problems.append("debug must be false")
        if not self.session_cookie_secure:
            problems.append("session_cookie_secure must be true (cookies require TLS)")
        if self.database_url.startswith("postgresql") and _looks_like_placeholder(
            self.database_url
        ):
            problems.append("database_url still contains a placeholder credential")
        if _is_development_database_url(self.database_url):
            problems.append(
                "database_url is still the committed development URL; supply the "
                "deployment database configuration"
            )
        if self.migration_database_url and _is_development_database_url(
            self.migration_database_url
        ):
            problems.append("migration_database_url is still the committed development URL")
        if not self.allow_local_database_endpoint:
            for label, url in (
                ("database_url", self.database_url),
                ("migration_database_url", self.migration_database_url),
            ):
                if url and _is_loopback_endpoint(url):
                    problems.append(
                        f"{label} points at a loopback host; set "
                        "allow_local_database_endpoint=true only when the deployment "
                        "genuinely reaches PostgreSQL over loopback"
                    )
        if self.db_echo:
            problems.append(
                "db_echo must be false outside local development: echoed SQL carries "
                "parameter values, including credential updates, into the logs"
            )
        if not self.trusted_origins:
            problems.append(
                "trusted_origins must list the browser origin(s) allowed to perform "
                "state-changing requests (CSRF Origin validation)"
            )
        if self.allow_local_bootstrap:
            problems.append("allow_local_bootstrap must be false outside local development")
        for origin in self.cors_allowed_origins + self.trusted_origins:
            if origin.startswith("http://") and not origin.startswith("http://localhost"):
                problems.append(f"origin {origin!r} must use https outside local development")

        if problems:
            raise ValueError(
                f"Unsafe configuration for environment '{self.environment.value}': "
                + "; ".join(problems)
            )
        return self

    @model_validator(mode="after")
    def _enforce_session_lifetimes(self) -> Settings:
        if self.session_idle_timeout_minutes > self.session_absolute_lifetime_minutes:
            raise ValueError(
                "session_idle_timeout_minutes cannot exceed session_absolute_lifetime_minutes"
            )
        return self

    # -- Derived ----------------------------------------------------------

    @property
    def effective_migration_database_url(self) -> str:
        """URL used by Alembic. A dedicated migration role is recommended."""
        return self.migration_database_url or self.database_url


def _looks_like_placeholder(value: str) -> bool:
    lowered = value.lower()
    return any(fragment in lowered for fragment in _PLACEHOLDER_FRAGMENTS)


@functools.lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide settings singleton."""
    return Settings()
