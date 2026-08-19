"""Authentication behaviour (ADR-002, SECURITY.md §3).

Covers valid login, invalid password, disabled account, logout, expired session,
revoked session, session rotation, cookie attributes and upgrade-on-login.
"""

from __future__ import annotations

from datetime import timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.config import Settings
from app.core.security import PasswordHasherService, hash_opaque_token
from app.modules.access.catalog import ORGANIZATION_READ
from app.modules.identity.models import Credential, User, UserSession
from tests.conftest import TEST_PASSWORD, ApiClient, Factory

pytestmark = pytest.mark.db


class TestValidLogin:
    def test_login_succeeds_and_returns_identity(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization(slug="stavya-test")
        user = factory.user(organization, email="md.office@example.com")
        factory.session.commit()

        response = client.login("md.office@example.com")

        assert response.status_code == 200
        body = response.json()
        assert body["user"]["id"] == str(user.id)
        assert body["user"]["email"] == "md.office@example.com"
        assert body["organization_slug"] == "stavya-test"
        assert body["session"]["id"]

    def test_login_is_case_insensitive_on_email(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user(organization, email="Priya.Sharma@Example.Com")
        factory.session.commit()

        assert client.login("priya.sharma@example.com").status_code == 200

    def test_login_sets_secure_session_and_csrf_cookies(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="cookies@example.com")
        factory.session.commit()

        response = client.login("cookies@example.com")

        raw_cookies = response.headers.get_list("set-cookie")
        session_cookie = next(c for c in raw_cookies if c.startswith("lakshya_session="))
        csrf_cookie = next(c for c in raw_cookies if c.startswith("lakshya_csrf="))

        # The session identifier must be unreadable by script (ADR-002).
        assert "HttpOnly" in session_cookie
        assert "samesite=lax" in session_cookie.lower()
        assert "Path=/" in session_cookie

        # The CSRF token is readable on purpose: the client echoes it in a header.
        assert "HttpOnly" not in csrf_cookie

    def test_only_a_hash_of_the_session_token_is_stored(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="hashed@example.com")
        factory.session.commit()

        client.login_or_fail("hashed@example.com")
        token = client.session_cookie
        assert token

        record = db_session.execute(select(UserSession)).scalar_one()
        assert record.token_hash != token
        assert token not in record.token_hash
        assert record.token_hash == hash_opaque_token(token)

    def test_last_login_is_recorded(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="stamped@example.com")
        factory.session.commit()
        assert user.last_login_at is None

        client.login_or_fail("stamped@example.com")

        db_session.expire_all()
        refreshed = db_session.get(User, user.id)
        assert refreshed is not None
        assert refreshed.last_login_at is not None


class TestRejectedLogin:
    def test_wrong_password_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user(organization, email="person@example.com")
        factory.session.commit()

        response = client.login("person@example.com", "definitely-the-wrong-password")

        assert response.status_code == 401
        assert response.json()["code"] == "authentication_failed"
        assert client.session_cookie is None

    def test_unknown_account_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        factory.organization()
        factory.session.commit()
        assert client.login("nobody@example.com").status_code == 401

    def test_failure_messages_are_indistinguishable(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """SECURITY.md §3: a generic failure, so accounts cannot be enumerated."""
        organization = factory.organization()
        factory.user(organization, email="real@example.com")
        factory.user(organization, email="disabled@example.com", is_active=False)
        factory.session.commit()

        bodies = [
            client.login("real@example.com", "wrong-password").json(),
            client.login("nobody@example.com", TEST_PASSWORD).json(),
            client.login("disabled@example.com", TEST_PASSWORD).json(),
        ]

        assert {body["status"] for body in bodies} == {401}
        assert len({body["detail"] for body in bodies}) == 1
        assert len({body["code"] for body in bodies}) == 1

    def test_disabled_user_cannot_log_in(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user(organization, email="gone@example.com", is_active=False)
        factory.session.commit()

        assert client.login("gone@example.com").status_code == 401
        assert client.session_cookie is None

    def test_user_without_credential_cannot_log_in(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """An account provisioned without an initial password cannot sign in."""
        organization = factory.organization()
        factory.user(organization, email="nocred@example.com", password=None)
        factory.session.commit()

        assert client.login("nocred@example.com").status_code == 401

    def test_inactive_organization_blocks_login(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization(is_active=False)
        factory.user(organization, email="closed@example.com")
        factory.session.commit()

        assert client.login("closed@example.com").status_code == 401

    def test_failed_attempt_is_counted_for_monitoring(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="counted@example.com")
        factory.session.commit()

        client.login("counted@example.com", "wrong-password")

        db_session.expire_all()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        assert credential.failed_attempt_count == 1
        assert credential.last_failed_at is not None

    def test_successful_login_clears_the_failure_counter(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="recovered@example.com")
        factory.session.commit()

        client.login("recovered@example.com", "wrong-password")
        client.login_or_fail("recovered@example.com")

        db_session.expire_all()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        assert credential.failed_attempt_count == 0
        assert credential.last_verified_at is not None


class TestAmbiguousEmail:
    def test_same_email_in_two_organizations_requires_a_slug(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Email is unique per organization, not globally (DATABASE.md §2)."""
        first = factory.organization(slug="org-one")
        second = factory.organization(slug="org-two")
        factory.user(first, email="shared@example.com")
        factory.user(second, email="shared@example.com")
        factory.session.commit()

        # Ambiguous without a slug: refusing is safer than guessing a tenant.
        assert client.login("shared@example.com").status_code == 401

        response = client.login("shared@example.com", organization_slug="org-two")
        assert response.status_code == 200
        assert response.json()["organization_slug"] == "org-two"

    def test_slug_cannot_reach_another_organizations_account(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """The slug disambiguates; it never widens access."""
        first = factory.organization(slug="alpha")
        factory.organization(slug="beta")
        factory.user(first, email="only-in-alpha@example.com")
        factory.session.commit()

        assert (
            client.login("only-in-alpha@example.com", organization_slug="beta").status_code == 401
        )


class TestCurrentIdentity:
    def test_me_requires_authentication(self, client: ApiClient) -> None:
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401
        assert response.json()["code"] == "authentication_required"

    def test_me_reports_roles_and_permissions(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        department = factory.department(organization)
        user = factory.user_with_permissions(
            organization,
            (ORGANIZATION_READ,),
            email="reader@example.com",
            departments=(department,),
        )
        client.login_or_fail("reader@example.com")

        body = client.get("/api/v1/auth/me").json()

        assert body["user"]["id"] == str(user.id)
        assert body["permissions"] == [ORGANIZATION_READ]
        assert len(body["roles"]) == 1
        assert body["department_ids"] == [str(department.id)]
        assert body["must_change_password"] is False

    def test_fresh_database_grants_no_permissions(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """ADR-006: unresolved role grants must not be seeded."""
        organization = factory.organization()
        factory.user(organization, email="ungranted@example.com")
        factory.session.commit()
        client.login_or_fail("ungranted@example.com")

        body = client.get("/api/v1/auth/me").json()
        assert body["permissions"] == []
        assert body["roles"] == []


class TestLogout:
    def test_logout_revokes_the_session(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="bye@example.com")
        factory.session.commit()
        client.login_or_fail("bye@example.com")

        assert client.post("/api/v1/auth/logout").status_code == 204

        db_session.expire_all()
        record = db_session.execute(select(UserSession)).scalar_one()
        assert record.revoked_at is not None
        assert record.revoked_reason == "logout"

    def test_session_is_unusable_after_logout(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user(organization, email="bye2@example.com")
        factory.session.commit()
        client.login_or_fail("bye2@example.com")

        client.post("/api/v1/auth/logout")

        # Even if the client keeps the cookie, the server-side record is dead.
        assert client.get("/api/v1/auth/me").status_code == 401

    def test_logout_requires_authentication(self, client: ApiClient) -> None:
        assert client.post("/api/v1/auth/logout").status_code == 401


class TestSessionExpiry:
    def test_absolute_expiry_rejects_the_session(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="expired@example.com")
        factory.session.commit()
        client.login_or_fail("expired@example.com")

        record = db_session.execute(select(UserSession)).scalar_one()
        # ``issued_at`` moves back too: the ``expires_at > issued_at`` CHECK
        # constraint is a real invariant, so simulating an expired session means
        # simulating one that was issued in the past, not one that expired before
        # it was created.
        record.issued_at = utcnow() - timedelta(hours=2)
        record.expires_at = utcnow() - timedelta(minutes=1)
        db_session.commit()

        assert client.get("/api/v1/auth/me").status_code == 401

        db_session.expire_all()
        expired = db_session.get(UserSession, record.id)
        assert expired is not None
        assert expired.revoked_reason == "absolute_expiry"

    def test_inactivity_expiry_rejects_the_session(
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

        db_session.expire_all()
        timed_out = db_session.get(UserSession, record.id)
        assert timed_out is not None
        assert timed_out.revoked_reason == "idle_timeout"

    def test_activity_extends_the_idle_window(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="active@example.com")
        factory.session.commit()
        client.login_or_fail("active@example.com")

        record = db_session.execute(select(UserSession)).scalar_one()
        original = record.last_activity_at
        record.last_activity_at = utcnow() - timedelta(minutes=5)
        db_session.commit()

        assert client.get("/api/v1/auth/me").status_code == 200

        db_session.expire_all()
        refreshed = db_session.get(UserSession, record.id)
        assert refreshed is not None
        assert refreshed.last_activity_at > utcnow() - timedelta(minutes=1)
        assert refreshed.last_activity_at != original

    def test_manually_revoked_session_is_rejected(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """The property stateless browser JWTs cannot provide."""
        organization = factory.organization()
        factory.user(organization, email="revoked@example.com")
        factory.session.commit()
        client.login_or_fail("revoked@example.com")

        record = db_session.execute(select(UserSession)).scalar_one()
        record.revoked_at = utcnow()
        record.revoked_reason = "security_action"
        db_session.commit()

        assert client.get("/api/v1/auth/me").status_code == 401

    def test_forged_session_token_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user(organization, email="forged@example.com")
        factory.session.commit()

        client.raw.cookies.set("lakshya_session", "a-token-that-was-never-issued")
        assert client.get("/api/v1/auth/me").status_code == 401


class TestDisabledMidSession:
    def test_disabling_an_account_kills_its_live_session(
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

        db_session.expire_all()
        record = db_session.execute(select(UserSession)).scalar_one()
        assert record.revoked_reason == "account_disabled"


class TestSessionRotation:
    def test_login_rotates_an_existing_session(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """ADR-002: "Rotate on login"."""
        organization = factory.organization()
        factory.user(organization, email="rotate@example.com")
        factory.session.commit()

        client.login_or_fail("rotate@example.com")
        first_token = client.session_cookie
        client.login_or_fail("rotate@example.com")
        second_token = client.session_cookie

        assert first_token != second_token

        db_session.expire_all()
        records = list(db_session.execute(select(UserSession)).scalars())
        assert len(records) == 2
        rotated = next(r for r in records if r.revoked_reason == "rotated")
        current = next(r for r in records if r.revoked_at is None)
        assert current.rotated_from_session_id == rotated.id


class TestPasswordChange:
    def test_password_change_rotates_the_session_and_updates_the_hash(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="changer@example.com")
        factory.session.commit()
        client.login_or_fail("changer@example.com")
        original_token = client.session_cookie

        original_hash = db_session.execute(
            select(Credential.password_hash).where(Credential.user_id == user.id)
        ).scalar_one()

        response = client.post(
            "/api/v1/auth/password/change",
            json={
                "current_password": TEST_PASSWORD,
                "new_password": "an-entirely-different-passphrase",
            },
        )

        assert response.status_code == 200
        assert client.session_cookie != original_token

        db_session.expire_all()
        new_hash = db_session.execute(
            select(Credential.password_hash).where(Credential.user_id == user.id)
        ).scalar_one()
        assert new_hash != original_hash
        assert "an-entirely-different-passphrase" not in new_hash

        # Old password no longer works; new one does.
        client.raw.cookies.clear()
        assert client.login("changer@example.com", TEST_PASSWORD).status_code == 401
        assert (
            client.login("changer@example.com", "an-entirely-different-passphrase").status_code
            == 200
        )

    def test_wrong_current_password_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user(organization, email="reauth@example.com")
        factory.session.commit()
        client.login_or_fail("reauth@example.com")

        response = client.post(
            "/api/v1/auth/password/change",
            json={"current_password": "not-my-password", "new_password": "a-brand-new-passphrase"},
        )
        assert response.status_code == 401

    def test_short_password_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user(organization, email="short@example.com")
        factory.session.commit()
        client.login_or_fail("short@example.com")

        response = client.post(
            "/api/v1/auth/password/change",
            json={"current_password": TEST_PASSWORD, "new_password": "tooshort"},
        )
        assert response.status_code == 422
        assert "new_password" in response.json()["field_errors"]

    def test_reusing_the_current_password_is_rejected(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="reuse@example.com")
        factory.session.commit()
        client.login_or_fail("reuse@example.com")

        response = client.post(
            "/api/v1/auth/password/change",
            json={"current_password": TEST_PASSWORD, "new_password": TEST_PASSWORD},
        )
        assert response.status_code == 422

    def test_other_sessions_are_revoked(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="multi@example.com")
        factory.session.commit()
        client.login_or_fail("multi@example.com")

        client.post(
            "/api/v1/auth/password/change",
            json={"current_password": TEST_PASSWORD, "new_password": "yet-another-passphrase"},
        )

        db_session.expire_all()
        revoked = list(
            db_session.execute(
                select(UserSession).where(
                    UserSession.user_id == user.id,
                    UserSession.revoked_reason == "password_changed",
                )
            ).scalars()
        )
        assert revoked


class TestForcedPasswordChange:
    def test_account_with_must_change_password_is_gated(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """An administrator-set password cannot remain the account's credential."""
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (ORGANIZATION_READ,), email="forced@example.com"
        )
        credential = factory.session.execute(select(Credential)).scalar_one()
        credential.must_change_password = True
        factory.session.commit()

        body = client.login_or_fail("forced@example.com").json()
        assert body["must_change_password"] is True

        # /auth/me stays reachable so the client can discover the requirement.
        assert client.get("/api/v1/auth/me").status_code == 200

        blocked = client.get("/api/v1/organizations/current")
        assert blocked.status_code == 403
        assert blocked.json()["code"] == "password_change_required"

    def test_changing_the_password_clears_the_gate(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (ORGANIZATION_READ,), email="unblock@example.com"
        )
        credential = factory.session.execute(select(Credential)).scalar_one()
        credential.must_change_password = True
        factory.session.commit()

        client.login_or_fail("unblock@example.com")
        response = client.post(
            "/api/v1/auth/password/change",
            json={"current_password": TEST_PASSWORD, "new_password": "a-freshly-chosen-passphrase"},
        )
        assert response.status_code == 200
        assert response.json()["must_change_password"] is False
        assert client.get("/api/v1/organizations/current").status_code == 200


class TestUpgradeOnLogin:
    def test_weakly_hashed_password_is_rehashed_on_login(
        self,
        client: ApiClient,
        factory: Factory,
        db_session: Session,
        settings: Settings,
    ) -> None:
        """SECURITY.md §3: Argon2id "with ... upgrade-on-login"."""
        weak_hasher = PasswordHasherService(
            settings.model_copy(update={"argon2_time_cost": 1, "argon2_memory_cost_kib": 8192})
        )
        organization = factory.organization()
        user = factory.user(organization, email="upgrade@example.com", password=None)
        credential = Credential(
            organization_id=organization.id,
            user_id=user.id,
            password_hash=weak_hasher.hash(TEST_PASSWORD),
            password_updated_at=utcnow(),
        )
        factory.session.add(credential)
        factory.session.commit()
        stale_hash = credential.password_hash

        # A hasher configured with stronger parameters than the stored hash.
        client.app.state.password_hasher = PasswordHasherService(
            settings.model_copy(update={"argon2_time_cost": 3, "argon2_memory_cost_kib": 16384})
        )

        assert client.login("upgrade@example.com").status_code == 200

        db_session.expire_all()
        refreshed = db_session.get(Credential, credential.id)
        assert refreshed is not None
        assert refreshed.password_hash != stale_hash
