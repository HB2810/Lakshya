"""No API response schema may expose authentication material.

SECURITY.md §6. The primary guarantee is structural: if a response model has no
field for a password hash or session token, no serialisation mistake can leak
one. These tests assert that structure over every response schema at once, so a
future schema addition is covered without a new test.
"""

from __future__ import annotations

import pytest
from pydantic import BaseModel

from app.modules.access import schemas as access_schemas
from app.modules.identity import schemas as identity_schemas
from app.modules.organization import schemas as organization_schemas

_FORBIDDEN_FIELD_MARKERS = (
    "password_hash",
    "token_hash",
    "csrf",
    "secret",
    "salt",
    "session_token",
)

_SCHEMA_MODULES = (identity_schemas, organization_schemas, access_schemas)


def _response_models() -> list[type[BaseModel]]:
    models: list[type[BaseModel]] = []
    for module in _SCHEMA_MODULES:
        for name in dir(module):
            candidate = getattr(module, name)
            if (
                isinstance(candidate, type)
                and issubclass(candidate, BaseModel)
                and candidate is not BaseModel
                and name.endswith(("Response", "Summary"))
            ):
                models.append(candidate)
    return models


def test_response_models_were_discovered() -> None:
    """Guard the guard: an empty list would make every check below vacuous."""
    assert len(_response_models()) >= 8


@pytest.mark.parametrize("model", _response_models(), ids=lambda m: m.__name__)
def test_response_model_has_no_secret_field(model: type[BaseModel]) -> None:
    offenders = [
        field
        for field in model.model_fields
        if any(marker in field for marker in _FORBIDDEN_FIELD_MARKERS)
    ]
    assert offenders == [], f"{model.__name__} exposes {offenders}"


def test_session_summary_exposes_no_token() -> None:
    """The session identifier lives in an HttpOnly cookie and nowhere else."""
    fields = set(identity_schemas.SessionSummary.model_fields)
    assert fields == {"id", "issued_at", "expires_at", "last_activity_at"}


def test_user_response_has_no_credential_field() -> None:
    fields = set(identity_schemas.UserResponse.model_fields)
    assert "password" not in " ".join(fields)
    assert "credential" not in " ".join(fields)


def test_current_user_response_reports_capabilities_not_secrets() -> None:
    fields = set(identity_schemas.CurrentUserResponse.model_fields)
    assert {"roles", "permissions", "must_change_password"} <= fields
    assert not any(marker in field for field in fields for marker in _FORBIDDEN_FIELD_MARKERS)


@pytest.mark.parametrize(
    "model",
    [
        identity_schemas.UserCreateRequest,
        identity_schemas.UserUpdateRequest,
        identity_schemas.LoginRequest,
        organization_schemas.DepartmentCreateRequest,
        organization_schemas.DepartmentUpdateRequest,
        organization_schemas.OrganizationUpdateRequest,
        access_schemas.RoleCreateRequest,
        access_schemas.RoleAssignmentCreateRequest,
    ],
    ids=lambda m: m.__name__,
)
def test_request_models_forbid_unknown_fields(model: type[BaseModel]) -> None:
    """Mass assignment prevention (SECURITY.md §5: "reject unknown fields")."""
    assert model.model_config.get("extra") == "forbid"


@pytest.mark.parametrize(
    "model",
    [
        organization_schemas.DepartmentCreateRequest,
        access_schemas.RoleCreateRequest,
        access_schemas.RoleAssignmentCreateRequest,
        identity_schemas.UserCreateRequest,
    ],
    ids=lambda m: m.__name__,
)
def test_no_request_model_accepts_organization_id(model: type[BaseModel]) -> None:
    """Organization scope comes from the session, never the request (API.md §1)."""
    assert "organization_id" not in model.model_fields
