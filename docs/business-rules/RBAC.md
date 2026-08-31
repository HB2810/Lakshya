# LAKSHYA V0.1 RBAC Architecture

**Status:** Partially approved; Stavya work-creation boundaries incorporated

## 1. Model

Authorization combines role permissions, scope and resource relationships. Named roles are configurable templates, not code branches.

```text
Role permission + organization/department scope + record relationship + valid transition = allowed
```

Scopes are `self`, `related` (assignee, RACI member, meeting participant), `department`, and `organization`. A broader scope does not grant a missing action. Deny by default. Backend use cases and scoped SQL queries are authoritative; frontend controls are usability only.

Permission families include `*.read`, `*.create`, `*.update`, `*.assign`, `*.deadline.change`, `*.priority.change`, `*.complete`, `*.reopen`, plus explicit approval, escalation, audit and access-administration capabilities.

## 2. Persona intent

- **MD:** organization-level management visibility, decisions and high-level escalation authority; not automatically a system administrator.
- **MD Office:** may create and assign work organization-wide within authorized scope; access administration and audit export remain separately unresolved.
- **Department Head:** may assign work within authorized department scope.
- **Manager:** may assign work within authorized team scope.
- **Stavyan:** may create/assign a Task only to themself and complete a normal assigned Task. They cannot assign others, directly change official deadlines, independently change organizational priority, complete a formal Commitment without Accountable/authorized approval, or directly reopen a completed formal Commitment.

The exact permission matrix remains unresolved beyond these approved boundaries.

## 3. Decision matrix

Legend: `A` approved, `S` approved within stated scope, `—` explicitly denied, `TBD` unresolved. Approved cells still require server-side relationship/scope validation.

| Capability | MD | MD Office | Dept Head | Manager | Stavyan | Decision status |
|---|---:|---:|---:|---:|---:|---|
| View organization exception dashboard | TBD | TBD | — | — | — | `REQUIRES BUSINESS DECISION` |
| View department dashboard | TBD | TBD | TBD | TBD | — | `REQUIRES BUSINESS DECISION` |
| View own/related tasks | TBD | TBD | TBD | TBD | TBD | `REQUIRES BUSINESS DECISION` visibility matrix |
| View all organization tasks | TBD | TBD | — | — | — | `REQUIRES BUSINESS DECISION` |
| View other departments | TBD | TBD | TBD | — | — | `REQUIRES BUSINESS DECISION` |
| Create normal Task for self | TBD | S | S | S | A | Stavyan self-task approved; other roles by assignment scope |
| Assign Task to another user | TBD | S organization | S department | S team | — | Approved scope boundaries; hierarchy source unresolved |
| Change Task owner | TBD | S organization | S department | S team | — | Same approved assignment boundaries |
| Change official deadline | TBD | TBD | TBD | TBD | — | Stavyan denial approved; formal authority unresolved |
| Change organizational priority | TBD | TBD | TBD | TBD | — | Authorized management only; exact grants unresolved |
| Update own Task progress | TBD | TBD | TBD | TBD | TBD | `REQUIRES BUSINESS DECISION` |
| Complete assigned normal Task | TBD | TBD | TBD | TBD | A | Stavyan completion approved |
| Approve formal Commitment completion | TBD | TBD | TBD | TBD | S only if Accountable | Accountable or authorized approver; alternate authority unresolved |
| Reopen completed formal Commitment | TBD | TBD | TBD | TBD | — | Stavyan denial approved; authority unresolved |
| Create/approve official Commitment | TBD | TBD | TBD | TBD | — | `REQUIRES BUSINESS DECISION` |
| Create/change Monthly Priority | TBD | TBD | TBD | — | — | Authorized management only; exact grants unresolved |
| Create meeting / record draft Decision | TBD | TBD | TBD | TBD | TBD | `REQUIRES BUSINESS DECISION` |
| Approve Decision/meeting work | TBD | TBD | TBD | TBD | — | Human approval required; exact grants unresolved |
| Manage RACI | TBD | TBD | TBD | TBD | — | `REQUIRES BUSINESS DECISION`; mandatory R+A always enforced |
| Report Stuck/Need | TBD | TBD | TBD | TBD | TBD | `REQUIRES BUSINESS DECISION` for visible work |
| Create/resolve escalation | TBD | TBD | TBD | TBD | TBD | `REQUIRES BUSINESS DECISION` |
| Configure/activate automation rules | TBD | TBD | — | — | — | `REQUIRES BUSINESS DECISION` |
| View/export audit | TBD | TBD | TBD | — | — | `REQUIRES BUSINESS DECISION` |
| Manage users and role grants | TBD | TBD | — | — | — | `REQUIRES BUSINESS DECISION` |

## 4. Field and transition controls

- Task update is not one broad permission. Title/description, progress, owner, deadline, priority, status, completion, reopen and cancellation are distinct commands.
- Owner, deadline, priority, RACI, status, completion, reopening, approved Decision, Commitment and escalation changes are always audited with previous/new values where applicable.
- Formal Commitment activation requires at least one R and exactly one A. Completion requires the Accountable user or another authorized approver; an Stavyan cannot reopen a completed Commitment directly.
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
2. Can MD and MD Office read all task details, 1:1 records and stavyan remarks, or only summaries/exceptions?
3. What defines a Manager's team and a Department Head's departments?
4. Which users may create/approve official Commitments and approve meeting-derived work?
5. Which management roles may change official deadlines and organizational priorities, and when is assignee consent required?
6. Who is the alternate Commitment completion approver, and who may reopen/cancel formal Commitments or Tasks?
7. Who may manually escalate, at what initial level, and who resolves each level?
8. Which audit fields are visible to operational managers and who may export them?
9. Are any actions subject to maker-checker separation or recent reauthentication?
10. How are temporary delegates and acting roles represented?
