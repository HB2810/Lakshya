"""Audit foundation behaviour (ADR-005, ARCHITECTURE.md §11).

Asserts four properties:

1. Real mutations write audit events with actor, entity, before/after and
   correlation ID.
2. Audit rows are append-only, enforced by the database.
3. The audit insert is atomic with its mutation — a rolled-back mutation leaves
   no audit row.
4. No audit payload ever carries password material, hashes or session tokens.

No test fabricates an audit event to demonstrate the feature: every event below
is a side effect of a real request.
"""

from __future__ import annotations

import json

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from app.modules.access.catalog import (
    DEPARTMENT_CREATE,
    DEPARTMENT_READ,
    DEPARTMENT_UPDATE,
    ORGANIZATION_READ,
    ORGANIZATION_UPDATE,
    ROLE_ASSIGN,
    ROLE_CREATE,
    ROLE_PERMISSION_MANAGE,
    ROLE_READ,
    USER_CREATE,
    USER_READ,
    USER_UPDATE,
)
from app.modules.audit.models import AuditEvent
from tests.conftest import TEST_PASSWORD, ApiClient, Factory

pytestmark = pytest.mark.db


def _events(session: Session, action: str | None = None) -> list[AuditEvent]:
    query = select(AuditEvent).order_by(AuditEvent.occurred_at)
    if action is not None:
        query = query.where(AuditEvent.action == action)
    return list(session.execute(query).scalars())


class TestAuthenticationEvents:
    def test_successful_login_is_audited(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="audited@example.com")
        factory.session.commit()

        client.login_or_fail("audited@example.com")

        events = _events(db_session, "auth.login.succeeded")
        assert len(events) == 1
        event = events[0]
        assert event.actor_user_id == user.id
        assert event.organization_id == organization.id
        assert event.entity_type == "session"
        assert event.source == "api"
        assert event.actor_type == "user"
        assert event.correlation_id

    def test_failed_login_is_audited_with_a_reason(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="failed@example.com")
        factory.session.commit()

        client.login("failed@example.com", "the-wrong-password")

        events = _events(db_session, "auth.login.failed")
        assert len(events) == 1
        event = events[0]
        assert event.reason == "invalid_password"

        # ADR-007: a pre-authentication failure stays anonymous even though the
        # target account resolved. Recording the caller as that user would assert
        # an identity the failed attempt never proved.
        assert event.actor_type == "anonymous"
        assert event.actor_user_id is None

        # The resolved account is the target ENTITY, which is what makes the
        # event useful for monitoring without claiming who the caller was.
        assert event.entity_type == "user"
        assert event.entity_id == user.id
        assert event.organization_id == organization.id

    def test_unknown_account_failure_has_no_organization(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """A pre-authentication event where no tenant can be resolved."""
        factory.organization()
        factory.session.commit()

        client.login("does-not-exist@example.com", TEST_PASSWORD)

        events = _events(db_session, "auth.login.failed")
        assert len(events) == 1
        assert events[0].organization_id is None
        assert events[0].actor_type == "anonymous"
        assert events[0].reason == "unknown_account"

    def test_submitted_address_is_not_recorded(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """An audit table full of attempted addresses is itself a disclosure risk."""
        factory.organization()
        factory.session.commit()

        client.login("someone.private@example.com", TEST_PASSWORD)

        events = _events(db_session, "auth.login.failed")
        payload = json.dumps(
            {
                "before": events[0].before_state,
                "after": events[0].after_state,
                "reason": events[0].reason,
            }
        )
        assert "someone.private" not in payload

    def test_disabled_account_failure_records_the_reason(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="blocked@example.com", is_active=False)
        factory.session.commit()

        client.login("blocked@example.com")

        events = _events(db_session, "auth.login.failed")
        assert events[0].reason == "account_disabled"

    def test_logout_is_audited(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="loggedout@example.com")
        factory.session.commit()
        client.login_or_fail("loggedout@example.com")

        client.post("/api/v1/auth/logout")

        events = _events(db_session, "auth.logout")
        assert len(events) == 1
        assert events[0].after_state is not None
        assert events[0].after_state["revoked_reason"] == "logout"


class TestMutationEvents:
    def test_department_creation_is_audited(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        actor = factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="creator@example.com"
        )
        client.login_or_fail("creator@example.com")

        created = client.post(
            "/api/v1/departments", json={"name": "Radiology", "code": "RAD", "reason": "new unit"}
        )
        assert created.status_code == 201

        events = _events(db_session, "department.created")
        assert len(events) == 1
        event = events[0]
        assert event.entity_id is not None and str(event.entity_id) == created.json()["id"]
        assert event.actor_user_id == actor.id
        assert event.reason == "new unit"
        assert event.before_state is None
        assert event.after_state is not None
        assert event.after_state["name"] == "Radiology"
        assert event.after_state["code"] == "RAD"

    def test_update_records_previous_and_new_values(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """ADR-005: "Previous/new values are retained where applicable"."""
        organization = factory.organization()
        department = factory.department(organization, name="Original Name")
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="updater@example.com"
        )
        client.login_or_fail("updater@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        client.patch(
            f"/api/v1/departments/{department.id}",
            json={"name": "Renamed Unit", "reason": "reorganisation"},
            etag=etag,
        )

        events = _events(db_session, "department.updated")
        assert len(events) == 1
        event = events[0]
        assert event.before_state == {"name": "Original Name", "version": 1}
        assert event.after_state == {"name": "Renamed Unit", "version": 2}
        assert event.reason == "reorganisation"

    def test_only_changed_fields_are_recorded(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """Keeps "what changed" obvious to a reviewer."""
        organization = factory.organization()
        department = factory.department(organization, name="Stable", code="STB")
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="diff@example.com"
        )
        client.login_or_fail("diff@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        client.patch(f"/api/v1/departments/{department.id}", json={"code": "NEW"}, etag=etag)

        event = _events(db_session, "department.updated")[0]
        assert event.before_state is not None
        assert set(event.before_state) == {"code", "version"}
        assert "name" not in event.before_state

    def test_organization_update_is_audited(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization(name="Before Rename")
        factory.user_with_permissions(
            organization, (ORGANIZATION_READ, ORGANIZATION_UPDATE), email="orged@example.com"
        )
        client.login_or_fail("orged@example.com")

        etag = client.get("/api/v1/organizations/current").headers["ETag"]
        client.patch("/api/v1/organizations/current", json={"name": "After Rename"}, etag=etag)

        event = _events(db_session, "organization.updated")[0]
        assert event.before_state is not None and event.before_state["name"] == "Before Rename"
        assert event.after_state is not None and event.after_state["name"] == "After Rename"

    def test_user_provisioning_is_audited(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (USER_READ, USER_CREATE), email="hr@example.com"
        )
        client.login_or_fail("hr@example.com")

        client.post(
            "/api/v1/users",
            json={
                "full_name": "New Colleague",
                "email": "new@example.com",
                "initial_password": "a-temporary-local-password",
            },
        )

        actions = {event.action for event in _events(db_session)}
        assert "user.created" in actions
        assert "credential.created" in actions

    def test_access_administration_is_audited(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """SECURITY.md §4: "auditing all grants"."""
        organization = factory.organization()
        target = factory.user(organization, email="grantee@example.com")
        factory.user_with_permissions(
            organization,
            (ROLE_READ, ROLE_CREATE, ROLE_PERMISSION_MANAGE, ROLE_ASSIGN, DEPARTMENT_READ),
            email="access-admin@example.com",
        )
        client.login_or_fail("access-admin@example.com")

        role_id = client.post(
            "/api/v1/roles", json={"key": "audited_role", "name": "Audited Role"}
        ).json()["id"]
        client.post(
            f"/api/v1/roles/{role_id}/permissions", json={"permission_key": DEPARTMENT_READ}
        )
        assignment_id = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(target.id),
                "role_id": role_id,
                "scope_type": "organization",
            },
        ).json()["id"]
        client.delete(
            f"/api/v1/role-assignments/{assignment_id}", json={"reason": "no longer required"}
        )

        actions = [event.action for event in _events(db_session)]
        for expected in (
            "role.created",
            "role.permission.granted",
            "role_assignment.created",
            "role_assignment.ended",
        ):
            assert expected in actions, f"{expected} was not audited"

        ended = _events(db_session, "role_assignment.ended")[0]
        assert ended.reason == "no longer required"

    def test_membership_changes_are_audited(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        department = factory.department(organization)
        target = factory.user(organization, email="moved@example.com")
        factory.user_with_permissions(
            organization,
            (USER_READ, USER_UPDATE, DEPARTMENT_READ),
            email="mover@example.com",
        )
        client.login_or_fail("mover@example.com")

        membership_id = client.post(
            f"/api/v1/users/{target.id}/department-memberships",
            json={"department_id": str(department.id)},
        ).json()["id"]
        client.post(
            f"/api/v1/users/{target.id}/department-memberships/{membership_id}:end",
            json={"reason": "transferred"},
        )

        actions = {event.action for event in _events(db_session)}
        assert "department_membership.created" in actions
        assert "department_membership.ended" in actions


class TestAppendOnly:
    def test_update_is_blocked_by_the_database(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """ADR-005: the runtime role cannot update audit rows."""
        organization = factory.organization()
        factory.user(organization, email="immutable@example.com")
        factory.session.commit()
        client.login_or_fail("immutable@example.com")

        event = _events(db_session, "auth.login.succeeded")[0]

        with pytest.raises(DBAPIError, match="append-only"):
            db_session.execute(
                text("UPDATE audit_events SET action = 'tampered' WHERE id = :id"),
                {"id": event.id},
            )
        db_session.rollback()

        assert _events(db_session, "auth.login.succeeded")[0].action == "auth.login.succeeded"

    def test_delete_is_blocked_by_the_database(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="undeletable@example.com")
        factory.session.commit()
        client.login_or_fail("undeletable@example.com")

        event = _events(db_session, "auth.login.succeeded")[0]

        with pytest.raises(DBAPIError, match="append-only"):
            db_session.execute(text("DELETE FROM audit_events WHERE id = :id"), {"id": event.id})
        db_session.rollback()

        assert _events(db_session, "auth.login.succeeded")

    def test_maintenance_escape_hatch_requires_an_explicit_session_setting(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """Approved retention work must be deliberate and therefore visible."""
        organization = factory.organization()
        factory.user(organization, email="retained@example.com")
        factory.session.commit()
        client.login_or_fail("retained@example.com")

        event_id = _events(db_session, "auth.login.succeeded")[0].id

        db_session.execute(text("SET LOCAL lakshya.audit_maintenance = 'on'"))
        db_session.execute(text("DELETE FROM audit_events WHERE id = :id"), {"id": event_id})
        db_session.commit()

        assert db_session.get(AuditEvent, event_id) is None


class TestAtomicity:
    def test_a_rejected_mutation_leaves_no_audit_row(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """ADR-005: the audit insert shares the mutation's transaction."""
        organization = factory.organization()
        factory.department(organization, name="Existing")
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="atomic@example.com"
        )
        client.login_or_fail("atomic@example.com")

        before = len(_events(db_session, "department.created"))

        # Rejected by the duplicate-name rule, after authorization succeeded.
        assert client.post("/api/v1/departments", json={"name": "Existing"}).status_code == 409

        db_session.expire_all()
        assert len(_events(db_session, "department.created")) == before

    def test_a_denied_request_creates_no_mutation_audit_row(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user_with_permissions(organization, (DEPARTMENT_READ,), email="denied@example.com")
        client.login_or_fail("denied@example.com")

        assert client.post("/api/v1/departments", json={"name": "Attempted"}).status_code == 403

        db_session.expire_all()
        assert _events(db_session, "department.created") == []


class TestNoSecretsInAudit:
    def test_no_audit_payload_contains_secret_material(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """Sweeps every event produced by a realistic sequence of requests."""
        organization = factory.organization()
        department = factory.department(organization)
        target = factory.user(organization, email="subject@example.com")
        factory.user_with_permissions(
            organization,
            (
                ORGANIZATION_READ,
                ORGANIZATION_UPDATE,
                DEPARTMENT_READ,
                DEPARTMENT_CREATE,
                DEPARTMENT_UPDATE,
                USER_READ,
                USER_CREATE,
                USER_UPDATE,
                ROLE_READ,
                ROLE_CREATE,
                ROLE_PERMISSION_MANAGE,
                ROLE_ASSIGN,
            ),
            email="busy@example.com",
        )

        # Exercise a broad set of audited paths.
        client.login("busy@example.com", "wrong-password-first")
        client.login_or_fail("busy@example.com")
        client.post("/api/v1/departments", json={"name": "Audited Unit"})
        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        client.patch(f"/api/v1/departments/{department.id}", json={"name": "Renamed"}, etag=etag)
        client.post(
            "/api/v1/users",
            json={
                "full_name": "Provisioned",
                "email": "provisioned@example.com",
                "initial_password": "a-secret-initial-password",
            },
        )
        role_id = client.post(
            "/api/v1/roles", json={"key": "sweep_role", "name": "Sweep Role"}
        ).json()["id"]
        client.post(
            f"/api/v1/roles/{role_id}/permissions", json={"permission_key": DEPARTMENT_READ}
        )
        client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(target.id),
                "role_id": role_id,
                "scope_type": "organization",
            },
        )
        client.post(
            "/api/v1/auth/password/change",
            json={
                "current_password": TEST_PASSWORD,
                "new_password": "a-brand-new-secret-passphrase",
            },
        )

        events = _events(db_session)
        assert len(events) >= 8, "the sweep did not produce enough events to be meaningful"

        payload = json.dumps(
            [
                {
                    "action": event.action,
                    "before": event.before_state,
                    "after": event.after_state,
                    "reason": event.reason,
                }
                for event in events
            ]
        )

        for secret in (
            TEST_PASSWORD,
            "wrong-password-first",
            "a-secret-initial-password",
            "a-brand-new-secret-passphrase",
            "$argon2id$",
        ):
            assert secret not in payload, f"{secret!r} leaked into an audit payload"

        for forbidden_key in ("password_hash", "token_hash", "csrf_token_hash"):
            assert forbidden_key not in payload

    def test_credential_events_record_state_not_material(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="pwchange@example.com")
        factory.session.commit()
        client.login_or_fail("pwchange@example.com")

        client.post(
            "/api/v1/auth/password/change",
            json={"current_password": TEST_PASSWORD, "new_password": "another-fine-passphrase"},
        )

        event = _events(db_session, "credential.password_changed")[0]
        assert event.after_state is not None
        assert set(event.after_state) <= {"user_id", "algorithm", "must_change_password"}
        assert "password_hash" not in event.after_state


class TestCorrelation:
    def test_events_from_one_request_share_its_correlation_id(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """ARCHITECTURE.md §11 requires a request/correlation ID on each event."""
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (USER_READ, USER_CREATE), email="corr@example.com"
        )
        client.login_or_fail("corr@example.com")

        response = client.post(
            "/api/v1/users",
            json={
                "full_name": "Correlated",
                "email": "correlated@example.com",
                "initial_password": "a-temporary-local-password",
            },
        )
        correlation_id = response.headers["X-Correlation-Id"]

        request_events = [
            event
            for event in _events(db_session)
            if event.action in {"user.created", "credential.created"}
        ]
        assert len(request_events) == 2
        assert {event.correlation_id for event in request_events} == {correlation_id}
