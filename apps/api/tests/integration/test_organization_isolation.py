"""Organization isolation and IDOR prevention.

SECURITY.md §2 lists "insecure direct object reference" and "cross-department
leakage" as primary threats. SECURITY.md §4: "Never trust user-provided
organization_id or department_id."

Every test here substitutes a real identifier from another organization or
department and asserts the caller cannot reach it.
"""

from __future__ import annotations

import uuid
from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.access.catalog import (
    DEPARTMENT_CREATE,
    DEPARTMENT_READ,
    DEPARTMENT_UPDATE,
    ORGANIZATION_READ,
    ROLE_ASSIGN,
    ROLE_READ,
    USER_CREATE,
    USER_READ,
    USER_UPDATE,
)
from app.modules.organization.models import Department, DepartmentMembership
from tests.conftest import ApiClient, Factory

pytestmark = pytest.mark.db


class TestOrganizationIsolation:
    def test_organization_endpoint_returns_only_the_callers_tenant(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """There is no by-id organization route, so this is the whole surface."""
        mine = factory.organization(slug="mine", name="My Organization")
        factory.organization(slug="theirs", name="Their Organization")
        factory.user_with_permissions(mine, (ORGANIZATION_READ,), email="me@example.com")
        client.login_or_fail("me@example.com")

        body = client.get("/api/v1/organizations/current").json()
        assert body["id"] == str(mine.id)
        assert body["name"] == "My Organization"

    def test_departments_of_another_organization_are_invisible(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine2")
        theirs = factory.organization(slug="theirs2")
        my_department = factory.department(mine, name="My Department")
        their_department = factory.department(theirs, name="Their Department")
        factory.user_with_permissions(mine, (DEPARTMENT_READ,), email="me2@example.com")
        client.login_or_fail("me2@example.com")

        listed = client.get("/api/v1/departments").json()
        assert [item["id"] for item in listed["items"]] == [str(my_department.id)]

        # Identifier substitution with a real, existing identifier.
        assert client.get(f"/api/v1/departments/{their_department.id}").status_code == 404

    def test_users_of_another_organization_are_invisible(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine3")
        theirs = factory.organization(slug="theirs3")
        their_user = factory.user(theirs, email="them@example.com")
        me = factory.user_with_permissions(mine, (USER_READ,), email="me3@example.com")
        client.login_or_fail("me3@example.com")

        visible = {item["id"] for item in client.get("/api/v1/users").json()["items"]}
        assert visible == {str(me.id)}
        assert client.get(f"/api/v1/users/{their_user.id}").status_code == 404

    def test_cannot_update_another_organizations_department(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine4")
        theirs = factory.organization(slug="theirs4")
        their_department = factory.department(theirs, name="Untouchable")
        factory.user_with_permissions(
            mine, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="me4@example.com"
        )
        client.login_or_fail("me4@example.com")

        response = client.patch(
            f"/api/v1/departments/{their_department.id}", json={"name": "Hijacked"}, etag='"1"'
        )
        assert response.status_code == 404

        # And it really was not modified.
        factory.session.expire_all()
        stored = factory.session.get(Department, their_department.id)
        assert stored is not None
        assert stored.name == "Untouchable"

    def test_cannot_parent_a_department_into_another_organization(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine5")
        theirs = factory.organization(slug="theirs5")
        their_department = factory.department(theirs)
        factory.user_with_permissions(
            mine, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="me5@example.com"
        )
        client.login_or_fail("me5@example.com")

        response = client.post(
            "/api/v1/departments",
            json={"name": "Sneaky", "parent_department_id": str(their_department.id)},
        )
        assert response.status_code == 422
        assert "parent_department_id" in response.json()["field_errors"]

    def test_cannot_assign_a_role_to_another_organizations_user(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine6")
        theirs = factory.organization(slug="theirs6")
        their_user = factory.user(theirs, email="them6@example.com")
        my_role = factory.role(mine, permissions=(DEPARTMENT_READ,), key="my_role")
        factory.user_with_permissions(
            mine, (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ), email="me6@example.com"
        )
        client.login_or_fail("me6@example.com")

        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(their_user.id),
                "role_id": str(my_role.id),
                "scope_type": "organization",
            },
        )
        assert response.status_code == 422
        assert "user_id" in response.json()["field_errors"]

    def test_cannot_assign_another_organizations_role(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine7")
        theirs = factory.organization(slug="theirs7")
        their_role = factory.role(theirs, permissions=(DEPARTMENT_READ,), key="their_role")
        my_user = factory.user(mine, email="mine7-target@example.com")
        factory.user_with_permissions(
            mine, (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ), email="me7@example.com"
        )
        client.login_or_fail("me7@example.com")

        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(my_user.id),
                "role_id": str(their_role.id),
                "scope_type": "organization",
            },
        )
        assert response.status_code == 422
        assert "role_id" in response.json()["field_errors"]

    def test_cannot_scope_an_assignment_to_another_organizations_department(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine8")
        theirs = factory.organization(slug="theirs8")
        their_department = factory.department(theirs)
        my_user = factory.user(mine, email="mine8-target@example.com")
        my_role = factory.role(mine, permissions=(DEPARTMENT_READ,), key="my_role8")
        factory.user_with_permissions(
            mine, (ROLE_READ, ROLE_ASSIGN, DEPARTMENT_READ), email="me8@example.com"
        )
        client.login_or_fail("me8@example.com")

        response = client.post(
            "/api/v1/role-assignments",
            json={
                "user_id": str(my_user.id),
                "role_id": str(my_role.id),
                "scope_type": "department",
                "department_id": str(their_department.id),
            },
        )
        assert response.status_code == 422
        assert "department_id" in response.json()["field_errors"]

    def test_cannot_add_a_membership_in_another_organizations_department(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="mine9")
        theirs = factory.organization(slug="theirs9")
        their_department = factory.department(theirs)
        my_user = factory.user(mine, email="mine9-target@example.com")
        factory.user_with_permissions(mine, (USER_READ, USER_UPDATE), email="me9@example.com")
        client.login_or_fail("me9@example.com")

        response = client.post(
            f"/api/v1/users/{my_user.id}/department-memberships",
            json={"department_id": str(their_department.id)},
        )
        assert response.status_code == 422

    def test_random_identifiers_are_indistinguishable_from_foreign_ones(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """A 404 for both means substitution reveals nothing about existence."""
        mine = factory.organization(slug="mine10")
        theirs = factory.organization(slug="theirs10")
        their_department = factory.department(theirs)
        factory.user_with_permissions(mine, (DEPARTMENT_READ,), email="me10@example.com")
        client.login_or_fail("me10@example.com")

        foreign = client.get(f"/api/v1/departments/{their_department.id}")
        nonexistent = client.get(f"/api/v1/departments/{uuid.uuid4()}")

        assert foreign.status_code == nonexistent.status_code == 404
        assert foreign.json()["detail"] == nonexistent.json()["detail"]

    def test_created_resources_belong_to_the_callers_organization(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """The body cannot choose a tenant, so creation always lands in-scope."""
        mine = factory.organization(slug="mine11")
        theirs = factory.organization(slug="theirs11")
        factory.user_with_permissions(
            mine, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="me11@example.com"
        )
        client.login_or_fail("me11@example.com")

        # An extra organization_id is rejected outright by the request schema.
        rejected = client.post(
            "/api/v1/departments",
            json={"name": "Injected", "organization_id": str(theirs.id)},
        )
        assert rejected.status_code == 422

        created = client.post("/api/v1/departments", json={"name": "Legitimate"})
        assert created.status_code == 201
        assert created.json()["organization_id"] == str(mine.id)


class TestDatabaseLevelIsolation:
    """The composite foreign keys must hold even if service code is bypassed."""

    def test_department_cannot_be_parented_across_organizations_in_sql(
        self, factory: Factory, db_session: Session
    ) -> None:
        mine = factory.organization(slug="sql1")
        theirs = factory.organization(slug="sql2")
        their_department = factory.department(theirs)
        db_session.commit()

        rogue = Department(
            organization_id=mine.id,
            name="Rogue",
            parent_department_id=their_department.id,
        )
        db_session.add(rogue)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()

    def test_membership_cannot_cross_organizations_in_sql(
        self, factory: Factory, db_session: Session
    ) -> None:
        mine = factory.organization(slug="sql3")
        theirs = factory.organization(slug="sql4")
        my_user = factory.user(mine, email="sql3@example.com")
        their_department = factory.department(theirs)
        db_session.commit()

        rogue = DepartmentMembership(
            organization_id=mine.id,
            user_id=my_user.id,
            department_id=their_department.id,
            started_on=date.today(),
        )
        db_session.add(rogue)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()


class TestUserProvisioningScope:
    def test_provisioned_user_lands_in_the_callers_organization(
        self, client: ApiClient, factory: Factory
    ) -> None:
        mine = factory.organization(slug="prov1")
        factory.user_with_permissions(
            mine, (USER_READ, USER_CREATE), email="provisioner@example.com"
        )
        client.login_or_fail("provisioner@example.com")

        response = client.post(
            "/api/v1/users",
            json={
                "full_name": "New Colleague",
                "email": "new.colleague@example.com",
                "initial_password": "a-temporary-local-password",
            },
        )
        assert response.status_code == 201
        assert response.json()["organization_id"] == str(mine.id)

    def test_same_email_may_exist_in_two_organizations(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Uniqueness is per organization (DATABASE.md §2)."""
        first = factory.organization(slug="prov2")
        second = factory.organization(slug="prov3")
        factory.user(second, email="shared.address@example.com")
        factory.user_with_permissions(
            first, (USER_READ, USER_CREATE), email="provisioner2@example.com"
        )
        client.login_or_fail("provisioner2@example.com")

        response = client.post(
            "/api/v1/users",
            json={"full_name": "Same Address", "email": "shared.address@example.com"},
        )
        assert response.status_code == 201

    def test_duplicate_email_within_an_organization_is_rejected(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization(slug="prov4")
        factory.user(organization, email="taken@example.com")
        factory.user_with_permissions(
            organization, (USER_READ, USER_CREATE), email="provisioner3@example.com"
        )
        client.login_or_fail("provisioner3@example.com")

        response = client.post(
            "/api/v1/users", json={"full_name": "Duplicate", "email": "TAKEN@example.com"}
        )
        assert response.status_code == 409

    def test_provisioned_account_has_no_authority(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """Creating a user must never confer a role."""
        organization = factory.organization(slug="prov5")
        factory.user_with_permissions(
            organization, (USER_READ, USER_CREATE), email="provisioner4@example.com"
        )
        client.login_or_fail("provisioner4@example.com")

        client.post(
            "/api/v1/users",
            json={
                "full_name": "Fresh Account",
                "email": "fresh@example.com",
                "initial_password": "a-temporary-local-password",
            },
        )

        client.raw.cookies.clear()
        client.login_or_fail("fresh@example.com", "a-temporary-local-password")
        body = client.get("/api/v1/auth/me").json()
        assert body["permissions"] == []
        assert body["roles"] == []
        # An administrator-chosen password must be replaced before use.
        assert body["must_change_password"] is True


class TestDepartmentMembershipHistory:
    def test_ending_a_membership_preserves_the_row(
        self, client: ApiClient, factory: Factory
    ) -> None:
        """DOMAIN_MODEL.md §3: transfers must retain history."""
        organization = factory.organization(slug="hist1")
        department = factory.department(organization, name="Radiology")
        target = factory.user(organization, email="transferred@example.com")
        factory.user_with_permissions(
            organization,
            (USER_READ, USER_UPDATE, DEPARTMENT_READ),
            email="hr@example.com",
        )
        client.login_or_fail("hr@example.com")

        created = client.post(
            f"/api/v1/users/{target.id}/department-memberships",
            json={"department_id": str(department.id), "is_primary": True},
        )
        assert created.status_code == 201
        membership_id = created.json()["id"]

        ended = client.post(
            f"/api/v1/users/{target.id}/department-memberships/{membership_id}:end",
            json={"reason": "moved to another department"},
        )
        assert ended.status_code == 200
        assert ended.json()["ended_on"] is not None

        history = client.get(f"/api/v1/users/{target.id}/department-memberships").json()
        assert [item["id"] for item in history] == [membership_id]

        current = client.get(
            f"/api/v1/users/{target.id}/department-memberships?current_only=true"
        ).json()
        assert current == []

    def test_duplicate_active_membership_is_rejected(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization(slug="hist2")
        department = factory.department(organization)
        target = factory.user(organization, email="dupmember@example.com")
        factory.user_with_permissions(
            organization,
            (USER_READ, USER_UPDATE, DEPARTMENT_READ),
            email="hr2@example.com",
        )
        client.login_or_fail("hr2@example.com")

        body = {"department_id": str(department.id)}
        assert (
            client.post(f"/api/v1/users/{target.id}/department-memberships", json=body).status_code
            == 201
        )
        assert (
            client.post(f"/api/v1/users/{target.id}/department-memberships", json=body).status_code
            == 409
        )


class TestDepartmentArchival:
    def test_department_with_active_members_cannot_be_archived(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization(slug="arch1")
        department = factory.department(organization, name="Occupied")
        factory.user(organization, email="occupant@example.com", departments=(department,))
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="archiver@example.com"
        )
        client.login_or_fail("archiver@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        response = client.patch(
            f"/api/v1/departments/{department.id}", json={"is_active": False}, etag=etag
        )
        assert response.status_code == 409
        assert "active memberships" in response.json()["detail"]

    def test_empty_department_can_be_archived(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization(slug="arch2")
        department = factory.department(organization, name="Empty")
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="archiver2@example.com"
        )
        client.login_or_fail("archiver2@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        response = client.patch(
            f"/api/v1/departments/{department.id}", json={"is_active": False}, etag=etag
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False
        assert response.json()["archived_at"] is not None

    def test_archived_department_name_can_be_reused(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization(slug="arch3")
        department = factory.department(organization, name="Recycled")
        factory.user_with_permissions(
            organization,
            (DEPARTMENT_READ, DEPARTMENT_UPDATE, DEPARTMENT_CREATE),
            email="archiver3@example.com",
        )
        client.login_or_fail("archiver3@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        client.patch(f"/api/v1/departments/{department.id}", json={"is_active": False}, etag=etag)

        assert client.post("/api/v1/departments", json={"name": "Recycled"}).status_code == 201

    def test_duplicate_active_department_name_is_rejected(
        self, client: ApiClient, factory: Factory
    ) -> None:
        organization = factory.organization(slug="arch4")
        factory.department(organization, name="Radiology")
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_CREATE), email="dup@example.com"
        )
        client.login_or_fail("dup@example.com")

        assert client.post("/api/v1/departments", json={"name": "radiology"}).status_code == 409


class TestHierarchyCycles:
    def test_a_cycle_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        """API.md requires cycle prevention; the DB check only blocks self-parenting."""
        organization = factory.organization(slug="cycle1")
        grandparent = factory.department(organization, name="Level 1")
        parent = factory.department(organization, name="Level 2", parent=grandparent)
        child = factory.department(organization, name="Level 3", parent=parent)
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="cycler@example.com"
        )
        client.login_or_fail("cycler@example.com")

        etag = client.get(f"/api/v1/departments/{grandparent.id}").headers["ETag"]
        response = client.patch(
            f"/api/v1/departments/{grandparent.id}",
            json={"parent_department_id": str(child.id)},
            etag=etag,
        )
        assert response.status_code == 422
        assert "parent_department_id" in response.json()["field_errors"]

    def test_self_parenting_is_rejected(self, client: ApiClient, factory: Factory) -> None:
        organization = factory.organization(slug="cycle2")
        department = factory.department(organization, name="Alone")
        factory.user_with_permissions(
            organization, (DEPARTMENT_READ, DEPARTMENT_UPDATE), email="selfer@example.com"
        )
        client.login_or_fail("selfer@example.com")

        etag = client.get(f"/api/v1/departments/{department.id}").headers["ETag"]
        response = client.patch(
            f"/api/v1/departments/{department.id}",
            json={"parent_department_id": str(department.id)},
            etag=etag,
        )
        assert response.status_code == 422
