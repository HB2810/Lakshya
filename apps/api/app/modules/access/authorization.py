"""Data-driven authorization service.

ARCHITECTURE.md §8 / RBAC.md §1:

    allow = permission granted by active role
        AND organization scope matches
        AND department/resource scope permits access
        AND domain invariant permits the transition

There is no persona branch in this file or anywhere else. Every decision reads
role assignments, roles and role permissions from the database, so Stavya changes
policy with data, not with a deployment.

Deny by default: an empty grant set denies everything. A freshly migrated
database has no grants at all (see ``catalog.py``).
"""

from __future__ import annotations

import uuid
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date

from sqlalchemy import Select, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.core.clock import utcnow
from app.core.errors import PermissionDeniedError
from app.modules.access.catalog import (
    ORGANIZATION_SCOPE_ONLY_PERMISSIONS,
    PERMISSION_KEYS,
    ScopeType,
)
from app.modules.access.models import Permission, Role, RoleAssignment, RolePermission
from app.modules.identity.models import User
from app.modules.organization.models import DepartmentMembership


class UnknownPermissionError(LookupError):
    """A permission key was checked that is not in the Phase 2 catalog.

    Fails loudly rather than silently denying: a typo in a route dependency
    would otherwise look like a correct denial and pass its own tests.
    """


@dataclass(frozen=True)
class PermissionGrant:
    """One effective permission at one scope."""

    permission_key: str
    scope_type: ScopeType
    department_id: uuid.UUID | None


@dataclass(frozen=True)
class AuthorizationContext:
    """The authenticated actor's effective authority.

    Resolved once per request from the session, never from request content.
    ``organization_id`` here is the only trusted organization scope: a client
    supplying ``organization_id`` in a body or query string is ignored
    (SECURITY.md §4, API.md §1).
    """

    user_id: uuid.UUID
    organization_id: uuid.UUID
    grants: tuple[PermissionGrant, ...]
    #: Departments the actor currently belongs to. Recorded for the ``self`` /
    #: ``related`` scopes that later modules need; it grants nothing on its own.
    member_department_ids: frozenset[uuid.UUID]

    # -- Queries ----------------------------------------------------------

    @property
    def permission_keys(self) -> frozenset[str]:
        """Every permission the actor holds at any scope.

        Suitable for ``GET /auth/me`` (API.md: "effective capabilities") and for
        frontend affordances. It is *not* an authorization decision — scope still
        has to be checked per resource.
        """
        return frozenset(grant.permission_key for grant in self.grants)

    def has_permission(self, permission_key: str) -> bool:
        """True when the actor holds ``permission_key`` at any scope."""
        _assert_known(permission_key)
        return any(grant.permission_key == permission_key for grant in self.grants)

    def has_organization_scope(self, permission_key: str) -> bool:
        """True when the actor holds ``permission_key`` organization-wide."""
        _assert_known(permission_key)
        return any(
            grant.permission_key == permission_key and grant.scope_type is ScopeType.ORGANIZATION
            for grant in self.grants
        )

    def authorized_department_ids(self, permission_key: str) -> frozenset[uuid.UUID]:
        """Departments for which ``permission_key`` is granted at department scope.

        TODO REQUIRES BUSINESS DECISION (RBAC.md §4): this returns the exact
        departments named in the role assignments and does **not** walk down the
        department hierarchy. Descendant inheritance needs Stavya's authoritative
        reporting structure; assuming it would silently widen authority.
        """
        _assert_known(permission_key)
        return frozenset(
            grant.department_id
            for grant in self.grants
            if grant.permission_key == permission_key
            and grant.scope_type is ScopeType.DEPARTMENT
            and grant.department_id is not None
        )

    def permits_department(self, permission_key: str, department_id: uuid.UUID | None) -> bool:
        """True when the actor may act on a resource owned by ``department_id``.

        ``None`` means an organization-wide resource, which requires
        organization scope.
        """
        if self.has_organization_scope(permission_key):
            return True
        if department_id is None:
            return False
        return department_id in self.authorized_department_ids(permission_key)

    # -- Assertions -------------------------------------------------------

    def require(self, permission_key: str) -> None:
        """Raise ``403`` unless the actor holds ``permission_key`` at any scope.

        Used as the first gate on list endpoints, which then narrow rows in SQL.
        """
        if not self.has_permission(permission_key):
            raise PermissionDeniedError(
                f"Permission '{permission_key}' is required.", permission=permission_key
            )

    def require_organization_scope(self, permission_key: str) -> None:
        """Raise ``403`` unless the actor holds ``permission_key`` organization-wide."""
        if not self.has_organization_scope(permission_key):
            raise PermissionDeniedError(
                f"Permission '{permission_key}' at organization scope is required.",
                permission=permission_key,
            )

    def require_department(self, permission_key: str, department_id: uuid.UUID | None) -> None:
        """Raise ``403`` unless the actor may act within ``department_id``."""
        if not self.permits_department(permission_key, department_id):
            raise PermissionDeniedError(
                f"Permission '{permission_key}' is not granted for this department.",
                permission=permission_key,
            )

    def require_delegatable(
        self,
        permission_keys: Iterable[str],
        *,
        scope_type: ScopeType,
        department_id: uuid.UUID | None,
    ) -> None:
        """Prevent privilege escalation through delegation.

        RBAC.md §4: "A user cannot grant a permission or scope they do not
        possess." SECURITY.md §4: "requiring grantors to possess grantable
        permission/scope".

        Granting at organization scope therefore requires holding the permission
        at organization scope; granting at department scope requires holding it
        either organization-wide or for that same department.
        """
        for key in sorted(set(permission_keys)):
            _assert_known(key)
            if scope_type is ScopeType.ORGANIZATION:
                permitted = self.has_organization_scope(key)
            else:
                permitted = self.permits_department(key, department_id)
            if not permitted:
                raise PermissionDeniedError(
                    f"You cannot delegate '{key}' because you do not hold it at the "
                    "requested scope.",
                    permission=key,
                )


class AuthorizationService:
    """Loads effective authority for a user."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def load_context(self, user: User, *, as_of: date | None = None) -> AuthorizationContext:
        """Resolve every effective grant for ``user`` in one query.

        RBAC.md §5: "Each request resolves effective permission assignments and
        applies organization/department/resource predicates in the database
        query. Never load all rows and filter in application memory."

        TODO REQUIRES BUSINESS DECISION (DOMAIN_MODEL.md §10): effective dates
        are compared against the current **UTC** date. Evaluating them in the
        organization's timezone requires the approved timezone and week-start
        convention, so no local-calendar rule is invented here.
        """
        effective_date = as_of or utcnow().date()

        rows = self._session.execute(
            self._grant_query(user.id, user.organization_id, effective_date)
        ).all()

        grants: list[PermissionGrant] = []
        for permission_key, scope_type_value, department_id in rows:
            scope_type = ScopeType(scope_type_value)
            # A department-scoped assignment must not confer an
            # organization-level capability such as creating a department or
            # provisioning a user. Enforced here so it holds no matter how the
            # role's permissions were configured.
            if (
                scope_type is ScopeType.DEPARTMENT
                and permission_key in ORGANIZATION_SCOPE_ONLY_PERMISSIONS
            ):
                continue
            grants.append(
                PermissionGrant(
                    permission_key=permission_key,
                    scope_type=scope_type,
                    department_id=department_id,
                )
            )

        return AuthorizationContext(
            user_id=user.id,
            organization_id=user.organization_id,
            grants=tuple(grants),
            member_department_ids=self._current_department_ids(user),
        )

    def load_effective_role_keys(self, user: User, *, as_of: date | None = None) -> list[str]:
        """Role keys the user actually holds right now.

        Shares :func:`effective_assignment_conditions` with the permission query,
        so a role name displayed by ``GET /auth/me`` can never disagree with the
        permissions that come with it. Filtering the two independently is how a
        future-dated or expired assignment ends up shown as a current role while
        granting nothing — a display that quietly misrepresents someone's
        authority.
        """
        effective_date = as_of or utcnow().date()
        return list(
            self._session.execute(
                select(Role.key)
                .join(RoleAssignment, RoleAssignment.role_id == Role.id)
                .where(
                    *effective_assignment_conditions(user.id, user.organization_id, effective_date)
                )
                .distinct()
                .order_by(Role.key)
            ).scalars()
        )

    @staticmethod
    def _grant_query(
        user_id: uuid.UUID, organization_id: uuid.UUID, effective_date: date
    ) -> Select[tuple[str, str, uuid.UUID | None]]:
        return (
            select(
                Permission.key,
                RoleAssignment.scope_type,
                RoleAssignment.department_id,
            )
            .join(Role, Role.id == RoleAssignment.role_id)
            .join(RolePermission, RolePermission.role_id == Role.id)
            .join(Permission, Permission.id == RolePermission.permission_id)
            .where(*effective_assignment_conditions(user_id, organization_id, effective_date))
            .distinct()
        )

    def _current_department_ids(self, user: User) -> frozenset[uuid.UUID]:
        rows = self._session.execute(
            select(DepartmentMembership.department_id).where(
                DepartmentMembership.user_id == user.id,
                DepartmentMembership.organization_id == user.organization_id,
                DepartmentMembership.ended_on.is_(None),
            )
        ).scalars()
        return frozenset(rows)


def effective_assignment_conditions(
    user_id: uuid.UUID, organization_id: uuid.UUID, effective_date: date
) -> tuple[ColumnElement[bool], ...]:
    """The single definition of "this role assignment is in force right now".

    Used by both the permission query and the role-name query. Anything that
    decides what a user currently holds must use this, so the two can never
    drift apart.
    """
    return (
        RoleAssignment.user_id == user_id,
        # Organization scope is part of the predicate, not an assumption.
        RoleAssignment.organization_id == organization_id,
        Role.organization_id == organization_id,
        RoleAssignment.revoked_at.is_(None),
        RoleAssignment.effective_from <= effective_date,
        (RoleAssignment.effective_to.is_(None)) | (RoleAssignment.effective_to >= effective_date),
        Role.is_active.is_(True),
    )


def _assert_known(permission_key: str) -> None:
    if permission_key not in PERMISSION_KEYS:
        raise UnknownPermissionError(
            f"{permission_key!r} is not a Phase 2 permission key. Add it to "
            "app.modules.access.catalog together with the code that enforces it."
        )
