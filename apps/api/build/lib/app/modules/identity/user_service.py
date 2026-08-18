"""User provisioning, profile updates and department membership use cases.

API.md "Users, roles and departments". All reads and writes are scoped to the
caller's organization and authorized departments.

Account provisioning note (TODO REQUIRES BUSINESS DECISION, SECURITY.md §14):
Stavya has not approved an account-provisioning model, self-service password
reset or MFA. Phase 2 therefore supports the minimum that makes an account
usable: an authorized user may set an initial password, which is stored as an
Argon2id hash with ``must_change_password`` forced on, so the administrator's
chosen value cannot remain the account's long-term credential. Replace this with
the approved provisioning flow when it exists.
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import date
from typing import Any

from sqlalchemy import Select, exists, select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import ConflictError, ResourceNotFoundError, ValidationFailedError
from app.core.security import PASSWORD_ALGORITHM, PasswordHasherService
from app.core.sentinels import UNSET
from app.core.text import normalize_email, normalize_name
from app.db.concurrency import assert_version, lock_for_update
from app.modules.access.authorization import AuthorizationContext
from app.modules.access.catalog import USER_CREATE, USER_READ, USER_UPDATE
from app.modules.audit.service import (
    CREDENTIAL_CREATED,
    DEPARTMENT_MEMBERSHIP_CREATED,
    DEPARTMENT_MEMBERSHIP_ENDED,
    USER_CREATED,
    USER_DISABLED,
    USER_ENABLED,
    USER_UPDATED,
    AuditActor,
    AuditRecorder,
)
from app.modules.identity.models import CREDENTIAL_KIND_PASSWORD, Credential, User
from app.modules.identity.service import AuthenticationService
from app.modules.organization.models import Department, DepartmentMembership


class UserService:
    """User directory and account lifecycle within the caller's scope."""

    def __init__(
        self,
        session: Session,
        audit: AuditRecorder,
        hasher: PasswordHasherService,
        authentication: AuthenticationService,
    ) -> None:
        self._session = session
        self._audit = audit
        self._hasher = hasher
        self._authentication = authentication

    # -- Reads ------------------------------------------------------------

    def list_users(
        self,
        context: AuthorizationContext,
        *,
        limit: int,
        include_inactive: bool = False,
        department_id: uuid.UUID | None = None,
        cursor: uuid.UUID | None = None,
    ) -> Sequence[User]:
        """List users the caller may read, scoped in SQL."""
        context.require(USER_READ)
        query = self._readable_query(context)
        if not include_inactive:
            query = query.where(User.is_active.is_(True))
        if department_id is not None:
            # A filter can only ever narrow the authorized set, never widen it:
            # it is applied on top of the scope predicate.
            query = query.where(_has_active_membership(department_id))
        if cursor is not None:
            query = query.where(User.id > cursor)
        return list(self._session.execute(query.order_by(User.id).limit(limit)).scalars())

    def get_user(self, context: AuthorizationContext, user_id: uuid.UUID) -> User:
        """Return one readable user, or ``404``.

        Out-of-scope identifiers are indistinguishable from non-existent ones
        (API.md §2), which is what prevents identifier substitution from mapping
        the organization.
        """
        context.require(USER_READ)
        user = self._session.execute(
            self._readable_query(context).where(User.id == user_id)
        ).scalar_one_or_none()
        if user is None:
            raise ResourceNotFoundError("User not found.")
        return user

    def list_memberships(
        self, context: AuthorizationContext, user_id: uuid.UUID, *, current_only: bool = False
    ) -> Sequence[DepartmentMembership]:
        """List a readable user's memberships, including ended ones by default.

        History is preserved and visible, because a transfer must remain
        explicable after the fact (DOMAIN_MODEL.md §3).
        """
        user = self.get_user(context, user_id)
        query = select(DepartmentMembership).where(
            DepartmentMembership.user_id == user.id,
            DepartmentMembership.organization_id == context.organization_id,
        )
        if current_only:
            query = query.where(DepartmentMembership.ended_on.is_(None))
        return list(
            self._session.execute(
                query.order_by(DepartmentMembership.started_on.desc(), DepartmentMembership.id)
            ).scalars()
        )

    def _readable_query(self, context: AuthorizationContext) -> Select[tuple[User]]:
        """Users in the caller's organization, narrowed by department scope."""
        query = select(User).where(User.organization_id == context.organization_id)
        if context.has_organization_scope(USER_READ):
            return query
        authorized = context.authorized_department_ids(USER_READ)
        if not authorized:
            return query.where(User.id.in_([]))
        # A department-scoped reader sees users who currently belong to one of
        # their departments. Users with no membership are not visible to them.
        return query.where(
            exists(
                select(DepartmentMembership.id).where(
                    DepartmentMembership.user_id == User.id,
                    DepartmentMembership.department_id.in_(authorized),
                    DepartmentMembership.ended_on.is_(None),
                )
            )
        )

    # -- Provisioning -----------------------------------------------------

    def create_user(
        self,
        context: AuthorizationContext,
        *,
        full_name: str,
        email: str,
        actor: AuditActor,
        initial_password: str | None = None,
        department_memberships: Sequence[tuple[uuid.UUID, bool]] = (),
        reason: str | None = None,
    ) -> User:
        """Provision a user account in the caller's organization."""
        context.require_organization_scope(USER_CREATE)

        clean_email = email.strip()
        normalized = normalize_email(clean_email)
        if (
            self._session.execute(
                select(User.id)
                .where(
                    User.organization_id == context.organization_id,
                    User.normalized_email == normalized,
                )
                .limit(1)
            ).first()
            is not None
        ):
            raise ConflictError(
                "A user with this email already exists in this organization.",
            )

        user = User(
            organization_id=context.organization_id,
            full_name=normalize_name(full_name),
            email=clean_email,
            normalized_email=normalized,
        )
        self._session.add(user)
        self._session.flush()

        self._audit.record(
            action=USER_CREATED,
            entity_type="user",
            entity_id=user.id,
            actor=actor,
            organization_id=context.organization_id,
            after=_user_snapshot(user),
            reason=reason,
            diff_only=False,
        )

        if initial_password is not None:
            self._create_password_credential(user, initial_password, actor=actor)

        for department_id, is_primary in department_memberships:
            self.add_membership(
                context,
                user_id=user.id,
                department_id=department_id,
                is_primary=is_primary,
                started_on=utcnow().date(),
                actor=actor,
                skip_read_check=True,
            )

        return user

    def _create_password_credential(
        self, user: User, password: str, *, actor: AuditActor
    ) -> Credential:
        """Store an Argon2id credential for ``user``.

        The plaintext exists only as this function's argument. It is never
        assigned to a model attribute, logged or audited; the audit event records
        algorithm and state only.
        """
        credential = Credential(
            organization_id=user.organization_id,
            user_id=user.id,
            kind=CREDENTIAL_KIND_PASSWORD,
            password_hash=self._hasher.hash(password),
            algorithm=PASSWORD_ALGORITHM,
            password_updated_at=utcnow(),
            # An administrator-chosen value must not remain the credential.
            must_change_password=True,
        )
        self._session.add(credential)
        self._session.flush()

        self._audit.record(
            action=CREDENTIAL_CREATED,
            entity_type="credential",
            entity_id=credential.id,
            actor=actor,
            organization_id=user.organization_id,
            after={
                "user_id": user.id,
                "kind": credential.kind,
                "algorithm": credential.algorithm,
                "is_active": credential.is_active,
                "must_change_password": credential.must_change_password,
            },
            diff_only=False,
        )
        return credential

    # -- Updates ----------------------------------------------------------

    def update_user(
        self,
        context: AuthorizationContext,
        user_id: uuid.UUID,
        *,
        expected_version: int,
        actor: AuditActor,
        full_name: Any = UNSET,
        email: Any = UNSET,
        is_active: Any = UNSET,
        disabled_reason: Any = UNSET,
        reason: str | None = None,
    ) -> User:
        """Update a user's profile or account state.

        Disabling an account revokes every live session in the same transaction,
        so authorization cannot outlive the account (SECURITY.md §4).
        """
        context.require(USER_UPDATE)

        readable = self._session.execute(
            self._readable_query(context).where(User.id == user_id)
        ).scalar_one_or_none()
        if readable is None:
            raise ResourceNotFoundError("User not found.")
        self._require_update_scope(context, readable)

        user = lock_for_update(self._session, User, user_id)
        if user is None:  # pragma: no cover - readability implies presence
            raise ResourceNotFoundError("User not found.")
        assert_version(user.version, expected_version)

        before = _user_snapshot(user)
        was_active = user.is_active

        if full_name is not UNSET:
            user.full_name = normalize_name(str(full_name))

        if email is not UNSET:
            clean_email = str(email).strip()
            normalized = normalize_email(clean_email)
            if (
                normalized != user.normalized_email
                and self._session.execute(
                    select(User.id)
                    .where(
                        User.organization_id == context.organization_id,
                        User.normalized_email == normalized,
                        User.id != user.id,
                    )
                    .limit(1)
                ).first()
                is not None
            ):
                raise ConflictError("A user with this email already exists in this organization.")
            user.email = clean_email
            user.normalized_email = normalized

        if is_active is not UNSET:
            active = bool(is_active)
            if active:
                user.is_active = True
                user.disabled_at = None
                user.disabled_reason = None
            else:
                if user.id == context.user_id:
                    # A self-disable would immediately revoke the caller's own
                    # session and could leave an organization with no authorized
                    # administrator.
                    raise ValidationFailedError("You cannot disable your own account.")
                user.is_active = False
                user.disabled_at = utcnow()
                user.disabled_reason = (
                    str(disabled_reason) if disabled_reason not in (UNSET, None) else None
                )

        user.version += 1
        self._session.flush()

        self._audit.record(
            action=USER_UPDATED,
            entity_type="user",
            entity_id=user.id,
            actor=actor,
            organization_id=context.organization_id,
            before=before,
            after=_user_snapshot(user),
            reason=reason,
        )

        if was_active and not user.is_active:
            self._authentication.revoke_all_user_sessions(
                user, reason="account_disabled", actor=actor
            )
            self._audit.record(
                action=USER_DISABLED,
                entity_type="user",
                entity_id=user.id,
                actor=actor,
                organization_id=context.organization_id,
                after={"is_active": False, "disabled_at": user.disabled_at},
                reason=user.disabled_reason or reason,
                diff_only=False,
            )
        elif not was_active and user.is_active:
            self._audit.record(
                action=USER_ENABLED,
                entity_type="user",
                entity_id=user.id,
                actor=actor,
                organization_id=context.organization_id,
                after={"is_active": True},
                reason=reason,
                diff_only=False,
            )

        return user

    def _require_update_scope(self, context: AuthorizationContext, user: User) -> None:
        """Require ``user.update`` for at least one department the user belongs to.

        An organization-scoped grant is sufficient. A department-scoped grant
        covers only users who currently belong to one of the granted departments.
        """
        if context.has_organization_scope(USER_UPDATE):
            return
        authorized = context.authorized_department_ids(USER_UPDATE)
        member_of = set(
            self._session.execute(
                select(DepartmentMembership.department_id).where(
                    DepartmentMembership.user_id == user.id,
                    DepartmentMembership.ended_on.is_(None),
                )
            ).scalars()
        )
        if not authorized & member_of:
            # 404 rather than 403: the caller can read this user but may not
            # manage them, and naming the distinction adds nothing useful while
            # the read path already gates visibility.
            from app.core.errors import PermissionDeniedError

            raise PermissionDeniedError(
                "You do not have permission to manage this user.", permission=USER_UPDATE
            )

    # -- Department memberships -------------------------------------------

    def add_membership(
        self,
        context: AuthorizationContext,
        *,
        user_id: uuid.UUID,
        department_id: uuid.UUID,
        is_primary: bool,
        started_on: date,
        actor: AuditActor,
        note: str | None = None,
        skip_read_check: bool = False,
    ) -> DepartmentMembership:
        """Add a department membership.

        TODO REQUIRES BUSINESS DECISION (DOMAIN_MODEL.md §10): whether a user may
        hold several concurrent memberships. No limit is invented; only a
        duplicate active membership in the *same* department is rejected, which
        the database also enforces.
        """
        context.require(USER_UPDATE)

        if skip_read_check:
            user = self._session.get(User, user_id)
            if user is None or user.organization_id != context.organization_id:
                raise ResourceNotFoundError("User not found.")
        else:
            user = self.get_user(context, user_id)
            self._require_update_scope(context, user)

        department = self._session.execute(
            select(Department).where(
                Department.id == department_id,
                Department.organization_id == context.organization_id,
            )
        ).scalar_one_or_none()
        if department is None:
            raise ValidationFailedError(
                "department_id does not reference a department in this organization.",
                field_errors={"department_id": ["Unknown department."]},
            )
        if not department.is_active:
            raise ValidationFailedError(
                "Cannot add a membership to an archived department.",
                field_errors={"department_id": ["Department is archived."]},
            )
        context.require_department(USER_UPDATE, department.id)

        if (
            self._session.execute(
                select(DepartmentMembership.id)
                .where(
                    DepartmentMembership.user_id == user.id,
                    DepartmentMembership.department_id == department.id,
                    DepartmentMembership.ended_on.is_(None),
                )
                .limit(1)
            ).first()
            is not None
        ):
            raise ConflictError("The user already has an active membership in this department.")

        if is_primary:
            self._clear_primary_flags(user.id)

        membership = DepartmentMembership(
            organization_id=context.organization_id,
            user_id=user.id,
            department_id=department.id,
            is_primary=is_primary,
            started_on=started_on,
            note=note,
        )
        self._session.add(membership)
        self._session.flush()

        self._audit.record(
            action=DEPARTMENT_MEMBERSHIP_CREATED,
            entity_type="department_membership",
            entity_id=membership.id,
            actor=actor,
            organization_id=context.organization_id,
            after=_membership_snapshot(membership),
            diff_only=False,
        )
        return membership

    def end_membership(
        self,
        context: AuthorizationContext,
        *,
        user_id: uuid.UUID,
        membership_id: uuid.UUID,
        ended_on: date,
        actor: AuditActor,
        reason: str | None = None,
    ) -> DepartmentMembership:
        """End a membership without deleting it.

        The row is retained with ``ended_on`` set, so historical department
        relationships survive a transfer (DATABASE.md §2: "Time-aware user
        membership").
        """
        context.require(USER_UPDATE)
        user = self.get_user(context, user_id)
        self._require_update_scope(context, user)

        membership = self._session.execute(
            select(DepartmentMembership).where(
                DepartmentMembership.id == membership_id,
                DepartmentMembership.user_id == user.id,
                DepartmentMembership.organization_id == context.organization_id,
            )
        ).scalar_one_or_none()
        if membership is None:
            raise ResourceNotFoundError("Membership not found.")
        context.require_department(USER_UPDATE, membership.department_id)

        if membership.ended_on is not None:
            raise ConflictError("The membership has already ended.")
        if ended_on < membership.started_on:
            raise ValidationFailedError(
                "ended_on cannot precede started_on.",
                field_errors={"ended_on": ["Must not precede the membership start date."]},
            )

        before = _membership_snapshot(membership)
        membership.ended_on = ended_on
        membership.is_primary = False
        self._session.flush()

        self._audit.record(
            action=DEPARTMENT_MEMBERSHIP_ENDED,
            entity_type="department_membership",
            entity_id=membership.id,
            actor=actor,
            organization_id=context.organization_id,
            before=before,
            after=_membership_snapshot(membership),
            reason=reason,
        )
        return membership

    def _clear_primary_flags(self, user_id: uuid.UUID) -> None:
        rows = self._session.execute(
            select(DepartmentMembership).where(
                DepartmentMembership.user_id == user_id,
                DepartmentMembership.ended_on.is_(None),
                DepartmentMembership.is_primary.is_(True),
            )
        ).scalars()
        for row in rows:
            row.is_primary = False


def _has_active_membership(department_id: uuid.UUID) -> Any:
    return exists(
        select(DepartmentMembership.id).where(
            DepartmentMembership.user_id == User.id,
            DepartmentMembership.department_id == department_id,
            DepartmentMembership.ended_on.is_(None),
        )
    )


def _user_snapshot(user: User) -> dict[str, Any]:
    """Audit snapshot for a user.

    Contains no authentication material: the credential lives in another table
    and is never joined into this projection.
    """
    return {
        "full_name": user.full_name,
        "email": user.email,
        "normalized_email": user.normalized_email,
        "is_active": user.is_active,
        "disabled_at": user.disabled_at,
        "disabled_reason": user.disabled_reason,
        "version": user.version,
    }


def _membership_snapshot(membership: DepartmentMembership) -> dict[str, Any]:
    return {
        "user_id": membership.user_id,
        "department_id": membership.department_id,
        "is_primary": membership.is_primary,
        "started_on": membership.started_on,
        "ended_on": membership.ended_on,
        "note": membership.note,
    }
