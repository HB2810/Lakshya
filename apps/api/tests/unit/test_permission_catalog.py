"""The permission catalog must stay honest.

ADR-006: "Phase 2 may implement identity/organization/RBAC foundations, but
unresolved role grants must not be invented or broadly seeded."

RBAC.md §3 still marks every identity/access capability for MD, MD Office,
Department Head, Manager and Stavyan as ``TBD``/``REQUIRES BUSINESS DECISION``.
These tests are the mechanical guard: they fail if a future change attaches a
permission to a persona template, or advertises a permission key that nothing in
the codebase enforces.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from app.modules.access.catalog import (
    ORGANIZATION_SCOPE_ONLY_PERMISSIONS,
    PERMISSION_CATALOG,
    PERMISSION_KEY_PATTERN,
    PERMISSION_KEYS,
    ROLE_TEMPLATE_KEYS,
    ROLE_TEMPLATES,
    PermissionDefinition,
    assert_catalog_grants_nothing,
)

APP_DIR = Path(__file__).resolve().parents[2] / "app"


class TestRoleTemplates:
    def test_no_template_seeds_any_permission(self) -> None:
        """The core Phase 2 constraint: a fresh database grants nothing."""
        for template in ROLE_TEMPLATES:
            assert template.permissions == (), (
                f"role template {template.key!r} seeds permissions, but the Stavya "
                "permission matrix is REQUIRES BUSINESS DECISION (RBAC.md §6)"
            )

    def test_guard_helper_passes(self) -> None:
        """Migration 0003 calls this; it must not raise for the current catalog."""
        assert_catalog_grants_nothing()

    def test_all_five_personas_exist(self) -> None:
        """AGENTS.md §3 / RBAC.md §2 personas are represented as templates."""
        assert ROLE_TEMPLATE_KEYS == {
            "md",
            "md_office",
            "department_head",
            "manager",
            "stavyan",
        }

    def test_no_unrestricted_administrator_template(self) -> None:
        """RBAC.md §2: the MD is "not automatically a system administrator"."""
        suspicious = {"admin", "administrator", "superuser", "root", "owner"}
        assert not (ROLE_TEMPLATE_KEYS & suspicious)


class TestPermissionKeys:
    def test_keys_follow_the_naming_convention(self) -> None:
        for definition in PERMISSION_CATALOG:
            assert PERMISSION_KEY_PATTERN.match(definition.key), definition.key

    def test_keys_are_unique(self) -> None:
        keys = [definition.key for definition in PERMISSION_CATALOG]
        assert len(keys) == len(set(keys))

    def test_every_key_is_referenced_by_application_code(self) -> None:
        """A catalog entry with no enforcement point would advertise a lie.

        ``audit.read`` and ``audit.export`` are the documented exceptions: they are
        seeded so the keys are stable, but Phase 2 exposes no audit endpoint
        because audit visibility is REQUIRES BUSINESS DECISION.
        """
        documented_catalog_only = {
            "audit.read", "audit.export",
            "raci.read",
            "meetings.view", "meetings.create", "meetings.update", "meetings.start",
            "meetings.complete", "meetings.cancel", "meetings.manage_participants",
            "meetings.manage_agenda", "meetings.facilitate",
            "goals.view", "goals.propose", "goals.create", "goals.approve",
            "priorities.view", "priorities.propose", "priorities.approve",
            "milestones.view", "milestones.update_assigned",
            "kpis.view", "kpis.create", "kpis.record_assigned_value",
            "oo.view", "oo.create", "oo.update_assigned",
            "calendar.view", "calendar.manage_own_connections",
            "calendar.manage_organization_integrations",
        }
        sources = "\n".join(
            path.read_text(encoding="utf-8")
            for path in APP_DIR.rglob("*.py")
            if "catalog.py" not in path.name
        )
        unreferenced = [
            key for key in sorted(PERMISSION_KEYS - documented_catalog_only) if key not in sources
        ]
        assert unreferenced == [], f"permission keys nothing enforces: {unreferenced}"

    def test_no_future_module_keys_are_seeded(self) -> None:
        """Phase 2 must not advertise capabilities for unimplemented modules."""
        future_resources = (
            "task.",
            "commitment.",
            "decision.",
            "objective.",
            "dependency.",
            "stuck.",
            "escalation.",
            "notification.",
            "automation.",
            "dashboard.",
        )
        premature = [key for key in sorted(PERMISSION_KEYS) if key.startswith(future_resources)]
        assert premature == [], f"keys for later phases are already seeded: {premature}"

    def test_organization_only_permissions_are_in_the_catalog(self) -> None:
        assert ORGANIZATION_SCOPE_ONLY_PERMISSIONS <= PERMISSION_KEYS

    def test_creation_and_administration_require_organization_scope(self) -> None:
        """A department-scoped grant must not confer organization-level acts."""
        for key in ("department.create", "user.create", "role.create", "role.permission.manage"):
            assert key in ORGANIZATION_SCOPE_ONLY_PERMISSIONS


class TestPermissionDefinitionValidation:
    def test_malformed_key_is_rejected(self) -> None:
        with pytest.raises(ValueError, match="invalid permission key"):
            PermissionDefinition(
                key="Department.Read", resource="department", action="read", description="x"
            )

    def test_key_must_match_resource_and_action(self) -> None:
        with pytest.raises(ValueError, match="does not match resource/action"):
            PermissionDefinition(
                key="department.read", resource="user", action="read", description="x"
            )
