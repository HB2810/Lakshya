from __future__ import annotations
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


WORK_ITEM_STATUSES = ('todo', 'in_progress', 'blocked', 'stuck', 'completed', 'cancelled')
WORK_ITEM_PRIORITIES = ('low', 'medium', 'high', 'urgent')
_STATUSES_SQL = ', '.join(repr(s) for s in WORK_ITEM_STATUSES)
_PRIORITIES_SQL = ', '.join(repr(p) for p in WORK_ITEM_PRIORITIES)


def upgrade() -> None:
    op.create_table(
        'work_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_id', sa.UUID(), nullable=True),
        sa.Column('status', sa.String(length=32), server_default=sa.text("'todo'"), nullable=False),
        sa.Column('priority', sa.String(length=32), server_default=sa.text("'medium'"), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=True),
        sa.Column('owner_name', sa.String(length=200), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=False),
        sa.Column('department_id', sa.UUID(), nullable=True),
        sa.Column('department_name', sa.String(length=200), nullable=True),
        sa.Column('due_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('completed_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('progress_percent', sa.Integer(), server_default='0', nullable=False),
        sa.Column('blocked_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('blocked_reason', sa.Text(), nullable=True),
        sa.Column('blocker_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('raci', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('edc', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('origin_meeting_id', sa.UUID(), nullable=True),
        sa.Column('source_type', sa.String(length=64), server_default=sa.text("'MANUAL'"), nullable=False),
        sa.Column('source_title', sa.String(length=300), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('version', sa.Integer(), server_default='1', nullable=False),
        sa.CheckConstraint(f"status IN ({_STATUSES_SQL})", name="status_allowed"),
        sa.CheckConstraint(f"priority IN ({_PRIORITIES_SQL})", name="priority_allowed"),
        sa.CheckConstraint("length(btrim(title)) > 0", name="title_not_blank"),
        sa.CheckConstraint("progress_percent >= 0 AND progress_percent <= 100", name="progress_range"),
        sa.ForeignKeyConstraint(
            ['organization_id', 'owner_id'],
            ['users.organization_id', 'users.id'],
            name='fk_work_items_owner_same_organization',
            ondelete='SET NULL',
        ),
        sa.ForeignKeyConstraint(
            ['organization_id', 'created_by'],
            ['users.organization_id', 'users.id'],
            name='fk_work_items_creator_same_organization',
            ondelete='RESTRICT',
        ),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name='fk_work_items_organization_id_organizations', ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_work_items')),
        sa.UniqueConstraint('organization_id', 'id', name='uq_work_items_organization_id_id'),
    )
    op.create_index('ix_work_items_organization_id_due_at', 'work_items', ['organization_id', 'due_at'])
    op.create_index('ix_work_items_organization_id_owner_id', 'work_items', ['organization_id', 'owner_id'])
    op.create_index('ix_work_items_organization_id_status', 'work_items', ['organization_id', 'status'])

    op.create_table(
        'work_item_activities',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('work_item_id', sa.UUID(), nullable=False),
        sa.Column('author_id', sa.UUID(), nullable=False),
        sa.Column('author_name', sa.String(length=200), nullable=False),
        sa.Column('activity_type', sa.String(length=64), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('previous_status', sa.String(length=32), nullable=True),
        sa.Column('new_status', sa.String(length=32), nullable=True),
        sa.Column('progress_percent', sa.Integer(), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['work_item_id'], ['work_items.id'], name='fk_work_item_activities_work_item_id_work_items', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_work_item_activities')),
    )
    op.create_index('ix_work_item_activities_work_item_id', 'work_item_activities', ['work_item_id'])

    op.create_table(
        'work_item_escalations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('work_item_id', sa.UUID(), nullable=False),
        sa.Column('level', sa.String(length=64), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('escalated_by_id', sa.UUID(), nullable=False),
        sa.Column('escalated_by_name', sa.String(length=200), nullable=False),
        sa.Column('escalated_to_id', sa.UUID(), nullable=False),
        sa.Column('escalated_to_name', sa.String(length=200), nullable=False),
        sa.Column('status', sa.String(length=32), server_default=sa.text("'PENDING'"), nullable=False),
        sa.Column('resolution_note', sa.Text(), nullable=True),
        sa.Column('resolved_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['work_item_id'], ['work_items.id'], name='fk_work_item_escalations_work_item_id_work_items', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_work_item_escalations')),
    )
    op.create_index('ix_work_item_escalations_escalated_to_id', 'work_item_escalations', ['escalated_to_id'])
    op.create_index('ix_work_item_escalations_work_item_id', 'work_item_escalations', ['work_item_id'])


def downgrade() -> None:
    op.drop_table('work_item_escalations')
    op.drop_table('work_item_activities')
    op.drop_table('work_items')
