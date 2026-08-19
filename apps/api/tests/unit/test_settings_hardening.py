"""Non-local configuration must fail loudly rather than run unsafely (Fix 1, Fix 15).

SECURITY.md §8: "Production refuses debug mode, default secrets, insecure cookie
settings or permissive CORS."

Each of these is a configuration mistake that produces a *working* system pointed
at the wrong place, which is why the settings layer refuses to construct rather
than logging a warning nobody reads.
"""

from __future__ import annotations

from typing import Any

import pytest

from app.core.config import (
    DEVELOPMENT_DATABASE_URL,
    ENV_FILES,
    ENVIRONMENT_VAR,
    Environment,
    Settings,
    active_env_files,
)

DEPLOYED_URL = "postgresql+psycopg://svc_lakshya:s3cret@db.internal.stavya:5432/lakshya"


def _settings(**overrides: Any) -> Settings:
    """Build settings for a deployed environment, with no ``.env`` involved."""
    base: dict[str, Any] = {
        "environment": Environment.STAGING,
        "debug": False,
        "session_cookie_secure": True,
        "trusted_origins": ("https://lakshya.example",),
        "cors_allowed_origins": ("https://lakshya.example",),
        "database_url": DEPLOYED_URL,
    }
    return Settings(_env_file=None, **{**base, **overrides})


class TestDeployedBaseline:
    def test_a_correctly_configured_deployment_is_accepted(self) -> None:
        assert _settings().environment is Environment.STAGING

    @pytest.mark.parametrize("environment", [Environment.STAGING, Environment.PRODUCTION])
    def test_both_deployed_environments_apply_the_rules(self, environment: Environment) -> None:
        with pytest.raises(ValueError, match="development URL"):
            _settings(environment=environment, database_url=DEVELOPMENT_DATABASE_URL)


class TestCommittedDevelopmentCredential:
    def test_the_committed_development_url_is_refused(self) -> None:
        """Reaching a deployment with this value means configuration never arrived."""
        with pytest.raises(ValueError, match="development URL"):
            _settings(database_url=DEVELOPMENT_DATABASE_URL)

    def test_it_is_refused_even_with_extra_query_options(self) -> None:
        """Compared on credential and target, not as an exact string."""
        with pytest.raises(ValueError, match="development URL"):
            _settings(database_url=f"{DEVELOPMENT_DATABASE_URL}?application_name=api")

    def test_the_migration_url_is_checked_too(self) -> None:
        with pytest.raises(ValueError, match="development URL"):
            _settings(
                migration_database_url=DEVELOPMENT_DATABASE_URL,
                allow_local_database_endpoint=True,
            )

    def test_local_development_still_uses_it_freely(self) -> None:
        """The hardening must not make local development harder."""
        local = Settings(
            _env_file=None,
            environment=Environment.LOCAL,
            database_url=DEVELOPMENT_DATABASE_URL,
        )
        assert local.database_url == DEVELOPMENT_DATABASE_URL


class TestLoopbackEndpoint:
    @pytest.mark.parametrize(
        "host", ["localhost", "127.0.0.1", "[::1]"], ids=["localhost", "ipv4", "ipv6"]
    )
    def test_loopback_database_is_refused_by_default(self, host: str) -> None:
        with pytest.raises(ValueError, match="loopback"):
            _settings(database_url=f"postgresql+psycopg://svc:pw@{host}:5432/lakshya")

    def test_loopback_is_permitted_when_explicitly_justified(self) -> None:
        """A sidecar or socket proxy is legitimate — but must be declared."""
        settings = _settings(
            database_url="postgresql+psycopg://svc:pw@localhost:5432/lakshya",
            allow_local_database_endpoint=True,
        )
        assert settings.allow_local_database_endpoint is True

    def test_a_real_host_is_unaffected(self) -> None:
        assert _settings().database_url == DEPLOYED_URL

    def test_local_development_may_use_loopback(self) -> None:
        local = Settings(
            _env_file=None,
            environment=Environment.LOCAL,
            database_url="postgresql+psycopg://lakshya:pw@localhost:5432/lakshya",
        )
        assert local.environment.is_local


class TestDbEcho:
    def test_db_echo_is_refused_outside_local(self) -> None:
        """Echoed SQL carries parameter values, including credential updates."""
        with pytest.raises(ValueError, match="db_echo"):
            _settings(db_echo=True)

    def test_db_echo_remains_available_locally(self) -> None:
        local = Settings(_env_file=None, environment=Environment.LOCAL, db_echo=True)
        assert local.db_echo is True


class TestExistingGuardsStillApply:
    @pytest.mark.parametrize(
        ("overrides", "expected"),
        [
            ({"debug": True}, "debug"),
            ({"session_cookie_secure": False}, "session_cookie_secure"),
            ({"trusted_origins": ()}, "trusted_origins"),
            ({"allow_local_bootstrap": True}, "allow_local_bootstrap"),
        ],
        ids=["debug", "insecure-cookie", "no-trusted-origins", "bootstrap-flag"],
    )
    def test_guard(self, overrides: dict[str, Any], expected: str) -> None:
        with pytest.raises(ValueError, match=expected):
            _settings(**overrides)

    def test_multiple_problems_are_reported_together(self) -> None:
        """One startup failure should list everything wrong, not the first item."""
        with pytest.raises(ValueError) as excinfo:
            _settings(debug=True, db_echo=True, database_url=DEVELOPMENT_DATABASE_URL)
        message = str(excinfo.value)
        assert "debug" in message
        assert "db_echo" in message
        assert "development URL" in message


class TestEnvFileDiscovery:
    """Fix 15: a deployed process must not pick up a repository ``.env``."""

    def test_local_consults_the_repository_env_files(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv(ENVIRONMENT_VAR, "local")
        assert active_env_files() == ENV_FILES

    def test_unset_environment_defaults_to_local(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv(ENVIRONMENT_VAR, raising=False)
        assert active_env_files() == ENV_FILES

    @pytest.mark.parametrize("environment", ["staging", "production", "PRODUCTION", " Staging "])
    def test_deployed_environments_load_no_env_file(
        self, monkeypatch: pytest.MonkeyPatch, environment: str
    ) -> None:
        monkeypatch.setenv(ENVIRONMENT_VAR, environment)
        assert active_env_files() == ()

    def test_env_file_paths_are_absolute_and_cwd_independent(self) -> None:
        """The paths follow the module, so Windows, pytest and containers agree."""
        assert all(path.is_absolute() for path in ENV_FILES)
        assert ENV_FILES[0].name == ".env"
        assert ENV_FILES[1].parent.name == "api"
