# LAKSHYA V0.1 RACI Rules

**Status:** Reconciled; mandatory official-Commitment accountability approved

## 1. Semantics

- **R — Responsible:** performs or coordinates the work. There may be one or more, subject to policy.
- **A — Accountable:** ultimately answerable for the result and acceptance. Every official Commitment has exactly one A.
- **C — Consulted:** input is expected before a relevant decision or result; two-way participation.
- **I — Informed:** receives relevant status/outcome information; no approval implied.

RACI applies to commitments and tasks in V0.1. It does not replace the operational task assignee: the assignee should normally be one of the Responsible users, while Accountable represents result ownership.

## 2. Assignment rules

1. Assignments reference active users in the same organization and a visible commitment/task.
2. A tuple `(target, user, RACI type)` is unique.
3. Whether a user may hold both R and A on one target remains `REQUIRES BUSINESS DECISION`; other duplicate-role combinations are rejected unless later approved.
4. Every official Commitment must have at least one R and exactly one A before activation.
5. Every executable active Task should have at least one R, and the primary assignee should be R. System validation requires explicit synchronization rather than silently changing RACI.
6. C and I are optional and may be multiple. They must not be used merely to grant broad visibility.
7. Deactivating/transferring a user does not delete history. Active assignments must be reassigned or receive an approved exception.
8. RACI replacement is atomic: validate the complete proposed set before changing any rows.
9. Changes after activation require authorization and audit with previous/new values. Required reason/acknowledgment policy remains `REQUIRES BUSINESS DECISION`.
10. Parent RACI does not silently inherit to child tasks. Defaults may be suggested or copied with explicit provenance and review.

## 3. Validation by lifecycle

| Transition | Proposed validation |
|---|---|
| Save draft | Users/target valid; tuple uniqueness |
| Activate official Commitment | at least one R and exactly one A; source and approval valid |
| Ready/start task | assignee exists and is Responsible; required Accountable exists |
| Change assignee | new assignee valid; synchronize Responsible only through explicit approved operation |
| Complete normal Task | assigned Stavyan or authorized actor; no invalid active assignments; outcome supplied per policy |
| Complete formal Commitment | Accountable or authorized alternate approver confirms outcome; child Task completion alone is insufficient |
| Reopen formal Commitment | Stavyan denied; explicit authorized transition and audit required |

Backend enforcement is mandatory. Database constraints enforce target/tuple integrity; the application transaction enforces conditional counts and transition rules.

## 4. Permission implications

- R: read work, update permitted progress, report Stuck/Need; completion authority is a separate decision.
- A: read work, receive accountability notifications and approve formal Commitment completion. Reassignment, deadline, priority and reopen authority are not automatically implied.
- C: read relevant context and provide input through approved mechanisms; no mutation authority by RACI alone.
- I: read a deliberately limited view and receive updates; no mutation authority.
- RACI management requires `raci.manage` in scope. A user cannot add participants merely to bypass normal visibility policy.

Sensitive linked content (1:1 notes, audit details, other departments) remains separately authorized even when RACI grants access to the work item.

## 5. Notifications and automation

RACI changes emit a domain event and audit event. Notification rules can target R/A/C/I differently, but notification delivery must not define responsibility. Automation may detect missing/invalid RACI and request correction; it may not silently choose or change people. Future AI may suggest RACI only through `recommendation -> human approval -> system action`.

## 6. Unresolved business decisions

- `REQUIRES BUSINESS DECISION`: whether one person may be both R and A, and in which cases.
- `REQUIRES BUSINESS DECISION`: whether multiple R users are permitted and how primary assignee is selected.
- `REQUIRES BUSINESS DECISION`: who may assign/change each RACI type and whether acceptance is required.
- `REQUIRES BUSINESS DECISION`: which roles besides the Accountable user may approve Commitment completion.
- `REQUIRES BUSINESS DECISION`: transfer/delegation and out-of-office behavior.
- `REQUIRES BUSINESS DECISION`: notification obligations for C and I.
- `REQUIRES BUSINESS DECISION`: whether cross-department RACI requires Department Head approval.
