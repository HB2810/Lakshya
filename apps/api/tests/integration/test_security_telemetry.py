"""ADR-007: security telemetry survives the rejected request that produced it.

The eight persistence behaviours ADR-007 was written to fix are asserted in
``test_authentication.py`` and ``test_audit.py``, alongside the rejection they
accompany. This module covers the *boundary itself*: that the independent
transaction commits only allow-listed effects, commits them atomically, never
alters the response, and behaves correctly under concurrency and a one-connection
pool.
"""

from __future__ import annotations

import json
import threading
import time
import uuid
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Any, cast

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, func, select, text, update
from sqlalchemy.orm import Session
from sqlalchemy.pool import QueuePool

from app.core.clock import as_utc, utcnow
from app.core.config import Settings
from app.core.security_effects import (
    REASON_ACCOUNT_DISABLED,
    REASON_IDLE_TIMEOUT,
    SecurityEffect,
    SecurityEffectKind,
)
from app.db.session import build_engine, build_session_factory
from app.main import create_app
from app.modules.audit.models import AuditEvent
from app.modules.identity.models import Credential, UserSession
from app.modules.identity.telemetry import (
    TELEMETRY_FAILURE_EVENT,
    SecurityTelemetryWriter,
    build_security_telemetry_writer,
)
from app.modules.organization.models import Department
from tests.conftest import TEST_ORIGIN, ApiClient, Factory

pytestmark = pytest.mark.db


#: Every Phase 2 tenant table, so the allow-list test cannot silently narrow.
_PHASE2_TABLES: tuple[str, ...] = (
    "audit_events",
    "sessions",
    "credentials",
    "department_memberships",
    "role_assignments",
    "role_permissions",
    "departments",
    "users",
    "organizations",
    "roles",
)


def _table_counts(session: Session) -> dict[str, int]:
    return {
        # Table names come from the module-level constant, never from input.
        table: session.execute(text(f"SELECT count(*) FROM {table}")).scalar_one()  # noqa: S608
        for table in _PHASE2_TABLES
    }


def _effect_for(
    kind: SecurityEffectKind, factory: Factory, organization: Any, user: Any
) -> SecurityEffect:
    """A valid effect of each kind, built from real rows."""
    credential = factory.session.execute(
        select(Credential).where(Credential.user_id == user.id)
    ).scalar_one()
    common = {
        "correlation_id": "dispatch-1",
        "occurred_at": utcnow(),
        "organization_id": organization.id,
        "target_user_id": user.id,
    }
    if kind is SecurityEffectKind.LOGIN_FAILURE:
        return SecurityEffect.login_failure(reason_code="unknown_account", **common)
    if kind is SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER:
        return SecurityEffect.credential_failure_counter(credential_id=credential.id, **common)
    if kind is SecurityEffectKind.SESSION_REVOCATION:
        session_row = UserSession(
            organization_id=organization.id,
            user_id=user.id,
            token_hash=f"tok-{uuid.uuid4().hex}",
            csrf_token_hash=f"csrf-{uuid.uuid4().hex}",
            issued_at=utcnow() - timedelta(hours=2),
            expires_at=utcnow() + timedelta(hours=2),
            last_activity_at=utcnow(),
        )
        factory.session.add(session_row)
        factory.session.commit()
        return SecurityEffect.session_revocation(
            session_id=session_row.id, reason_code=REASON_IDLE_TIMEOUT, **common
        )
    return SecurityEffect.user_session_revocation(reason_code=REASON_ACCOUNT_DISABLED, **common)


def _events(session: Session, action: str) -> list[AuditEvent]:
    return list(
        session.execute(
            select(AuditEvent).where(AuditEvent.action == action).order_by(AuditEvent.occurred_at)
        ).scalars()
    )


class TestIndependentCommit:
    """The security transaction commits while the request transaction does not."""

    def test_telemetry_commits_although_the_request_rolled_back(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="independent@example.com")
        factory.session.commit()

        response = client.login("independent@example.com", "wrong-password")
        assert response.status_code == 401

        # Committed by the independent transaction.
        assert len(_events(db_session, "auth.login.failed")) == 1
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        db_session.refresh(credential)
        assert credential.failed_attempt_count == 1
        assert credential.last_failed_at is not None

    def test_rejected_request_leaves_no_ordinary_mutation(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """Only the allow-listed effect survives; nothing else from the request does.

        ``last_login_at`` is written on the success path of the very same login
        use case, so its absence proves the request transaction really did roll
        back rather than partially commit.
        """
        organization = factory.organization()
        user = factory.user(organization, email="norollforward@example.com")
        factory.session.commit()

        assert client.login("norollforward@example.com", "wrong-password").status_code == 401

        db_session.refresh(user)
        assert user.last_login_at is None
        assert db_session.execute(select(func.count()).select_from(UserSession)).scalar_one() == 0

    def test_only_allow_listed_tables_are_written(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """A rejected login changes audit and the credential counter, nothing else.

        Every Phase 2 tenant table is counted, so a future handler that started
        writing somewhere new would fail here rather than pass unnoticed.
        """
        organization = factory.organization()
        user = factory.user(organization, email="scoped@example.com")
        factory.department(organization)
        factory.session.commit()

        before = _table_counts(db_session)
        credential_before = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        db_session.refresh(credential_before)
        assert credential_before.failed_attempt_count == 0

        assert client.login("scoped@example.com", "wrong-password").status_code == 401

        after = _table_counts(db_session)

        # audit_events gains exactly the one login-failure row; every other table
        # is untouched.
        assert after.pop("audit_events") == before.pop("audit_events") + 1
        assert after == before

        # The only non-audit change is the credential counter, which is an
        # update rather than an insert, so row counts alone would miss it.
        db_session.refresh(credential_before)
        assert credential_before.failed_attempt_count == 1


class TestResponseIsUnaffected:
    """A telemetry outcome never changes what the client sees."""

    def test_writer_failure_preserves_the_401(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="writerdown@example.com")
        factory.session.commit()

        failing = _FailingWriter()
        client.app.state.security_telemetry_writer = failing

        response = client.login("writerdown@example.com", "wrong-password")

        # Fail-closed for access: still a rejection, still the generic body.
        assert response.status_code == 401
        assert response.json()["code"] == "authentication_failed"
        assert response.json()["detail"] == "The supplied credentials are not valid."

        # Fail-loud operationally.
        assert failing.failure_count == 1

        # No partial security state was left behind.
        assert _events(db_session, "auth.login.failed") == []
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        db_session.refresh(credential)
        assert credential.failed_attempt_count == 0

    def test_writer_failure_is_logged_without_secrets(
        self,
        client: ApiClient,
        factory: Factory,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="loggedfailure@example.com")
        factory.session.commit()

        writer: SecurityTelemetryWriter = client.app.state.security_telemetry_writer
        original = writer._session_factory

        def explode(*args: Any, **kwargs: Any) -> Any:
            raise RuntimeError("database is unavailable")

        writer._session_factory = _BrokenFactory(explode)  # type: ignore[assignment]
        try:
            with caplog.at_level("ERROR"):
                response = client.login("loggedfailure@example.com", "hunter2-not-the-password")
        finally:
            writer._session_factory = original

        assert response.status_code == 401
        records = [r for r in caplog.records if TELEMETRY_FAILURE_EVENT in r.getMessage()]
        assert len(records) == 1

        blob = json.dumps(
            {
                "message": records[0].getMessage(),
                "kinds": getattr(records[0], "effect_kinds", None),
                "correlation": getattr(records[0], "effect_correlation_id", None),
            }
        )
        assert "hunter2-not-the-password" not in blob
        assert "loggedfailure@example.com" not in blob

    def test_effects_never_reach_the_response_body(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="nobleed@example.com")
        factory.session.commit()

        body = client.login("nobleed@example.com", "wrong-password").json()

        assert set(body) <= {
            "type",
            "title",
            "status",
            "detail",
            "instance",
            "code",
            "correlation_id",
            "field_errors",
        }
        serialised = json.dumps(body)
        for leak in ("security_effect", "credential_id", "session_id", "reason_code"):
            assert leak not in serialised


class TestCorrelation:
    def test_audit_correlation_matches_the_response(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="correlated@example.com")
        factory.session.commit()

        response = client.raw.post(
            "/api/v1/auth/login",
            json={"email": "correlated@example.com", "password": "wrong-password"},
            headers={"Origin": TEST_ORIGIN, "X-Correlation-Id": "adr007-check-1"},
        )
        assert response.status_code == 401

        event = _events(db_session, "auth.login.failed")[0]
        assert event.correlation_id == response.json()["correlation_id"] == "adr007-check-1"

    def test_correlation_id_is_sanitized_before_it_is_stored(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """An attacker-supplied header cannot inject punctuation into audit."""
        organization = factory.organization()
        factory.user(organization, email="dirtyheader@example.com")
        factory.session.commit()

        response = client.raw.post(
            "/api/v1/auth/login",
            json={"email": "dirtyheader@example.com", "password": "wrong-password"},
            headers={"Origin": TEST_ORIGIN, "X-Correlation-Id": "abc<script>/../\x00def"},
        )

        event = _events(db_session, "auth.login.failed")[0]
        assert event.correlation_id == response.json()["correlation_id"]
        assert "<" not in event.correlation_id
        assert "/" not in event.correlation_id


class TestNoSecretsPersisted:
    def test_telemetry_rows_contain_no_credential_material(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="secretfree@example.com")
        factory.session.commit()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        stored_hash = credential.password_hash

        secret = "a-very-secret-attempted-password"
        assert client.login("secretfree@example.com", secret).status_code == 401

        for event in _events(db_session, "auth.login.failed"):
            blob = json.dumps(
                {
                    "before": event.before_state,
                    "after": event.after_state,
                    "reason": event.reason,
                    "actor_label": event.actor_label,
                    "user_agent": event.user_agent,
                }
            )
            assert secret not in blob
            assert stored_hash not in blob
            assert "secretfree@example.com" not in blob

    def test_revocation_evidence_contains_no_session_token(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="tokenfree@example.com")
        factory.session.commit()
        client.login_or_fail("tokenfree@example.com")
        raw_cookie = client.session_cookie
        assert raw_cookie

        record = db_session.execute(select(UserSession)).scalar_one()
        record.issued_at = utcnow() - timedelta(hours=2)
        record.expires_at = utcnow() - timedelta(minutes=1)
        db_session.commit()

        assert client.get("/api/v1/auth/me").status_code == 401

        events = _events(db_session, "auth.session.revoked")
        assert len(events) == 1
        blob = json.dumps({"after": events[0].after_state, "reason": events[0].reason})
        assert raw_cookie not in blob
        assert record.token_hash not in blob
        assert record.csrf_token_hash not in blob


class TestIdempotentRevocation:
    def test_repeated_presentation_revokes_once_and_audits_once(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="repeat@example.com")
        factory.session.commit()
        client.login_or_fail("repeat@example.com")

        record = db_session.execute(select(UserSession)).scalar_one()
        record.last_activity_at = utcnow() - timedelta(hours=5)
        db_session.commit()

        for _ in range(4):
            assert client.get("/api/v1/auth/me").status_code == 401

        db_session.expire_all()
        revoked = db_session.get(UserSession, record.id)
        assert revoked is not None
        assert revoked.revoked_reason == REASON_IDLE_TIMEOUT

        # Only the transaction that performed the transition writes evidence.
        assert len(_events(db_session, "auth.session.revoked")) == 1

    def test_concurrent_presentations_produce_one_transition(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="concurrentexpiry@example.com")
        factory.session.commit()
        client.login_or_fail("concurrentexpiry@example.com")

        record = db_session.execute(select(UserSession)).scalar_one()
        record.last_activity_at = utcnow() - timedelta(hours=5)
        db_session.commit()

        with ThreadPoolExecutor(max_workers=6) as pool:
            statuses = [f.result() for f in [pool.submit(_probe_me, client) for _ in range(6)]]

        assert statuses == [401] * 6
        assert len(_events(db_session, "auth.session.revoked")) == 1


class TestAtomicCounter:
    def test_concurrent_failures_lose_no_increments(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """A read-modify-write counter would under-count here; SQL arithmetic does not."""
        organization = factory.organization()
        user = factory.user(organization, email="counter@example.com")
        factory.session.commit()

        attempts = 8
        with ThreadPoolExecutor(max_workers=attempts) as pool:
            statuses = [
                f.result()
                for f in [
                    pool.submit(_probe_login, client, "counter@example.com")
                    for _ in range(attempts)
                ]
            ]

        assert statuses == [401] * attempts

        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        db_session.refresh(credential)
        assert credential.failed_attempt_count == attempts
        assert len(_events(db_session, "auth.login.failed")) == attempts

    def test_successful_login_clears_failure_state_in_the_main_transaction(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="cleared@example.com")
        factory.session.commit()

        assert client.login("cleared@example.com", "wrong-password").status_code == 401
        client.login_or_fail("cleared@example.com")

        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        db_session.refresh(credential)
        assert credential.failed_attempt_count == 0
        assert credential.last_failed_at is None
        assert credential.last_verified_at is not None

        # Session creation and its audit committed together in the main
        # transaction, exactly as before ADR-007.
        assert db_session.execute(select(func.count()).select_from(UserSession)).scalar_one() == 1
        assert len(_events(db_session, "auth.login.succeeded")) == 1


class TestRejectedRequestDoesNotExtendSession:
    def test_a_denied_request_does_not_advance_last_activity(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        """ADR-007: ``last_activity_at`` is not rejection telemetry.

        It stays in the main transaction, so a request that authenticates and is
        then denied must not extend the idle window.
        """
        organization = factory.organization()
        factory.user(organization, email="denied@example.com")
        factory.session.commit()
        client.login_or_fail("denied@example.com")

        record = db_session.execute(select(UserSession)).scalar_one()
        original = record.last_activity_at

        # A fresh account holds no grants, so any protected read is denied.
        assert client.get("/api/v1/departments").status_code == 403

        db_session.expire_all()
        after = db_session.get(UserSession, record.id)
        assert after is not None
        assert after.last_activity_at == original


class TestNoAuditAmplification:
    @pytest.mark.parametrize(
        "cookie_value",
        ["not-a-real-token", ""],
        ids=["forged", "empty"],
    )
    def test_bad_tokens_create_no_audit_rows(
        self, client: ApiClient, factory: Factory, db_session: Session, cookie_value: str
    ) -> None:
        factory.organization()
        factory.session.commit()

        client.raw.cookies.set(client.settings.session_cookie_name, cookie_value)
        assert client.get("/api/v1/auth/me").status_code == 401

        assert db_session.execute(select(func.count()).select_from(AuditEvent)).scalar_one() == 0

    def test_already_revoked_token_creates_no_further_audit(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="revoked@example.com")
        factory.session.commit()
        client.login_or_fail("revoked@example.com")
        client.post("/api/v1/auth/logout")

        before = db_session.execute(select(func.count()).select_from(AuditEvent)).scalar_one()
        for _ in range(3):
            assert client.get("/api/v1/auth/me").status_code == 401

        assert (
            db_session.execute(select(func.count()).select_from(AuditEvent)).scalar_one() == before
        )


class TestConnectionDiscipline:
    def test_single_connection_pool_has_no_deadlock(
        self, settings: Settings, test_database_url: str, db_session: Session, factory: Factory
    ) -> None:
        """ADR-007: the request connection is released before the writer takes one.

        With ``pool_size=1`` and no overflow there is exactly one connection. If
        the writer ran before the request transaction was closed, this would block
        until the pool timeout instead of returning a ``401``.
        """
        organization = factory.organization()
        user = factory.user(organization, email="onepool@example.com")
        factory.session.commit()

        single = build_engine(
            settings.model_copy(update={"db_pool_size": 1, "db_max_overflow": 0}),
            url=test_database_url,
        )
        try:
            app = create_app(settings)
            with TestClient(app, base_url="http://localhost:8000") as raw:
                app.state.engine.dispose()
                app.state.engine = single
                factory_one = build_session_factory(single)
                app.state.session_factory = factory_one
                app.state.security_telemetry_writer = build_security_telemetry_writer(factory_one)

                response = raw.post(
                    "/api/v1/auth/login",
                    json={"email": "onepool@example.com", "password": "wrong-password"},
                    headers={"Origin": TEST_ORIGIN},
                )
            assert response.status_code == 401
        finally:
            single.dispose()

        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        db_session.refresh(credential)
        assert credential.failed_attempt_count == 1
        assert len(_events(db_session, "auth.login.failed")) == 1

    def test_connections_are_returned_after_every_path(
        self, client: ApiClient, factory: Factory, engine: Engine
    ) -> None:
        """Neither a rejection nor a success may leak a pooled connection."""
        organization = factory.organization()
        factory.user(organization, email="pooled@example.com")
        factory.session.commit()

        for _ in range(5):
            assert client.login("pooled@example.com", "wrong-password").status_code == 401
        client.login_or_fail("pooled@example.com")
        assert client.get("/api/v1/auth/me").status_code == 200

        # ``checkedout`` lives on QueuePool, not the generic Pool base that
        # ``Engine.pool`` is typed as.
        checked_out = cast("QueuePool", engine.pool).checkedout()
        assert checked_out == 0


class TestAdr005StillHolds:
    def test_audit_failure_rolls_back_its_business_mutation(
        self,
        client: ApiClient,
        factory: Factory,
        db_session: Session,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """ADR-007 must not weaken ADR-005 for ordinary successful commands."""
        from app.modules.audit.service import AuditRecorder

        organization = factory.organization()
        factory.user_with_permissions(
            organization, ("department.create", "department.read"), email="creator@example.com"
        )
        factory.session.commit()
        client.login_or_fail("creator@example.com")

        original = AuditRecorder.record

        def failing_record(self: AuditRecorder, **kwargs: Any) -> Any:
            if kwargs.get("action") == "department.created":
                raise RuntimeError("audit sink unavailable")
            return original(self, **kwargs)

        monkeypatch.setattr(AuditRecorder, "record", failing_record)

        with pytest.raises(RuntimeError):
            client.post("/api/v1/departments", json={"name": "Radiology"})

        # The mutation went with its audit event.
        assert (
            db_session.execute(
                select(func.count()).select_from(Department).where(Department.name == "Radiology")
            ).scalar_one()
            == 0
        )


class TestEffectAllowList:
    """The independent path is a closed allow-list, not a generic escape hatch."""

    @pytest.mark.parametrize("kind", list(SecurityEffectKind))
    def test_each_kind_reaches_its_own_handler(
        self,
        session_factory: Any,
        factory: Factory,
        kind: SecurityEffectKind,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Every kind must reach a distinct handler, not merely exist.

        Comparing enum strings proves nothing about routing. This records which
        handler actually ran for a real effect of each kind.
        """
        organization = factory.organization()
        user = factory.user(organization, email=f"dispatch-{kind.value}@example.com")
        factory.session.commit()
        effect = _effect_for(kind, factory, organization, user)

        called: list[str] = []
        for handler in (
            "_audit_login_failure",
            "_count_credential_failure",
            "_revoke_session",
            "_revoke_user_sessions",
        ):
            original = getattr(SecurityTelemetryWriter, handler)

            def spy(
                self: Any, *args: Any, _name: str = handler, _f: Any = original, **kw: Any
            ) -> Any:
                called.append(_name)
                return _f(self, *args, **kw)

            monkeypatch.setattr(SecurityTelemetryWriter, handler, spy)

        writer = build_security_telemetry_writer(session_factory)
        assert writer.persist([effect]) is True

        expected = {
            SecurityEffectKind.LOGIN_FAILURE: ["_audit_login_failure"],
            # The counter handler delegates to the audit handler on purpose: one
            # rejected request produces one audit row.
            SecurityEffectKind.CREDENTIAL_FAILURE_COUNTER: [
                "_count_credential_failure",
                "_audit_login_failure",
            ],
            SecurityEffectKind.SESSION_REVOCATION: ["_revoke_session"],
            SecurityEffectKind.USER_SESSION_REVOCATION: ["_revoke_user_sessions"],
        }[kind]
        assert called == expected

    def test_an_invalid_kind_cannot_become_a_database_mutation(
        self, session_factory: Any, factory: Factory, db_session: Session
    ) -> None:
        """A kind outside the closed set must write nothing at all."""
        organization = factory.organization()
        user = factory.user(organization, email="rogue@example.com")
        factory.session.commit()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()

        effect = SecurityEffect.credential_failure_counter(
            credential_id=credential.id,
            correlation_id="rogue-1",
            occurred_at=utcnow(),
            organization_id=organization.id,
            target_user_id=user.id,
        )
        # Bypass the frozen dataclass to simulate an unknown kind reaching the
        # writer, which is the only way this state is reachable at all.
        object.__setattr__(effect, "kind", "arbitrary_write")

        writer = build_security_telemetry_writer(session_factory)
        assert writer.persist([effect]) is False
        assert writer.failure_count == 1

        assert db_session.execute(select(func.count()).select_from(AuditEvent)).scalar_one() == 0
        db_session.refresh(credential)
        assert credential.failed_attempt_count == 0

    def test_state_and_audit_commit_together(
        self,
        client: ApiClient,
        factory: Factory,
        db_session: Session,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """If the audit insert fails, the counter increment must not survive."""
        from app.modules.audit.service import AuditRecorder

        organization = factory.organization()
        user = factory.user(organization, email="atomiceffect@example.com")
        factory.session.commit()

        original = AuditRecorder.record

        def failing_record(self: AuditRecorder, **kwargs: Any) -> Any:
            if kwargs.get("action") == "auth.login.failed":
                raise RuntimeError("audit sink unavailable")
            return original(self, **kwargs)

        monkeypatch.setattr(AuditRecorder, "record", failing_record)

        assert client.login("atomiceffect@example.com", "wrong-password").status_code == 401

        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        db_session.refresh(credential)
        assert credential.failed_attempt_count == 0
        assert _events(db_session, "auth.login.failed") == []


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _probe_me(client: ApiClient) -> int:
    # The cookie already lives on the client; setting it per request is
    # deprecated in httpx and unnecessary here.
    return int(client.raw.get("/api/v1/auth/me").status_code)


def _probe_login(client: ApiClient, email: str) -> int:
    response = client.raw.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrong-password"},
        headers={"Origin": TEST_ORIGIN},
    )
    return int(response.status_code)


class _FailingWriter:
    """Stands in for the writer when a test needs persistence to fail."""

    def __init__(self) -> None:
        self.failure_count = 0

    def persist(self, effects: Any) -> bool:
        self.failure_count += 1
        return False


class _BrokenFactory:
    """A session factory whose ``begin()`` raises, to exercise the failure path."""

    def __init__(self, explode: Callable[[], object]) -> None:
        self._explode = explode

    def begin(self) -> object:
        return self._explode()


class TestTenantConstrainedEffects:
    """Fix 3: an internally malformed effect must not reach another tenant's rows."""

    def test_correct_identifiers_update_the_credential(
        self, session_factory: Any, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="tenant-ok@example.com")
        factory.session.commit()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()

        writer = build_security_telemetry_writer(session_factory)
        assert (
            writer.persist(
                [
                    SecurityEffect.credential_failure_counter(
                        credential_id=credential.id,
                        correlation_id="tenant-ok",
                        occurred_at=utcnow(),
                        organization_id=organization.id,
                        target_user_id=user.id,
                    )
                ]
            )
            is True
        )

        db_session.refresh(credential)
        assert credential.failed_attempt_count == 1
        assert len(_events(db_session, "auth.login.failed")) == 1

    def test_wrong_organization_mutates_nothing_and_audits_nothing(
        self, session_factory: Any, factory: Factory, db_session: Session
    ) -> None:
        """The credential belongs to org A; the effect claims org B."""
        organization = factory.organization()
        other = factory.organization()
        user = factory.user(organization, email="tenant-wrong-org@example.com")
        other_user = factory.user(other, email="other-org@example.com")
        factory.session.commit()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()

        writer = build_security_telemetry_writer(session_factory)
        assert (
            writer.persist(
                [
                    SecurityEffect.credential_failure_counter(
                        credential_id=credential.id,
                        correlation_id="tenant-wrong-org",
                        occurred_at=utcnow(),
                        organization_id=other.id,
                        target_user_id=other_user.id,
                    )
                ]
            )
            is False
        )

        db_session.refresh(credential)
        assert credential.failed_attempt_count == 0
        assert credential.last_failed_at is None
        assert db_session.execute(select(func.count()).select_from(AuditEvent)).scalar_one() == 0

    def test_wrong_target_user_mutates_nothing_and_audits_nothing(
        self, session_factory: Any, factory: Factory, db_session: Session
    ) -> None:
        """Same organization, but the credential is not this user's."""
        organization = factory.organization()
        user = factory.user(organization, email="tenant-owner@example.com")
        bystander = factory.user(organization, email="tenant-bystander@example.com")
        factory.session.commit()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()

        writer = build_security_telemetry_writer(session_factory)
        assert (
            writer.persist(
                [
                    SecurityEffect.credential_failure_counter(
                        credential_id=credential.id,
                        correlation_id="tenant-wrong-user",
                        occurred_at=utcnow(),
                        organization_id=organization.id,
                        target_user_id=bystander.id,
                    )
                ]
            )
            is False
        )

        db_session.refresh(credential)
        assert credential.failed_attempt_count == 0
        assert db_session.execute(select(func.count()).select_from(AuditEvent)).scalar_one() == 0

    def test_session_revocation_is_tenant_constrained(
        self, session_factory: Any, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        other = factory.organization()
        user = factory.user(organization, email="revoke-owner@example.com")
        other_user = factory.user(other, email="revoke-other@example.com")
        factory.session.commit()

        live = UserSession(
            organization_id=organization.id,
            user_id=user.id,
            token_hash=f"tok-{uuid.uuid4().hex}",
            csrf_token_hash=f"csrf-{uuid.uuid4().hex}",
            issued_at=utcnow() - timedelta(hours=1),
            expires_at=utcnow() + timedelta(hours=1),
            last_activity_at=utcnow(),
        )
        db_session.add(live)
        db_session.commit()

        writer = build_security_telemetry_writer(session_factory)
        writer.persist(
            [
                SecurityEffect.session_revocation(
                    session_id=live.id,
                    reason_code=REASON_IDLE_TIMEOUT,
                    correlation_id="revoke-wrong-tenant",
                    occurred_at=utcnow(),
                    organization_id=other.id,
                    target_user_id=other_user.id,
                )
            ]
        )

        db_session.refresh(live)
        assert live.revoked_at is None
        assert live.revoked_reason is None
        assert _events(db_session, "auth.session.revoked") == []


class TestMonotonicFailureTimestamp:
    """Fix 5: a late-committing older event must not move last_failed_at backwards."""

    def test_older_event_cannot_overwrite_a_newer_timestamp(
        self, session_factory: Any, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="monotonic@example.com")
        factory.session.commit()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()

        newer = utcnow()
        older = newer - timedelta(minutes=10)
        writer = build_security_telemetry_writer(session_factory)

        def attempt(when: datetime, label: str) -> None:
            writer.persist(
                [
                    SecurityEffect.credential_failure_counter(
                        credential_id=credential.id,
                        correlation_id=label,
                        occurred_at=when,
                        organization_id=organization.id,
                        target_user_id=user.id,
                    )
                ]
            )

        # Deterministic ordering: the newer attempt persists first, then the
        # older one arrives late — exactly the interleaving that a naive
        # assignment would get wrong.
        attempt(newer, "monotonic-new")
        attempt(older, "monotonic-old")

        db_session.refresh(credential)
        assert credential.failed_attempt_count == 2, "the counter must still count both"
        assert credential.last_failed_at is not None
        assert as_utc(credential.last_failed_at) == newer, "timestamp regressed"

    def test_first_failure_sets_the_timestamp_from_null(
        self, session_factory: Any, factory: Factory, db_session: Session
    ) -> None:
        """GREATEST must not leave NULL on the very first failure."""
        organization = factory.organization()
        user = factory.user(organization, email="firstfail@example.com")
        factory.session.commit()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        # Assert through a local rather than on the attribute: mypy cannot know
        # that ``refresh`` mutates it, so narrowing the attribute to None here
        # would make the post-refresh check look unreachable.
        initial = credential.last_failed_at
        assert initial is None

        when = utcnow()
        build_security_telemetry_writer(session_factory).persist(
            [
                SecurityEffect.credential_failure_counter(
                    credential_id=credential.id,
                    correlation_id="firstfail",
                    occurred_at=when,
                    organization_id=organization.id,
                    target_user_id=user.id,
                )
            ]
        )

        db_session.refresh(credential)
        recorded = credential.last_failed_at
        assert recorded is not None
        assert as_utc(recorded) == when


class TestDeterministicOverlap:
    """Fix 9: force genuine overlap at the critical section, without timing luck."""

    def test_blocked_increment_is_not_lost(
        self, session_factory: Any, factory: Factory, db_session: Session, engine: Engine
    ) -> None:
        """A writer that must wait on a row lock still applies its increment.

        The lock is taken explicitly rather than hoped for: one session holds
        ``SELECT ... FOR UPDATE`` on the credential while the writer runs in
        another thread. The writer therefore *provably* executes its UPDATE while
        contended, which a plain thread pool cannot guarantee.
        """
        organization = factory.organization()
        user = factory.user(organization, email="locked@example.com")
        factory.session.commit()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()
        credential_id = credential.id

        writer = build_security_telemetry_writer(session_factory)
        blocked_started = threading.Event()
        result: dict[str, bool] = {}

        def contended_write() -> None:
            blocked_started.set()
            result["ok"] = writer.persist(
                [
                    SecurityEffect.credential_failure_counter(
                        credential_id=credential_id,
                        correlation_id="contended",
                        occurred_at=utcnow(),
                        organization_id=organization.id,
                        target_user_id=user.id,
                    )
                ]
            )

        holder = session_factory()
        try:
            # Hold the row lock, then start the contending writer.
            holder.execute(
                select(Credential).where(Credential.id == credential_id).with_for_update()
            )
            holder.execute(
                update(Credential)
                .where(Credential.id == credential_id)
                .values(failed_attempt_count=Credential.failed_attempt_count + 1)
                .execution_options(synchronize_session=False)
            )

            thread = threading.Thread(target=contended_write)
            thread.start()
            assert blocked_started.wait(timeout=5)
            time.sleep(0.2)  # let the writer reach its UPDATE and block on the lock
            holder.commit()  # release; the writer now proceeds
            thread.join(timeout=15)
            assert not thread.is_alive(), "the contended writer did not complete"
        finally:
            holder.close()

        assert result.get("ok") is True
        db_session.refresh(credential)
        # 1 from the lock holder + 1 from the contended writer. A read-modify-write
        # would have produced 1.
        assert credential.failed_attempt_count == 2

    def test_barrier_synchronised_revocations_produce_one_transition(
        self, session_factory: Any, factory: Factory, db_session: Session
    ) -> None:
        """Several writers revoke the same live session at the same instant."""
        organization = factory.organization()
        user = factory.user(organization, email="barrier-revoke@example.com")
        factory.session.commit()

        live = UserSession(
            organization_id=organization.id,
            user_id=user.id,
            token_hash=f"tok-{uuid.uuid4().hex}",
            csrf_token_hash=f"csrf-{uuid.uuid4().hex}",
            issued_at=utcnow() - timedelta(hours=1),
            expires_at=utcnow() + timedelta(hours=1),
            last_activity_at=utcnow(),
        )
        db_session.add(live)
        db_session.commit()

        workers = 5
        barrier = threading.Barrier(workers)
        writer = build_security_telemetry_writer(session_factory)
        outcomes: list[bool] = []
        lock = threading.Lock()

        def revoke(index: int) -> None:
            effect = SecurityEffect.session_revocation(
                session_id=live.id,
                reason_code=REASON_IDLE_TIMEOUT,
                correlation_id=f"barrier-{index}",
                occurred_at=utcnow(),
                organization_id=organization.id,
                target_user_id=user.id,
            )
            barrier.wait(timeout=10)  # all threads release together
            ok = writer.persist([effect])
            with lock:
                outcomes.append(ok)

        threads = [threading.Thread(target=revoke, args=(i,)) for i in range(workers)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=20)
            assert not thread.is_alive()

        assert outcomes == [True] * workers, "no writer may fail"

        db_session.refresh(live)
        assert live.revoked_reason == REASON_IDLE_TIMEOUT
        # Conditional UPDATE ... WHERE revoked_at IS NULL: exactly one transition.
        assert len(_events(db_session, "auth.session.revoked")) == 1

    def test_barrier_synchronised_failures_lose_no_increments(
        self, session_factory: Any, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="barrier-count@example.com")
        factory.session.commit()
        credential = db_session.execute(
            select(Credential).where(Credential.user_id == user.id)
        ).scalar_one()

        workers = 6
        barrier = threading.Barrier(workers)
        writer = build_security_telemetry_writer(session_factory)

        def attempt(index: int) -> None:
            effect = SecurityEffect.credential_failure_counter(
                credential_id=credential.id,
                correlation_id=f"barrier-count-{index}",
                occurred_at=utcnow(),
                organization_id=organization.id,
                target_user_id=user.id,
            )
            barrier.wait(timeout=10)
            writer.persist([effect])

        threads = [threading.Thread(target=attempt, args=(i,)) for i in range(workers)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=20)
            assert not thread.is_alive()

        db_session.refresh(credential)
        assert credential.failed_attempt_count == workers
        assert len(_events(db_session, "auth.login.failed")) == workers


class TestCredentialTimingEqualization:
    """Fix 6: a provisioned and an unprovisioned account cost the same to probe."""

    def test_no_active_credential_still_performs_verification_work(
        self, client: ApiClient, factory: Factory, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Instrumentation, not wall-clock: count the Argon2 verifications.

        A timing assertion would be flaky on shared CI. Counting the calls proves
        the same work happens, which is the property that matters.
        """
        from app.core.security import PasswordHasherService

        organization = factory.organization()
        # ``password=None`` provisions the account without a credential.
        factory.user(organization, email="nocredential@example.com", password=None)
        factory.user(organization, email="hascredential@example.com")
        factory.session.commit()

        calls: list[str] = []
        original = PasswordHasherService.verify

        def counting_verify(self: Any, password_hash: str, password: str) -> bool:
            calls.append(password_hash[:16])
            return original(self, password_hash, password)

        monkeypatch.setattr(PasswordHasherService, "verify", counting_verify)

        calls.clear()
        assert client.login("nocredential@example.com", "any-password").status_code == 401
        without_credential = len(calls)

        calls.clear()
        assert client.login("hascredential@example.com", "wrong-password").status_code == 401
        with_credential = len(calls)

        calls.clear()
        assert client.login("does-not-exist@example.com", "any-password").status_code == 401
        unknown_account = len(calls)

        assert without_credential == with_credential == unknown_account == 1

    def test_all_three_paths_return_the_identical_body(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user(organization, email="nocred2@example.com", password=None)
        factory.user(organization, email="hascred2@example.com")
        factory.session.commit()

        bodies = [
            client.login("nocred2@example.com", "any-password").json(),
            client.login("hascred2@example.com", "wrong-password").json(),
            client.login("missing@example.com", "any-password").json(),
        ]
        for body in bodies:
            body.pop("correlation_id")
        assert bodies[0] == bodies[1] == bodies[2]
