"""Enforce append-only audit at the database level.

ADR-005: "The runtime database role cannot update/delete audit rows."
DATABASE.md §8: "Deny UPDATE/DELETE on audit tables to the application runtime
role; use a separate migration/maintenance role."

Two complementary controls:

1. **Trigger (always installed).** ``BEFORE UPDATE OR DELETE`` on
   ``audit_events`` raises an exception. This holds regardless of role, including
   for a superuser and for the API role when a local development setup gives one
   role every privilege — which is precisely when the GRANT-based control below
   would be silently absent.

   A maintenance escape hatch exists for approved retention work: the trigger
   allows the statement when the session sets
   ``lakshya.audit_maintenance = 'on'``. Setting it requires a deliberate
   ``SET`` in the maintenance session and is therefore visible in whatever
   script performs it. The API never sets it.

2. **REVOKE (installed when configured).** When ``LAKSHYA_DB_APP_ROLE`` names the
   API runtime role, ``UPDATE`` and ``DELETE`` on ``audit_events`` are revoked
   from it, so the attempt fails at the privilege layer before the trigger is
   even reached. Left unset in local development, where one role owns everything.

The downgrade drops the trigger and **does not re-grant anything**: see
:func:`downgrade`.

Revision ID: 0002
Revises: 0001
"""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import text

from alembic import op
from app.core.config import get_settings

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_GUARD_FUNCTION = """
CREATE OR REPLACE FUNCTION lakshya_audit_events_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_setting('lakshya.audit_maintenance', true) = 'on' THEN
        RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
    END IF;

    RAISE EXCEPTION
        'audit_events is append-only: % is not permitted', TG_OP
        USING ERRCODE = 'insufficient_privilege',
              HINT = 'Audit events are immutable evidence (ADR-005). Approved '
                     'retention maintenance must set lakshya.audit_maintenance '
                     'explicitly in its own session.';
END;
$$;
"""

_GUARD_TRIGGER = """
CREATE TRIGGER trg_audit_events_append_only
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION lakshya_audit_events_append_only();
"""


def upgrade() -> None:
    op.execute(_GUARD_FUNCTION)
    op.execute(_GUARD_TRIGGER)

    app_role = _configured_app_role()
    if app_role:
        # Identifier is validated by _configured_app_role before interpolation.
        op.execute(text(f'REVOKE UPDATE, DELETE ON TABLE audit_events FROM "{app_role}"'))


def downgrade() -> None:
    """Remove the trigger. **Never re-grant UPDATE/DELETE.**

    An earlier version of this downgrade ran
    ``GRANT UPDATE, DELETE ON audit_events TO <app_role>`` to "undo" the upgrade's
    REVOKE. That was wrong in a way worth spelling out, because it looks
    symmetric:

    * ADR-005 and DATABASE.md §8 say the runtime role must never hold UPDATE or
      DELETE on ``audit_events``. There is no state of the system in which
      granting them is correct — including after a downgrade.
    * REVOKE is not the inverse of GRANT here. The upgrade only removed a
      privilege the role should not have had; it never recorded that the role
      *did* have it. Granting on the way down therefore does not restore a prior
      state, it invents a new and weaker one.
    * A downgrade is most often run during an incident. Silently widening
      privileges on the audit table at exactly that moment is the worst possible
      time to do it.

    Reversing the trigger is the whole job. If a future migration ever needs to
    restore a genuinely recorded prior ACL, it must capture that ACL during
    ``upgrade`` (for example with ``pg_class.relacl``) and replay it here; this
    migration has no such record, so it restores nothing.
    """
    op.execute("DROP TRIGGER IF EXISTS trg_audit_events_append_only ON audit_events")
    op.execute("DROP FUNCTION IF EXISTS lakshya_audit_events_append_only()")


def _configured_app_role() -> str | None:
    """Return the API runtime role name, validated as a safe identifier.

    A role name cannot be bound as a parameter in GRANT/REVOKE, so it is
    interpolated. Restricting it to ``[A-Za-z0-9_]`` before interpolation keeps
    that safe; anything else is rejected rather than quoted and hoped for.
    """
    role = (get_settings().db_app_role or "").strip()
    if not role:
        return None
    if not role.replace("_", "").isalnum():
        raise ValueError(
            f"LAKSHYA_DB_APP_ROLE={role!r} is not a simple identifier. Use only "
            "letters, digits and underscores."
        )
    return role
