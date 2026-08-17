# LAKSHYA V0.1 RBAC Architecture

**Status:** Proposed model; organizational grants require approval

## 1. Model

Authorization combines role permissions, scope and resource relationships. Named roles are configurable templates, not code branches.

```text
Role permission + organization/department scope + record relationship + valid transition = allowed
```

Scopes are `self`, `related` (assignee, RACI member, meeting participant), `department`, and `organization`. A broader scope does not grant a missing action. Deny by default. Backend use cases and scoped SQL queries are authoritative; frontend controls are usability only.

Permission families include `*.read`, `*.create`, `*.update`, `*.assign`, `*.deadline.change`, `*.priority.change`, `*.complete`, `*.reopen`, plus explicit approval, escalation, audit and access-administration capabilities.

## 2. Proposed persona intent

These are safe starting assumptions, not final Stavya policy:

- **MD:** organization-level management visibility, decisions and high-level escalation authority; not automatically a system administrator.
- **MD Office:** organization-wide coordination capabilities for approved management workflows; access administration and audit export remain separately granted.
- **Department Head:** management capabilities within owned department and approved cross-department relationships.
- **Manager:** team execution capabilities within assigned department/team scope.
- **Employee:** own/related work participation, progress, blocker reporting and limited meeting access.

Whether any persona receives a capability is `REQUIRES BUSINESS DECISION` until the matrix is approved.

## 3. Decision matrix

Legend: `P` proposed baseline, `R` relationship/scope-limited, `—` not proposed. Every row marked TBD requires business approval before seeding roles.

| Capability | MD | MD Office | Dept Head | Manager | Employee | Decision status |
|---|---:|---:|---:|---:|---:|---|
| View organization exception dashboard | P | P | — | — | — | `REQUIRES BUSINESS DECISION` |
| View department dashboard | P | P | R | R | — | `REQUIRES BUSINESS DECISION` |
| View own/related tasks | R | R | R | R | R | Proposed |
| View all organization tasks | P | P | — | — | — | `REQUIRES BUSINESS DECISION` |
| View other departments | P | P | R | — | — | `REQUIRES BUSINESS DECISION` |
| Create standalone task | R | P | R | R | R | `REQUIRES BUSINESS DECISION` |
| Assign task to self | R | P | R | R | R | `REQUIRES BUSINESS DECISION` |
| Assign task to another user | P | P | R | R | — | `REQUIRES BUSINESS DECISION` |
| Change owner | P | P | R | R | — | `REQUIRES BUSINESS DECISION` |
| Change deadline | P | P | R | R | — | `REQUIRES BUSINESS DECISION` |
| Change execution priority | P | P | R | R | — | `REQUIRES BUSINESS DECISION` |
| Update own progress | R | R | R | R | R | Proposed |
| Complete assigned task | R | R | R | R | R | `REQUIRES BUSINESS DECISION` |
| Reopen/cancel task | P | P | R | R | — | `REQUIRES BUSINESS DECISION` |
| Create monthly priority | P | P | R | — | — | `REQUIRES BUSINESS DECISION` |
| Activate/change monthly priority | P | P | R | — | — | `REQUIRES BUSINESS DECISION` |
| Create meeting | P | P | R | R | R | `REQUIRES BUSINESS DECISION` |
| Record draft decision | P | P | R | R | R | `REQUIRES BUSINESS DECISION` |
| Approve/supersede decision | P | P | R | — | — | `REQUIRES BUSINESS DECISION` |
| Manage RACI | P | P | R | R | — | `REQUIRES BUSINESS DECISION` |
| Report Stuck/Need | R | R | R | R | R | Proposed for visible work |
| Resolve Stuck/Need | R | R | R | R | R | `REQUIRES BUSINESS DECISION` |
| Create manual escalation | P | P | R | R | R | `REQUIRES BUSINESS DECISION` |
| Acknowledge escalation | R | R | R | R | R | Proposed for named audience |
| Resolve/change escalation level | P | P | R | — | — | `REQUIRES BUSINESS DECISION` |
| Configure/activate automation rules | — | P | — | — | — | `REQUIRES BUSINESS DECISION`; separate approval recommended |
| View scoped audit trail | P | P | R | — | — | `REQUIRES BUSINESS DECISION` |
| Export organization audit data | — | R | — | — | — | `REQUIRES BUSINESS DECISION` |
| Manage users and role grants | — | R | — | — | — | `REQUIRES BUSINESS DECISION`; dedicated admin recommended |

`P` is not approval. Implementation must seed only the matrix accepted by Stavya.

## 4. Field and transition controls

- Task update is not one broad permission. Title/description, progress, owner, deadline, priority, status, completion, reopen and cancellation are distinct commands.
- Owner, deadline, priority, RACI, approved decision and escalation changes are always audited; require a reason where policy approves.
- A user cannot grant a permission or scope they do not possess. Privileged role changes should require recent authentication and optionally dual approval.
- Department Head/Manager authority applies only to defined managed scope; hierarchy inference requires an authoritative reporting structure.
- Meeting participation grants access to the meeting context, not automatic access to every linked organizational record.
- Being Consulted or Informed usually grants read access to the relevant work item, not mutation authority. Responsible does not automatically grant reassignment or priority authority.
- Organization-wide dashboard permission does not automatically expose sensitive 1:1 meeting notes. Meeting-content sensitivity classification is `REQUIRES BUSINESS DECISION`.

## 5. Server-side enforcement

Each request resolves effective permission assignments and applies organization/department/resource predicates in the database query. Never load all rows and filter in application memory. Cache permission catalogs cautiously; role assignment changes invalidate sessions or authorization cache promptly.

Tests must cover positive and negative cases across role, organization, department, relationship, lifecycle and field transition. Include identifier-substitution tests to prevent insecure direct object reference.

## 6. Business decisions required before implementation

1. Who administers users, roles and permissions, and is MD Office administration separate from coordination?
2. Can MD and MD Office read all task details, 1:1 records and employee remarks, or only summaries/exceptions?
3. What defines a Manager's team and a Department Head's departments?
4. May employees create/assign tasks or only accept work and report progress?
5. Who may change owners, deadlines and priorities, and when is assignee consent required?
6. Who approves decisions, priorities, commitment completion and task reopen/cancellation?
7. Who may manually escalate, at what initial level, and who resolves each level?
8. Which audit fields are visible to operational managers and who may export them?
9. Are any actions subject to maker-checker separation or recent reauthentication?
10. How are temporary delegates and acting roles represented?

