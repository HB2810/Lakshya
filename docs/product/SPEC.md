# LAKSHYA V1 — Canonical Product Specification (SPEC.md)

**Project:** LAKSHYA — MD Office Management Operating System (SSIE V1)  
**Organization:** Stavya Spine Hospital  
**Owner:** Het Bhatt  
**Status:** FINAL / LOCKED  

---

## 1. Executive Summary & Product Direction

LAKSHYA is the first production implementation of the **SSIE (Smart/Structured Staff Intelligence & Execution)** operating system, purpose-built for Stavya Spine Hospital. It converts organizational objectives, meetings, decisions, instructions, stuck points, and commitments into structured execution, strict accountability, automated follow-up, and contextual management intelligence.

LAKSHYA is **NOT** a generic task manager or an open task browser. It is built strictly on an **Organization-First Architecture** where organizational relationships govern visibility, assignment, RACI accountability, and escalation.

---

## 2. Core Architectural Principles

### 2.1 The Canonical Hierarchy
The single source of truth for all relationships in LAKSHYA is the **Organization Chart**:
```text
Organization
└── Department / Unit
    └── Position / Post
        └── Person (User)
            └── Position Assignment (Effective-Dated)
                └── Reporting Relationship (Post -> Reports-To Post)
                    └── Authorization Scope
                        └── Work Visibility
                            └── Task Assignment / Ownership
                                └── RACI Framework
                                    └── Escalation Routing
```

### 2.2 Invariants: "A Person is NOT a Post"
1. **Vacant vs. Occupied:** A `Position` can exist without an active occupant.
2. **Effective Dating:** `PositionAssignment` records start date (`started_on`) and end date (`ended_on`).
3. **Single Transfer Mutation:** An stavyan transfer terminates the previous assignment, creates the new assignment, updates primary department membership, and logs an append-only audit event in a single atomic transaction.
4. **Historical Immutability & Dynamic Scoping:**
   - Transferred stavyans retain ownership of their existing tasks (tasks are **not** silently reassigned).
   - Historical RACI entries remain intact.
   - Current leader visibility, MD dashboards, and future escalations dynamically follow the **current organization graph**, not stale snapshot tables.

---

## 3. Persona Matrix & Privacy/Isolation Model

LAKSHYA enforces strict server-side access control. A user sees only what their organizational scope and explicit permissions permit:

| Persona | Primary Visibility Scope | Task Management Capabilities | Administrative Authority |
| :--- | :--- | :--- | :--- |
| **STAVYAN** | Strictly own assigned/created tasks + tasks where user is in RACI. | Can create tasks for self, update own progress, report Stuck/Need, and initiate 3-tier escalation. | None. Cannot view other stavyans' tasks or reassign peers. |
| **LEADER** (Dept Head / Manager) | Own tasks + direct/indirect reporting subordinates + assigned department work. | Can assign tasks to team members, update priorities within department, resolve subordinate escalations, and approve task completions. | Department-level operational coordination. |
| **MD** (Medical Director / MD Office) | Full organization-wide operational visibility across all departments and units. | Full operational intervention: reassign across departments, adjust organizational priority/deadlines, resolve top-tier escalations. | Organizational executive authority. |
| **MASTER** | System administration & user/credential management. | Hybrid model: Emergency root access to operational data with mandatory append-only audit logging. | IAM, permission catalogs, tenant configuration, cryptographic lifecycle. |

---

## 4. WorkItem & RACI Lifecycle Specification

### 4.1 Task Creation & RACI Engine
- Every formal `WorkItem` supports the **RACI** framework:
  - **R (Responsible):** The doer(s) executing the task.
  - **A (Accountable):** Exactly one single person with final ownership and sign-off authority.
  - **C (Consulted):** Subject-matter contributors (grants read/comment visibility).
  - **I (Informed):** Stakeholders updated on milestones (grants read visibility).
- If RACI is defined, completion requires sign-off from `A`, `R`, the direct reporting leader, or the `MD`. Unilateral unauthorized stavyan closure is rejected.

### 4.2 Stuck / Need & Contextual Escalation Engine
- Delayed or blocked tasks must specify **Why it is stuck** and **What is needed**.
- Escalations do **not** rely on hardcoded manager mappings. They resolve dynamically through the live organizational hierarchy:
  - **Tier 1 (Direct Leader):** Occupant of the parent `reports_to_position_id`.
  - **Tier 2 (Department Head):** Leadership position occupant of the department.
  - **Tier 3 (MD / MD Office):** Top-level executive leadership.

---

## 5. System Deliverables for Next Phases

1. **Phase 1 (Foundation - COMPLETED):**
   - Canonical `positions` and `position_assignments` database tables with composite tenant keys.
   - `PositionService` tree builder, reporting chain traverser, and atomic transfer mutation.
   - Dynamic `AuthorizationContext` loading subordinate user IDs.
   - `WorkItem` database models and service with strict tenant isolation.
   - Full integration test suite passing 31/31 isolation and foundation tests.

2. **Phase 2 (Leader Experience & Department Execution):**
   - Leader Team Overview & Subordinate Task Pipeline.
   - Department Workboard & Subordinate Work Assignment.
   - Inbound Escalation Triage & Blocker Resolution.

3. **Phase 3 (MD Command Center & Executive Intelligence):**
   - Organization-wide Exception Dashboard (Blockers, Overdue, Critical RACI).
   - Live Organization Chart Visualization & Interactive Position Management.
   - Cross-Department Executive Escalation Desk.

4. **Phase 4 (Master Administration & Audit Export):**
   - User Provisioning, Credential Lifecycle, and Role Template Grants.
   - Immutable Append-Only Audit Log Viewer & Telemetry Verification.

---

## 6. Definition of Done & Sign-Off

- [x] Canonical Org Chart models, services, migrations (`0006`, `0007`), and APIs implemented and tested.
- [x] Zero duplicate visibility tables; scoping dynamically derived from org tree.
- [x] Persona boundaries and 3-Tier escalation consensus locked.
- [x] SPEC.md documented and finalized.
