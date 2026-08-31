# ADR-006: Stavya Business-Rule Reconciliation

- **Status:** Accepted
- **Date:** 2026-08-17
- **Source:** `docs/business-rules/BUSINESS_RULES_V0.1.md`

## Context

The Phase 1 architecture intentionally marked organizational policy as `REQUIRES BUSINESS DECISION`. Stavya has now approved core V0.1 rules for work creation, accountability, deadlines, priority, completion, meetings, planning, O&O provenance, automation and management visibility. Architecture must distinguish these decisions from the remaining unresolved permission matrix.

## Business rules accepted

- Planning follows `Quarterly Direction -> Monthly Priority -> Weekly Milestone -> Commitment -> Task -> Outcome`.
- A Commitment is a formal organizational result/obligation; a Task is executable work. They remain separate entities.
- An Stavyan may create/assign a Task only to themself and may complete a normal assigned Task.
- A Manager may assign within authorized team scope; a Department Head within authorized department scope; MD Office organization-wide within authorized scope.
- Every active official Commitment requires at least one Responsible and exactly one Accountable; C and I are optional.
- Stavyans cannot directly change official organizational deadlines or independently change organizational priority.
- Formal Commitment completion requires the Accountable person or another authorized approver; child Task completion is insufficient.
- An Stavyan cannot directly reopen a completed formal Commitment.
- Every supported meeting type/scheduling mode may generate proposed work, but discussion/action does not become an official Commitment without required human approval.
- Monthly Priorities may change during the month, with history preserved.
- O&O is an approved execution source for Objectives, Priorities, Milestones, Commitments, Tasks and future Improvement Actions; its full workflow remains out of V0.1.
- Owner, deadline, priority, RACI, status, completion, reopening, escalation, Decision and Commitment changes are auditable with previous/new values where applicable.
- Deterministic automation remains the V0.1 mechanism. Future AI/Execution Intelligence is advisory for high-impact actions.

## Architecture changes

- Added Quarterly Direction and lightweight O&O source provenance to the domain/database architecture.
- Made mandatory Commitment R+A an activation invariant and separated Commitment completion approval from Task completion.
- Added explicit API command boundaries for Task assignment/owner, deadline, priority, Commitment submit/approve/completion/reopen and meeting-derived draft work.
- Replaced generic RBAC assumptions with approved Stavyan, Manager, Department Head and MD Office assignment boundaries.
- Required auditable before/after history for Monthly Priority and other sensitive mutations.
- Extended deterministic automation to model recommendation/action, required approval, execution and audit while retaining outbox idempotency.
- Added a future Execution Intelligence port using existing entity IDs and events, without microservices, AI infrastructure, vector storage or an analytics warehouse.

## Remaining unresolved business decisions

- Exact role/permission matrix and MD versus MD Office authority.
- Authoritative Manager team and Department Head hierarchy definitions.
- Formal deadline-change and priority-change authority.
- Alternate Commitment completion approval and Commitment reopen authority.
- Decision and meeting-action approvers.
- Escalation thresholds, audiences, acknowledgment and resolution authority.
- Sensitive 1:1 and audit visibility; audit/data retention.
- User/role administration and any maker-checker rules.
- Same-person R+A and multiple-Responsible rules.
- EC definition, exact O&O workflow and workload/availability data source.
- Identity provider/MFA, deployment, notification and operational policies already marked in the architecture.

## Assumptions

- "Official Commitment" means a Commitment that has passed approval and activation; drafts/proposals do not yet carry official execution authority.
- "Official organizational deadline" means a deadline on formal organizational work, not a personal reminder on an Stavyan's self-Task.
- Team/department/organization assignment permissions cannot be implemented until authoritative scope membership is available.
- O&O provenance can be stored without implementing O&O stages or Improvement Action lifecycle.
- Accountable may approve Commitment completion; any alternate approver requires a later approved permission.

## Consequences

Implementation must test approved denies and scope boundaries before relying on UI affordances. Commitment and Task endpoints, persistence and audit cannot be merged for convenience. Phase 2 may implement identity/organization/RBAC foundations, but unresolved role grants must not be invented or broadly seeded.

