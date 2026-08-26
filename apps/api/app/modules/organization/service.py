"""Organization and department use cases.

ARCHITECTURE.md §5: a use case establishes the transaction, loads scoped
entities, checks permissions and invariants, mutates state, appends audit data,
then commits atomically. The transaction boundary is the request dependency
(``app/db/session.py``); each method below runs inside one.

Every read path takes its organization from :class:`AuthorizationContext`, never
from request content. No method here accepts an ``organization_id`` argument
supplied by a caller.
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import ConflictError, ResourceNotFoundError, ValidationFailedError
from app.core.sentinels import UNSET
from app.core.text import normalize_name
from app.db.concurrency import assert_version, lock_for_update
from app.modules.access.authorization import AuthorizationContext
from app.modules.access.catalog import (
    DEPARTMENT_CREATE,
    DEPARTMENT_READ,
    DEPARTMENT_UPDATE,
    ORGANIZATION_READ,
    ORGANIZATION_UPDATE,
)
from app.modules.audit.service import (
    DEPARTMENT_CREATED,
    DEPARTMENT_UPDATED,
    ORGANIZATION_UPDATED,
    AuditActor,
    AuditRecorder,
)
from app.modules.organization.models import Department, DepartmentMembership, Organization

#: Maximum depth walked when checking for a department hierarchy cycle. Bounds
#: the check for a pathological chain (SECURITY.md §5: limit complexity).
_MAX_HIERARCHY_DEPTH = 64


class OrganizationService:
    """Read and update the caller's own organization."""

    def __init__(self, session: Session, audit: AuditRecorder) -> None:
        self._session = session
        self._audit = audit

    def get_current(self, context: AuthorizationContext) -> Organization:
        """Return the authenticated user's organization.

        There is deliberately no "list organizations" and no "get organization by
        id": a caller can only ever address its own tenant, so cross-organization
        enumeration is not expressible in the API surface.
        """
        context.require_organization_scope(ORGANIZATION_READ)
        organization = self._session.get(Organization, context.organization_id)
        if organization is None:  # pragma: no cover - a live session implies existence
            raise ResourceNotFoundError("Organization not found.")
        return organization

    def update_current(
        self,
        context: AuthorizationContext,
        *,
        expected_version: int,
        actor: AuditActor,
        name: Any = UNSET,
        timezone: Any = UNSET,
        is_active: Any = UNSET,
        reason: str | None = None,
    ) -> Organization:
        context.require_organization_scope(ORGANIZATION_UPDATE)

        organization = lock_for_update(self._session, Organization, context.organization_id)
        if organization is None:  # pragma: no cover
            raise ResourceNotFoundError("Organization not found.")
        assert_version(organization.version, expected_version)

        before = _organization_snapshot(organization)

        if name is not UNSET:
            organization.name = normalize_name(str(name))
        if timezone is not UNSET:
            organization.timezone = str(timezone)
        if is_active is not UNSET:
            organization.is_active = bool(is_active)
            organization.archived_at = None if organization.is_active else utcnow()

        organization.version += 1
        self._session.flush()

        self._audit.record(
            action=ORGANIZATION_UPDATED,
            entity_type="organization",
            entity_id=organization.id,
            actor=actor,
            organization_id=organization.id,
            before=before,
            after=_organization_snapshot(organization),
            reason=reason,
        )
        return organization


class DepartmentService:
    """Department CRUD within the caller's authorized scope."""

    def __init__(self, session: Session, audit: AuditRecorder) -> None:
        self._session = session
        self._audit = audit

    # -- Reads ------------------------------------------------------------

    def list_departments(
        self,
        context: AuthorizationContext,
        *,
        limit: int,
        include_inactive: bool = False,
        cursor: uuid.UUID | None = None,
    ) -> Sequence[Department]:
        """List departments the caller may read.

        RBAC.md §5: "apply organization/department/resource predicates in the
        database query. Never load all rows and filter in application memory."
        The scope predicate is part of the SQL and is applied *before* pagination,
        as API.md §1 requires.
        """
        context.require(DEPARTMENT_READ)
        query = self._readable_query(context)
        if not include_inactive:
            query = query.where(Department.is_active.is_(True))
        if cursor is not None:
            query = query.where(Department.id > cursor)
        return list(self._session.execute(query.order_by(Department.id).limit(limit)).scalars())

    def get_department(self, context: AuthorizationContext, department_id: uuid.UUID) -> Department:
        """Return one readable department.

        A department outside the caller's scope raises ``404``, not ``403``:
        confirming that an identifier exists would leak the structure of
        departments the caller may not see (API.md §2). This is the IDOR path
        exercised by the identifier-substitution tests.
        """
        context.require(DEPARTMENT_READ)
        department = self._session.execute(
            self._readable_query(context).where(Department.id == department_id)
        ).scalar_one_or_none()
        if department is None:
            raise ResourceNotFoundError("Department not found.")
        return department

    def _readable_query(self, context: AuthorizationContext) -> Select[tuple[Department]]:
        """Base query narrowed to the caller's organization and department scope."""
        query = select(Department).where(Department.organization_id == context.organization_id)
        if context.has_organization_scope(DEPARTMENT_READ):
            return query
        authorized = context.authorized_department_ids(DEPARTMENT_READ)
        if not authorized:
            # Unreachable after ``require``, but an empty ``IN ()`` silently means
            # "match nothing" — state the intent rather than relying on that.
            return query.where(Department.id.in_([]))
        return query.where(Department.id.in_(authorized))

    # -- Writes -----------------------------------------------------------

    def create_department(
        self,
        context: AuthorizationContext,
        *,
        name: str,
        code: str | None,
        parent_department_id: uuid.UUID | None,
        actor: AuditActor,
        reason: str | None = None,
    ) -> Department:
        """Create a department in the caller's organization.

        Creating a department is an organization-level act, so a department-scoped
        grant does not confer it (``ORGANIZATION_SCOPE_ONLY_PERMISSIONS``).
        """
        context.require_organization_scope(DEPARTMENT_CREATE)

        parent = self._resolve_parent(context, parent_department_id)
        clean_name = normalize_name(name)
        clean_code = code.strip() if code else None
        self._assert_name_available(context.organization_id, clean_name, exclude_id=None)
        if clean_code:
            self._assert_code_available(context.organization_id, clean_code, exclude_id=None)

        department = Department(
            organization_id=context.organization_id,
            name=clean_name,
            code=clean_code,
            parent_department_id=parent.id if parent is not None else None,
        )
        self._session.add(department)
        self._session.flush()

        self._audit.record(
            action=DEPARTMENT_CREATED,
            entity_type="department",
            entity_id=department.id,
            actor=actor,
            organization_id=context.organization_id,
            after=_department_snapshot(department),
            reason=reason,
            diff_only=False,
        )
        return department

    def update_department(
        self,
        context: AuthorizationContext,
        department_id: uuid.UUID,
        *,
        expected_version: int,
        actor: AuditActor,
        name: Any = UNSET,
        code: Any = UNSET,
        parent_department_id: Any = UNSET,
        is_active: Any = UNSET,
        reason: str | None = None,
    ) -> Department:
        """Update or archive a department within the caller's scope."""
        context.require(DEPARTMENT_UPDATE)

        # Resolve within scope first, so an out-of-scope identifier becomes a 404
        # before any lock is taken.
        readable = self._session.execute(
            self._readable_query(context).where(Department.id == department_id)
        ).scalar_one_or_none()
        if readable is None:
            raise ResourceNotFoundError("Department not found.")
        context.require_department(DEPARTMENT_UPDATE, readable.id)

        department = lock_for_update(self._session, Department, department_id)
        if department is None:  # pragma: no cover - readability implies presence
            raise ResourceNotFoundError("Department not found.")
        assert_version(department.version, expected_version)

        before = _department_snapshot(department)

        if name is not UNSET:
            clean_name = normalize_name(str(name))
            self._assert_name_available(
                context.organization_id, clean_name, exclude_id=department.id
            )
            department.name = clean_name

        if code is not UNSET:
            clean_code = str(code).strip() if code is not None else None
            if clean_code:
                self._assert_code_available(
                    context.organization_id, clean_code, exclude_id=department.id
                )
            department.code = clean_code or None

        if parent_department_id is not UNSET:
            parent = self._resolve_parent(context, parent_department_id)
            if parent is not None:
                self._assert_no_cycle(department.id, parent.id)
            department.parent_department_id = parent.id if parent is not None else None

        if is_active is not UNSET:
            active = bool(is_active)
            if not active:
                self._assert_archivable(department)
            department.is_active = active
            department.archived_at = None if active else utcnow()

        department.version += 1
        self._session.flush()

        self._audit.record(
            action=DEPARTMENT_UPDATED,
            entity_type="department",
            entity_id=department.id,
            actor=actor,
            organization_id=context.organization_id,
            before=before,
            after=_department_snapshot(department),
            reason=reason,
        )
        return department

    # -- Invariants -------------------------------------------------------

    def _resolve_parent(
        self, context: AuthorizationContext, parent_department_id: uuid.UUID | None
    ) -> Department | None:
        """Load the parent department, requiring the same organization.

        The composite foreign key already makes a cross-organization parent
        impossible at the database level; this produces a clean ``422`` instead of
        an integrity error, and keeps the rule visible in the use case.
        """
        if parent_department_id is None:
            return None
        parent = self._session.execute(
            select(Department).where(
                Department.id == parent_department_id,
                Department.organization_id == context.organization_id,
            )
        ).scalar_one_or_none()
        if parent is None:
            raise ValidationFailedError(
                "parent_department_id does not reference a department in this organization.",
                field_errors={"parent_department_id": ["Unknown department."]},
            )
        if not parent.is_active:
            raise ValidationFailedError(
                "A parent department must be active.",
                field_errors={"parent_department_id": ["Department is archived."]},
            )
        return parent

    def _assert_no_cycle(self, department_id: uuid.UUID, new_parent_id: uuid.UUID) -> None:
        """Reject a re-parent that would create a hierarchy cycle.

        API.md requires "prevent hierarchy cycle". The database check constraint
        blocks only direct self-parenting, so the transitive case is walked here.
        """
        if new_parent_id == department_id:
            raise ValidationFailedError(
                "A department cannot be its own parent.",
                field_errors={"parent_department_id": ["Cycle detected."]},
            )
        current: uuid.UUID | None = new_parent_id
        for _ in range(_MAX_HIERARCHY_DEPTH):
            if current is None:
                return
            if current == department_id:
                raise ValidationFailedError(
                    "The requested parent is a descendant of this department.",
                    field_errors={"parent_department_id": ["Cycle detected."]},
                )
            current = self._session.execute(
                select(Department.parent_department_id).where(Department.id == current)
            ).scalar_one_or_none()
        raise ValidationFailedError(
            "The department hierarchy is deeper than the supported limit.",
            field_errors={"parent_department_id": ["Hierarchy too deep."]},
        )

    def _assert_archivable(self, department: Department) -> None:
        """Refuse to archive a department that is still referenced.

        DATABASE.md §7: identity/configuration records use ``archived_at`` "where
        references must remain". Leaving live memberships, child departments or
        role assignments pointing at an archived department would make
        authorization scope ambiguous, so the caller unwinds them first.
        """
        if self._exists(
            select(DepartmentMembership.id).where(
                DepartmentMembership.department_id == department.id,
                DepartmentMembership.ended_on.is_(None),
            )
        ):
            raise ConflictError(
                "The department still has active memberships. End them before archiving."
            )

        if self._exists(
            select(Department.id).where(
                Department.parent_department_id == department.id,
                Department.is_active.is_(True),
            )
        ):
            raise ConflictError(
                "The department still has active child departments. Archive them first."
            )

        from app.modules.access.models import RoleAssignment

        if self._exists(
            select(RoleAssignment.id).where(
                RoleAssignment.department_id == department.id,
                RoleAssignment.revoked_at.is_(None),
            )
        ):
            raise ConflictError(
                "The department still has active role assignments. End them before archiving."
            )

    def _assert_name_available(
        self, organization_id: uuid.UUID, name: str, *, exclude_id: uuid.UUID | None
    ) -> None:
        query = select(Department.id).where(
            Department.organization_id == organization_id,
            Department.is_active.is_(True),
            func.lower(Department.name) == name.lower(),
        )
        if exclude_id is not None:
            query = query.where(Department.id != exclude_id)
        if self._exists(query):
            raise ConflictError("An active department with this name already exists.")

    def _assert_code_available(
        self, organization_id: uuid.UUID, code: str, *, exclude_id: uuid.UUID | None
    ) -> None:
        query = select(Department.id).where(
            Department.organization_id == organization_id,
            Department.is_active.is_(True),
            func.lower(Department.code) == code.lower(),
        )
        if exclude_id is not None:
            query = query.where(Department.id != exclude_id)
        if self._exists(query):
            raise ConflictError("An active department with this code already exists.")

    def _exists(self, query: Select[Any]) -> bool:
        return self._session.execute(query.limit(1)).first() is not None


# ---------------------------------------------------------------------------
# Audit snapshots
# ---------------------------------------------------------------------------


def _organization_snapshot(organization: Organization) -> dict[str, Any]:
    return {
        "name": organization.name,
        "slug": organization.slug,
        "timezone": organization.timezone,
        "is_active": organization.is_active,
        "archived_at": organization.archived_at,
        "version": organization.version,
    }


def _department_snapshot(department: Department) -> dict[str, Any]:
    return {
        "name": department.name,
        "code": department.code,
        "parent_department_id": department.parent_department_id,
        "is_active": department.is_active,
        "archived_at": department.archived_at,
        "version": department.version,
    }
