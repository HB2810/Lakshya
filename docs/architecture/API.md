# LAKSHYA V0.1 API Architecture

**Status:** Proposed for review  
**Style:** JSON REST API under `/api/v1`

## 1. Conventions

- Resources use plural nouns; actions are used only for domain transitions (`:approve`, `:acknowledge`).
- JSON uses `snake_case` consistently with Python. Dates/times use ISO 8601; timestamps include offsets and are stored in UTC.
- UUIDs are opaque. Clients never choose organization scope from an untrusted body when it can be derived from the session.
- Create returns `201`; reads/updates return `200`; delete/archive may return `204`; async accepted work returns `202` only when actually queued.
- Errors use RFC 9457 `application/problem+json` with `type`, `title`, `status`, `detail`, `instance`, `code`, `field_errors`, and `correlation_id` as applicable.
- Lists use cursor pagination with `limit` and stable sort. Filters are allow-listed. Authorization scope is applied before filter, count and pagination.
- Mutable resources expose an `ETag`/version. Update requests use `If-Match`; stale writes return `412`.
- Support an `Idempotency-Key` on creation/transition endpoints likely to be retried. Store the key scoped to actor, route and organization.
- OpenAPI is generated from FastAPI, reviewed, and used as the frontend contract. Never expose persistence models directly.

## 2. Security and validation pipeline

Each protected request follows: authenticate session, verify CSRF for unsafe methods, resolve organization, load role/scope grants, query the resource within scope, check action and transition policy, validate invariants, mutate, audit/outbox, commit.

Return `401` for no valid authentication, `403` for known but disallowed actions, and `404` when revealing resource existence would leak inaccessible data. Rate-limit authentication and high-cost/export endpoints. All server-side failures include a correlation ID without exposing stack traces.

## 3. Endpoint catalog

The permission names below are capabilities; role grants remain subject to [RBAC.md](../business-rules/RBAC.md).

### Authentication

| Method and route | Purpose | Request / response | Authorization and validation |
|---|---|---|---|
| `POST /api/v1/auth/login` | Create browser session | credentials + CSRF bootstrap; returns current-user summary | anonymous; rate limited; generic failure message |
| `POST /api/v1/auth/logout` | Revoke current session | no body; `204` | authenticated + CSRF |
| `GET /api/v1/auth/me` | Current identity, roles and effective capabilities | user/session summary | authenticated |
| `POST /api/v1/auth/password/change` | Change own password and revoke other sessions | current/new password; `204` | authenticated; password policy and reauthentication |
| `POST /api/v1/auth/password/reset-request` | Begin reset | identifier; always neutral response | anonymous; rate limited; delivery policy required |
| `POST /api/v1/auth/password/reset` | Consume single-use reset token | token/new password; `204` | token valid, unexpired and single-use |

SSO/OIDC routes are added only after the identity-provider decision.

### Users, roles and departments

| Method and route | Purpose | Request / response | Permission / validation |
|---|---|---|---|
| `GET /users`, `GET /users/{id}` | Scoped directory | summaries/detail | `user.read`; department visibility |
| `POST /users` | Provision user | profile, memberships; user | `user.create`; unique email and valid departments |
| `PATCH /users/{id}` | Change permitted profile/state fields | patch + version; user | `user.update`; privileged changes separated/audited |
| `GET /departments`, `GET /departments/{id}` | Read scoped units | list/detail | `department.read` |
| `POST /departments` | Create department | name/code/parent; department | `department.create`; parent same organization |
| `PATCH /departments/{id}` | Update/archive department | patch + version | `department.update`; prevent hierarchy cycle |
| `GET /roles`, `GET /permissions` | Inspect access catalog | scoped roles/stable keys | `role.read` |
| `POST /role-assignments` | Grant scoped role | user, role, scope, effective dates | `role.assign`; no privilege escalation |
| `DELETE /role-assignments/{id}` | End assignment | reason; `204` | `role.assign`; preserve history/audit |

### Objectives, priorities and milestones

| Method and route | Purpose | Permission / important validation |
|---|---|---|
| `GET/POST /objectives` | List/create objectives | `objective.read/create`; valid owner scope |
| `GET/PATCH /objectives/{id}` | Read/update objective | `objective.read/update`; transition/version checks |
| `GET/POST /priorities` | List/create monthly priorities | `priority.read/create`; valid month and objective scope |
| `GET/PATCH /priorities/{id}` | Read/update priority | `priority.read/update`; priority/deadline changes reasoned and audited |
| `POST /priorities/{id}:activate` | Activate reviewed priority | `priority.activate`; required fields/RACI policy |
| `GET/POST /milestones` | List/create weekly milestones | `milestone.read/create`; priority visible; week bounds valid |
| `GET/PATCH /milestones/{id}` | Read/update milestone | `milestone.read/update`; parent/time/version checks |
| `POST /milestones/{id}:complete` | Record completion/outcome | `milestone.complete`; completion policy |

Create requests contain business fields and relationship IDs; responses contain IDs, lifecycle, relationship summaries, timestamps, version and permitted `available_actions` as a convenience only.

### Meetings and decisions

| Method and route | Purpose | Permission / important validation |
|---|---|---|
| `GET/POST /meetings` | Scoped list/create | `meeting.read/create`; valid type/schedule/organizer |
| `GET/PATCH /meetings/{id}` | Detail/update agenda or metadata | `meeting.read/update`; lifecycle and participant access |
| `POST /meetings/{id}/participants` | Add participant | `meeting.participant.manage`; visible active user; unique member |
| `DELETE /meetings/{id}/participants/{user_id}` | Remove participant | same permission; preserve attendance history after completion |
| `POST /meetings/{id}:complete` | Complete official meeting | `meeting.complete`; required record checks |
| `GET/POST /meetings/{id}/decisions` | List/record decisions | `decision.read/create`; meeting visibility and state |
| `GET/PATCH /decisions/{id}` | Read/edit decision | `decision.read/update`; approved edits restricted and versioned |
| `POST /decisions/{id}:submit` | Request approval | `decision.submit`; completeness checks |
| `POST /decisions/{id}:approve` | Approve and emit conversion event | `decision.approve`; approver policy; idempotent |
| `POST /decisions/{id}:supersede` | Preserve and replace decision | `decision.supersede`; reason and replacement required |
| `POST /decisions/{id}/commitments` | Create linked commitment | `commitment.create`; decision approved unless exception authorized |

### Commitments, tasks, RACI and dependencies

| Method and route | Purpose | Permission / important validation |
|---|---|---|
| `GET/POST /commitments` | Scoped list/create | `commitment.read/create`; valid source and ownership |
| `GET/PATCH /commitments/{id}` | Read/update commitment | `commitment.read/update`; owner/deadline changes need specific capability/reason |
| `POST /commitments/{id}:fulfill` | Record outcome | `commitment.fulfill`; outcome/accountability checks |
| `GET/POST /tasks` | Scoped list/create task | `task.read/create`; source visible; assignee/scope valid |
| `GET/PATCH /tasks/{id}` | Read/update allowed fields | field-level capabilities; `If-Match`; transition checks |
| `POST /tasks/{id}:start` | Start work | `task.start`; assignee/authorized manager and dependencies policy |
| `POST /tasks/{id}:complete` | Complete with outcome | `task.complete`; blockers and evidence policy |
| `POST /tasks/{id}:reopen` | Reopen completed task | `task.reopen`; reason required |
| `POST /tasks/{id}:cancel` | Cancel task | `task.cancel`; reason and downstream checks |
| `GET/PUT /tasks/{id}/raci` | Read/replace complete RACI set atomically | `raci.read/manage`; users visible; uniqueness/accountability rules |
| `GET/PUT /commitments/{id}/raci` | Read/replace commitment RACI | same; commitment policy |
| `GET/POST /tasks/{id}/dependencies` | Read/add prerequisite | `dependency.read/manage`; same organization, no self/duplicate/cycle |
| `DELETE /tasks/{id}/dependencies/{dependency_id}` | Resolve/remove edge | `dependency.manage`; reason/history retained |

`PATCH /tasks/{id}` must not provide a generic bypass for owner, deadline, priority or status. These fields require named application commands/capabilities even if transported through PATCH.

### Stuck/Need and escalation

| Method and route | Purpose | Request / response | Permission / validation |
|---|---|---|---|
| `GET/POST /tasks/{id}/stuck-items` | Report/list needs | reason, need, provider, required_by, impact | `stuck.read/create`; task visible |
| `GET/PATCH /stuck-items/{id}` | Detail/update active need | editable need fields + version | `stuck.read/update`; lifecycle restrictions |
| `POST /stuck-items/{id}:resolve` | Record resolution | resolution and evidence | `stuck.resolve`; reason/evidence rules |
| `GET/POST /escalations` | List/manual escalation | target, level, reason, impact | `escalation.read/create`; allowed target/scope; no duplicate open case |
| `GET /escalations/{id}` | Escalation context/timeline | case and events | `escalation.read`; audience/scope |
| `POST /escalations/{id}:acknowledge` | Acknowledge attention | note | `escalation.acknowledge`; actor is allowed recipient |
| `POST /escalations/{id}:change-level` | Change level | level/reason | `escalation.level.change`; policy bounds |
| `POST /escalations/{id}:resolve` | Resolve case | resolution/outcome | `escalation.resolve`; resolution authority |
| `GET/POST /automation/escalation-rules` | Inspect/create draft policy | versioned condition/action | restricted MD Office admin; approval separation |
| `POST /automation/escalation-rules/{id}:activate` | Activate exact version | approval metadata | `automation.rule.activate`; no retroactive mutation |

Thresholds and role grants are not encoded in the API contract.

### Notifications, dashboards and audit

| Method and route | Purpose | Permission / validation |
|---|---|---|
| `GET /notifications` | Current user's inbox | authenticated; recipient fixed to self unless admin capability |
| `POST /notifications/{id}:read` | Mark read | recipient only; idempotent |
| `POST /notifications:read-all` | Mark visible set read | recipient only; bounded/filter semantics |
| `GET/PATCH /notification-preferences` | Read/update preferences | self; mandatory classes cannot be disabled |
| `GET /dashboards/md` | Exception/decision summary | `dashboard.md.read`; organization scope; no raw unauthorized drill-down |
| `GET /dashboards/department/{id}` | Department execution summary | `dashboard.department.read`; department scope |
| `GET /dashboards/me` | Personal work/attention summary | authenticated; relationship scoped |
| `GET /audit-events` | Filtered audit search | `audit.read`; strict scope, limits, sensitive redaction |
| `GET /audit-events/{id}` | Audit detail | `audit.read`; access itself audited |
| `POST /audit-exports` | Create bounded export job | `audit.export`; rate limited, approved retention/delivery |

Dashboard response fields must have written definitions (denominator, timezone, inclusion rules and freshness). V0.1 should compute summaries from transactional data; caches/read models remain an optimization.

## 4. Representative contracts

### Create task

```json
{
  "title": "Fix OPD dashboard waiting-time calculation",
  "description": "Correct calculation and verify against source data.",
  "commitment_id": "uuid-or-null",
  "milestone_id": "uuid-or-null",
  "assignee_user_id": "uuid",
  "due_at": "2026-08-21T17:00:00+05:30",
  "priority": "high",
  "raci": [
    {"user_id": "uuid", "type": "R"},
    {"user_id": "uuid", "type": "A"}
  ]
}
```

The API validates relationship visibility, same-organization membership, assignment authority, RACI uniqueness/accountability, deadline policy and idempotency. It returns `201` with the canonical task, version, links and authorized available actions.

### Resolve escalation

```json
{
  "resolution": "Required approval received and work resumed.",
  "outcome": "Blocker cleared",
  "reason_code": "condition_resolved"
}
```

Resolution requires an open/acknowledged case, resolution capability within scope and a reason. It appends an escalation event, audit event and notification event atomically.

## 5. Versioning and compatibility

`/api/v1` is the compatibility boundary. Prefer additive changes. Deprecations are documented and measured before removal. Domain-event contracts carry their own schema version because asynchronous consumers evolve independently. Do not version merely to correct undocumented behavior; define behavior first through tests and OpenAPI examples.

## 6. Unresolved API decisions

- `REQUIRES BUSINESS DECISION`: identity provider, self-service reset and MFA requirements.
- `REQUIRES BUSINESS DECISION`: exact role grants and cross-department visibility.
- `REQUIRES BUSINESS DECISION`: decision approval and commitment conversion workflow.
- `REQUIRES BUSINESS DECISION`: required reasons/evidence for each sensitive transition.
- `REQUIRES BUSINESS DECISION`: dashboard metric definitions and freshness.
- `REQUIRES BUSINESS DECISION`: external notification channels and mandatory notification classes.

