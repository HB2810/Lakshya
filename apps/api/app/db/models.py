"""Single import surface for every mapped model.

Alembic's ``target_metadata`` and the test schema builder import this module so
no table can be forgotten by autogenerate. Nothing else should import it.
"""

from __future__ import annotations

from app.db.base import Base
from app.modules.access.models import Permission, Role, RoleAssignment, RolePermission
from app.modules.audit.models import AuditEvent
from app.modules.calendar.models import CalendarEvent, CalendarSyncOutbox, UserCalendarIntegration
from app.modules.identity.models import Credential, User, UserSession
from app.modules.kpi.models import KPIDefinition, KPIValue
from app.modules.meeting.models import Meeting, MeetingAgenda, MeetingCheckin, MeetingHeadline, MeetingParticipant
from app.modules.oo.models import OAndOItem
from app.modules.organization.models import (
    Department,
    DepartmentMembership,
    Organization,
    Position,
    PositionAssignment,
)
from app.modules.strategy.models import AnnualGoal, MonthlyPriority, QuarterlyPriority, WeeklyMilestone
from app.modules.work_item.models import WorkItem, WorkItemActivity, WorkItemEscalation

__all__ = [
    "AnnualGoal",
    "AuditEvent",
    "Base",
    "CalendarEvent",
    "CalendarSyncOutbox",
    "Credential",
    "Department",
    "DepartmentMembership",
    "KPIDefinition",
    "KPIValue",
    "Meeting",
    "MeetingAgenda",
    "MeetingCheckin",
    "MeetingHeadline",
    "MeetingParticipant",
    "MonthlyPriority",
    "OAndOItem",
    "Organization",
    "Permission",
    "Position",
    "PositionAssignment",
    "QuarterlyPriority",
    "Role",
    "RoleAssignment",
    "RolePermission",
    "User",
    "UserCalendarIntegration",
    "UserSession",
    "WeeklyMilestone",
    "WorkItem",
    "WorkItemActivity",
    "WorkItemEscalation",
]


