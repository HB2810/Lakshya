"""LAKSHYA domain modules.

ARCHITECTURE.md §3 divides the backend by business capability. Phase 2
implements only the identity/access foundation:

* ``organization`` — organizations, departments, department memberships.
* ``identity``     — users, password credentials, browser sessions.
* ``access``       — permissions, roles, role permissions, role assignments.
* ``audit``        — append-only audit events.

Strategy, meetings, execution, attention, engagement, automation, reporting and
integrations are later phases. Modules must not bypass another module's service
layer to mutate its records (ARCHITECTURE.md §3).
"""
