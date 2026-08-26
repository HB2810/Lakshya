"""Authentication and user API contracts.

Security property of this module: **no schema here has a field for a password
hash, a session token or a CSRF token.** Secrets travel in cookies, set by the
route layer; they are structurally absent from every response body, so a
serialisation mistake cannot leak them.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.identity.models import User
from app.modules.organization.models import DepartmentMembership

_REQUEST_CONFIG = ConfigDict(extra="forbid", str_strip_whitespace=True)

FullName = Annotated[str, Field(min_length=1, max_length=200)]
Reason = Annotated[str, Field(max_length=1000)]

#: Upper bound only. The minimum is enforced by the service against the
#: configured policy, so one deployment can require longer passwords without a
#: schema change. Full policy is REQUIRES BUSINESS DECISION (SECURITY.md §3).
Password = Annotated[str, Field(min_length=1, max_length=4096)]


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------


class LoginRequest(BaseModel):
    """Credentials for ``POST /auth/login``.

    ``organization_slug`` only disambiguates an address that exists in more than
    one organization. It cannot widen access: the resulting scope always comes
    from the matched user record.
    """

    model_config = _REQUEST_CONFIG

    email: Annotated[str, Field(min_length=3, max_length=320)]
    password: Password
    organization_slug: Annotated[str, Field(max_length=64)] | None = None


class SessionSummary(BaseModel):
    """Non-secret facts about the current session."""

    id: uuid.UUID
    issued_at: datetime
    expires_at: datetime
    last_activity_at: datetime


class CurrentUserResponse(BaseModel):
    """``GET /auth/me`` and the ``POST /auth/login`` response.

    API.md: "Current identity, roles and effective capabilities".
    ``permissions`` is a convenience for the client's affordances only — the
    server re-checks every action (RBAC.md §1).
    """

    user: UserResponse
    organization_id: uuid.UUID
    organization_slug: str
    session: SessionSummary
    roles: list[str]
    permissions: list[str]
    department_ids: list[uuid.UUID]
    must_change_password: bool


class PasswordChangeRequest(BaseModel):
    """``POST /auth/password/change``.

    ``current_password`` is the re-authentication step required by
    SECURITY.md §3. A successful change revokes every other session.
    """

    model_config = _REQUEST_CONFIG

    current_password: Password
    new_password: Password


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class UserResponse(BaseModel):
    """User projection. Contains no authentication material."""

    id: uuid.UUID
    organization_id: uuid.UUID
    full_name: str
    email: str
    is_active: bool
    disabled_at: datetime | None
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime
    version: int

    @classmethod
    def from_model(cls, user: User) -> UserResponse:
        return cls(
            id=user.id,
            organization_id=user.organization_id,
            full_name=user.full_name,
            email=user.email,
            is_active=user.is_active,
            disabled_at=user.disabled_at,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
            version=user.version,
        )


class UserMembershipInput(BaseModel):
    """A department membership requested at user-creation time."""

    model_config = _REQUEST_CONFIG

    department_id: uuid.UUID
    is_primary: bool = False


class UserCreateRequest(BaseModel):
    """Provision a user.

    ``initial_password`` is optional. When supplied it is hashed with Argon2id and
    stored with ``must_change_password`` set, so the value chosen by the
    administrator cannot remain the account's credential. Omitting it creates an
    account that cannot yet sign in — appropriate once Stavya's approved
    provisioning/invitation flow exists (TODO REQUIRES BUSINESS DECISION).
    """

    model_config = _REQUEST_CONFIG

    full_name: FullName
    email: EmailStr
    initial_password: Password | None = None
    department_memberships: list[UserMembershipInput] = Field(default_factory=list, max_length=50)
    reason: Reason | None = None


class UserUpdateRequest(BaseModel):
    """Partial user update.

    Setting ``is_active`` to ``false`` disables the account and revokes its
    sessions in the same transaction.
    """

    model_config = _REQUEST_CONFIG

    full_name: FullName | None = None
    email: EmailStr | None = None
    is_active: bool | None = None
    disabled_reason: Annotated[str, Field(max_length=500)] | None = None
    reason: Reason | None = None


class UserListResponse(BaseModel):
    items: list[UserResponse]
    next_cursor: uuid.UUID | None = None


class DepartmentMembershipResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    department_id: uuid.UUID
    is_primary: bool
    started_on: date
    ended_on: date | None
    note: str | None
    created_at: datetime

    @classmethod
    def from_model(cls, membership: DepartmentMembership) -> DepartmentMembershipResponse:
        return cls(
            id=membership.id,
            user_id=membership.user_id,
            department_id=membership.department_id,
            is_primary=membership.is_primary,
            started_on=membership.started_on,
            ended_on=membership.ended_on,
            note=membership.note,
            created_at=membership.created_at,
        )


class DepartmentMembershipCreateRequest(BaseModel):
    model_config = _REQUEST_CONFIG

    department_id: uuid.UUID
    is_primary: bool = False
    started_on: date | None = None
    note: Annotated[str, Field(max_length=500)] | None = None


class DepartmentMembershipEndRequest(BaseModel):
    model_config = _REQUEST_CONFIG

    ended_on: date | None = None
    reason: Reason | None = None


# Resolve the forward reference used inside CurrentUserResponse.
CurrentUserResponse.model_rebuild()
