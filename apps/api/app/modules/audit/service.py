"""Append-only audit recorder.

ADR-005 / ARCHITECTURE.md §11. This is the infrastructure that later modules
(tasks, commitments, meetings, decisions, priorities, escalations) will call for
their own audited transitions. Phase 2 uses it for the mutations it actually
performs; no event is fabricated to demonstrate the feature.

Contract for callers:

* Pass the **same** :class:`~sqlalchemy.orm.Session` that carries the business
  mutation. The audit row then commits with the mutation, or neither commits.
* Pass entity values through :func:`~app.modules.audit.redaction.redact_snapshot`
  — which :meth:`AuditRecorder.record` does for you. Never assemble a payload by
  hand.
* Never pass password material, hashes, session tokens or secrets. The
  allow-list has no field for them and the deny-list strips them.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.correlation import get_correlation_id
from app.modules.audit.models import (
    AUDIT_PAYLOAD_SCHEMA_VERSION,
    ActorType,
    AuditEvent,
    AuditSource,
)
from app.modules.audit.redaction import diff_snapshots, redact_snapshot

# ---------------------------------------------------------------------------
# Stable action names used by Phase 2
# ---------------------------------------------------------------------------
# SECURITY.md §7 requires auditing "important authentication, authorization
# administration ..." actions. These are exactly the mutations Phase 2 performs.

AUTH_LOGIN_SUCCEEDED = "auth.login.succeeded"
AUTH_LOGIN_FAILED = "auth.login.failed"
AUTH_LOGOUT = "auth.logout"
AUTH_SESSION_REVOKED = "auth.session.revoked"
AUTH_CREDENTIAL_REHASHED = "auth.credential.rehashed"

CREDENTIAL_CREATED = "credential.created"
CREDENTIAL_PASSWORD_CHANGED = "credential.password_changed"  # noqa: S105 - audit action name

ORGANIZATION_UPDATED = "organization.updated"

DEPARTMENT_CREATED = "department.created"
DEPARTMENT_UPDATED = "department.updated"

USER_CREATED = "user.created"
USER_UPDATED = "user.updated"
USER_DISABLED = "user.disabled"
USER_ENABLED = "user.enabled"

DEPARTMENT_MEMBERSHIP_CREATED = "department_membership.created"
DEPARTMENT_MEMBERSHIP_ENDED = "department_membership.ended"

ROLE_CREATED = "role.created"
ROLE_UPDATED = "role.updated"
ROLE_PERMISSION_GRANTED = "role.permission.granted"
ROLE_PERMISSION_REVOKED = "role.permission.revoked"

ROLE_ASSIGNMENT_CREATED = "role_assignment.created"
ROLE_ASSIGNMENT_ENDED = "role_assignment.ended"


@dataclass(frozen=True)
class AuditActor:
    """Who is performing the action.

    Built from the authenticated session, never from request content — a client
    cannot claim to be another actor.
    """

    actor_type: ActorType
    user_id: uuid.UUID | None = None
    label: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None

    @classmethod
    def user(
        cls,
        user_id: uuid.UUID,
        *,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditActor:
        return cls(
            actor_type=ActorType.USER,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @classmethod
    def anonymous(
        cls, *, ip_address: str | None = None, user_agent: str | None = None
    ) -> AuditActor:
        return cls(
            actor_type=ActorType.ANONYMOUS,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @classmethod
    def system(cls, label: str) -> AuditActor:
        return cls(actor_type=ActorType.SYSTEM, label=label)


class AuditRecorder:
    """Inserts audit events into the caller's transaction."""

    def __init__(self, session: Session, *, source: AuditSource = AuditSource.API) -> None:
        self._session = session
        self._source = source

    def record(
        self,
        *,
        action: str,
        entity_type: str,
        actor: AuditActor,
        organization_id: uuid.UUID | None,
        entity_id: uuid.UUID | None = None,
        before: dict[str, Any] | None = None,
        after: dict[str, Any] | None = None,
        reason: str | None = None,
        causation_id: str | None = None,
        correlation_id: str | None = None,
        diff_only: bool = True,
    ) -> AuditEvent:
        """Append one audit event.

        ``before``/``after`` are raw entity field maps; they are redacted here.
        With ``diff_only`` (the default for updates) only changed fields are
        stored, which keeps the "previous and new values" requirement readable.

        ``correlation_id`` may be supplied explicitly. The security-telemetry
        writer (ADR-007) does so, because it carries the request's sanitized ID
        on the effect rather than reading an ambient context variable that a
        future thread or process boundary could lose.

        The row is flushed immediately so a constraint violation surfaces at the
        call site — inside the mutation's transaction — rather than at commit,
        where it would be harder to attribute.
        """
        redacted_before = redact_snapshot(entity_type, before)
        redacted_after = redact_snapshot(entity_type, after)

        if diff_only and redacted_before is not None and redacted_after is not None:
            redacted_before, redacted_after = diff_snapshots(redacted_before, redacted_after)

        event = AuditEvent(
            organization_id=organization_id,
            occurred_at=utcnow(),
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_type=actor.actor_type.value,
            actor_user_id=actor.user_id,
            actor_label=actor.label,
            source=self._source.value,
            correlation_id=correlation_id or get_correlation_id(),
            causation_id=causation_id,
            reason=reason,
            before_state=redacted_before,
            after_state=redacted_after,
            payload_schema_version=AUDIT_PAYLOAD_SCHEMA_VERSION,
            ip_address=actor.ip_address,
            user_agent=actor.user_agent,
        )
        self._session.add(event)
        self._session.flush()
        return event


class AuditQueryService:
    """Read-only query service for audit events with strict RBAC scoping."""

    @staticmethod
    def query_events(
        session: Session,
        current_user: Any,
        effective_roles: list[str],
        subordinate_user_ids: set[uuid.UUID],
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        actor_id: uuid.UUID | None = None,
        action: str | None = None,
        entity_type: str | None = None,
        entity_id: uuid.UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        from sqlalchemy import func, or_, select
        from app.modules.identity.models import User

        is_admin_or_md = any(r in ("master", "md", "md_office") for r in effective_roles)
        is_leader = any(r in ("leader", "department_head", "manager") for r in effective_roles)

        stmt = select(AuditEvent).where(
            AuditEvent.organization_id == current_user.organization_id
        )

        if not is_admin_or_md:
            if is_leader:
                # Leader sees audit events for self, subordinates, or events where subordinate was entity
                allowed_users = subordinate_user_ids | {current_user.id}
                stmt = stmt.where(
                    or_(
                        AuditEvent.actor_user_id.in_(allowed_users),
                        AuditEvent.entity_id.in_(allowed_users),
                    )
                )
            else:
                # Employee strictly sees events they initiated or where they are the entity
                stmt = stmt.where(
                    or_(
                        AuditEvent.actor_user_id == current_user.id,
                        AuditEvent.entity_id == current_user.id,
                    )
                )

        if start_time:
            stmt = stmt.where(AuditEvent.occurred_at >= start_time)
        if end_time:
            stmt = stmt.where(AuditEvent.occurred_at <= end_time)
        if actor_id:
            stmt = stmt.where(AuditEvent.actor_user_id == actor_id)
        if action:
            stmt = stmt.where(AuditEvent.action.ilike(f"%{action}%"))
        if entity_type:
            stmt = stmt.where(AuditEvent.entity_type == entity_type)
        if entity_id:
            stmt = stmt.where(AuditEvent.entity_id == entity_id)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = session.scalar(count_stmt) or 0

        # Query paginated items
        items = session.scalars(
            stmt.order_by(AuditEvent.occurred_at.desc()).limit(limit).offset(offset)
        ).all()

        # Resolve actor names
        actor_ids = {item.actor_user_id for item in items if item.actor_user_id}
        users_map: dict[uuid.UUID, str] = {}
        if actor_ids:
            users = session.scalars(select(User).where(User.id.in_(actor_ids))).all()
            users_map = {u.id: u.full_name for u in users}

        results = []
        for item in items:
            actor_name = users_map.get(item.actor_user_id, item.actor_label or "System")
            results.append({
                "id": item.id,
                "organization_id": item.organization_id,
                "occurred_at": item.occurred_at,
                "action": item.action,
                "entity_type": item.entity_type,
                "entity_id": item.entity_id,
                "actor_type": item.actor_type,
                "actor_user_id": item.actor_user_id,
                "actor_name": actor_name,
                "actor_label": item.actor_label,
                "source": item.source,
                "correlation_id": item.correlation_id,
                "causation_id": item.causation_id,
                "reason": item.reason,
                "before_state": item.before_state,
                "after_state": item.after_state,
                "ip_address": item.ip_address,
                "user_agent": item.user_agent,
                "created_at": item.created_at,
            })

        return results, total
