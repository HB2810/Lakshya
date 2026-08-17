# ADR-003: RBAC with Scoped Resource Authorization

- **Status:** Proposed
- **Date:** 2026-08-17

## Context

LAKSHYA has organization-wide, department, team, participant, RACI and personal views. Pure persona checks cannot safely express these boundaries, while a general policy engine would be premature.

## Decision

Use database-backed RBAC permissions and role assignments combined with organization/department scope and resource relationships. Named personas are configurable role templates. Stable permission keys map to application commands. All backend use cases and list queries enforce scope; frontend visibility is non-authoritative.

Keep sensitive field/transition capabilities separate, including assignment, owner, deadline, priority, RACI, decision approval, escalation resolution, audit export and role administration. Deny by default and prevent grantors from delegating beyond their own authority.

## Alternatives

- Hard-coded `if role == ...`: rejected because roles and policy will evolve and cross-department relationships do not fit.
- RBAC alone without resource scope: rejected because it leaks department/meeting/task data.
- External ABAC/policy engine: deferred until policy complexity or multiple services justify its operational cost.
- PostgreSQL RLS as the sole control: rejected; it cannot replace domain transition authorization. It may become defense-in-depth later.

## Consequences

Authorization must be designed into repository queries and thoroughly matrix-tested. Role/scope policy requires Stavya approval before seeds are finalized. Permission caching needs prompt invalidation. Detailed policy is in `docs/business-rules/RBAC.md`.

