# LAKSHYA V0.1 RACI Rules

**Status:** Proposed; accountability policy requires approval

## 1. Semantics

- **R — Responsible:** performs or coordinates the work. There may be one or more, subject to policy.
- **A — Accountable:** ultimately answerable for the result and acceptance. The recommended model is exactly one for governed active work.
- **C — Consulted:** input is expected before a relevant decision or result; two-way participation.
- **I — Informed:** receives relevant status/outcome information; no approval implied.

RACI applies to commitments and tasks in V0.1. It does not replace the operational task assignee: the assignee should normally be one of the Responsible users, while Accountable represents result ownership.

## 2. Assignment rules

1. Assignments reference active users in the same organization and a visible commitment/task.
2. A tuple `(target, user, RACI type)` is unique.
3. A user may hold more than one RACI type on the same target only if explicitly allowed. Recommended default: allow `R+A` for small work, reject all other duplicate-role combinations; `REQUIRES BUSINESS DECISION`.
4. Active critical commitments should have exactly one A before activation. Whether every commitment and task requires A is `REQUIRES BUSINESS DECISION`.
5. Every executable active task should have at least one R, and the primary assignee should be R. System validation should propose/require synchronization rather than silently changing RACI.
6. C and I are optional and may be multiple. They must not be used merely to grant broad visibility.
7. Deactivating/transferring a user does not delete history. Active assignments must be reassigned or receive an approved exception.
8. RACI replacement is atomic: validate the complete proposed set before changing any rows.
9. Changes after activation require authorization, reason and audit. Accountable changes may require acknowledgment/approval.
10. Parent RACI does not silently inherit to child tasks. Defaults may be suggested or copied with explicit provenance and review.

## 3. Validation by lifecycle

| Transition | Proposed validation |
|---|---|
| Save draft | Users/target valid; tuple uniqueness |
| Activate commitment | accountability rule satisfied; at least one Responsible where execution begins |
| Ready/start task | assignee exists and is Responsible; required Accountable exists |
| Change assignee | new assignee valid; synchronize Responsible only through explicit approved operation |
| Complete task | actor has completion authority; no invalid active assignments; outcome supplied per policy |
| Fulfill commitment | Accountable or authorized approver confirms outcome per policy |

Backend enforcement is mandatory. Database constraints enforce target/tuple integrity; the application transaction enforces conditional counts and transition rules.

## 4. Permission implications

- R: read work, update permitted progress, report Stuck/Need; completion authority is a separate decision.
- A: read work and receive accountability notifications; approval, reassignment and deadline authority are not automatically implied.
- C: read relevant context and provide input through approved mechanisms; no mutation authority by RACI alone.
- I: read a deliberately limited view and receive updates; no mutation authority.
- RACI management requires `raci.manage` in scope. A user cannot add participants merely to bypass normal visibility policy.

Sensitive linked content (1:1 notes, audit details, other departments) remains separately authorized even when RACI grants access to the work item.

## 5. Notifications and automation

RACI changes emit a domain event and audit event. Notification rules can target R/A/C/I differently, but notification delivery must not define responsibility. Automation may detect missing/invalid RACI and request correction; it may not silently choose or change people. Future AI may suggest RACI only through `recommendation -> human approval -> system action`.

## 6. Unresolved business decisions

- `REQUIRES BUSINESS DECISION`: which commitment/task classifications require exactly one A.
- `REQUIRES BUSINESS DECISION`: whether one person may be both R and A, and in which cases.
- `REQUIRES BUSINESS DECISION`: whether multiple R users are permitted and how primary assignee is selected.
- `REQUIRES BUSINESS DECISION`: who may assign/change each RACI type and whether acceptance is required.
- `REQUIRES BUSINESS DECISION`: whether Accountable approves completion/fulfillment.
- `REQUIRES BUSINESS DECISION`: transfer/delegation and out-of-office behavior.
- `REQUIRES BUSINESS DECISION`: notification obligations for C and I.
- `REQUIRES BUSINESS DECISION`: whether cross-department RACI requires Department Head approval.

