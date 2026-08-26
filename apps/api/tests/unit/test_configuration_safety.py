"""The settings layer must refuse unsafe configuration.

SECURITY.md §8: "Production refuses debug mode, default secrets, insecure cookie
settings or permissive CORS." These tests assert the refusal actually happens,
because a settings layer that silently accepts an unsafe combination is worse
than none: it looks like a control.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Environment, Settings

_SAFE_PRODUCTION: dict[str, object] = {
    "_env_file": None,
    "environment": Environment.PRODUCTION,
    "debug": False,
    "database_url": "postgresql+psycopg://lakshya_api:s3cret-from-vault@db.internal:5432/lakshya",
    "session_cookie_secure": True,
    "trusted_origins": ("https://lakshya.stavyaspine.internal",),
    "cors_allowed_origins": ("https://lakshya.stavyaspine.internal",),
}


def _settings(**overrides: object) -> Settings:
    return Settings(**{**_SAFE_PRODUCTION, **overrides})  # type: ignore[arg-type]


def test_safe_production_configuration_is_accepted() -> None:
    settings = _settings()
    assert settings.environment.is_production
    assert settings.session_cookie_secure


def test_sqlite_is_rejected() -> None:
    """DATABASE.md mandates PostgreSQL; SQLite must not be silently accepted."""
    with pytest.raises(ValidationError, match="requires PostgreSQL"):
        _settings(database_url="sqlite:///./lakshya.db")


def test_production_rejects_debug_mode() -> None:
    with pytest.raises(ValidationError, match="debug must be false"):
        _settings(debug=True)


def test_production_rejects_insecure_session_cookie() -> None:
    with pytest.raises(ValidationError, match="session_cookie_secure must be true"):
        _settings(session_cookie_secure=False)


def test_production_rejects_placeholder_database_credential() -> None:
    """A committed placeholder must never reach a real environment."""
    with pytest.raises(ValidationError, match="placeholder credential"):
        _settings(
            database_url="postgresql+psycopg://lakshya:change-me-locally@db.internal:5432/lakshya"
        )


def test_production_requires_trusted_origins_for_csrf() -> None:
    with pytest.raises(ValidationError, match="trusted_origins must list"):
        _settings(trusted_origins=())


def test_production_rejects_plain_http_origin() -> None:
    with pytest.raises(ValidationError, match="must use https"):
        _settings(trusted_origins=("http://lakshya.stavyaspine.internal",))


def test_production_rejects_local_bootstrap_flag() -> None:
    """The development bootstrap must be impossible to enable outside local."""
    with pytest.raises(ValidationError, match="allow_local_bootstrap must be false"):
        _settings(allow_local_bootstrap=True)


@pytest.mark.parametrize("origin", ["*", "*.stavyaspine.internal"])
def test_wildcard_origins_are_rejected(origin: str) -> None:
    """Cookie authentication plus a wildcard origin would be a CSRF hole."""
    with pytest.raises(ValidationError, match="must not contain a wildcard"):
        _settings(cors_allowed_origins=(origin,))


def test_origins_require_a_scheme() -> None:
    with pytest.raises(ValidationError, match="must include a scheme"):
        _settings(trusted_origins=("lakshya.stavyaspine.internal",))


def test_comma_separated_origins_are_parsed() -> None:
    settings = _settings(
        trusted_origins="https://a.stavyaspine.internal, https://b.stavyaspine.internal"
    )
    assert settings.trusted_origins == (
        "https://a.stavyaspine.internal",
        "https://b.stavyaspine.internal",
    )


def test_comma_separated_origins_are_parsed_from_the_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The documented ``.env`` form must actually load.

    Exercises the *environment* path specifically: a tuple-typed setting makes
    pydantic-settings attempt ``json.loads`` before validation, which rejects the
    comma-separated form documented in ``.env.example``. Passing the same string
    to the constructor does not go through that code path, so only this test
    catches the regression.
    """
    monkeypatch.setenv("LAKSHYA_ENVIRONMENT", "local")
    monkeypatch.setenv("LAKSHYA_TRUSTED_ORIGINS", "http://localhost:3000,http://localhost:8000")
    monkeypatch.setenv("LAKSHYA_CORS_ALLOWED_ORIGINS", "http://localhost:3000")

    settings = Settings(_env_file=None)

    assert settings.trusted_origins == ("http://localhost:3000", "http://localhost:8000")
    assert settings.cors_allowed_origins == ("http://localhost:3000",)


def test_single_origin_from_the_environment_is_parsed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LAKSHYA_ENVIRONMENT", "local")
    monkeypatch.setenv("LAKSHYA_TRUSTED_ORIGINS", "http://localhost:3000")

    assert Settings(_env_file=None).trusted_origins == ("http://localhost:3000",)


def test_empty_origin_list_from_the_environment_is_parsed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """An empty value means deny-by-default, not a parse error."""
    monkeypatch.setenv("LAKSHYA_ENVIRONMENT", "local")
    monkeypatch.setenv("LAKSHYA_CORS_ALLOWED_ORIGINS", "")

    assert Settings(_env_file=None).cors_allowed_origins == ()


def test_idle_timeout_cannot_exceed_absolute_lifetime() -> None:
    with pytest.raises(ValidationError, match="cannot exceed"):
        _settings(session_absolute_lifetime_minutes=60, session_idle_timeout_minutes=120)


def test_local_environment_permits_development_settings() -> None:
    """Local development must remain workable over plain HTTP."""
    settings = Settings(
        _env_file=None,
        environment=Environment.LOCAL,
        debug=True,
        session_cookie_secure=False,
        allow_local_bootstrap=True,
        database_url="postgresql+psycopg://lakshya:change-me-locally@localhost:5432/lakshya_dev",
    )
    assert settings.environment.is_local
    assert settings.allow_local_bootstrap


def test_migration_url_falls_back_to_database_url() -> None:
    settings = _settings()
    assert settings.effective_migration_database_url == settings.database_url


def test_migration_url_override_is_used() -> None:
    """SECURITY.md §9 recommends a separate migration role."""
    settings = _settings(
        migration_database_url=(
            "postgresql+psycopg://lakshya_migrator:s3cret-from-vault@db.internal:5432/lakshya"
        )
    )
    assert "lakshya_migrator" in settings.effective_migration_database_url
