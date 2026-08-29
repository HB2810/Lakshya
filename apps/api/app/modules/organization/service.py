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
from datetime import date
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


# ---------------------------------------------------------------------------
# Position and Organizational Hierarchy Service
# ---------------------------------------------------------------------------

from app.modules.identity.models import User
from app.modules.organization.models import Position, PositionAssignment
from app.modules.organization.schemas import (
    OrgNode,
    OrgNodeOccupant,
    OrgTreeResponse,
    PositionResponse,
)

POSITION_CREATED = "organization.position.created"
POSITION_UPDATED = "organization.position.updated"
POSITION_TRANSFERRED = "organization.position.transferred"


class PositionService:
    """Canonical position management, employee transfer, reporting line & tree queries."""

    def __init__(self, session: Session, audit: AuditRecorder) -> None:
        self._session = session
        self._audit = audit

    # -- Position CRUD ----------------------------------------------------

    def list_positions(
        self,
        context: AuthorizationContext,
        *,
        department_id: uuid.UUID | None = None,
        include_inactive: bool = False,
    ) -> list[PositionResponse]:
        """List positions with their current occupant details."""
        query = select(Position).where(Position.organization_id == context.organization_id)
        if not include_inactive:
            query = query.where(Position.is_active.is_(True))
        if department_id is not None:
            query = query.where(Position.department_id == department_id)

        positions = list(self._session.execute(query.order_by(Position.title)).scalars())

        # Load active assignments
        pos_ids = [p.id for p in positions]
        occupants_map: dict[uuid.UUID, tuple[uuid.UUID, str, str]] = {}
        if pos_ids:
            assign_query = (
                select(
                    PositionAssignment.position_id,
                    User.id,
                    User.full_name,
                    User.email,
                )
                .join(User, User.id == PositionAssignment.user_id)
                .where(
                    PositionAssignment.organization_id == context.organization_id,
                    PositionAssignment.position_id.in_(pos_ids),
                    PositionAssignment.ended_on.is_(None),
                )
            )
            for row in self._session.execute(assign_query):
                occupants_map[row[0]] = (row[1], row[2], row[3])

        results: list[PositionResponse] = []
        for p in positions:
            occupant = occupants_map.get(p.id)
            results.append(
                PositionResponse(
                    id=p.id,
                    organization_id=p.organization_id,
                    department_id=p.department_id,
                    reports_to_position_id=p.reports_to_position_id,
                    title=p.title,
                    code=p.code,
                    is_leadership=p.is_leadership,
                    is_active=p.is_active,
                    archived_at=p.archived_at,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                    version=p.version,
                    current_occupant_id=occupant[0] if occupant else None,
                    current_occupant_name=occupant[1] if occupant else None,
                    current_occupant_email=occupant[2] if occupant else None,
                )
            )
        return results

    def create_position(
        self,
        context: AuthorizationContext,
        *,
        department_id: uuid.UUID,
        title: str,
        code: str | None = None,
        reports_to_position_id: uuid.UUID | None = None,
        is_leadership: bool = False,
        actor: AuditActor,
    ) -> Position:
        """Create a new post in a department."""
        dept = self._session.execute(
            select(Department).where(
                Department.id == department_id,
                Department.organization_id == context.organization_id,
                Department.is_active.is_(True),
            )
        ).scalar_one_or_none()
        if not dept:
            raise ValidationFailedError("Valid active department in this organization is required.")

        if reports_to_position_id is not None:
            parent_pos = self._session.execute(
                select(Position).where(
                    Position.id == reports_to_position_id,
                    Position.organization_id == context.organization_id,
                    Position.is_active.is_(True),
                )
            ).scalar_one_or_none()
            if not parent_pos:
                raise ValidationFailedError("reports_to_position_id must reference a valid active position.")

        pos = Position(
            organization_id=context.organization_id,
            department_id=department_id,
            reports_to_position_id=reports_to_position_id,
            title=normalize_name(title),
            code=code.strip() if code else None,
            is_leadership=is_leadership,
        )
        self._session.add(pos)
        self._session.flush()

        self._audit.record(
            action=POSITION_CREATED,
            entity_type="position",
            entity_id=pos.id,
            actor=actor,
            organization_id=context.organization_id,
            after={
                "title": pos.title,
                "department_id": pos.department_id,
                "reports_to_position_id": pos.reports_to_position_id,
                "is_leadership": pos.is_leadership,
            },
            diff_only=False,
        )
        return pos

    # -- Canonical Transfer Mutation --------------------------------------

    def transfer_person(
        self,
        context: AuthorizationContext,
        *,
        user_id: uuid.UUID,
        new_position_id: uuid.UUID,
        started_on: date,
        transfer_reason: str | None = None,
        actor: AuditActor,
    ) -> PositionAssignment:
        """Transfer an employee to a new position.

        Single unified mutation:
        1. Closes current active position assignment for user (ended_on = started_on).
        2. Closes existing occupant of target position if any.
        3. Creates new active PositionAssignment.
        4. Updates primary DepartmentMembership to match target position's department.
        5. Emits POSITION_TRANSFERRED audit event.
        """
        user = self._session.execute(
            select(User).where(
                User.id == user_id,
                User.organization_id == context.organization_id,
                User.is_active.is_(True),
            )
        ).scalar_one_or_none()
        if not user:
            raise ResourceNotFoundError("User not found in organization.")

        target_pos = self._session.execute(
            select(Position).where(
                Position.id == new_position_id,
                Position.organization_id == context.organization_id,
                Position.is_active.is_(True),
            )
        ).scalar_one_or_none()
        if not target_pos:
            raise ResourceNotFoundError("Target position not found or inactive.")

        # 1. Close current active position assignment(s) for this user
        active_assignments = list(
            self._session.execute(
                select(PositionAssignment).where(
                    PositionAssignment.organization_id == context.organization_id,
                    PositionAssignment.user_id == user.id,
                    PositionAssignment.ended_on.is_(None),
                )
            ).scalars()
        )
        prev_pos_id: uuid.UUID | None = None
        for old_assign in active_assignments:
            old_assign.ended_on = started_on
            old_assign.is_primary = False
            prev_pos_id = old_assign.position_id

        # 2. Close existing occupant on target position if any
        target_occupants = list(
            self._session.execute(
                select(PositionAssignment).where(
                    PositionAssignment.organization_id == context.organization_id,
                    PositionAssignment.position_id == target_pos.id,
                    PositionAssignment.ended_on.is_(None),
                )
            ).scalars()
        )
        for occ in target_occupants:
            occ.ended_on = started_on
            occ.is_primary = False

        # 3. Create new PositionAssignment
        new_assignment = PositionAssignment(
            organization_id=context.organization_id,
            user_id=user.id,
            position_id=target_pos.id,
            is_primary=True,
            started_on=started_on,
            transfer_reason=transfer_reason,
            assigned_by_user_id=context.user_id,
        )
        self._session.add(new_assignment)
        self._session.flush()

        # 4. Synchronize DepartmentMembership
        # End current primary membership
        current_memberships = list(
            self._session.execute(
                select(DepartmentMembership).where(
                    DepartmentMembership.organization_id == context.organization_id,
                    DepartmentMembership.user_id == user.id,
                    DepartmentMembership.ended_on.is_(None),
                )
            ).scalars()
        )
        for dm in current_memberships:
            if dm.department_id != target_pos.department_id:
                dm.ended_on = started_on
                dm.is_primary = False

        # Ensure membership in target department exists
        target_dm = self._session.execute(
            select(DepartmentMembership).where(
                DepartmentMembership.organization_id == context.organization_id,
                DepartmentMembership.user_id == user.id,
                DepartmentMembership.department_id == target_pos.department_id,
                DepartmentMembership.ended_on.is_(None),
            )
        ).scalar_one_or_none()
        if not target_dm:
            target_dm = DepartmentMembership(
                organization_id=context.organization_id,
                user_id=user.id,
                department_id=target_pos.department_id,
                is_primary=True,
                started_on=started_on,
                note=f"Transferred to position '{target_pos.title}'",
            )
            self._session.add(target_dm)
        else:
            target_dm.is_primary = True

        self._session.flush()

        self._audit.record(
            action=POSITION_TRANSFERRED,
            entity_type="position_assignment",
            entity_id=new_assignment.id,
            actor=actor,
            organization_id=context.organization_id,
            before={"position_id": prev_pos_id, "user_id": user.id},
            after={
                "position_id": target_pos.id,
                "department_id": target_pos.department_id,
                "user_id": user.id,
                "started_on": started_on.isoformat(),
            },
            reason=transfer_reason,
        )
        return new_assignment

    # -- Org Tree and Reporting Graph -------------------------------------

    def get_organization_tree(self, context: AuthorizationContext) -> OrgTreeResponse:
        """Build the full canonical hierarchical organization chart from database."""
        org = self._session.get(Organization, context.organization_id)
        if not org:
            raise ResourceNotFoundError("Organization not found.")

        # 1. Load departments
        depts = {
            d.id: d.name
            for d in self._session.execute(
                select(Department).where(
                    Department.organization_id == context.organization_id,
                    Department.is_active.is_(True),
                )
            ).scalars()
        }

        # 2. Load positions
        positions = list(
            self._session.execute(
                select(Position).where(
                    Position.organization_id == context.organization_id,
                    Position.is_active.is_(True),
                )
            ).scalars()
        )

        # 3. Load active occupants
        occupant_query = (
            select(
                PositionAssignment.position_id,
                User.id,
                User.full_name,
                User.email,
                PositionAssignment.started_on,
            )
            .join(User, User.id == PositionAssignment.user_id)
            .where(
                PositionAssignment.organization_id == context.organization_id,
                PositionAssignment.ended_on.is_(None),
            )
        )
        occupants: dict[uuid.UUID, OrgNodeOccupant] = {}
        for row in self._session.execute(occupant_query):
            occupants[row[0]] = OrgNodeOccupant(
                user_id=row[1],
                full_name=row[2],
                email=row[3],
                started_on=row[4].isoformat(),
            )

        # 4. Assemble Tree Nodes
        nodes_by_id: dict[uuid.UUID, OrgNode] = {}
        for p in positions:
            dept_name = depts.get(p.department_id, "General")
            nodes_by_id[p.id] = OrgNode(
                position_id=p.id,
                title=p.title,
                code=p.code,
                is_leadership=p.is_leadership,
                department_id=p.department_id,
                department_name=dept_name,
                reports_to_position_id=p.reports_to_position_id,
                current_occupant=occupants.get(p.id),
                subordinates=[],
            )

        root_nodes: list[OrgNode] = []
        for pos_id, node in nodes_by_id.items():
            if node.reports_to_position_id and node.reports_to_position_id in nodes_by_id:
                nodes_by_id[node.reports_to_position_id].subordinates.append(node)
            else:
                root_nodes.append(node)

        return OrgTreeResponse(
            organization_id=org.id,
            organization_name=org.name,
            root_nodes=root_nodes,
        )

    def get_scoped_organization_tree(self, context: AuthorizationContext) -> OrgTreeResponse:
        """Build the scoped organization tree rooted at the caller's position subtree."""
        full_tree = self.get_organization_tree(context)

        upper_roles = [r.upper() for r in context.effective_roles]
        if any(r in upper_roles for r in ("MD", "MANAGING_DIRECTOR", "MD_OFFICE", "MASTER", "ADMIN")):
            return full_tree

        # Find leader's active position
        leader_pos_id = self._session.execute(
            select(PositionAssignment.position_id).where(
                PositionAssignment.organization_id == context.organization_id,
                PositionAssignment.user_id == context.user_id,
                PositionAssignment.ended_on.is_(None),
            )
        ).scalar_one_or_none()

        if not leader_pos_id:
            return OrgTreeResponse(
                organization_id=full_tree.organization_id,
                organization_name=full_tree.organization_name,
                root_nodes=[],
            )

        def _find_node(nodes: list[OrgNode], target_id: uuid.UUID) -> OrgNode | None:
            for n in nodes:
                if n.position_id == target_id:
                    return n
                sub = _find_node(n.subordinates, target_id)
                if sub:
                    return sub
            return None

        scoped_root = _find_node(full_tree.root_nodes, leader_pos_id)
        return OrgTreeResponse(
            organization_id=full_tree.organization_id,
            organization_name=full_tree.organization_name,
            root_nodes=[scoped_root] if scoped_root else [],
        )


    def get_user_reporting_chain(
        self, context: AuthorizationContext, user_id: uuid.UUID
    ) -> list[dict[str, Any]]:
        """Walk up the reporting structure for a user."""
        chain: list[dict[str, Any]] = []

        # Find user's active position
        current_pos_id = self._session.execute(
            select(PositionAssignment.position_id).where(
                PositionAssignment.organization_id == context.organization_id,
                PositionAssignment.user_id == user_id,
                PositionAssignment.ended_on.is_(None),
            )
        ).scalar_one_or_none()

        curr_pos_id = current_pos_id
        depth = 0
        while curr_pos_id and depth < _MAX_HIERARCHY_DEPTH:
            pos = self._session.get(Position, curr_pos_id)
            if not pos:
                break

            # Find occupant
            occ_query = (
                select(User.id, User.full_name, User.email)
                .join(PositionAssignment, PositionAssignment.user_id == User.id)
                .where(
                    PositionAssignment.position_id == pos.id,
                    PositionAssignment.ended_on.is_(None),
                )
            )
            occ_row = self._session.execute(occ_query).first()

            dept = self._session.get(Department, pos.department_id)
            chain.append({
                "position_id": str(pos.id),
                "position_title": pos.title,
                "department_name": dept.name if dept else "General",
                "occupant_id": str(occ_row[0]) if occ_row else None,
                "occupant_name": occ_row[1] if occ_row else "Vacant",
                "occupant_email": occ_row[2] if occ_row else None,
                "is_leadership": pos.is_leadership,
            })
            curr_pos_id = pos.reports_to_position_id
            depth += 1

        return chain

    def get_subordinate_user_ids(
        self, organization_id: uuid.UUID, leader_user_id: uuid.UUID
    ) -> set[uuid.UUID]:
        """Compute all direct and indirect reportee user IDs under leader."""
        # 1. Find all active positions held by leader
        leader_pos_ids = set(
            self._session.execute(
                select(PositionAssignment.position_id).where(
                    PositionAssignment.organization_id == organization_id,
                    PositionAssignment.user_id == leader_user_id,
                    PositionAssignment.ended_on.is_(None),
                )
            ).scalars()
        )
        if not leader_pos_ids:
            return set()

        # 2. Walk down position hierarchy
        all_positions = list(
            self._session.execute(
                select(Position.id, Position.reports_to_position_id).where(
                    Position.organization_id == organization_id,
                    Position.is_active.is_(True),
                )
            ).all()
        )
        children_map: dict[uuid.UUID, list[uuid.UUID]] = {}
        for pid, parent_id in all_positions:
            if parent_id:
                children_map.setdefault(parent_id, []).append(pid)

        descendant_pos_ids: set[uuid.UUID] = set()
        queue = list(leader_pos_ids)
        while queue:
            curr = queue.pop(0)
            for child in children_map.get(curr, []):
                if child not in descendant_pos_ids:
                    descendant_pos_ids.add(child)
                    queue.append(child)

        if not descendant_pos_ids:
            return set()

        # 3. Find active occupants of descendant positions
        sub_users = set(
            self._session.execute(
                select(PositionAssignment.user_id).where(
                    PositionAssignment.organization_id == organization_id,
                    PositionAssignment.position_id.in_(descendant_pos_ids),
                    PositionAssignment.ended_on.is_(None),
                )
            ).scalars()
        )
        return sub_users

