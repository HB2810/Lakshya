"""The frontend-facing authentication contract.

These tests pin the wire format that `apps/web` codes against:
`docs/architecture/AUTH_API_CONTRACT.md`. They deliberately assert on response
*shape* — status codes, field names, cookie attributes, timestamp format, error
codes — rather than on internal behaviour, which the other modules already cover.

A change here is a breaking change for the frontend, which is the point: it should
require editing this file and the contract document together.
"""

from __future__ import annotations

import re
from datetime import timedelta
from typing import Any

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.config import Settings
from app.modules.identity.models import UserSession
from tests.conftest import TEST_ORIGIN, TEST_PASSWORD, ApiClient, Factory

pytestmark = pytest.mark.db

#: Every timestamp on the wire is UTC with a ``Z`` suffix, never a local offset.
#: A mixed representation forces the client to special-case parsing.
_UTC_ISO = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$")

_CURRENT_USER_FIELDS = {
    "user",
    "organization_id",
    "organization_slug",
    "session",
    "roles",
    "permissions",
    "department_ids",
    "must_change_password",
}
_USER_FIELDS = {
    "id",
    "organization_id",
    "full_name",
    "email",
    "is_active",
    "disabled_at",
    "last_login_at",
    "created_at",
    "updated_at",
    "version",
}
_SESSION_FIELDS = {"id", "issued_at", "expires_at", "last_activity_at"}
_PROBLEM_FIELDS = {"type", "title", "status", "detail", "instance", "code", "correlation_id"}


def _cookie(response: Any, name: str) -> str:
    """Return the raw ``Set-Cookie`` line for ``name``."""
    for raw in response.headers.get_list("set-cookie"):
        if raw.startswith(f"{name}="):
            return str(raw)
    raise AssertionError(f"no Set-Cookie for {name!r}")


class TestLoginContract:
    """``POST /api/v1/auth/login``."""

    def test_successful_login_returns_the_current_user_envelope(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="contract@example.com")
        factory.session.commit()

        response = client.login("contract@example.com")

        assert response.status_code == 200
        body = response.json()
        assert set(body) == _CURRENT_USER_FIELDS
        assert set(body["user"]) == _USER_FIELDS
        assert set(body["session"]) == _SESSION_FIELDS
        assert body["organization_id"] == str(organization.id)
        assert body["organization_slug"] == organization.slug
        assert body["user"]["email"] == "contract@example.com"
        assert body["must_change_password"] is False

    def test_login_sets_both_cookies_with_the_documented_attributes(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="cookies@example.com")
        factory.session.commit()

        response = client.login("cookies@example.com")

        session_cookie = _cookie(response, "lakshya_session").lower()
        csrf_cookie = _cookie(response, "lakshya_csrf").lower()

        # The session identifier must be unreadable by script.
        assert "httponly" in session_cookie
        assert "samesite=lax" in session_cookie
        assert "path=/" in session_cookie

        # The CSRF cookie is readable on purpose: the client copies it into the
        # X-CSRF-Token header. It is not an authenticator on its own.
        assert "httponly" not in csrf_cookie
        assert "samesite=lax" in csrf_cookie

    def test_a_new_login_rotates_the_session_identifier(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="rotate@example.com")
        factory.session.commit()

        client.login_or_fail("rotate@example.com")
        first = client.session_cookie
        client.login_or_fail("rotate@example.com")
        second = client.session_cookie

        assert first and second and first != second

    @pytest.mark.parametrize(
        ("email", "password", "label"),
        [
            ("known@example.com", "wrong-password", "wrong password"),
            ("missing@example.com", TEST_PASSWORD, "unknown account"),
            ("disabled@example.com", TEST_PASSWORD, "disabled account"),
        ],
    )
    def test_every_rejection_is_an_identical_401(
        self, client: ApiClient, factory: Factory, email: str, password: str, label: str
    ) -> None:
        """The client cannot distinguish why a login failed."""
        organization = factory.organization()
        factory.user(organization, email="known@example.com")
        factory.user(organization, email="disabled@example.com", is_active=False)
        factory.session.commit()

        response = client.login(email, password)

        assert response.status_code == 401, label
        body = response.json()
        assert set(body) == _PROBLEM_FIELDS
        assert body["code"] == "authentication_failed"
        assert body["detail"] == "The supplied credentials are not valid."
        assert response.headers["content-type"].startswith("application/problem+json")

    def test_malformed_request_is_422_not_401(self, client: ApiClient) -> None:
        """Schema failures are distinguishable from credential failures."""
        response = client.raw.post(
            "/api/v1/auth/login",
            json={"email": "not-an-email-or-anything"},
            headers={"Origin": TEST_ORIGIN},
        )
        assert response.status_code == 422
        assert response.json()["code"] == "validation_failed"

    def test_login_needs_no_csrf_token(self, client: ApiClient, factory: Factory) -> None:
        """There is no session yet, so there is no CSRF token to present."""
        organization = factory.organization()
        factory.user(organization, email="nocsrf@example.com")
        factory.session.commit()

        response = client.raw.post(
            "/api/v1/auth/login",
            json={"email": "nocsrf@example.com", "password": TEST_PASSWORD},
            headers={"Origin": TEST_ORIGIN},
        )
        assert response.status_code == 200


class TestCurrentUserContract:
    """``GET /api/v1/auth/me``."""

    def test_me_returns_the_same_envelope_as_login(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """One shape for both, so the client has a single parser."""
        organization = factory.organization()
        factory.user(organization, email="sameshape@example.com")
        factory.session.commit()

        login_body = client.login_or_fail("sameshape@example.com").json()
        me_body = client.get("/api/v1/auth/me").json()

        assert set(login_body) == set(me_body) == _CURRENT_USER_FIELDS
        assert me_body["user"] == login_body["user"]
        assert me_body["session"]["id"] == login_body["session"]["id"]

    def test_me_carries_the_rbac_identity_context(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Roles and permissions are what the frontend renders navigation from."""
        organization = factory.organization()
        department = factory.department(organization)
        factory.user_with_permissions(
            organization,
            ("department.read", "user.read"),
            email="rbac@example.com",
            departments=(department,),
        )
        factory.session.commit()

        client.login_or_fail("rbac@example.com")
        body = client.get("/api/v1/auth/me").json()

        assert body["permissions"] == ["department.read", "user.read"]
        assert len(body["roles"]) == 1
        assert body["department_ids"] == [str(department.id)]

    def test_me_without_a_session_is_401(self, client: ApiClient) -> None:
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401
        assert response.json()["code"] == "authentication_required"

    def test_me_needs_no_csrf_token(self, client: ApiClient, factory: Factory) -> None:
        """It is a safe method; requiring CSRF would break a plain page load."""
        organization = factory.organization()
        factory.user(organization, email="safemethod@example.com")
        factory.session.commit()
        client.login_or_fail("safemethod@example.com")

        response = client.raw.get("/api/v1/auth/me")
        assert response.status_code == 200


class TestLogoutContract:
    """``POST /api/v1/auth/logout``."""

    def test_logout_returns_204_and_clears_both_cookies(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="bye@example.com")
        factory.session.commit()
        client.login_or_fail("bye@example.com")

        response = client.post("/api/v1/auth/logout")

        assert response.status_code == 204
        assert not response.content
        for name in ("lakshya_session", "lakshya_csrf"):
            assert "max-age=0" in _cookie(response, name).lower()

    def test_logout_requires_csrf(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user(organization, email="csrfless@example.com")
        factory.session.commit()
        client.login_or_fail("csrfless@example.com")

        response = client.raw.post("/api/v1/auth/logout", headers={"Origin": TEST_ORIGIN})

        assert response.status_code == 403
        assert response.json()["code"] == "csrf_validation_failed"

    def test_the_session_is_dead_server_side_after_logout(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """Clearing cookies is housekeeping; revocation is what ends the session."""
        organization = factory.organization()
        factory.user(organization, email="revoked@example.com")
        factory.session.commit()
        client.login_or_fail("revoked@example.com")

        client.post("/api/v1/auth/logout")

        record = db_session.execute(select(UserSession)).scalar_one()
        assert record.revoked_at is not None
        assert record.revoked_reason == "logout"
        assert client.get("/api/v1/auth/me").status_code == 401


class TestSessionLifecycleContract:
    def test_absolute_expiry_returns_401(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="expired@example.com")
        factory.session.commit()
        client.login_or_fail("expired@example.com")

        record = db_session.execute(select(UserSession)).scalar_one()
        record.issued_at = utcnow() - timedelta(hours=3)
        record.expires_at = utcnow() - timedelta(minutes=1)
        db_session.commit()

        assert client.get("/api/v1/auth/me").status_code == 401

    def test_idle_timeout_returns_401(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="idle@example.com")
        factory.session.commit()
        client.login_or_fail("idle@example.com")

        record = db_session.execute(select(UserSession)).scalar_one()
        record.last_activity_at = utcnow() - timedelta(hours=5)
        db_session.commit()

        assert client.get("/api/v1/auth/me").status_code == 401

    def test_disabling_the_account_ends_the_session(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="terminated@example.com")
        factory.session.commit()
        client.login_or_fail("terminated@example.com")
        assert client.get("/api/v1/auth/me").status_code == 200

        user.is_active = False
        user.disabled_at = utcnow()
        db_session.commit()

        assert client.get("/api/v1/auth/me").status_code == 401


class TestTimestampContract:
    """Every instant on the wire is UTC, in both endpoints and every field."""

    def test_login_and_me_serialise_timestamps_identically_in_utc(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="clock@example.com")
        factory.session.commit()

        login_body = client.login_or_fail("clock@example.com").json()
        me_body = client.get("/api/v1/auth/me").json()

        for body, label in ((login_body, "login"), (me_body, "me")):
            for field in ("issued_at", "expires_at", "last_activity_at"):
                value = body["session"][field]
                assert _UTC_ISO.match(value), f"{label}.session.{field} is not UTC: {value}"
            for field in ("created_at", "updated_at", "last_login_at"):
                value = body["user"][field]
                assert value is None or _UTC_ISO.match(value), (
                    f"{label}.user.{field} is not UTC: {value}"
                )

        # The same session, read twice, must not change representation.
        assert login_body["session"]["issued_at"] == me_body["session"]["issued_at"]
        assert login_body["session"]["expires_at"] == me_body["session"]["expires_at"]


class TestSecretsStayOutOfTheContract:
    def test_no_response_carries_credential_or_token_material(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="nosecrets@example.com")
        factory.session.commit()

        login = client.login_or_fail("nosecrets@example.com")
        session_token = client.session_cookie
        assert session_token

        for body in (login.text, client.get("/api/v1/auth/me").text):
            assert session_token not in body
            # ``must_change_password`` is a legitimate boolean flag whose *name*
            # contains the word; drop it before scanning for the word itself.
            scannable = body.lower().replace("must_change_password", "")
            for forbidden in ("password", "token_hash", "csrf_token_hash", "argon2", "hash"):
                assert forbidden not in scannable


class TestBrowserIntegration:
    def test_preflight_allows_credentialed_cross_origin_requests(self, client: ApiClient) -> None:
        """The frontend runs on a different origin and must send cookies."""
        response = client.raw.options(
            "/api/v1/auth/login",
            headers={
                "Origin": TEST_ORIGIN,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,x-csrf-token",
            },
        )
        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == TEST_ORIGIN
        assert response.headers["access-control-allow-credentials"] == "true"
        allowed = response.headers["access-control-allow-headers"].lower()
        assert "x-csrf-token" in allowed
        assert "content-type" in allowed

    def test_an_untrusted_origin_is_refused_on_state_change(
        self, client: ApiClient, factory: Factory, settings: Settings
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="badorigin@example.com")
        factory.session.commit()
        client.login_or_fail("badorigin@example.com")

        response = client.raw.post(
            "/api/v1/auth/logout",
            headers={
                "Origin": "https://attacker.invalid",
                settings.csrf_header_name: client.csrf_token or "",
            },
        )
        assert response.status_code == 403
        assert response.json()["code"] == "csrf_validation_failed"
