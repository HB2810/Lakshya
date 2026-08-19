"""Local development bootstrap.

============================================================================
THIS IS NOT THE PRODUCTION AUTHORIZATION MODEL
============================================================================

A freshly migrated LAKSHYA database intentionally grants nothing to anybody: the
Stavya permission matrix is still ``REQUIRES BUSINESS DECISION`` (RBAC.md §3, §6)
and ADR-006 forbids inventing or broadly seeding role grants. Correct — and
completely unusable for local development, because no one can call any endpoint.

This script creates the minimum needed to exercise the API locally:

* one organization,
* one department,
* one role named ``local_bootstrap_admin`` holding **every** Phase 2 permission
  at organization scope,
* one user with a password credential and that role assigned.

The role it creates is deliberately named so it cannot be mistaken for a Stavya
persona, and it is created as ordinary data through the normal tables — there is
no hidden "superuser" flag, no bypass in the authorization service, and no code
path anywhere that treats this role specially. Delete the role and its grants
disappear; that is the whole mechanism.

**Guards.** The script refuses to run unless BOTH:

* ``LAKSHYA_ENVIRONMENT=local``, and
* ``LAKSHYA_ALLOW_LOCAL_BOOTSTRAP=true``.

**Before production.** Replace this with the approved access-administration
process. Grep for ``local_bootstrap_admin``: if a non-local database contains
that role, it is a finding, not a feature.

Usage::

    cd apps/api
    LAKSHYA_ALLOW_LOCAL_BOOTSTRAP=true python -m app.scripts.bootstrap_local \\
        --organization-name "Stavya Spine (local)" \\
        --organization-slug stavya-local \\
        --timezone Asia/Kolkata \\
        --email md.office@example.invalid \\
        --full-name "Local Bootstrap User" \\
        --password "change-this-locally-please"
"""

from __future__ import annotations

import argparse
import sys
import uuid
import zoneinfo
from datetime import date

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.config import Settings, get_settings
from app.core.correlation import set_correlation_id
from app.core.security import PASSWORD_ALGORITHM, PasswordHasherService
from app.core.text import normalize_email, normalize_name
from app.db.session import build_engine, build_session_factory, session_scope
from app.modules.access.catalog import PERMISSION_CATALOG, ScopeType
from app.modules.access.models import Permission, Role, RoleAssignment, RolePermission
from app.modules.audit.models import AuditSource
from app.modules.audit.service import (
    CREDENTIAL_CREATED,
    ROLE_ASSIGNMENT_CREATED,
    ROLE_CREATED,
    ROLE_PERMISSION_GRANTED,
    USER_CREATED,
    AuditActor,
    AuditRecorder,
)
from app.modules.identity.models import CREDENTIAL_KIND_PASSWORD, Credential, User
from app.modules.organization.models import Department, DepartmentMembership, Organization

#: Named so it is obvious in any audit, role list or database dump that this is a
#: development artefact and not a Stavya persona.
BOOTSTRAP_ROLE_KEY = "local_bootstrap_admin"
BOOTSTRAP_ROLE_NAME = "Local Bootstrap Admin (development only)"
BOOTSTRAP_ROLE_DESCRIPTION = (
    "Development-only role created by app/scripts/bootstrap_local.py. Holds every "
    "Phase 2 permission at organization scope so the API can be exercised locally. "
    "NOT an approved Stavya role: the real permission matrix is REQUIRES BUSINESS "
    "DECISION (RBAC.md §6). Must not exist in staging or production."
)

#: The audit actor for rows this script creates. Recorded as a system actor with
#: an unmistakable label, so bootstrap-created data is distinguishable from
#: anything a real user did.
BOOTSTRAP_ACTOR_LABEL = "system:bootstrap_local"


class BootstrapRefused(RuntimeError):
    """The environment does not permit bootstrapping."""


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv or sys.argv[1:])

    try:
        # The settings layer is the outer guard: it rejects
        # ``allow_local_bootstrap`` outright outside local, so a non-local
        # environment fails here before this script runs at all.
        settings = get_settings()
        _assert_allowed(settings)
    except ValidationError as exc:
        print(
            "refused: the configuration is not valid for a local bootstrap.\n"
            f"{exc.error_count()} setting(s) rejected:\n"
            + "\n".join(f"  - {error['msg']}" for error in exc.errors()),
            file=sys.stderr,
        )
        return 2
    except BootstrapRefused as exc:
        print(f"refused: {exc}", file=sys.stderr)
        return 2

    if len(args.password) < settings.password_min_length:
        print(
            f"refused: --password must be at least {settings.password_min_length} characters.",
            file=sys.stderr,
        )
        return 2
    try:
        zoneinfo.ZoneInfo(args.timezone)
    except (zoneinfo.ZoneInfoNotFoundError, ValueError):
        print(
            f"refused: --timezone {args.timezone!r} is not a known IANA timezone.", file=sys.stderr
        )
        return 2

    set_correlation_id(f"bootstrap-local-{uuid.uuid4()}")
    engine = build_engine(settings)
    try:
        with session_scope(build_session_factory(engine)) as session:
            summary = _bootstrap(session, settings, args)
    finally:
        engine.dispose()

    _print_summary(summary, args)
    return 0


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m app.scripts.bootstrap_local",
        description="Create a local development organization, admin role and user.",
    )
    parser.add_argument("--organization-name", default="Stavya Spine (local)")
    parser.add_argument("--organization-slug", default="stavya-local")
    parser.add_argument(
        "--timezone",
        default="Asia/Kolkata",
        help=(
            "IANA timezone for the organization. The real Stavya value is "
            "REQUIRES BUSINESS DECISION (DOMAIN_MODEL.md §10); this is a local default."
        ),
    )
    parser.add_argument("--department-name", default="MD Office")
    parser.add_argument("--department-code", default="MDO")
    parser.add_argument("--email", required=True)
    parser.add_argument("--full-name", required=True)
    parser.add_argument(
        "--password",
        required=True,
        help="Local development password. Never pass a real credential here.",
    )
    return parser.parse_args(argv)


def _assert_allowed(settings: Settings) -> None:
    if not settings.environment.is_local:
        raise BootstrapRefused(
            f"LAKSHYA_ENVIRONMENT is {settings.environment.value!r}. The local bootstrap "
            "only runs with LAKSHYA_ENVIRONMENT=local."
        )
    if not settings.allow_local_bootstrap:
        raise BootstrapRefused(
            "LAKSHYA_ALLOW_LOCAL_BOOTSTRAP is not true. Set it explicitly to confirm you "
            "intend to create a development-only administrative role."
        )


def _bootstrap(session: Session, settings: Settings, args: argparse.Namespace) -> dict[str, object]:
    audit = AuditRecorder(session, source=AuditSource.CLI)
    actor = AuditActor.system(BOOTSTRAP_ACTOR_LABEL)
    hasher = PasswordHasherService(settings)
    today = utcnow().date()

    organization = _ensure_organization(session, args)
    department = _ensure_department(session, organization, args, audit, actor)
    role = _ensure_role(session, organization, audit, actor)
    _ensure_role_permissions(session, role, organization, audit, actor)
    user, created_user = _ensure_user(session, organization, args, audit, actor)
    if created_user:
        _create_credential(session, user, args.password, hasher, audit, actor)
        _ensure_membership(session, user, department, today)
    _ensure_assignment(session, user, role, organization, today, audit, actor)

    return {
        "organization_id": organization.id,
        "organization_slug": organization.slug,
        "department_id": department.id,
        "role_id": role.id,
        "user_id": user.id,
        "credential_created": created_user,
    }


def _ensure_organization(session: Session, args: argparse.Namespace) -> Organization:
    existing = session.execute(
        select(Organization).where(Organization.slug == args.organization_slug)
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    organization = Organization(
        name=normalize_name(args.organization_name),
        slug=args.organization_slug,
        timezone=args.timezone,
    )
    session.add(organization)
    session.flush()
    # No audit event: creating the tenant itself has no organization to attribute
    # it to, and audit_events.organization_id would have to be NULL for a
    # non-security event. Organization provisioning belongs to the approved
    # deployment process, not to this script.
    return organization


def _ensure_department(
    session: Session,
    organization: Organization,
    args: argparse.Namespace,
    audit: AuditRecorder,
    actor: AuditActor,
) -> Department:
    existing = session.execute(
        select(Department).where(
            Department.organization_id == organization.id,
            Department.code == args.department_code,
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    department = Department(
        organization_id=organization.id,
        name=normalize_name(args.department_name),
        code=args.department_code,
    )
    session.add(department)
    session.flush()
    audit.record(
        action="department.created",
        entity_type="department",
        entity_id=department.id,
        actor=actor,
        organization_id=organization.id,
        after={"name": department.name, "code": department.code, "is_active": True},
        reason="local_bootstrap",
        diff_only=False,
    )
    return department


def _ensure_role(
    session: Session, organization: Organization, audit: AuditRecorder, actor: AuditActor
) -> Role:
    existing = session.execute(
        select(Role).where(Role.organization_id == organization.id, Role.key == BOOTSTRAP_ROLE_KEY)
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    role = Role(
        organization_id=organization.id,
        key=BOOTSTRAP_ROLE_KEY,
        name=BOOTSTRAP_ROLE_NAME,
        description=BOOTSTRAP_ROLE_DESCRIPTION,
        is_system_template=False,
    )
    session.add(role)
    session.flush()
    audit.record(
        action=ROLE_CREATED,
        entity_type="role",
        entity_id=role.id,
        actor=actor,
        organization_id=organization.id,
        after={"key": role.key, "name": role.name, "is_active": role.is_active},
        reason="local_bootstrap",
        diff_only=False,
    )
    return role


def _ensure_role_permissions(
    session: Session,
    role: Role,
    organization: Organization,
    audit: AuditRecorder,
    actor: AuditActor,
) -> None:
    """Attach every Phase 2 permission to the bootstrap role.

    Only keys already present in the catalog are attached, so this cannot invent a
    permission the application does not enforce.
    """
    held = set(
        session.execute(
            select(Permission.key)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role.id)
        ).scalars()
    )

    for definition in PERMISSION_CATALOG:
        if definition.key in held:
            continue
        permission = session.execute(
            select(Permission).where(Permission.key == definition.key)
        ).scalar_one_or_none()
        if permission is None:
            raise RuntimeError(
                f"permission {definition.key!r} is missing from the database. "
                "Run 'alembic upgrade head' first."
            )
        mapping = RolePermission(role_id=role.id, permission_id=permission.id)
        session.add(mapping)
        session.flush()
        audit.record(
            action=ROLE_PERMISSION_GRANTED,
            entity_type="role_permission",
            entity_id=mapping.id,
            actor=actor,
            organization_id=organization.id,
            after={"role_id": role.id, "permission_key": permission.key},
            reason="local_bootstrap",
            diff_only=False,
        )


def _ensure_user(
    session: Session,
    organization: Organization,
    args: argparse.Namespace,
    audit: AuditRecorder,
    actor: AuditActor,
) -> tuple[User, bool]:
    normalized = normalize_email(args.email)
    existing = session.execute(
        select(User).where(
            User.organization_id == organization.id, User.normalized_email == normalized
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing, False

    user = User(
        organization_id=organization.id,
        full_name=normalize_name(args.full_name),
        email=args.email.strip(),
        normalized_email=normalized,
    )
    session.add(user)
    session.flush()
    audit.record(
        action=USER_CREATED,
        entity_type="user",
        entity_id=user.id,
        actor=actor,
        organization_id=organization.id,
        after={
            "full_name": user.full_name,
            "email": user.email,
            "normalized_email": user.normalized_email,
            "is_active": user.is_active,
        },
        reason="local_bootstrap",
        diff_only=False,
    )
    return user, True


def _create_credential(
    session: Session,
    user: User,
    password: str,
    hasher: PasswordHasherService,
    audit: AuditRecorder,
    actor: AuditActor,
) -> None:
    """Store the Argon2id hash of the supplied local password.

    ``must_change_password`` is left ``False`` here — unlike API-provisioned
    accounts — because the developer running the script chose the value
    themselves, and forcing an immediate change would just add a step to every
    local setup. It is one more reason this path must never be used outside local
    development.
    """
    credential = Credential(
        organization_id=user.organization_id,
        user_id=user.id,
        kind=CREDENTIAL_KIND_PASSWORD,
        password_hash=hasher.hash(password),
        algorithm=PASSWORD_ALGORITHM,
        password_updated_at=utcnow(),
        must_change_password=False,
    )
    session.add(credential)
    session.flush()
    audit.record(
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
        reason="local_bootstrap",
        diff_only=False,
    )


def _ensure_membership(session: Session, user: User, department: Department, today: date) -> None:
    existing = session.execute(
        select(DepartmentMembership).where(
            DepartmentMembership.user_id == user.id,
            DepartmentMembership.department_id == department.id,
            DepartmentMembership.ended_on.is_(None),
        )
    ).scalar_one_or_none()
    if existing is not None:
        return
    session.add(
        DepartmentMembership(
            organization_id=user.organization_id,
            user_id=user.id,
            department_id=department.id,
            is_primary=True,
            started_on=today,
            note="Created by the local development bootstrap.",
        )
    )
    session.flush()


def _ensure_assignment(
    session: Session,
    user: User,
    role: Role,
    organization: Organization,
    today: date,
    audit: AuditRecorder,
    actor: AuditActor,
) -> None:
    existing = session.execute(
        select(RoleAssignment).where(
            RoleAssignment.user_id == user.id,
            RoleAssignment.role_id == role.id,
            RoleAssignment.scope_type == ScopeType.ORGANIZATION.value,
            RoleAssignment.revoked_at.is_(None),
        )
    ).scalar_one_or_none()
    if existing is not None:
        return

    assignment = RoleAssignment(
        organization_id=organization.id,
        user_id=user.id,
        role_id=role.id,
        scope_type=ScopeType.ORGANIZATION.value,
        department_id=None,
        effective_from=today,
    )
    session.add(assignment)
    session.flush()
    audit.record(
        action=ROLE_ASSIGNMENT_CREATED,
        entity_type="role_assignment",
        entity_id=assignment.id,
        actor=actor,
        organization_id=organization.id,
        after={
            "user_id": user.id,
            "role_id": role.id,
            "role_key": role.key,
            "scope_type": assignment.scope_type,
            "department_id": None,
            "effective_from": assignment.effective_from,
        },
        reason="local_bootstrap",
        diff_only=False,
    )


def _print_summary(summary: dict[str, object], args: argparse.Namespace) -> None:
    print("LAKSHYA local bootstrap complete.")
    print("")
    print(f"  organization : {args.organization_name}  (slug: {summary['organization_slug']})")
    print(f"  department   : {args.department_name}")
    print(f"  user         : {args.email}")
    print(f"  role         : {BOOTSTRAP_ROLE_KEY}  (organization scope, all Phase 2 permissions)")
    print("")
    if not summary["credential_created"]:
        print("  NOTE: the user already existed; its password was NOT changed.")
        print("")
    print("  This role is a DEVELOPMENT-ONLY artefact. It is not an approved Stavya")
    print("  role and must never exist in staging or production. See")
    print("  docs/implementation/PHASE2_FOUNDATION.md.")


if __name__ == "__main__":
    raise SystemExit(main())
