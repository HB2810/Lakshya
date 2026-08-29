"""Stable permission-key catalog and role templates for Phase 2.

ADR-003: "Stable permission keys map to application commands." RBAC.md §1:
"Named roles are configurable templates, not code branches."

============================================================================
WHY NO ROLE HAS ANY PERMISSION IN THIS FILE
============================================================================

RBAC.md §3 marks essentially every identity/access capability as
``REQUIRES BUSINESS DECISION``:

* "Manage users and role grants" — TBD for MD and MD Office, denied for
  Department Head, Manager and Stavyan.
* "View/export audit" — TBD for MD, MD Office and Department Head.
* "View other departments" — TBD.

ADR-006 is explicit about what Phase 2 may therefore do: "Phase 2 may implement
identity/organization/RBAC foundations, but unresolved role grants must not be
invented or broadly seeded."

So the catalog below seeds:

* the **permission keys** (stable action identifiers — safe, they grant nothing);
* the five persona **role templates** with **zero permissions attached**.

A freshly migrated LAKSHYA database consequently denies every protected
operation to everybody. That is the correct, deny-by-default outcome, not a bug.
Real grants are created once Stavya approves the permission matrix; until then
local development uses the clearly isolated bootstrap script
(``app/scripts/bootstrap_local.py``).

Templates are organization-less and therefore **cannot be assigned to a user**:
``role_assignments`` carries a composite foreign key to
``roles (organization_id, id)``, which no template row can satisfy. An
organization instantiates its own role from a template and then receives grants.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum

#: ``resource.action`` or the more specific ``resource.subresource.action``
#: (RBAC.md §1 permission families).
PERMISSION_KEY_PATTERN = re.compile(r"^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$")


class ScopeType(str, Enum):
    """Scope at which a role assignment grants its permissions.

    RBAC.md §1 defines four scopes: ``self``, ``related``, ``department`` and
    ``organization``. Only ``department`` and ``organization`` are *grantable*
    role-assignment scopes. ``self`` and ``related`` are relationship facts about
    a record (assignee, RACI member, meeting participant), evaluated per record
    by the modules that own those relationships — they are not something an
    administrator assigns, and none of those relationships exist yet in Phase 2.
    """

    ORGANIZATION = "organization"
    DEPARTMENT = "department"


@dataclass(frozen=True)
class PermissionDefinition:
    """One stable permission key."""

    key: str
    resource: str
    action: str
    description: str

    def __post_init__(self) -> None:
        if not PERMISSION_KEY_PATTERN.match(self.key):
            raise ValueError(f"invalid permission key: {self.key!r}")
        expected_prefix = f"{self.resource}."
        if not self.key.startswith(expected_prefix) or not self.key.endswith(f".{self.action}"):
            raise ValueError(f"permission key {self.key!r} does not match resource/action")


# ---------------------------------------------------------------------------
# Permission keys implemented by Phase 2
# ---------------------------------------------------------------------------
# Only keys with a real enforcement point in this phase are listed. Keys for
# later modules (task.*, commitment.*, meeting.*, decision.*, priority.*,
# milestone.*, raci.*, escalation.*, automation.*, dashboard.*) are added by the
# phase that implements and enforces them, so the catalog never advertises a
# capability that nothing checks.

ORGANIZATION_READ = "organization.read"
ORGANIZATION_UPDATE = "organization.update"

DEPARTMENT_READ = "department.read"
DEPARTMENT_CREATE = "department.create"
DEPARTMENT_UPDATE = "department.update"

USER_READ = "user.read"
USER_CREATE = "user.create"
USER_UPDATE = "user.update"

ROLE_READ = "role.read"
ROLE_CREATE = "role.create"
ROLE_UPDATE = "role.update"
ROLE_PERMISSION_MANAGE = "role.permission.manage"
ROLE_ASSIGN = "role.assign"

AUDIT_READ = "audit.read"
AUDIT_EXPORT = "audit.export"

RACI_READ = "raci.read"
RACI_MANAGE = "raci.manage"


PERMISSION_CATALOG: tuple[PermissionDefinition, ...] = (
    PermissionDefinition(
        key=ORGANIZATION_READ,
        resource="organization",
        action="read",
        description="Read the authenticated user's organization profile and settings.",
    ),
    PermissionDefinition(
        key=ORGANIZATION_UPDATE,
        resource="organization",
        action="update",
        description="Update organization name, timezone and active state.",
    ),
    PermissionDefinition(
        key=DEPARTMENT_READ,
        resource="department",
        action="read",
        description="Read departments within the granted scope.",
    ),
    PermissionDefinition(
        key=DEPARTMENT_CREATE,
        resource="department",
        action="create",
        description="Create a department. Requires organization scope.",
    ),
    PermissionDefinition(
        key=DEPARTMENT_UPDATE,
        resource="department",
        action="update",
        description="Update or archive a department within the granted scope.",
    ),
    PermissionDefinition(
        key=USER_READ,
        resource="user",
        action="read",
        description="Read user directory entries within the granted scope.",
    ),
    PermissionDefinition(
        key=USER_CREATE,
        resource="user",
        action="create",
        description="Provision a user account. Requires organization scope.",
    ),
    PermissionDefinition(
        key=USER_UPDATE,
        resource="user",
        action="update",
        description=(
            "Update a user profile, account state and department memberships "
            "within the granted scope."
        ),
    ),
    PermissionDefinition(
        key=ROLE_READ,
        resource="role",
        action="read",
        description="Read the role and permission catalog, and existing role assignments.",
    ),
    PermissionDefinition(
        key=ROLE_CREATE,
        resource="role",
        action="create",
        description="Create an organization role. Requires organization scope.",
    ),
    PermissionDefinition(
        key=ROLE_UPDATE,
        resource="role",
        action="update",
        description="Update an organization role's name, description or active state.",
    ),
    PermissionDefinition(
        key=ROLE_PERMISSION_MANAGE,
        resource="role",
        action="manage",
        description=(
            "Grant or revoke permissions on an organization role. A grantor can "
            "only grant permissions they themselves hold."
        ),
    ),
    PermissionDefinition(
        key=ROLE_ASSIGN,
        resource="role",
        action="assign",
        description=(
            "Grant or end a scoped role assignment. A grantor cannot delegate "
            "beyond their own permissions and scope."
        ),
    ),
    PermissionDefinition(
        key=AUDIT_READ,
        resource="audit",
        action="read",
        description=(
            "Read audit events. Catalog entry only in Phase 2: no audit read "
            "endpoint exists yet, and audit visibility is REQUIRES BUSINESS DECISION."
        ),
    ),
    PermissionDefinition(
        key=AUDIT_EXPORT,
        resource="audit",
        action="export",
        description=(
            "Export audit events. Catalog entry only in Phase 2: export approval, "
            "delivery and retention are REQUIRES BUSINESS DECISION."
        ),
    ),
    PermissionDefinition(
        key=RACI_READ,
        resource="raci",
        action="read",
        description="Read the RACI assignments on a work item already visible to the user.",
    ),
    PermissionDefinition(
        key=RACI_MANAGE,
        resource="raci",
        action="manage",
        description="Atomically replace RACI assignments within the granted organization or department scope.",
    ),
    PermissionDefinition(
        key="meetings.view",
        resource="meetings",
        action="view",
        description="View scheduled and active meetings.",
    ),
    PermissionDefinition(
        key="meetings.create",
        resource="meetings",
        action="create",
        description="Create and schedule meetings.",
    ),
    PermissionDefinition(
        key="meetings.update",
        resource="meetings",
        action="update",
        description="Update meeting details and structure.",
    ),
    PermissionDefinition(
        key="meetings.start",
        resource="meetings",
        action="start",
        description="Start a draft or scheduled meeting.",
    ),
    PermissionDefinition(
        key="meetings.complete",
        resource="meetings",
        action="complete",
        description="Finalize and complete a meeting.",
    ),
    PermissionDefinition(
        key="meetings.cancel",
        resource="meetings",
        action="cancel",
        description="Cancel a scheduled or draft meeting.",
    ),
    PermissionDefinition(
        key="meetings.manage_participants",
        resource="meetings",
        action="manage_participants",
        description="Manage participants and roles for a meeting.",
    ),
    PermissionDefinition(
        key="meetings.manage_agenda",
        resource="meetings",
        action="manage_agenda",
        description="Add, edit, or reorder agenda items.",
    ),
    PermissionDefinition(
        key="meetings.facilitate",
        resource="meetings",
        action="facilitate",
        description="Facilitate meeting execution and section flow.",
    ),
    PermissionDefinition(
        key="goals.view",
        resource="goals",
        action="view",
        description="View annual goals and progress.",
    ),
    PermissionDefinition(
        key="goals.propose",
        resource="goals",
        action="propose",
        description="Propose annual goal adjustments.",
    ),
    PermissionDefinition(
        key="goals.create",
        resource="goals",
        action="create",
        description="Create annual goals in annual planning context.",
    ),
    PermissionDefinition(
        key="goals.approve",
        resource="goals",
        action="approve",
        description="Approve annual goals (MD restricted).",
    ),
    PermissionDefinition(
        key="priorities.view",
        resource="priorities",
        action="view",
        description="View financial quarter priorities.",
    ),
    PermissionDefinition(
        key="priorities.propose",
        resource="priorities",
        action="propose",
        description="Propose financial quarter priorities.",
    ),
    PermissionDefinition(
        key="priorities.approve",
        resource="priorities",
        action="approve",
        description="Approve or reject quarterly priority proposals (MD restricted).",
    ),
    PermissionDefinition(
        key="milestones.view",
        resource="milestones",
        action="view",
        description="View weekly milestones.",
    ),
    PermissionDefinition(
        key="milestones.update_assigned",
        resource="milestones",
        action="update_assigned",
        description="Update assigned weekly milestone progress.",
    ),
    PermissionDefinition(
        key="kpis.view",
        resource="kpis",
        action="view",
        description="View KPI indicators and actual values.",
    ),
    PermissionDefinition(
        key="kpis.create",
        resource="kpis",
        action="create",
        description="Define and configure new KPIs.",
    ),
    PermissionDefinition(
        key="kpis.record_assigned_value",
        resource="kpis",
        action="record_assigned_value",
        description="Record actual values for assigned KPIs.",
    ),
    PermissionDefinition(
        key="oo.view",
        resource="oo",
        action="view",
        description="View Obstacles and Opportunities.",
    ),
    PermissionDefinition(
        key="oo.create",
        resource="oo",
        action="create",
        description="Create Obstacle or Opportunity items.",
    ),
    PermissionDefinition(
        key="oo.update_assigned",
        resource="oo",
        action="update_assigned",
        description="Update assigned Obstacle or Opportunity items.",
    ),
    PermissionDefinition(
        key="calendar.view",
        resource="calendar",
        action="view",
        description="View unified LAKSHYA calendar events.",
    ),
    PermissionDefinition(
        key="calendar.manage_own_connections",
        resource="calendar",
        action="manage_own_connections",
        description="Manage personal OAuth calendar provider connections.",
    ),
    PermissionDefinition(
        key="calendar.manage_organization_integrations",
        resource="calendar",
        action="manage_organization_integrations",
        description="Manage organization-wide calendar integration settings.",
    ),
)

PERMISSION_KEYS: frozenset[str] = frozenset(item.key for item in PERMISSION_CATALOG)

#: Permissions that only make sense at organization scope. Creating a
#: department, provisioning a user or creating a role are organization-level
#: acts: a department-scoped grant must not confer them.
ORGANIZATION_SCOPE_ONLY_PERMISSIONS: frozenset[str] = frozenset(
    {
        ORGANIZATION_READ,
        ORGANIZATION_UPDATE,
        DEPARTMENT_CREATE,
        USER_CREATE,
        ROLE_CREATE,
        ROLE_UPDATE,
        ROLE_PERMISSION_MANAGE,
        AUDIT_EXPORT,
    }
)


# ---------------------------------------------------------------------------
# Persona role templates — seeded with NO permissions
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class RoleTemplate:
    """A named persona from AGENTS.md §3 / RBAC.md §2.

    ``permissions`` is intentionally empty for every template. See the module
    docstring: no identity/access grant for these personas is approved yet.
    """

    key: str
    name: str
    description: str
    permissions: tuple[str, ...] = ()


ROLE_TEMPLATES: tuple[RoleTemplate, ...] = (
    RoleTemplate(
        key="md",
        name="MD",
        description=(
            "Organization-level management visibility, decisions and high-level "
            "escalation authority. Not automatically a system administrator "
            "(RBAC.md §2). No permissions are seeded: the MD permission set is "
            "REQUIRES BUSINESS DECISION."
        ),
    ),
    RoleTemplate(
        key="md_office",
        name="MD Office",
        description=(
            "Coordination, tracking and follow-up; may create and assign work "
            "organization-wide within authorized scope once execution modules "
            "exist. Access administration and audit export remain unresolved, so "
            "no permissions are seeded (RBAC.md §2)."
        ),
    ),
    RoleTemplate(
        key="department_head",
        name="Department Head",
        description=(
            "May assign work within authorized department scope. The authoritative "
            "department hierarchy is REQUIRES BUSINESS DECISION, so no permissions "
            "are seeded (RBAC.md §6.3)."
        ),
    ),
    RoleTemplate(
        key="manager",
        name="Manager",
        description=(
            "May assign work within authorized team scope. The authoritative team "
            "definition is REQUIRES BUSINESS DECISION, so no permissions are "
            "seeded (RBAC.md §6.3)."
        ),
    ),
    RoleTemplate(
        key="stavyan",
        name="Stavyan",
        description=(
            "May create/assign a Task only to themself and complete a normal "
            "assigned Task (ADR-006). Those capabilities belong to the execution "
            "module in a later phase; no Phase 2 identity/access permission is "
            "approved, so none is seeded."
        ),
    ),
)

ROLE_TEMPLATE_KEYS: frozenset[str] = frozenset(template.key for template in ROLE_TEMPLATES)


def assert_catalog_grants_nothing() -> None:
    """Guard invoked by tests and by the seed migration.

    Fails loudly if someone later attaches permissions to a persona template
    without an approved business decision, which is exactly the silent
    privilege creep ADR-006 warns against.
    """
    granting = [template.key for template in ROLE_TEMPLATES if template.permissions]
    if granting:
        raise AssertionError(
            "Persona role templates must not seed permissions until the Stavya "
            f"permission matrix is approved (RBAC.md §6). Offending templates: {granting}"
        )
