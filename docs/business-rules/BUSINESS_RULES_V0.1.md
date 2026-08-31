# LAKSHYA V0.1 — Stavya Business Rules

**Status:** Approved where stated; unresolved items remain explicitly marked
**Authority:** Primary source for Stavya-specific V0.1 business rules

---

# 1. Core Execution Model

LAKSHYA must preserve these distinct execution chains:

```text
Quarterly Direction
→ Monthly Priority
→ Weekly Milestone
→ Commitment
→ Task
→ Outcome
```

```text
Meeting
→ Decision
→ Commitment
→ Task
```

```text
O&O
→ Objective / Priority / Milestone / Commitment / Task / Improvement Action
```

```text
Stuck / Need
→ Escalation
→ Resolution
```

These concepts must remain traceable and must not be collapsed into one generic task record.

---

# 2. Quarterly, Monthly and Weekly Planning

Quarterly Direction provides planning context for Monthly Priorities.

Monthly Priorities define the organization's focus for a month. They may change during the month, but every change must preserve history and be auditable.

Weekly Milestones define measurable progress toward a Monthly Priority.

Commitments define the organizational result or obligation accepted against that planning context. Tasks define the executable work used to deliver a Commitment.

---

# 3. Commitment

A Commitment is a formal organizational result or obligation. It is not a task.

Every official Commitment requires at least one Responsible assignment (R) and exactly one Accountable assignment (A). Consulted (C) and Informed (I) assignments are optional.

A Commitment may have multiple Tasks. Completing every Task does not automatically complete the Commitment. Formal Commitment completion requires approval by the Accountable person or another authorized approver.

---

# 4. Task

A Task is executable work. It may support a Commitment or exist as an authorized standalone operational task.

A normal Task may be completed by the assigned Stavyan. Task completion and any later reopening must be auditable.

Task ownership, deadline and priority are separate controlled attributes and cannot be changed through a generic update that bypasses authorization.

---

# 5. Stavyan Work Creation

An Stavyan may create a Task for themself. An Stavyan cannot assign a Task to another Stavyan.

Creating a self-task does not authorize the Stavyan to create or approve an official Commitment, change an organizational priority, or establish an official organizational deadline outside approved policy.

---

# 6. Manager Work Assignment

A Manager may assign work within their authorized team scope.

The definition and authoritative data source for a Manager's team remain `REQUIRES BUSINESS DECISION`.

---

# 7. Department Head Work Assignment

A Department Head may assign work within their authorized department scope.

The exact department hierarchy and any authority across multiple departments remain `REQUIRES BUSINESS DECISION`.

---

# 8. MD Office Work Assignment

MD Office may create and assign work organization-wide within its authorized scope.

The exact boundary between MD and MD Office authority remains `REQUIRES BUSINESS DECISION`.

---

# 9. RACI

R means Responsible, A means Accountable, C means Consulted, and I means Informed.

Every official Commitment must have at least one R and exactly one A before it becomes active. C and I remain optional.

RACI changes must be authorized and auditable. RACI must be enforced by the backend and represented as a first-class relationship, not unstructured text or JSON.

Whether the same person may hold both R and A, and the rules for multiple Responsible people, remain `REQUIRES BUSINESS DECISION`.

---

# 10. Deadline Rules

Stavyans cannot directly change official organizational deadlines.

Deadline changes must be performed by an authorized user within scope and must be audited with previous and new values. The formal approval authority and required reason/evidence remain `REQUIRES BUSINESS DECISION`.

---

# 11. Priority Rules

Stavyans cannot independently change organizational priority.

Authorized management users may change priority within their scope. Every priority change, including a Monthly Priority change during the active month, must preserve previous and new values in the audit history.

Formal priority-change authority remains `REQUIRES BUSINESS DECISION`.

---

# 12. Completion Rules

An assigned Stavyan may complete a normal Task.

A formal Commitment requires completion approval by its Accountable person or another authorized approver. Task completion alone does not prove that the Commitment outcome was achieved.

The exact alternate Commitment completion approval authority remains `REQUIRES BUSINESS DECISION`.

---

# 13. Reopen Rules

An Stavyan cannot directly reopen a formally completed Commitment.

Reopening a completed Commitment requires an authorized transition and must be audited. Authority and any required reason/evidence remain `REQUIRES BUSINESS DECISION`.

Normal Task reopening authority remains governed by scoped permissions and is `REQUIRES BUSINESS DECISION` beyond the requirement that it be audited.

---

# 14. Meeting Types

All supported meeting types can generate work:

- Major Meeting.
- Cross Functional Team Meeting.
- 1:1 Meeting.
- Scheduled Meeting.
- Non-Scheduled Meeting.

Meeting type and scheduling mode are separate dimensions: a meeting can have a business type and be scheduled or non-scheduled.

---

# 15. Meeting Work Approval

Meeting discussion or an extracted action does not automatically become an official Commitment.

```text
Meeting
→ Discussion / Action
→ Decision or proposed work
→ Required human approval
→ Commitment and/or Task
```

The source meeting and decision must remain traceable. The exact approver for each meeting/decision type remains `REQUIRES BUSINESS DECISION`.

---

# 16. Decision Traceability

A Decision remains distinct from a Commitment and Task. Approved Decisions may create one or more Commitments, and those Commitments may contain one or more Tasks.

Decision approval, conversion and subsequent changes must be auditable and idempotent where automation is involved.

---

# 17. O&O as an Execution Source

O&O is a recognized execution source that may generate Objectives, Priorities, Milestones, Commitments, Tasks and Improvement Actions.

V0.1 architecture must preserve O&O source provenance without implementing the complete O&O workflow. The exact O&O workflow remains `REQUIRES BUSINESS DECISION` and is not part of V0.1 implementation.

---

# 18. Stuck / Need

Stuck / Need is a first-class execution record. It should capture the reason, what is needed, who or what can provide it, required-by date and business impact.

Stuck / Need may lead to an Escalation but does not automatically require one.

---

# 19. Escalation

Escalation must be contextual. Overdue work alone does not automatically require escalation.

Escalation evaluation may consider priority, criticality, deadline, delay, progress, dependencies, blocker, business impact, required decision and risk.

Exact thresholds, levels, audiences and resolution authority remain `REQUIRES BUSINESS DECISION`.

---

# 20. Deterministic Automation

Approved deterministic automation follows:

```text
Trigger
→ Condition
→ Recommendation or Action
→ Approval if required
→ Execution
→ Audit
```

Known, approved low-risk conditions may trigger known actions. High-impact actions must respect the relevant approval rule. Automation must be versioned, idempotent and auditable.

---

# 21. Execution Intelligence

Execution Intelligence is a future extension point, not a V0.1 implementation module. It may eventually support smart task generation, task decomposition, assignment recommendations, workload-aware assignment, progress-versus-plan analysis, risk detection, dependency analysis, next-best-action recommendations and smart escalation.

```text
Organizational Data
→ Deterministic Rules and/or Intelligence
→ Recommendation
→ Human Approval where required
→ Execution
→ Audit
```

The workload and availability data source remains `REQUIRES BUSINESS DECISION`.

---

# 22. AI Authority

AI assistance complements deterministic automation; it does not replace it.

AI remains advisory for high-impact organizational actions, including ownership, deadlines, organizational priority, RACI, formal Commitment completion/reopening and escalation. These high-impact actions require human approval. Separately approved deterministic automation may execute classified low-risk actions.

No autonomous agent framework, vector database or complex AI infrastructure is required for V0.1.

---

# 23. Scope Control

LAKSHYA V0.1 remains a modular monolith.

V0.1 must not introduce microservices, Kubernetes, event-streaming platforms, a separate analytics warehouse, vector database or autonomous agent framework without a concrete approved requirement.

O&O workflows, advanced AI and Execution Intelligence are extension points only and are not to be implemented in V0.1.

---

# 24. Management View

The MD view should prioritize:

- What's Up.
- Critical issues.
- Major delays.
- Decisions required.
- Escalations.
- Priority health.
- Milestone health.
- Major commitments.
- Risks.

The MD should not need to manually inspect every task.

---

# 25. Auditability

The following changes must be auditable:

- Owner.
- Deadline.
- Priority.
- RACI.
- Status.
- Completion.
- Reopening.
- Escalation.
- Decision.
- Commitment.
- Priority changes.

Audit records should preserve the previous and new values where applicable.

---

# 26. Future Automation Levels

LAKSHYA should evolve through controlled automation levels.

## Level 1 — Assisted

System detects and recommends. Human approves.

## Level 2 — Deterministic Automation

Known condition triggers known action.

## Level 3 — Intelligent Assistance

System uses organizational context to recommend actions.

## Level 4 — Controlled Autonomy

Low-risk approved actions may execute automatically. High-impact organizational actions remain approval-based.

---

# 27. Business Decisions Still Required

The following remain intentionally unresolved and must be finalized with Stavya leadership before production:

- Exact role/permission matrix beyond the approved work-creation boundaries.
- Exact MD vs MD Office authority.
- Manager/Department Head hierarchy definition.
- Formal deadline-change approval authority.
- Formal priority-change authority.
- Commitment completion alternate approval authority.
- Commitment reopening authority.
- Decision and meeting-action approval authority.
- Escalation thresholds, audiences and resolution authority.
- Sensitive 1:1 visibility.
- Audit visibility and retention.
- User/role administration.
- EC definition.
- O&O exact workflow.
- Workload/availability data source.
- R/A combination and multiple-Responsible rules.
