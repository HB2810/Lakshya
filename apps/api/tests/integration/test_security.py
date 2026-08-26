"""CSRF, secret non-exposure, concurrency and input-validation controls.

SECURITY.md §3 (CSRF and Origin validation), §5 (API and input security) and §6
(no secret material in responses).
"""

from __future__ import annotations

import json
from collections.abc import Iterator

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.modules.access.catalog import (
    DEPARTMENT_CREATE,
    DEPARTMENT_READ,
    DEPARTMENT_UPDATE,
    ORGANIZATION_READ,
    ORGANIZATION_UPDATE,
    USER_CREATE,
    USER_READ,
    USER_UPDATE,
)
from app.modules.audit.models import AuditEvent
from app.modules.identity.models import Credential, UserSession
from tests.conftest import TEST_ORIGIN, TEST_PASSWORD, ApiClient, Factory

pytestmark = pytest.mark.db


class TestCsrfProtection:
    """A cookie-authenticated state change must prove it came from our origin."""

    @pytest.fixture()
    def authenticated(self, client: ApiClient, factory: Factory) -> ApiClient:
        organization = factory.organization()
        factory.user_with_permissions(
            organization,
            (DEPARTMENT_READ, DEPARTMENT_CREATE),
            email="csrf@example.com",
        )
        client.login_or_fail("csrf@example.com")
        return client

    def test_missing_csrf_header_is_rejected(self, authenticated: ApiClient) -> None:
        response = authenticated.raw.post(
            "/api/v1/departments",
            json={"name": "Forged"},
            headers={"Origin": TEST_ORIGIN},
        )
        assert response.status_code == 403
        assert response.json()["code"] == "csrf_validation_failed"

    def test_wrong_csrf_token_is_rejected(self, authenticated: ApiClient) -> None:
        response = authenticated.raw.post(
            "/api/v1/departments",
            json={"name": "Forged"},
            headers={"Origin": TEST_ORIGIN, "X-CSRF-Token": "not-the-right-token"},
        )
        assert response.status_code == 403

    def test_csrf_token_from_another_session_is_rejected(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """The header is checked against the session row, not just the cookie.

        Comparing header to cookie alone would accept a token an attacker injected
        into both — for example from a sibling subdomain.
        """
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="one@example.com"
        )
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="two@example.com"
        )

        client.login_or_fail("two@example.com")
        other_session_token = client.csrf_token
        client.raw.cookies.clear()

        client.login_or_fail("one@example.com")
        session_cookie = client.session_cookie

        client.raw.cookies.clear()
        client.raw.cookies.set("lakshya_session", session_cookie or "")
        client.raw.cookies.set("lakshya_csrf", other_session_token or "")

        response = client.raw.post(
            "/api/v1/departments",
            json={"name": "Forged"},
            headers={"Origin": TEST_ORIGIN, "X-CSRF-Token": other_session_token or ""},
        )
        assert response.status_code == 403
        assert "does not belong to this session" in response.json()["detail"]

    def test_untrusted_origin_is_rejected(self, authenticated: ApiClient) -> None:
        response = authenticated.raw.post(
            "/api/v1/departments",
            json={"name": "Forged"},
            headers={
                "Origin": "https://evil.example",
                "X-CSRF-Token": authenticated.csrf_token or "",
            },
        )
        assert response.status_code == 403
        assert "Origin is not trusted" in response.json()["detail"]

    def test_untrusted_referer_is_rejected(self, authenticated: ApiClient) -> None:
        response = authenticated.raw.post(
            "/api/v1/departments",
            json={"name": "Forged"},
            headers={
                "Referer": "https://evil.example/attack",
                "X-CSRF-Token": authenticated.csrf_token or "",
            },
        )
        assert response.status_code == 403

    def test_trusted_referer_is_accepted_when_origin_is_absent(
        self, authenticated: ApiClient
    ) -> None:
        response = authenticated.raw.post(
            "/api/v1/departments",
            json={"name": "From Referer"},
            headers={
                "Referer": f"{TEST_ORIGIN}/departments",
                "X-CSRF-Token": authenticated.csrf_token or "",
            },
        )
        assert response.status_code == 201

    def test_request_without_origin_or_referer_is_rejected(self, authenticated: ApiClient) -> None:
        response = authenticated.raw.post(
            "/api/v1/departments",
            json={"name": "Forged"},
            headers={"X-CSRF-Token": authenticated.csrf_token or ""},
        )
        assert response.status_code == 403

    def test_safe_methods_need_no_csrf_token(self, authenticated: ApiClient) -> None:
        assert authenticated.raw.get("/api/v1/departments").status_code == 200

    def test_valid_csrf_request_succeeds(self, authenticated: ApiClient) -> None:
        assert (
            authenticated.post("/api/v1/departments", json={"name": "Legitimate"}).status_code
            == 201
        )

    def test_csrf_is_enforced_on_patch_and_delete(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        department = factory.department(organization)
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="verbs@example.com"
        )
        client.login_or_fail("verbs@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        response = client.raw.patch(
            f"/api/v1/departments/{department.id}",
            json={"name": "Forged"},
            headers={"Origin": TEST_ORIGIN, "If-Match": etag},
        )
        assert response.status_code == 403


class TestSecretsNeverLeave:
    def test_login_response_contains_no_token_or_hash(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="secrets@example.com")
        factory.session.commit()

        response = client.login("secrets@example.com")
        body = response.text

        assert TEST_PASSWORD not in body
        assert "$argon2id$" not in body
        assert "password_hash" not in body
        assert "token_hash" not in body
        # The tokens are delivered only as cookies, never in the payload.
        assert (client.session_cookie or "not-set") not in body
        assert (client.csrf_token or "not-set") not in body

    def test_me_response_contains_no_secret(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (ORGANIZATION_READ,), email="secrets2@example.com"
        )
        client.login_or_fail("secrets2@example.com")

        body = client.get("/api/v1/auth/me").text

        for leak in ("$argon2id$", "password_hash", "token_hash", "csrf_token"):
            assert leak not in body
        assert (client.session_cookie or "not-set") not in body
        assert (client.csrf_token or "not-set") not in body
        # ``must_change_password`` is a flag, so "password" appears as a field
        # name; assert it is the only occurrence rather than banning the word.
        assert body.count("password") == 1
        assert "must_change_password" in body

    def test_user_endpoints_never_return_credentials(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        target = factory.user(organization, email="target@example.com")
        factory.user_with_permissions(
            organization, (USER_READ, USER_CREATE), email="secrets3@example.com"
        )
        client.login_or_fail("secrets3@example.com")

        for body in (
            client.get("/api/v1/users").text,
            client.get(f"/api/v1/users/{target.id}").text,
            client.post(
                "/api/v1/users",
                json={
                    "full_name": "Created",
                    "email": "created@example.com",
                    "initial_password": "a-temporary-local-password",
                },
            ).text,
        ):
            assert "password" not in body
            assert "$argon2id$" not in body
            assert "a-temporary-local-password" not in body

    def test_initial_password_is_stored_only_as_a_hash(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (USER_READ, USER_CREATE), email="hashonly@example.com"
        )
        client.login_or_fail("hashonly@example.com")

        client.post(
            "/api/v1/users",
            json={
                "full_name": "Hashed Only",
                "email": "hashed.only@example.com",
                "initial_password": "a-distinctive-initial-password",
            },
        )

        hashes = list(db_session.execute(select(Credential.password_hash)).scalars())
        assert hashes
        for stored in hashes:
            assert stored.startswith("$argon2id$")
            assert "a-distinctive-initial-password" not in stored

    def test_error_responses_expose_no_internals(self, client: ApiClient, factory: Factory) -> None:
        """SECURITY.md §5: no stack traces, secrets or internal detail."""
        organization = factory.organization()
        factory.user(organization, email="errors@example.com")
        factory.session.commit()

        for response in (
            client.login("errors@example.com", "wrong-password"),
            client.get("/api/v1/organizations/current"),
            client.get("/api/v1/departments/not-a-uuid"),
        ):
            text = response.text.lower()
            for leak in ("traceback", "sqlalchemy", "psycopg", "postgresql://", "select "):
                assert leak not in text


class TestOptimisticConcurrency:
    def test_patch_without_if_match_is_428(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        department = factory.department(organization)
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="conc@example.com"
        )
        client.login_or_fail("conc@example.com")

        response = client.raw.patch(
            f"/api/v1/departments/{department.id}",
            json={"name": "No Precondition"},
            headers={"Origin": TEST_ORIGIN, "X-CSRF-Token": client.csrf_token or ""},
        )
        assert response.status_code == 428

    def test_stale_if_match_is_412(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        department = factory.department(organization)
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="stale@example.com"
        )
        client.login_or_fail("stale@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        assert (
            client.patch(
                f"/api/v1/departments/{department.id}", json={"name": "First"}, etag=etag
            ).status_code
            == 200
        )
        # The same ETag is now stale.
        response = client.patch(
            f"/api/v1/departments/{department.id}", json={"name": "Second"}, etag=etag
        )
        assert response.status_code == 412

    def test_etag_increments_on_update(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        department = factory.department(organization)
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="etag@example.com"
        )
        client.login_or_fail("etag@example.com")

        first = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        updated = client.patch(
            f"/api/v1/departments/{department.id}", json={"name": "Bumped"}, etag=first
        )
        assert updated.headers["ETag"] != first
        assert updated.json()["version"] == 2

    def test_organization_update_requires_if_match(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (ORGANIZATION_READ, ORGANIZATION_UPDATE), email="orgconc@example.com"
        )
        client.login_or_fail("orgconc@example.com")

        etag = client.get("/api/v1/organizations/current").headers["ETag"]
        response = client.patch(
            "/api/v1/organizations/current", json={"name": "Renamed Org"}, etag=etag
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Renamed Org"


class TestInputValidation:
    def test_unknown_fields_are_rejected(self, client: ApiClient, factory: Factory) -> None:
        """Mass-assignment prevention (SECURITY.md §5)."""
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="valid@example.com"
        )
        client.login_or_fail("valid@example.com")

        response = client.post(
            "/api/v1/departments", json={"name": "Fine", "is_active": True, "version": 99}
        )
        assert response.status_code == 422
        assert response.json()["field_errors"]

    def test_blank_name_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="blank@example.com"
        )
        client.login_or_fail("blank@example.com")

        assert client.post("/api/v1/departments", json={"name": "   "}).status_code == 422

    def test_invalid_uuid_path_parameter_is_422(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user_with_permissions(organization, (DEPARTMENT_READ,), email="uuid@example.com")
        client.login_or_fail("uuid@example.com")

        assert client.get("/api/v1/departments/definitely-not-a-uuid").status_code == 422

    def test_invalid_email_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (USER_READ, USER_CREATE), email="email@example.com"
        )
        client.login_or_fail("email@example.com")

        response = client.post(
            "/api/v1/users", json={"full_name": "Bad Email", "email": "not-an-email"}
        )
        assert response.status_code == 422

    def test_invalid_timezone_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (ORGANIZATION_READ, ORGANIZATION_UPDATE), email="tz@example.com"
        )
        client.login_or_fail("tz@example.com")

        etag = client.get("/api/v1/organizations/current").headers["ETag"]
        response = client.patch(
            "/api/v1/organizations/current", json={"timezone": "Mars/Olympus_Mons"}, etag=etag
        )
        assert response.status_code == 422

    def test_empty_patch_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        department = factory.department(organization)
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="empty@example.com"
        )
        client.login_or_fail("empty@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        response = client.patch(f"/api/v1/departments/{department.id}", json={}, etag=etag)
        assert response.status_code == 422

    def test_pagination_limit_is_bounded(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user_with_permissions(organization, (DEPARTMENT_READ,), email="page@example.com")
        client.login_or_fail("page@example.com")

        assert client.get("/api/v1/departments?limit=100").status_code == 200
        assert client.get("/api/v1/departments?limit=100000").status_code == 422

    def test_oversized_chunked_body_without_content_length_is_rejected(
        self, client: ApiClient, settings: Settings
    ) -> None:
        """The limit must hold when ``Content-Length`` is absent.

        httpx sends a generator body with ``Transfer-Encoding: chunked`` and no
        ``Content-Length``, so a header-only check would let this through and the
        application would buffer the whole payload.
        """
        limit = settings.max_request_body_bytes

        def oversized() -> Iterator[bytes]:
            sent = 0
            chunk = b"x" * 8192
            while sent <= limit:
                sent += len(chunk)
                yield chunk

        response = client.raw.post(
            "/api/v1/auth/login",
            content=oversized(),
            headers={"Origin": TEST_ORIGIN, "Content-Type": "application/json"},
        )
        assert response.status_code == 413
        assert response.json()["code"] == "payload_too_large"

    def test_understated_content_length_is_still_rejected(
        self, client: ApiClient, settings: Settings
    ) -> None:
        """A client that lies about its length is caught by the streaming counter."""
        limit = settings.max_request_body_bytes
        payload = b"y" * (limit + 4096)

        response = client.raw.post(
            "/api/v1/auth/login",
            content=payload,
            headers={
                "Origin": TEST_ORIGIN,
                "Content-Type": "application/json",
                "Content-Length": "10",
            },
        )
        assert response.status_code in {400, 413}

    def test_a_body_under_the_limit_without_content_length_still_works(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Normal request parsing must not be broken by the streaming limit."""
        organization = factory.organization()
        factory.user(organization, email="chunkedok@example.com")
        factory.session.commit()

        def small() -> Iterator[bytes]:
            yield json.dumps({"email": "chunkedok@example.com", "password": TEST_PASSWORD}).encode()

        response = client.raw.post(
            "/api/v1/auth/login",
            content=small(),
            headers={"Origin": TEST_ORIGIN, "Content-Type": "application/json"},
        )
        assert response.status_code == 200

    def test_oversized_body_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="big@example.com"
        )
        client.login_or_fail("big@example.com")

        response = client.post("/api/v1/departments", json={"name": "x", "note": "y" * 400_000})
        assert response.status_code == 413


class TestSelfProtection:
    def test_a_user_cannot_disable_their_own_account(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Would revoke the caller's own session and could leave the organization
        with no authorized administrator."""
        organization = factory.organization()
        me = factory.user_with_permissions(
            organization, (USER_READ, USER_UPDATE), email="selfdisable@example.com"
        )
        client.login_or_fail("selfdisable@example.com")

        etag = client.get(f"/api/v1/users/{me.id}").headers["ETag"]
        response = client.patch(f"/api/v1/users/{me.id}", json={"is_active": False}, etag=etag)
        assert response.status_code == 422
        assert "your own account" in response.json()["detail"]

    def test_disabling_another_user_revokes_their_sessions(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        target = factory.user(organization, email="tobedisabled@example.com")
        factory.user_with_permissions(
            organization, (USER_READ, USER_UPDATE), email="disabler@example.com"
        )
        target_id = target.id

        client.login_or_fail("tobedisabled@example.com")
        assert client.get("/api/v1/auth/me").status_code == 200
        client.raw.cookies.clear()

        client.login_or_fail("disabler@example.com")
        etag = client.get(f"/api/v1/users/{target_id}").headers["ETag"]
        response = client.patch(
            f"/api/v1/users/{target_id}",
            json={"is_active": False, "disabled_reason": "left the organization"},
            etag=etag,
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False

        db_session.expire_all()
        sessions = list(
            db_session.execute(
                select(UserSession).where(UserSession.user_id == target_id)
            ).scalars()
        )
        assert sessions
        assert all(record.revoked_reason == "account_disabled" for record in sessions)

        # The disablement itself is audited.
        actions = set(db_session.execute(select(AuditEvent.action)).scalars())
        assert "user.disabled" in actions
