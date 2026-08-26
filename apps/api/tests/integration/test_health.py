"""Health and readiness probes (ARCHITECTURE.md §14)."""

from __future__ import annotations

import pytest

from tests.conftest import ApiClient

pytestmark = pytest.mark.db


def test_health_is_public_and_touches_no_dependency(client: ApiClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"]


def test_readiness_reports_database_and_migration_state(client: ApiClient) -> None:
    response = client.get("/ready")
    assert response.status_code == 200
    body = response.json()

    assert body["status"] == "ready"
    checks = {check["name"]: check["status"] for check in body["checks"]}
    assert checks == {"database": "ok", "migrations": "ok"}
    # Confirms migrations were applied by the release step, not by the API.
    assert body["schema_revision"] == "0005"


def test_probes_expose_no_configuration(client: ApiClient) -> None:
    """Probes are unauthenticated, so they must not leak deployment detail."""
    for path in ("/health", "/ready"):
        text = client.get(path).text.lower()
        for leak in ("postgresql://", "postgresql+psycopg", "password", "secret", "localhost:5432"):
            assert leak not in text


def test_security_headers_are_applied(client: ApiClient) -> None:
    """SECURITY.md §9 response headers."""
    headers = client.get("/health").headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["Referrer-Policy"] == "no-referrer"
    assert "default-src 'none'" in headers["Content-Security-Policy"]
    assert headers["Cache-Control"] == "no-store"


def test_correlation_id_is_returned(client: ApiClient) -> None:
    assert client.get("/health").headers["X-Correlation-Id"]


def test_inbound_correlation_id_is_sanitised(client: ApiClient) -> None:
    """The value reaches logs and audit rows, so it is never trusted verbatim."""
    response = client.get(
        "/health", headers={"X-Correlation-Id": "abc<script>alert(1)</script>123"}
    )
    returned = response.headers["X-Correlation-Id"]
    assert "<" not in returned and ">" not in returned
    assert returned.startswith("abcscriptalert1")


def test_unknown_route_returns_problem_json(client: ApiClient) -> None:
    response = client.get("/api/v1/does-not-exist")
    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["code"] == "resource_not_found"
    assert body["correlation_id"]


def test_future_module_endpoints_do_not_exist(client: ApiClient) -> None:
    """Phase 2 must not expose endpoints for later phases."""
    for path in (
        "/api/v1/tasks",
        "/api/v1/commitments",
        "/api/v1/meetings",
        "/api/v1/decisions",
        "/api/v1/priorities",
        "/api/v1/milestones",
        "/api/v1/escalations",
        "/api/v1/notifications",
        "/api/v1/dashboards/md",
        "/api/v1/audit-events",
    ):
        assert client.get(path).status_code == 404, f"{path} should not exist in Phase 2"
