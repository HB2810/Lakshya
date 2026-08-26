"""Create Meeting, Calendar, Strategy, KPI, and O&O tables.

Revision ID: 0004
Revises: 0003
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op
from app.modules.access.catalog import PERMISSION_CATALOG
from app.modules.calendar.models import CALENDAR_EVENT_TYPES, OUTBOX_STATUSES, SYNC_STATUSES
from app.modules.meeting.models import AGENDA_STATUSES, MEETING_STATUSES, MEETING_TYPES
from app.modules.oo.models import OO_PRIORITIES, OO_STATUSES, OO_TYPES
from app.modules.strategy.models import QUARTERLY_PRIORITY_STATUSES

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Seed new permission keys
    connection = op.get_bind()
    insert_permission = sa.text(
        """
        INSERT INTO permissions (id, key, resource, action, description)
        VALUES (:id, :key, :resource, :action, :description)
        ON CONFLICT (key) DO NOTHING
        """
    ).bindparams(sa.bindparam("id"))

    for permission in PERMISSION_CATALOG:
        connection.execute(
            insert_permission,
            {
                "id": uuid.uuid4(),
                "key": permission.key,
                "resource": permission.resource,
                "action": permission.action,
                "description": permission.description,
            },
        )

    # 2. Meetings table
    op.create_table(
        "meetings",
        op.f("pk_meetings"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("purpose", sa.Text, nullable=True),
        sa.Column("meeting_type", sa.String(50), nullable=False, server_default="WEEKLY"),
        sa.Column("status", sa.String(50), nullable=False, server_default="DRAFT"),
        sa.Column("organizer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("facilitator_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("start_time", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("end_time", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="Asia/Kolkata"),
        sa.Column("location_or_link", sa.String(500), nullable=True),
        sa.Column("is_instant", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("recurrence_rule", sa.String(255), nullable=True),
        sa.Column("cancellation_reason", sa.Text, nullable=True),
        sa.Column("reopen_reason", sa.Text, nullable=True),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(f"meeting_type IN {MEETING_TYPES}", name="ck_meetings_meeting_type"),
        sa.CheckConstraint(f"status IN {MEETING_STATUSES}", name="ck_meetings_status"),
    )
    op.create_index("ix_meetings_organization_id", "meetings", ["organization_id"])
    op.create_index("ix_meetings_status", "meetings", ["status"])
    op.create_index("ix_meetings_start_time", "meetings", ["start_time"])

    # 3. Meeting Participants
    op.create_table(
        "meeting_participants",
        op.f("pk_meeting_participants"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("meeting_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="ATTENDEE"),
        sa.Column("attended", sa.Boolean, nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("meeting_id", "user_id", name="uq_meeting_participants_meeting_user"),
    )
    op.create_index("ix_meeting_participants_meeting_id", "meeting_participants", ["meeting_id"])
    op.create_index("ix_meeting_participants_user_id", "meeting_participants", ["user_id"])

    # 4. Meeting Agendas
    op.create_table(
        "meeting_agendas",
        op.f("pk_meeting_agendas"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("meeting_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("presenter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("order_index", sa.Integer, nullable=False, server_default="0"),
        sa.Column("status", sa.String(50), nullable=False, server_default="PENDING"),
        sa.Column("deferred_to_meeting_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetings.id"), nullable=True),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(f"status IN {AGENDA_STATUSES}", name="ck_meeting_agendas_status"),
    )
    op.create_index("ix_meeting_agendas_meeting_id", "meeting_agendas", ["meeting_id"])

    # 5. Meeting Checkins
    op.create_table(
        "meeting_checkins",
        op.f("pk_meeting_checkins"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("meeting_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("confidence_score", sa.Integer, nullable=True),
        sa.Column("important_update", sa.Text, nullable=True),
        sa.Column("immediate_concern", sa.Text, nullable=True),
        sa.Column("support_needed", sa.Text, nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("meeting_id", "user_id", name="uq_meeting_checkins_meeting_user"),
    )

    # 6. Meeting Headlines
    op.create_table(
        "meeting_headlines",
        op.f("pk_meeting_headlines"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("meeting_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("headline_type", sa.String(50), nullable=False, server_default="UPDATE"),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("details", sa.Text, nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # 7. Calendar Events
    op.create_table(
        "calendar_events",
        op.f("pk_calendar_events"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("meeting_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetings.id", ondelete="CASCADE"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False, server_default="LAKSHYA_MEETING"),
        sa.Column("start_time", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("end_time", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="Asia/Kolkata"),
        sa.Column("provider", sa.String(50), nullable=False, server_default="LAKSHYA"),
        sa.Column("external_event_id", sa.String(255), nullable=True),
        sa.Column("external_calendar_id", sa.String(255), nullable=True),
        sa.Column("sync_status", sa.String(50), nullable=False, server_default="NOT_SYNCED"),
        sa.Column("last_synced_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(f"event_type IN {CALENDAR_EVENT_TYPES}", name="ck_calendar_events_type"),
        sa.CheckConstraint(f"sync_status IN {SYNC_STATUSES}", name="ck_calendar_events_sync_status"),
    )
    op.create_index("ix_calendar_events_organization_id", "calendar_events", ["organization_id"])
    op.create_index("ix_calendar_events_user_id", "calendar_events", ["user_id"])
    op.create_index("ix_calendar_events_meeting_id", "calendar_events", ["meeting_id"])
    op.create_index("ix_calendar_events_start_time", "calendar_events", ["start_time"])

    # 8. Calendar Sync Outbox
    op.create_table(
        "calendar_sync_outbox",
        op.f("pk_calendar_sync_outbox"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("payload", postgresql.JSONB, nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="PENDING"),
        sa.Column("attempts", sa.Integer, nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer, nullable=False, server_default="5"),
        sa.Column("last_error", sa.Text, nullable=True),
        sa.Column("next_attempt_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(f"status IN {OUTBOX_STATUSES}", name="ck_calendar_sync_outbox_status"),
    )
    op.create_index("ix_calendar_sync_outbox_status_next_attempt", "calendar_sync_outbox", ["status", "next_attempt_at"])

    # 9. User Calendar Integration
    op.create_table(
        "user_calendar_integrations",
        op.f("pk_user_calendar_integrations"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False, server_default="GOOGLE"),
        sa.Column("encrypted_refresh_token", sa.Text, nullable=False),
        sa.Column("account_email", sa.String(255), nullable=False),
        sa.Column("calendar_id", sa.String(255), nullable=False, server_default="primary"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_sync_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("user_id", "provider", name="uq_user_calendar_integrations_user_provider"),
    )

    # 10. Annual Goals
    op.create_table(
        "annual_goals",
        op.f("pk_annual_goals"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("fy_start_year", sa.Integer, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("purpose", sa.Text, nullable=True),
        sa.Column("expected_outcome", sa.Text, nullable=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("md_sponsor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("target_date", sa.Date, nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="ACTIVE"),
        sa.Column("health_status", sa.String(50), nullable=False, server_default="ON_TRACK"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_annual_goals_organization_id", "annual_goals", ["organization_id"])
    op.create_index("ix_annual_goals_fy_start_year", "annual_goals", ["fy_start_year"])

    # 11. Quarterly Priorities
    op.create_table(
        "quarterly_priorities",
        op.f("pk_quarterly_priorities"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("annual_goal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("annual_goals.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("expected_outcome", sa.Text, nullable=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("proposer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("fy_start_year", sa.Integer, nullable=False),
        sa.Column("quarter", sa.String(10), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="DRAFT"),
        sa.Column("rejection_or_change_reason", sa.Text, nullable=True),
        sa.Column("approved_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("approved_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("source_meeting_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetings.id"), nullable=True),
        sa.Column("source_agenda_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meeting_agendas.id"), nullable=True),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(f"status IN {QUARTERLY_PRIORITY_STATUSES}", name="ck_quarterly_priorities_status"),
    )
    op.create_index("ix_quarterly_priorities_organization_id", "quarterly_priorities", ["organization_id"])
    op.create_index("ix_quarterly_priorities_fy_quarter", "quarterly_priorities", ["fy_start_year", "quarter"])
    op.create_index("ix_quarterly_priorities_status", "quarterly_priorities", ["status"])

    # 12. Monthly Priorities
    op.create_table(
        "monthly_priorities",
        op.f("pk_monthly_priorities"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("quarterly_priority_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quarterly_priorities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("expected_result", sa.Text, nullable=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("target_month", sa.Integer, nullable=False),
        sa.Column("target_year", sa.Integer, nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="ACTIVE"),
        sa.Column("progress_percentage", sa.Integer, nullable=False, server_default="0"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_monthly_priorities_quarterly_priority_id", "monthly_priorities", ["quarterly_priority_id"])

    # 13. Weekly Milestones
    op.create_table(
        "weekly_milestones",
        op.f("pk_weekly_milestones"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("monthly_priority_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("monthly_priorities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("expected_result", sa.Text, nullable=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("week_number", sa.Integer, nullable=False),
        sa.Column("year", sa.Integer, nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="PLANNED"),
        sa.Column("progress_percentage", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_blocked", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("blocker_reason", sa.Text, nullable=True),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_weekly_milestones_monthly_priority_id", "weekly_milestones", ["monthly_priority_id"])

    # 14. O&O Items
    op.create_table(
        "o_and_o_items",
        op.f("pk_o_and_o_items"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("oo_type", sa.String(50), nullable=False, server_default="OBSTACLE"),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("raised_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("assigned_owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("source_department_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("priority", sa.String(50), nullable=False, server_default="MEDIUM"),
        sa.Column("business_impact", sa.Text, nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="OPEN"),
        sa.Column("outcome", sa.String(100), nullable=True),
        sa.Column("resolution_evidence", sa.Text, nullable=True),
        sa.Column("source_meeting_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetings.id"), nullable=True),
        sa.Column("source_agenda_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meeting_agendas.id"), nullable=True),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(f"oo_type IN {OO_TYPES}", name="ck_o_and_o_items_type"),
        sa.CheckConstraint(f"status IN {OO_STATUSES}", name="ck_o_and_o_items_status"),
        sa.CheckConstraint(f"priority IN {OO_PRIORITIES}", name="ck_o_and_o_items_priority"),
    )
    op.create_index("ix_o_and_o_items_organization_id", "o_and_o_items", ["organization_id"])
    op.create_index("ix_o_and_o_items_status", "o_and_o_items", ["status"])
    op.create_index("ix_o_and_o_items_assigned_owner_id", "o_and_o_items", ["assigned_owner_id"])

    # 15. KPI Definitions
    op.create_table(
        "kpi_definitions",
        op.f("pk_kpi_definitions"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("department_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("accountable_leader_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("unit", sa.String(50), nullable=False, server_default="COUNT"),
        sa.Column("measurement_frequency", sa.String(50), nullable=False, server_default="WEEKLY"),
        sa.Column("target_value", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("warning_threshold", sa.Float, nullable=True),
        sa.Column("critical_threshold", sa.Float, nullable=True),
        sa.Column("is_automated", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("data_source_config", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_kpi_definitions_organization_id", "kpi_definitions", ["organization_id"])
    op.create_index("ix_kpi_definitions_department_id", "kpi_definitions", ["department_id"])

    # 16. KPI Values
    op.create_table(
        "kpi_values",
        op.f("pk_kpi_values"),
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("kpi_definition_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("kpi_definitions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actual_value", sa.Float, nullable=False),
        sa.Column("recorded_date", sa.Date, nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("recorded_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("source_meeting_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetings.id"), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_kpi_values_kpi_definition_id", "kpi_values", ["kpi_definition_id"])
    op.create_index("ix_kpi_values_recorded_date", "kpi_values", ["recorded_date"])


def downgrade() -> None:
    op.drop_table("kpi_values")
    op.drop_table("kpi_definitions")
    op.drop_table("o_and_o_items")
    op.drop_table("weekly_milestones")
    op.drop_table("monthly_priorities")
    op.drop_table("quarterly_priorities")
    op.drop_table("annual_goals")
    op.drop_table("user_calendar_integrations")
    op.drop_table("calendar_sync_outbox")
    op.drop_table("calendar_events")
    op.drop_table("meeting_headlines")
    op.drop_table("meeting_checkins")
    op.drop_table("meeting_agendas")
    op.drop_table("meeting_participants")
    op.drop_table("meetings")
