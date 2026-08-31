"""Organization and department API contracts.

API.md §1: "Never expose persistence models directly." Request and response
schemas are separate types, so a column added to a model does not silently become
part of the public contract.
"""

from __future__ import annotations

import uuid
import zoneinfo
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.organization.models import Department, Organization

# Request models reject unknown fields, which is what prevents mass assignment
# through a field the schema does not declare (SECURITY.md §5).
_REQUEST_CONFIG = ConfigDict(extra="forbid", str_strip_whitespace=True)

Name = Annotated[str, Field(min_length=1, max_length=200)]
DepartmentCode = Annotated[str, Field(min_length=1, max_length=32)]
Reason = Annotated[str, Field(max_length=1000)]


class OrganizationResponse(BaseModel):
    """Organization projection."""

    id: uuid.UUID
    name: str
    slug: str
    timezone: str
    is_active: bool
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime
    version: int

    @classmethod
    def from_model(cls, organization: Organization) -> OrganizationResponse:
        return cls(
            id=organization.id,
            name=organization.name,
            slug=organization.slug,
            timezone=organization.timezone,
            is_active=organization.is_active,
            archived_at=organization.archived_at,
            created_at=organization.created_at,
            updated_at=organization.updated_at,
            version=organization.version,
        )


class OrganizationUpdateRequest(BaseModel):
    """Partial organization update.

    ``slug`` is not updatable: it identifies the tenant in login and future URLs,
    so changing it would break existing references.
    """

    model_config = _REQUEST_CONFIG

    name: Name | None = None
    timezone: str | None = None
    is_active: bool | None = None
    reason: Reason | None = None

    @field_validator("timezone")
    @classmethod
    def _validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        try:
            zoneinfo.ZoneInfo(value)
        except (zoneinfo.ZoneInfoNotFoundError, ValueError) as exc:
            raise ValueError(f"{value!r} is not a known IANA timezone name") from exc
        return value


class DepartmentResponse(BaseModel):
    """Department projection."""

    id: uuid.UUID
    organization_id: uuid.UUID
    parent_department_id: uuid.UUID | None
    name: str
    code: str | None
    is_active: bool
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime
    version: int

    @classmethod
    def from_model(cls, department: Department) -> DepartmentResponse:
        return cls(
            id=department.id,
            organization_id=department.organization_id,
            parent_department_id=department.parent_department_id,
            name=department.name,
            code=department.code,
            is_active=department.is_active,
            archived_at=department.archived_at,
            created_at=department.created_at,
            updated_at=department.updated_at,
            version=department.version,
        )


class DepartmentCreateRequest(BaseModel):
    """Create a department.

    ``organization_id`` is deliberately absent: the organization is derived from
    the authenticated session, never from the request body (API.md §1).
    """

    model_config = _REQUEST_CONFIG

    name: Name
    code: DepartmentCode | None = None
    parent_department_id: uuid.UUID | None = None
    reason: Reason | None = None


class DepartmentUpdateRequest(BaseModel):
    """Partial department update.

    Setting ``is_active`` to ``false`` archives the department. Departments are
    never hard-deleted, because role assignments and membership history reference
    them (DATABASE.md §7).
    """

    model_config = _REQUEST_CONFIG

    name: Name | None = None
    code: DepartmentCode | None = None
    parent_department_id: uuid.UUID | None = None
    is_active: bool | None = None
    reason: Reason | None = None


class DepartmentListResponse(BaseModel):
    """Cursor-paginated department list (API.md §1)."""

    items: list[DepartmentResponse]
    next_cursor: uuid.UUID | None = None


# ---------------------------------------------------------------------------
# Positions & Organizational Hierarchy
# ---------------------------------------------------------------------------


class PositionResponse(BaseModel):
    """Position / Post projection."""

    id: uuid.UUID
    organization_id: uuid.UUID
    department_id: uuid.UUID
    reports_to_position_id: uuid.UUID | None
    title: str
    code: str | None
    is_leadership: bool
    is_active: bool
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime
    version: int

    # Current occupant summary if any
    current_occupant_id: uuid.UUID | None = None
    current_occupant_name: str | None = None
    current_occupant_email: str | None = None


class PositionCreateRequest(BaseModel):
    """Create a new organizational position."""

    model_config = _REQUEST_CONFIG

    department_id: uuid.UUID
    title: Name
    code: str | None = None
    reports_to_position_id: uuid.UUID | None = None
    is_leadership: bool = False


class PositionUpdateRequest(BaseModel):
    """Update a position."""

    model_config = _REQUEST_CONFIG

    title: Name | None = None
    code: str | None = None
    department_id: uuid.UUID | None = None
    reports_to_position_id: uuid.UUID | None = None
    is_leadership: bool | None = None
    is_active: bool | None = None


class PositionAssignmentResponse(BaseModel):
    """Position assignment projection."""

    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    position_id: uuid.UUID
    position_title: str | None = None
    department_id: uuid.UUID | None = None
    department_name: str | None = None
    user_name: str | None = None
    is_primary: bool
    started_on: str
    ended_on: str | None
    transfer_reason: str | None
    is_current: bool


class PositionTransferRequest(BaseModel):
    """Single transfer mutation: Move an stavyan to a new position."""

    model_config = _REQUEST_CONFIG

    user_id: uuid.UUID
    new_position_id: uuid.UUID
    started_on: str | None = None
    transfer_reason: str | None = None


class OrgNodeOccupant(BaseModel):
    user_id: uuid.UUID
    full_name: str
    email: str
    started_on: str


class OrgNode(BaseModel):
    """A node in the canonical Organization Chart."""

    position_id: uuid.UUID
    title: str
    code: str | None
    is_leadership: bool
    department_id: uuid.UUID
    department_name: str
    reports_to_position_id: uuid.UUID | None
    current_occupant: OrgNodeOccupant | None = None
    subordinates: list[OrgNode] = []


class OrgTreeResponse(BaseModel):
    """Full canonical organization chart tree backed by real database data."""

    organization_id: uuid.UUID
    organization_name: str
    root_nodes: list[OrgNode]

