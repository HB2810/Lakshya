"""Role, role-permission and role-assignment use cases.

This is the access-administration surface. Two rules dominate it, both from
RBAC.md §4 and SECURITY.md §4:

* **No self-elevation.** A grantor must already hold every permission it grants,
  at the scope it grants it. Enforced by
  :meth:`AuthorizationContext.require_delegatable`.
* **History is preserved.** Ending an assignment sets ``revoked_at``; nothing is
  deleted, and every grant and revocation writes an audit event.

Changing a user's grants revokes that user's live sessions, so authorization
state cannot outlive its grant (RBAC.md §5: "role assignment changes invalidate
sessions or authorization cache promptly").

TODO REQUIRES BUSINESS DECISION (RBAC.md §6.9, SECURITY.md §4): maker-checker
(dual approval) and recent-reauthentication requirements for privileged role
changes are unresolved. Neither is implemented, and neither is faked.
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import date
from typing import Any

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import ConflictError, ResourceNotFoundError, ValidationFailedError
from app.core.sentinels import UNSET
from app.core.text import normalize_name
from app.db.concurrency import assert_version, lock_for_update
from app.modules.access.authorization import AuthorizationContext
from app.modules.access.catalog import (
    ORGANIZATION_SCOPE_ONLY_PERMISSIONS,
    ROLE_ASSIGN,
    ROLE_CREATE,
    ROLE_PERMISSION_MANAGE,
    ROLE_READ,
    ROLE_TEMPLATE_KEYS,
    ROLE_UPDATE,
    ScopeType,
)
from app.modules.access.models import Permission, Role, RoleAssignment, RolePermission
from app.modules.audit.service import (
    ROLE_ASSIGNMENT_CREATED,
    ROLE_ASSIGNMENT_ENDED,
    ROLE_CREATED,
    ROLE_PERMISSION_GRANTED,
    ROLE_PERMISSION_REVOKED,
    ROLE_UPDATED,
    AuditActor,
    AuditRecorder,
)
from app.modules.identity.models import User
from app.modules.identity.service import AuthenticationService
from app.modules.organization.models import Department


class PermissionCatalogService:
    """Read-only access to the seeded permission catalog."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def list_permissions(self, context: AuthorizationContext) -> Sequence[Permission]:
        """List every permission key.

        API.md maps ``GET /permissions`` to ``role.read``. The catalog is global
        reference data, so there is no organization predicate — and no way to
        create a permission through the API, because minting a permission key
        would be minting authority.
        """
        context.require(ROLE_READ)
        return list(self._session.execute(select(Permission).order_by(Permission.key)).scalars())


class RoleService:
    """Organization role management."""

    def __init__(
        self,
        session: Session,
        audit: AuditRecorder,
        authentication: AuthenticationService,
    ) -> None:
        self._session = session
        self._audit = audit
        self._authentication = authentication

    # -- Reads ------------------------------------------------------------

    def list_roles(
        self, context: AuthorizationContext, *, include_templates: bool = True
    ) -> Sequence[Role]:
        """List the organization's roles and, optionally, the seeded templates.

        Templates are visible so an administrator can see which personas exist,
        but they carry no permissions and cannot be assigned.
        """
        context.require(ROLE_READ)
        condition = Role.organization_id == context.organization_id
        if include_templates:
            condition = condition | Role.organization_id.is_(None)
        return list(
            self._session.execute(
                select(Role).where(condition).order_by(Role.organization_id.nulls_last(), Role.key)
            ).scalars()
        )

    def get_role(self, context: AuthorizationContext, role_id: uuid.UUID) -> Role:
        context.require(ROLE_READ)
        role = self._session.execute(self._readable_query(context, role_id)).scalar_one_or_none()
        if role is None:
            raise ResourceNotFoundError("Role not found.")
        return role

    def list_role_permission_keys(
        self, context: AuthorizationContext, role_id: uuid.UUID
    ) -> Sequence[str]:
        role = self.get_role(context, role_id)
        return list(
            self._session.execute(
                select(Permission.key)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .where(RolePermission.role_id == role.id)
                .order_by(Permission.key)
            ).scalars()
        )

    def _readable_query(
        self, context: AuthorizationContext, role_id: uuid.UUID
    ) -> Select[tuple[Role]]:
        return select(Role).where(
            Role.id == role_id,
            (Role.organization_id == context.organization_id) | Role.organization_id.is_(None),
        )

    def _own_role(self, context: AuthorizationContext, role_id: uuid.UUID) -> Role:
        """Load a mutable organization role.

        System templates are excluded: they are seeded reference data, so allowing
        an organization to edit them would let one tenant change what every future
        tenant starts from.
        """
        role = self._session.execute(
            select(Role).where(
                Role.id == role_id,
                Role.organization_id == context.organization_id,
            )
        ).scalar_one_or_none()
        if role is None:
            raise ResourceNotFoundError("Role not found.")
        return role

    # -- Writes -----------------------------------------------------------

    def create_role(
        self,
        context: AuthorizationContext,
        *,
        key: str,
        name: str,
        description: str | None,
        template_key: str | None,
        actor: AuditActor,
        reason: str | None = None,
    ) -> Role:
        """Create an assignable organization role.

        A role is created with **no permissions**. Grants are a separate,
        separately authorized command (``role.permission.manage``), so creating a
        role can never itself confer authority.

        ``template_key`` records provenance from a seeded persona. It copies
        nothing but the name and description: no template has permissions to copy
        (see ``catalog.py``).
        """
        context.require_organization_scope(ROLE_CREATE)

        clean_key = key.strip().lower()
        if template_key is not None and template_key not in ROLE_TEMPLATE_KEYS:
            raise ValidationFailedError(
                "template_key does not name a seeded role template.",
                field_errors={"template_key": ["Unknown template."]},
            )
        if (
            self._session.execute(
                select(Role.id)
                .where(Role.organization_id == context.organization_id, Role.key == clean_key)
                .limit(1)
            ).first()
            is not None
        ):
            raise ConflictError("A role with this key already exists in this organization.")

        role = Role(
            organization_id=context.organization_id,
            key=clean_key,
            name=normalize_name(name),
            description=description,
            is_system_template=False,
            template_key=template_key,
        )
        self._session.add(role)
        self._session.flush()

        self._audit.record(
            action=ROLE_CREATED,
            entity_type="role",
            entity_id=role.id,
            actor=actor,
            organization_id=context.organization_id,
            after=_role_snapshot(role),
            reason=reason,
            diff_only=False,
        )
        return role

    def update_role(
        self,
        context: AuthorizationContext,
        role_id: uuid.UUID,
        *,
        expected_version: int,
        actor: AuditActor,
        name: Any = UNSET,
        description: Any = UNSET,
        is_active: Any = UNSET,
        reason: str | None = None,
    ) -> Role:
        """Rename, re-describe or deactivate an organization role.

        Deactivating a role immediately removes its grants from every holder,
        because :meth:`AuthorizationService.load_context` filters on
        ``Role.is_active``. Holders' sessions are therefore revoked here too.
        """
        context.require_organization_scope(ROLE_UPDATE)
        self._own_role(context, role_id)

        role = lock_for_update(self._session, Role, role_id)
        if role is None:  # pragma: no cover
            raise ResourceNotFoundError("Role not found.")
        assert_version(role.version, expected_version)

        before = _role_snapshot(role)
        was_active = role.is_active

        if name is not UNSET:
            role.name = normalize_name(str(name))
        if description is not UNSET:
            role.description = str(description) if description is not None else None
        if is_active is not UNSET:
            role.is_active = bool(is_active)

        role.version += 1
        self._session.flush()

        self._audit.record(
            action=ROLE_UPDATED,
            entity_type="role",
            entity_id=role.id,
            actor=actor,
            organization_id=context.organization_id,
            before=before,
            after=_role_snapshot(role),
            reason=reason,
        )

        if was_active and not role.is_active:
            self._revoke_sessions_of_role_holders(role, actor=actor)
        return role

    # -- Role permissions -------------------------------------------------

    def grant_permission(
        self,
        context: AuthorizationContext,
        role_id: uuid.UUID,
        *,
        permission_key: str,
        actor: AuditActor,
        reason: str | None = None,
    ) -> RolePermission:
        """Add a permission to an organization role.

        The grantor must hold ``permission_key`` at organization scope. Role
        permissions are organization-wide by nature — the *assignment* decides the
        scope at which they apply — so a department-scoped grantor cannot extend a
        role, which would leak authority beyond their department.
        """
        context.require_organization_scope(ROLE_PERMISSION_MANAGE)
        role = self._own_role(context, role_id)

        context.require_delegatable(
            [permission_key], scope_type=ScopeType.ORGANIZATION, department_id=None
        )

        permission = self._session.execute(
            select(Permission).where(Permission.key == permission_key)
        ).scalar_one_or_none()
        if permission is None:
            raise ValidationFailedError(
                "permission_key is not in the permission catalog.",
                field_errors={"permission_key": ["Unknown permission."]},
            )

        if (
            self._session.execute(
                select(RolePermission.id)
                .where(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == permission.id,
                )
                .limit(1)
            ).first()
            is not None
        ):
            raise ConflictError("The role already has this permission.")

        mapping = RolePermission(
            role_id=role.id,
            permission_id=permission.id,
            granted_by_user_id=context.user_id,
        )
        self._session.add(mapping)
        self._session.flush()

        self._audit.record(
            action=ROLE_PERMISSION_GRANTED,
            entity_type="role_permission",
            entity_id=mapping.id,
            actor=actor,
            organization_id=context.organization_id,
            after={"role_id": role.id, "permission_key": permission.key},
            reason=reason,
            diff_only=False,
        )
        self._revoke_sessions_of_role_holders(role, actor=actor)
        return mapping

    def revoke_permission(
        self,
        context: AuthorizationContext,
        role_id: uuid.UUID,
        *,
        permission_key: str,
        actor: AuditActor,
        reason: str | None = None,
    ) -> None:
        """Remove a permission from an organization role."""
        context.require_organization_scope(ROLE_PERMISSION_MANAGE)
        role = self._own_role(context, role_id)

        row = self._session.execute(
            select(RolePermission, Permission)
            .join(Permission, Permission.id == RolePermission.permission_id)
            .where(RolePermission.role_id == role.id, Permission.key == permission_key)
        ).one_or_none()
        if row is None:
            raise ResourceNotFoundError("The role does not have this permission.")

        mapping, permission = row
        self._session.delete(mapping)
        self._session.flush()

        self._audit.record(
            action=ROLE_PERMISSION_REVOKED,
            entity_type="role_permission",
            entity_id=mapping.id,
            actor=actor,
            organization_id=context.organization_id,
            before={"role_id": role.id, "permission_key": permission.key},
            reason=reason,
            diff_only=False,
        )
        self._revoke_sessions_of_role_holders(role, actor=actor)

    # -- Role assignments -------------------------------------------------

    def list_assignments(
        self,
        context: AuthorizationContext,
        *,
        user_id: uuid.UUID | None = None,
        include_revoked: bool = False,
    ) -> Sequence[RoleAssignment]:
        context.require(ROLE_READ)
        query = select(RoleAssignment).where(
            RoleAssignment.organization_id == context.organization_id
        )
        if user_id is not None:
            query = query.where(RoleAssignment.user_id == user_id)
        if not include_revoked:
            query = query.where(RoleAssignment.revoked_at.is_(None))
        if not context.has_organization_scope(ROLE_READ):
            # A department-scoped reader sees only assignments scoped to their
            # own departments. Organization-scoped assignments are invisible to
            # them, because seeing who holds organization-wide authority is
            # itself organization-level information.
            authorized = context.authorized_department_ids(ROLE_READ)
            if not authorized:
                return []
            query = query.where(RoleAssignment.department_id.in_(authorized))
        return list(
            self._session.execute(
                query.order_by(RoleAssignment.created_at.desc(), RoleAssignment.id)
            ).scalars()
        )

    def create_assignment(
        self,
        context: AuthorizationContext,
        *,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        scope_type: ScopeType,
        department_id: uuid.UUID | None,
        effective_from: date,
        effective_to: date | None,
        actor: AuditActor,
        reason: str | None = None,
    ) -> RoleAssignment:
        """Grant a scoped role to a user.

        Order of checks matters and is deliberate:

        1. the actor may assign roles at all;
        2. the target user and role belong to the actor's organization;
        3. the requested scope is coherent;
        4. the actor holds every permission the role carries, at the requested
           scope — the anti-escalation gate.
        """
        context.require(ROLE_ASSIGN)

        user = self._session.execute(
            select(User).where(User.id == user_id, User.organization_id == context.organization_id)
        ).scalar_one_or_none()
        if user is None:
            raise ValidationFailedError(
                "user_id does not reference a user in this organization.",
                field_errors={"user_id": ["Unknown user."]},
            )
        if not user.is_active:
            raise ValidationFailedError(
                "Cannot assign a role to a disabled user.",
                field_errors={"user_id": ["User is disabled."]},
            )

        role = self._session.execute(
            select(Role).where(
                Role.id == role_id,
                Role.organization_id == context.organization_id,
            )
        ).scalar_one_or_none()
        if role is None:
            # Includes the system-template case: templates have no organization,
            # so they are not assignable.
            raise ValidationFailedError(
                "role_id does not reference an assignable role in this organization.",
                field_errors={"role_id": ["Unknown or non-assignable role."]},
            )
        if not role.is_active:
            raise ValidationFailedError(
                "Cannot assign an inactive role.",
                field_errors={"role_id": ["Role is inactive."]},
            )

        department = self._resolve_scope(context, scope_type, department_id)

        if effective_to is not None and effective_to < effective_from:
            raise ValidationFailedError(
                "effective_to cannot precede effective_from.",
                field_errors={"effective_to": ["Must not precede effective_from."]},
            )

        # Anti-escalation: the actor must be able to delegate every permission
        # the role carries, at the requested scope.
        role_permission_keys = list(
            self._session.execute(
                select(Permission.key)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .where(RolePermission.role_id == role.id)
            ).scalars()
        )
        context.require_delegatable(
            role_permission_keys,
            scope_type=scope_type,
            department_id=department.id if department is not None else None,
        )
        if scope_type is ScopeType.DEPARTMENT:
            self._warn_scope_only_permissions(role_permission_keys)

        if (
            self._session.execute(
                self._duplicate_assignment_query(
                    user_id=user.id,
                    role_id=role.id,
                    scope_type=scope_type,
                    department_id=department.id if department is not None else None,
                ).limit(1)
            ).first()
            is not None
        ):
            raise ConflictError("The user already holds this role at this scope.")

        assignment = RoleAssignment(
            organization_id=context.organization_id,
            user_id=user.id,
            role_id=role.id,
            scope_type=scope_type.value,
            department_id=department.id if department is not None else None,
            effective_from=effective_from,
            effective_to=effective_to,
            granted_by_user_id=context.user_id,
        )
        self._session.add(assignment)
        self._session.flush()

        self._audit.record(
            action=ROLE_ASSIGNMENT_CREATED,
            entity_type="role_assignment",
            entity_id=assignment.id,
            actor=actor,
            organization_id=context.organization_id,
            after=_assignment_snapshot(assignment, role_key=role.key),
            reason=reason,
            diff_only=False,
        )
        # The grantee's authority just changed; drop their live sessions so the
        # next request resolves fresh grants.
        self._authentication.revoke_all_user_sessions(
            user, reason="role_assignment_changed", actor=actor
        )
        return assignment

    def end_assignment(
        self,
        context: AuthorizationContext,
        assignment_id: uuid.UUID,
        *,
        actor: AuditActor,
        reason: str | None = None,
    ) -> RoleAssignment:
        """End a role assignment, preserving the row for history."""
        context.require(ROLE_ASSIGN)

        assignment = self._session.execute(
            select(RoleAssignment).where(
                RoleAssignment.id == assignment_id,
                RoleAssignment.organization_id == context.organization_id,
            )
        ).scalar_one_or_none()
        if assignment is None:
            raise ResourceNotFoundError("Role assignment not found.")
        if assignment.revoked_at is not None:
            raise ConflictError("The role assignment has already ended.")

        scope_type = ScopeType(assignment.scope_type)
        if scope_type is ScopeType.DEPARTMENT:
            context.require_department(ROLE_ASSIGN, assignment.department_id)
        else:
            context.require_organization_scope(ROLE_ASSIGN)

        role = self._session.get(Role, assignment.role_id)
        before = _assignment_snapshot(assignment, role_key=role.key if role else None)

        assignment.revoked_at = utcnow()
        assignment.revoked_by_user_id = context.user_id
        assignment.revoked_reason = reason
        self._session.flush()

        self._audit.record(
            action=ROLE_ASSIGNMENT_ENDED,
            entity_type="role_assignment",
            entity_id=assignment.id,
            actor=actor,
            organization_id=context.organization_id,
            before=before,
            after=_assignment_snapshot(assignment, role_key=role.key if role else None),
            reason=reason,
        )

        user = self._session.get(User, assignment.user_id)
        if user is not None:
            self._authentication.revoke_all_user_sessions(
                user, reason="role_assignment_changed", actor=actor
            )
        return assignment

    # -- Helpers ----------------------------------------------------------

    def _resolve_scope(
        self,
        context: AuthorizationContext,
        scope_type: ScopeType,
        department_id: uuid.UUID | None,
    ) -> Department | None:
        if scope_type is ScopeType.ORGANIZATION:
            if department_id is not None:
                raise ValidationFailedError(
                    "department_id must be omitted for an organization-scoped assignment.",
                    field_errors={"department_id": ["Not allowed at organization scope."]},
                )
            context.require_organization_scope(ROLE_ASSIGN)
            return None

        if department_id is None:
            raise ValidationFailedError(
                "department_id is required for a department-scoped assignment.",
                field_errors={"department_id": ["Required at department scope."]},
            )
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
                "Cannot scope an assignment to an archived department.",
                field_errors={"department_id": ["Department is archived."]},
            )
        context.require_department(ROLE_ASSIGN, department.id)
        return department

    @staticmethod
    def _warn_scope_only_permissions(permission_keys: Sequence[str]) -> None:
        """Reject a department-scoped assignment of an organization-only role.

        Silently dropping those permissions at evaluation time (which
        ``load_context`` also does, as defence in depth) would leave the grantor
        believing the assignment took effect. Failing here makes the mismatch
        visible at the moment of the grant.
        """
        offending = sorted(set(permission_keys) & ORGANIZATION_SCOPE_ONLY_PERMISSIONS)
        if offending:
            raise ValidationFailedError(
                "This role carries organization-level permissions and cannot be "
                f"assigned at department scope: {', '.join(offending)}.",
                field_errors={"scope_type": ["Role requires organization scope."]},
            )

    @staticmethod
    def _duplicate_assignment_query(
        *,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        scope_type: ScopeType,
        department_id: uuid.UUID | None,
    ) -> Select[tuple[uuid.UUID]]:
        query = select(RoleAssignment.id).where(
            RoleAssignment.user_id == user_id,
            RoleAssignment.role_id == role_id,
            RoleAssignment.scope_type == scope_type.value,
            RoleAssignment.revoked_at.is_(None),
        )
        if department_id is None:
            return query.where(RoleAssignment.department_id.is_(None))
        return query.where(RoleAssignment.department_id == department_id)

    def _revoke_sessions_of_role_holders(self, role: Role, *, actor: AuditActor) -> None:
        """Revoke sessions for everyone currently holding ``role``.

        A permission change on a role alters the authority of every holder, so
        their session context must not survive it. The reason recorded on the
        session is ``role_assignment_changed``; the specific cause (grant, revoke
        or deactivation) is already in the caller's audit event.
        """
        holders = list(
            self._session.execute(
                select(User)
                .join(RoleAssignment, RoleAssignment.user_id == User.id)
                .where(
                    RoleAssignment.role_id == role.id,
                    RoleAssignment.revoked_at.is_(None),
                )
                .distinct()
            ).scalars()
        )
        for holder in holders:
            self._authentication.revoke_all_user_sessions(
                holder, reason="role_assignment_changed", actor=actor
            )


def _role_snapshot(role: Role) -> dict[str, Any]:
    return {
        "key": role.key,
        "name": role.name,
        "description": role.description,
        "is_active": role.is_active,
        "template_key": role.template_key,
        "version": role.version,
    }


def _assignment_snapshot(assignment: RoleAssignment, *, role_key: str | None) -> dict[str, Any]:
    return {
        "user_id": assignment.user_id,
        "role_id": assignment.role_id,
        "role_key": role_key,
        "scope_type": assignment.scope_type,
        "department_id": assignment.department_id,
        "effective_from": assignment.effective_from,
        "effective_to": assignment.effective_to,
        "revoked_at": assignment.revoked_at,
        "revoked_reason": assignment.revoked_reason,
    }
