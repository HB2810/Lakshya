"""RBAC enforcement (ADR-003, RBAC.md).

RBAC.md §5: "Tests must cover positive and negative cases across role,
organization, department, relationship, lifecycle and field transition. Include
identifier-substitution tests to prevent insecure direct object reference."
"""

from __future__ import annotations

from datetime import date, timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.access.catalog import (
    DEPARTMENT_CREATE,
    DEPARTMENT_READ,
    DEPARTMENT_UPDATE,
    ORGANIZATION_READ,
    ORGANIZATION_UPDATE,
    ROLE_ASSIGN,
    ROLE_CREATE,
    ROLE_PERMISSION_MANAGE,
    ROLE_READ,
    USER_CREATE,
    USER_READ,
    ScopeType,
)
from app.modules.access.models import RoleAssignment
from app.modules.identity.models import UserSession
from tests.conftest import ApiClient, Factory

pytestmark = pytest.mark.db


class TestDenyByDefault:
    def test_authenticated_user_without_grants_is_denied_everywhere(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """The state of a freshly migrated database (ADR-006)."""
        organization = factory.organization()
        factory.user(organization, email="nogrants@example.com")
        factory.session.commit()
        client.login_or_fail("nogrants@example.com")

        for path in (
            "/api/v1/organizations/current",
            "/api/v1/departments",
            "/api/v1/users",
            "/api/v1/roles",
            "/api/v1/permissions",
            "/api/v1/role-assignments",
        ):
            response = client.get(path)
            assert response.status_code == 403, f"{path} returned {response.status_code}"
            assert response.json()["code"] == "permission_denied"

    def test_unauthenticated_access_is_401_not_403(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """API.md §2: 401 for no authentication, 403 for a disallowed action."""
        for path in ("/api/v1/organizations/current", "/api/v1/departments", "/api/v1/users"):
            assert client.get(path).status_code == 401


class TestGrantedPermissions:
    def test_granted_permission_allows_the_action(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (ORGANIZATION_READ,), email="orgreader@example.com"
        )
        client.login_or_fail("orgreader@example.com")

        response = client.get("/api/v1/organizations/current")
        assert response.status_code == 200
        assert response.json()["id"] == str(organization.id)

    def test_one_permission_does_not_imply_another(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Read does not imply update; ADR-003 keeps capabilities separate."""
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (ORGANIZATION_READ,), email="readonly@example.com"
        )
        client.login_or_fail("readonly@example.com")

        etag = client.get("/api/v1/organizations/current").headers["ETag"]
        response = client.patch(
            "/api/v1/organizations/current", json={"name": "Renamed"}, etag=etag
        )
        assert response.status_code == 403

    def test_department_read_does_not_grant_department_create(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ,), email="deptreader@example.com"
        )
        client.login_or_fail("deptreader@example.com")

        assert client.get("/api/v1/departments").status_code == 200
        assert client.post("/api/v1/departments", json={"name": "New"}).status_code == 403


class TestRoleAssignmentLifecycle:
    def test_revoked_assignment_removes_authority(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="revoke-me@example.com")
        role = factory.role(organization, permissions=(ORGANIZATION_READ,))
        assignment = factory.assign(user, role)
        factory.session.commit()

        client.login_or_fail("revoke-me@example.com")
        assert client.get("/api/v1/organizations/current").status_code == 200

        from app.core.clock import utcnow

        assignment.revoked_at = utcnow()
        db_session.commit()

        client.raw.cookies.clear()
        client.login_or_fail("revoke-me@example.com")
        assert client.get("/api/v1/organizations/current").status_code == 403

    def test_future_effective_date_does_not_grant_yet(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="future@example.com")
        role = factory.role(organization, permissions=(ORGANIZATION_READ,))
        factory.assign(user, role, effective_from=date.today() + timedelta(days=7))
        factory.session.commit()

        client.login_or_fail("future@example.com")
        assert client.get("/api/v1/organizations/current").status_code == 403

    def test_expired_effective_period_no_longer_grants(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="past@example.com")
        role = factory.role(organization, permissions=(ORGANIZATION_READ,))
        factory.assign(
            user,
            role,
            effective_from=date.today() - timedelta(days=30),
            effective_to=date.today() - timedelta(days=1),
        )
        factory.session.commit()

        client.login_or_fail("past@example.com")
        assert client.get("/api/v1/organizations/current").status_code == 403

    def test_current_effective_period_grants(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="current@example.com")
        role = factory.role(organization, permissions=(ORGANIZATION_READ,))
        factory.assign(
            user,
            role,
            effective_from=date.today() - timedelta(days=1),
            effective_to=date.today() + timedelta(days=1),
        )
        factory.session.commit()

        client.login_or_fail("current@example.com")
        assert client.get("/api/v1/organizations/current").status_code == 200

    def test_inactive_role_grants_nothing(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="inactive-role@example.com")
        role = factory.role(organization, permissions=(ORGANIZATION_READ,), is_active=False)
        factory.assign(user, role)
        factory.session.commit()

        client.login_or_fail("inactive-role@example.com")
        assert client.get("/api/v1/organizations/current").status_code == 403


class TestDepartmentScope:
    def test_department_scoped_reader_sees_only_that_department(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        visible = factory.department(organization, name="Radiology")
        hidden = factory.department(organization, name="Pharmacy")
        factory.user_with_permissions(
            organization,
            (DEPARTMENT_READ,),
            scope=ScopeType.DEPARTMENT,
            department=visible,
            email="scoped@example.com",
        )
        client.login_or_fail("scoped@example.com")

        listed = client.get("/api/v1/departments").json()
        assert [item["id"] for item in listed["items"]] == [str(visible.id)]

        assert client.get(f"/api/v1/departments/{visible.id}").status_code == 200
        # 404, not 403: confirming existence would leak the department structure.
        assert client.get(f"/api/v1/departments/{hidden.id}").status_code == 404

    def test_child_department_is_not_inherited(self, client: ApiClient, factory: Factory) -> None:
        """TODO REQUIRES BUSINESS DECISION (RBAC.md §4): hierarchy inheritance
        needs Stavya's authoritative reporting structure, so a department grant
        covers exactly that department and no descendant."""
        organization = factory.organization()
        parent = factory.department(organization, name="Clinical Services")
        child = factory.department(organization, name="Physiotherapy", parent=parent)
        factory.user_with_permissions(
            organization,
            (DEPARTMENT_READ,),
            scope=ScopeType.DEPARTMENT,
            department=parent,
            email="parentscope@example.com",
        )
        client.login_or_fail("parentscope@example.com")

        listed = client.get("/api/v1/departments").json()
        assert [item["id"] for item in listed["items"]] == [str(parent.id)]
        assert client.get(f"/api/v1/departments/{child.id}").status_code == 404

    def test_department_scope_cannot_create_a_department(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Creating a department is an organization-level act."""
        organization = factory.organization()
        department = factory.department(organization)
        factory.user_with_permissions(
            organization,
            (DEPARTMENT_READ, DEPARTMENT_CREATE),
            scope=ScopeType.DEPARTMENT,
            department=department,
            email="deptcreate@example.com",
        )
        client.login_or_fail("deptcreate@example.com")

        response = client.post("/api/v1/departments", json={"name": "Attempted"})
        assert response.status_code == 403

    def test_department_scoped_updater_cannot_touch_another_department(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        mine = factory.department(organization, name="Mine")
        theirs = factory.department(organization, name="Theirs")
        factory.user_with_permissions(
            organization,
            (DEPARTMENT_READ, DEPARTMENT_UPDATE),
            scope=ScopeType.DEPARTMENT,
            department=mine,
            email="deptupdate@example.com",
        )
        client.login_or_fail("deptupdate@example.com")

        etag = client.get(f"/api/v1/departments/{mine.id}").headers["ETag"]
        assert (
            client.patch(
                f"/api/v1/departments/{mine.id}", json={"name": "Mine Renamed"}, etag=etag
            ).status_code
            == 200
        )
        assert (
            client.patch(
                f"/api/v1/departments/{theirs.id}", json={"name": "Hijacked"}, etag='"1"'
            ).status_code
            == 404
        )

    def test_department_scoped_user_read_sees_only_department_members(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        mine = factory.department(organization, name="Mine")
        theirs = factory.department(organization, name="Theirs")
        member = factory.user(organization, email="member@example.com", departments=(mine,))
        outsider = factory.user(organization, email="outsider@example.com", departments=(theirs,))
        reader = factory.user_with_permissions(
            organization,
            (USER_READ,),
            scope=ScopeType.DEPARTMENT,
            department=mine,
            email="userreader@example.com",
            departments=(mine,),
        )
        client.login_or_fail("userreader@example.com")

        visible = {item["id"] for item in client.get("/api/v1/users").json()["items"]}
        assert str(member.id) in visible
        assert str(reader.id) in visible
        assert str(outsider.id) not in visible

        assert client.get(f"/api/v1/users/{outsider.id}").status_code == 404

    def test_department_filter_cannot_widen_scope(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """A query filter narrows the authorized set; it never expands it."""
        organization = factory.organization()
        mine = factory.department(organization, name="Mine")
        theirs = factory.department(organization, name="Theirs")
        factory.user(organization, email="hidden-member@example.com", departments=(theirs,))
        factory.user_with_permissions(
            organization,
            (USER_READ,),
            scope=ScopeType.DEPARTMENT,
            department=mine,
            email="filterer@example.com",
            departments=(mine,),
        )
        client.login_or_fail("filterer@example.com")

        response = client.get(f"/api/v1/users?department_id={theirs.id}")
        assert response.status_code == 200
        assert response.json()["items"] == []


class TestPrivilegeEscalation:
    def test_grantor_cannot_grant_a_permission_it_lacks(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """RBAC.md §4: "A user cannot grant a permission or scope they do not
        possess"."""
        organization = factory.organization()
        factory.user_with_permissions(
            organization,
            (ROLE_READ, ROLE_CREATE, ROLE_PERMISSION_MANAGE),
            email="grantor@example.com",
        )
        client.login_or_fail("grantor@example.com")

        created = client.post("/api/v1/roles", json={"key": "new_role", "name": "New Role"})
        assert created.status_code == 201
        role_id = created.json()["id"]

        # The grantor does not hold user.create, so it cannot put it on a role.
        response = client.post(
            f"/api/v1/roles/{role_id}/permissions", json={"permission_key": USER_CREATE}
        )
        assert response.status_code == 403
        assert "cannot delegate" in response.json()["detail"]

    def test_grantor_can_grant_a_permission_it_holds(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization,
            (ROLE_READ, ROLE_CREATE, ROLE_PERMISSION_MANAGE, DEPARTMENT_READ),
            email="okgrantor@example.com",
        )
        client.login_or_fail("okgrantor@example.com")

        role_id = client.post(
            "/api/v1/roles", json={"key": "reader_role", "name": "Reader Role"}
        ).json()["id"]

        response = client.post(
            f"/api/v1/roles/{role_id}/permissions", json={"permission_key": DEPARTMENT_READ}
        )
        assert response.status_code == 201
        assert response.json()["permissions"] == [DEPARTMENT_READ]

    def test_assigning_a_role_requires_holding_its_permissions(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        target = factory.user(organization, email="target@example.com")
        powerful = factory.role(organization, permissions=(USER_CREATE,), key="powerful")
        factory.user_with_permissions(
            organization, (ROLE_READ, ROLE_ASSIGN), email="weak-assigner@example.com"
        )
        client.login_or_fail("weak-assigner@example.com")

        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(target.id),
                "role_id": str(powerful.id),
                "scope_type": "organization",
            },
        )
        assert response.status_code == 403

    def test_department_scoped_assigner_cannot_grant_organization_scope(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        department = factory.department(organization)
        target = factory.user(organization, email="target2@example.com")
        role = factory.role(organization, permissions=(DEPARTMENT_READ,), key="dept_reader")
        factory.user_with_permissions(
            organization,
            (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ),
            scope=ScopeType.DEPARTMENT,
            department=department,
            email="deptassigner@example.com",
        )
        client.login_or_fail("deptassigner@example.com")

        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(target.id),
                "role_id": str(role.id),
                "scope_type": "organization",
            },
        )
        assert response.status_code == 403

    def test_organization_only_role_cannot_be_assigned_at_department_scope(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Failing loudly beats silently dropping the permissions at evaluation."""
        organization = factory.organization()
        department = factory.department(organization)
        target = factory.user(organization, email="target3@example.com")
        role = factory.role(organization, permissions=(USER_CREATE,), key="provisioner")
        factory.user_with_permissions(
            organization, (ROLE_READ, ROLE_ASSIGN, USER_CREATE), email="assigner@example.com"
        )
        client.login_or_fail("assigner@example.com")

        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(target.id),
                "role_id": str(role.id),
                "scope_type": "department",
                "department_id": str(department.id),
            },
        )
        assert response.status_code == 422
        assert "organization-level permissions" in response.json()["detail"]


class TestRoleAssignmentApi:
    def test_assignment_grants_authority_and_revokes_grantee_sessions(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        grantee = factory.user(organization, email="grantee@example.com")
        role = factory.role(organization, permissions=(DEPARTMENT_READ,), key="dept_read_role")
        factory.user_with_permissions(
            organization,
            (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ),
            email="admin@example.com",
        )
        grantee_id = grantee.id

        # The grantee starts with a live session and no authority.
        client.login_or_fail("grantee@example.com")
        assert client.get("/api/v1/departments").status_code == 403
        client.raw.cookies.clear()

        client.login_or_fail("admin@example.com")
        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(grantee_id),
                "role_id": str(role.id),
                "scope_type": "organization",
            },
        )
        assert response.status_code == 201
        assert response.json()["scope_type"] == "organization"

        # RBAC.md §5: the grantee's session state must not outlive the change.
        db_session.expire_all()
        grantee_sessions = list(
            db_session.execute(
                select(UserSession).where(UserSession.user_id == grantee_id)
            ).scalars()
        )
        assert all(record.revoked_at is not None for record in grantee_sessions)

        client.raw.cookies.clear()
        client.login_or_fail("grantee@example.com")
        assert client.get("/api/v1/departments").status_code == 200

    def test_duplicate_assignment_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        target = factory.user(organization, email="dup@example.com")
        role = factory.role(organization, permissions=(DEPARTMENT_READ,), key="dup_role")
        factory.user_with_permissions(
            organization,
            (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ),
            email="dupadmin@example.com",
        )
        client.login_or_fail("dupadmin@example.com")

        body = {
            "user_id": str(target.id),
            "role_id": str(role.id),
            "scope_type": "organization",
        }
        assert client.post("/api/v1/role-assignments", json=body).status_code == 201
        assert client.post("/api/v1/role-assignments", json=body).status_code == 409

    def test_ending_an_assignment_preserves_history(
        self, client: ApiClient, factory: Factory, db_session: Session
    ) -> None:
        organization = factory.organization()
        target = factory.user(organization, email="ended@example.com")
        role = factory.role(organization, permissions=(DEPARTMENT_READ,), key="ended_role")
        assignment = factory.assign(target, role)
        factory.user_with_permissions(
            organization,
            (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ),
            email="ender@example.com",
        )
        client.login_or_fail("ender@example.com")

        response = client.delete(
            f"/api/v1/role-assignments/{assignment.id}", json={"reason": "role transfer"}
        )
        assert response.status_code == 200
        assert response.json()["revoked_at"] is not None

        # The row survives, so the history of who held what is intact.
        db_session.expire_all()
        stored = db_session.get(RoleAssignment, assignment.id)
        assert stored is not None
        assert stored.revoked_reason == "role transfer"

    def test_disabled_user_cannot_receive_a_role(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        disabled = factory.user(organization, email="disabled-target@example.com", is_active=False)
        role = factory.role(organization, permissions=(DEPARTMENT_READ,), key="unusable_role")
        factory.user_with_permissions(
            organization,
            (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ),
            email="assign-to-disabled@example.com",
        )
        client.login_or_fail("assign-to-disabled@example.com")

        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(disabled.id),
                "role_id": str(role.id),
                "scope_type": "organization",
            },
        )
        assert response.status_code == 422


class TestRoleTemplates:
    def test_seeded_templates_carry_no_permissions(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """ADR-006: no unresolved grant may be seeded."""
        organization = factory.organization()
        factory.user_with_permissions(organization, (ROLE_READ,), email="rolereader@example.com")
        client.login_or_fail("rolereader@example.com")

        roles = client.get("/api/v1/roles").json()["items"]
        templates = [role for role in roles if role["is_system_template"]]

        assert {template["key"] for template in templates} == {
            "md",
            "md_office",
            "department_head",
            "manager",
            "stavyan",
        }
        for template in templates:
            assert template["permissions"] == [], f"{template['key']} seeds permissions"
            assert template["organization_id"] is None

    def test_a_template_cannot_be_assigned(self, client: ApiClient, factory: Factory) -> None:
        """Templates have no organization, so the composite FK rejects them."""
        organization = factory.organization()
        target = factory.user(organization, email="template-target@example.com")
        factory.user_with_permissions(
            organization, (ROLE_READ, ROLE_ASSIGN), email="template-assigner@example.com"
        )
        client.login_or_fail("template-assigner@example.com")

        template = next(
            role
            for role in client.get("/api/v1/roles").json()["items"]
            if role["is_system_template"]
        )
        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(target.id),
                "role_id": template["id"],
                "scope_type": "organization",
            },
        )
        assert response.status_code == 422
        assert "assignable role" in response.json()["detail"]

    def test_a_template_cannot_be_edited(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user_with_permissions(
            organization,
            (ROLE_READ, ROLE_CREATE, ROLE_PERMISSION_MANAGE),
            email="ed@example.com",
        )
        client.login_or_fail("ed@example.com")

        template = next(
            role
            for role in client.get("/api/v1/roles").json()["items"]
            if role["is_system_template"]
        )
        response = client.post(
            f"/api/v1/roles/{template['id']}/permissions",
            json={"permission_key": ORGANIZATION_READ},
        )
        assert response.status_code == 404


class TestPermissionCatalogEndpoint:
    def test_catalog_lists_only_phase_two_keys(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user_with_permissions(organization, (ROLE_READ,), email="cat@example.com")
        client.login_or_fail("cat@example.com")

        keys = {item["key"] for item in client.get("/api/v1/permissions").json()["items"]}

        assert ORGANIZATION_UPDATE in keys
        assert not any(
            key.startswith(("task.", "commitment.", "meeting.", "priority.")) for key in keys
        )

    def test_catalog_requires_role_read(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        factory.user(organization, email="nocat@example.com")
        factory.session.commit()
        client.login_or_fail("nocat@example.com")

        assert client.get("/api/v1/permissions").status_code == 403


class TestRoleDisplayEffectiveDates:
    """Fix 12: ``/auth/me`` role names use the same date semantics as permissions.

    A role shown as current while granting nothing misrepresents someone's
    authority — the display and the enforcement must not disagree.
    """

    def test_a_future_assignment_is_not_shown_as_a_current_role(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="future-role@example.com")
        role = factory.role(organization, key="future_role", permissions=("department.read",))
        factory.assign(
            user,
            role,
            effective_from=date.today() + timedelta(days=7),
        )
        factory.session.commit()

        client.login_or_fail("future-role@example.com")
        body = client.get("/api/v1/auth/me").json()

        assert "future_role" not in body["roles"]
        assert "department.read" not in body["permissions"]

    def test_an_expired_assignment_is_not_shown_as_a_current_role(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="expired-role@example.com")
        role = factory.role(organization, key="expired_role", permissions=("department.read",))
        factory.assign(
            user,
            role,
            effective_from=date.today() - timedelta(days=30),
            effective_to=date.today() - timedelta(days=1),
        )
        factory.session.commit()

        client.login_or_fail("expired-role@example.com")
        body = client.get("/api/v1/auth/me").json()

        assert "expired_role" not in body["roles"]
        assert "department.read" not in body["permissions"]

    def test_a_current_assignment_is_shown(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization()
        user = factory.user(organization, email="current-role@example.com")
        role = factory.role(organization, key="current_role", permissions=("department.read",))
        factory.assign(
            user,
            role,
            effective_from=date.today() - timedelta(days=1),
            effective_to=date.today() + timedelta(days=1),
        )
        factory.session.commit()

        client.login_or_fail("current-role@example.com")
        body = client.get("/api/v1/auth/me").json()

        assert "current_role" in body["roles"]
        assert "department.read" in body["permissions"]

    def test_roles_and_permissions_never_disagree(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """A displayed role must always be backed by its permissions."""
        organization = factory.organization()
        user = factory.user(organization, email="consistent-role@example.com")
        live = factory.role(organization, key="live_role", permissions=("user.read",))
        stale = factory.role(organization, key="stale_role", permissions=("role.read",))
        factory.assign(user, live, effective_from=date.today() - timedelta(days=1))
        factory.assign(
            user,
            stale,
            effective_from=date.today() - timedelta(days=10),
            effective_to=date.today() - timedelta(days=2),
        )
        factory.session.commit()

        client.login_or_fail("consistent-role@example.com")
        body = client.get("/api/v1/auth/me").json()

        assert body["roles"] == ["live_role"]
        assert "user.read" in body["permissions"]
        assert "role.read" not in body["permissions"]
