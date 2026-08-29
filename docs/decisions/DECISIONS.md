# LAKSHYA V1 — Phase 2 Architecture & Product Decisions (DECISIONS.md)

**Phase:** Phase 2 — Leader Experience & Department Execution  
**Project:** LAKSHYA — MD Office Management Operating System (SSIE V1)  
**Organization:** Stavya Spine Hospital  
**Status:** LOCKED / FINALIZED  

---

## 1. Leader Role Definition
The **Leader** (Department Head, Unit Incharge, or Team Manager) is the operational anchor responsible for driving team execution, unblocking subordinates, validating critical commitments, and triaging team capacity.
- **Core Workspace Question:** *"What is happening with my team, what needs my immediate attention, and what do I need to act on?"*
- **Operational Boundary:** A Leader is **not** an unrestricted hospital-wide browser. Visibility and authority strictly derive from the canonical organizational graph.

---

## 2. Leader Organizational Scope
- **Canonical Model:** **Model D (Reporting Subtree + Assigned Primary Department Work)**.
- **Computation:**
  1. Direct and indirect subordinates resolved dynamically from `Position` tree traversal (`reports_to_position_id`).
  2. Active members of the Leader's primary assigned department (`DepartmentMembership`).
  3. Tasks where the Leader is explicitly named in the RACI matrix (`R`, `A`, `C`, `I`).
- **Server-Side Enforcement:** Query predicates dynamically filter `WorkItem` by `(owner_id == leader.id | created_by == leader.id | owner_id IN subordinate_user_ids | department_id IN leader_department_ids)`.

---

## 3. Leader Task Visibility Matrix

| Context | Visibility | Reason / Rule |
| :--- | :--- | :--- |
| **Own Tasks** | `ALLOW` | Full read, edit, and state management. |
| **Direct & Indirect Subordinate Tasks** | `ALLOW` | Read progress, update priority/deadline, reassign within team, and triage blockers. |
| **Department Unit Work** | `ALLOW` | WorkItems tagged with the Leader's primary department. |
| **RACI Consulted / Informed Tasks** | `ALLOW` (Read-only) | Full context visibility; cannot mutate unless also owner or leader. |
| **Cross-Department Tasks** | `DENY` | Inaccessible unless explicitly named in RACI or authorized via MD delegation. |
| **Peer Leader Tasks** | `DENY` | Strict isolation between departments. |

---

## 4. Leader Task Management Permissions

| Capability | Policy | Details / Enforcement |
| :--- | :--- | :--- |
| **Create Task for Self** | `ALLOW` | Standard task creation. |
| **Create & Assign Task to Subordinate** | `ALLOW` | Assignee must be in Leader's subordinate graph or department. |
| **Reassign Task within Team** | `ALLOW` | Can move ownership between team members; generates audit event. |
| **Change Task Priority** | `ALLOW` | Can adjust priority for subordinate tasks (`low`, `medium`, `high`, `urgent`). |
| **Change Task Deadline** | `ALLOW` | Can adjust due dates; recorded in task activity history. |
| **Mark Task 'In Progress' / 'Blocked'**| `ALLOW` | Operational state transitions permitted. |
| **Mark Routine Task 'Completed'** | `ALLOW` | Can complete on behalf of subordinate. |
| **Approve / Verify Formal Commitment** | `ALLOW` | If Leader is designated `Accountable (A)` or direct reporting leader. |
| **Reassign Task to Other Department** | `DENY` | Must route through cross-team delegation or MD request. |

---

## 5. RACI Permissions
- **R (Responsible):** Leader can assign/reassign doers within their team.
- **A (Accountable):** Critical commitments require exactly one `A`. Leader can designate `A` to themselves or a qualified subordinate.
- **C (Consulted) & I (Informed):** Leader can add cross-department stakeholders as `C` or `I` to grant them visibility without transferring ownership.
- **Accountable Sign-Off:** Tasks with formal RACI require `A` (or Leader) confirmation before reaching finalized `Completed` state.

---

## 6. EDC (Expected Deliverable / Evidence / Completion)
- **Routine Tasks:** Assignee (`R`) can mark complete directly once output criteria are met.
- **Formal Commitments / Critical Work:** Enters `Ready for Review` state.
- **Verification Sign-Off:** Leader reviews provided deliverables/evidence, approving closure or returning task with feedback.

---

## 7. Dependency Permissions
- **Intra-Team Dependencies:** Leader can link dependent tasks within the team and resolve blocking links.
- **Cross-Team Dependencies:** Leader can declare a dependency on another department's work item.
- **Cross-Team Blocker Handling:** Declaring a cross-team blocker automatically notifies the owner and generates an upstream dependency alert. Cross-team mutation is strictly `DENIED`.

---

## 8. Escalation Rules
- **Canonical 3-Tier Escalation:**
  1. **Tier 1 (Direct Leader):** Immediate reporting position occupant receives alert and triage action.
  2. **Tier 2 (Department Head):** If unresolved within SLA or requiring broader departmental authority.
  3. **Tier 3 (MD / MD Office):** High-criticality hospital blockers and executive decisions.
- **Leader Inbound Triage:** Leaders have a dedicated *Attention Required* inbox to resolve, redirect, or escalate blockers up the hierarchy.
- **Audit Immutability:** All escalation events, reasons, timestamps, and resolutions are permanently recorded in `WorkItemEscalation`.

---

## 9. Transfer Behaviour & Invariants
- **Dynamic Scope Cut:** When Employee A transfers from Leader A to Leader B:
  1. Leader B immediately gains visibility over Employee A's tasks.
  2. Leader A immediately loses current management visibility unless Leader A is retained in the RACI matrix.
  3. Employee A retains ownership of their active/completed tasks (no silent task reassignments).
  4. Future escalations and approvals automatically route to Leader B.

---

## 10. Org Chart Interaction in Leader Experience
- **Interactive Scope Visualizer:** The Org Chart displays the Leader's reporting subtree, showing occupied vs. vacant posts, active reportees, and direct dependencies.
- **Clear Scope Explanation:** Shows exactly *why* a task or employee is in the Leader's workspace.
- **Strict Boundary:** No recruitment, payroll, appraisal, or HR management features.

---

## 11. MD Delegation Model
- **Explicit Delegation:** The MD can grant Leader X temporary or permanent management authority over Team/Department Y.
- **Implementation Mechanism:** Stored as an explicit scoped delegation record (`DelegationGrant`) linking `(leader_user_id, target_department_id/target_position_id, effective_from, effective_to)`.
- **Dynamic Evaluation:** Authorization queries evaluate `(subordinates | direct_departments | delegated_scopes)`.

---

## 12. Security & IDOR Rules
- **Server-Side Authorization:** Every endpoint checks `AuthorizationContext`. Accessing a non-permitted `work_item_id` returns `404 Not Found` (or `403 Forbidden`).
- **Mutation Boundary:** Attempting to update a task outside one's organizational scope fails server-side with `403 Permission Denied`.
- **Append-Only Auditing:** All mutations (reassignment, deadline change, priority shift, escalation) emit redacted audit logs with actor and entity snapshots.

---

## 13. Leader Workspace Information Hierarchy (Action-First)
The Leader UI is organized for immediate operational clarity:
```text
┌─────────────────────────────────────────────────────────────┐
│ 1. ATTENTION REQUIRED (Action Inbox)                        │
│    • Inbound Escalations  • Blocked Tasks  • Overdue Work   │
├─────────────────────────────────────────────────────────────┤
│ 2. TODAY & UPCOMING (Execution Pipeline)                    │
│    • Milestones due today  • High-priority commitments      │
├─────────────────────────────────────────────────────────────┤
│ 3. TEAM WORKLOAD & MEMBERS                                  │
│    • Capacity breakdown  • Active assignments per reportee  │
├─────────────────────────────────────────────────────────────┤
│ 4. ORG SCOPE & REPORTING TREE                               │
│    • Interactive subtree showing positions and reportees    │
└─────────────────────────────────────────────────────────────┘
```

---

## 15. Phase 2 Remediation & Live-Wire Execution Decisions (Audit Lock)

Following the real user-facing acceptance audit, the 15 core operational decisions are locked as follows:

### 15.1 Exact Leader Home Information Hierarchy
The Leader Workspace (`apps/web/app/(app)/overview/page.tsx`) renders a dedicated **Leader Operational View** when logged in as `LEADERS` / `DEPARTMENT_HEAD` / `MANAGER`:
1. **Header Kaizen Banner:** Subtle top-center continuous improvement wisdom chip.
2. **Attention Required Triage Deck (Top Priority):**
   - Inbound Escalations (pending resolution).
   - Blocked & Stuck Tasks with explicit need descriptions.
   - Overdue Commitments.
3. **Today & Upcoming Execution Stream:** High-priority items, today's due dates, and upcoming milestone deliverables.
4. **Team Execution & Workload Grid:** Reportees, active task counts, completion velocity, and vacancy indicators.
5. **Interactive Scoped Org Subtree:** Real-time tree visualizer driven by `GET /api/v1/organizations/tree/scoped`.
6. **Quick Smart Intake Action:** Fast NLP/modal task creation with pre-populated reporting department and assignees.

### 15.2 Exact WorkItem Detail Interaction Model
The Task Detail Drawer provides:
- Primary status and progress percentage slider.
- Clear distinction between routine tasks and formal commitments.
- Blocker declaration modal (Reason, What is Needed, Urgency, Escalation route).
- Immutable chronological activity timeline fetched from backend activities.

### 15.3 Exact RACI Editing Permissions
- **Responsible (R):** Leader can assign/reassign to self, direct reportees, indirect reportees, or members of their primary department.
- **Accountable (A):** Strictly enforced single user. Leader can set `A` to self or a designated reporting lead.
- **Consulted (C) & Informed (I):** Can include cross-department users without altering primary task ownership.
- **Server Enforcement:** `WorkItemService` validates that assignee and accountable users exist in the organization and meet assignment rules.

### 15.4 Exact EDC Verification Interaction
- Routine tasks: Assignee can mark `completed` directly.
- Critical/Formal Commitments with EDC criteria:
  - Assignee marks `ready_for_review` (progress = 100%).
  - Leader / Accountable user receives verification prompt in Drawer with "Verify & Sign-off" button.
  - Submitting verification note triggers `POST /api/v1/work_items/{id}/verify`, locking task as `completed` with a `COMPLETION_VERIFIED` audit entry.

### 15.5 Exact Dependency Interaction
- Declared inside `WorkItem` as structured metadata (`dependencies` array).
- Selecting a blocking task within the team creates a direct state link.
- Cross-team dependency displays the target task's public title and status without leaking private execution details.

### 15.6 Exact Escalation Inbox Interaction
- Leader views all pending inbound escalations in the *Attention Required* deck.
- Action options:
  1. **Resolve Blocker:** Enters resolution notes $\rightarrow$ triggers `POST /api/v1/work_items/escalations/{id}/resolve` $\rightarrow$ automatically transitions task to `in_progress` and clears `blocked_reason`.
  2. **Escalate to Tier 2 / MD:** Re-routes escalation up the organizational graph.

### 15.7 Exact Org Chart Editing Permissions
- **MASTER / ADMIN:** Full CRUD on departments, positions, reporting lines, and user assignments.
- **MD / MD Office:** Full authority to modify positions, reporting lines, and execute transfers.
- **LEADER:** View-only access to scoped reporting subtree; can request personnel transfers through MD Office.
- **EMPLOYEE:** View-only access to direct reporting chain.

### 15.8 Roles Authorized to Transfer Employees
- Strictly restricted to `MD`, `MD_OFFICE`, `MASTER`, and `ADMIN`.
- Executed via `POST /api/v1/organizations/transfer`.
- Atomic database mutation: closes prior `PositionAssignment`, updates `DepartmentMembership`, and preserves task history.

### 15.9 Cross-Team Dependency Visibility Boundary
- When a task in Team A depends on a task in Team B, Leader A sees:
  - Target Work Item ID & Title.
  - Owning Department & Owner Name.
  - High-level Status (`todo`, `in_progress`, `completed`, `blocked`).
- Leader A **cannot** see private notes, attachments, internal discussions, or audit trails of Team B's task.

### 15.10 Behaviour of Active Tasks After Transfer
- When Employee Carol transfers from Leader A to Leader B:
  - Carol **retains ownership** of all active, pending, and completed tasks.
  - Leader B **immediately gains management visibility** over Carol's tasks.
  - Leader A **immediately loses visibility**, unless Leader A was explicitly added as `A`, `C`, or `I` in the task's RACI matrix.
  - No database task rows are rewritten or deleted.

### 15.11 Behaviour of RACI Relationships After Transfer
- Named RACI user IDs remain intact on historical and active records.
- If transferred employee was Accountable (`A`), they remain Accountable unless the new Leader reassigns `A`.
- If former Leader was explicitly in RACI as `C` or `I`, their read access is preserved through the RACI grant.

### 15.12 Behaviour of Existing Escalations After Transfer
- Existing unresolved escalations that were targeted to Leader A remain assigned to Leader A for resolution of that specific past blocker, or can be re-triaged by the new Leader upon claim.
- All new blocker escalations automatically calculate and route to the new reporting line (Leader B).

### 15.13 Mock Data Cleanup Policy
- **To Be Removed from Production Code:**
  - `apps/web/lib/mocks/workItemMock.ts` $\rightarrow$ Remove runtime fallback in `apps/web/lib/api/client.ts`; enforce live `/api/v1/work_items` REST endpoints.
  - `apps/web/lib/mocks/organizationMock.ts` $\rightarrow$ Remove runtime fallback; wire `organization/page.tsx` directly to `/api/v1/organizations/tree/scoped`.
- **Allowed to Remain as Fixtures (Phase 3 Prep):**
  - `strategyMock.ts` & `dashboardMock.ts` (Isolated to future Phase 3 strategy views until Phase 3 planning).

### 15.14 API Modifications vs. Frontend Live-Wiring
- **Backend API Status:** Fully implemented and verified (`/work_items`, `/work_items/escalations/inbox`, `/work_items/escalations/{id}/resolve`, `/work_items/{id}/verify`, `/organizations/tree/scoped`, `/organizations/transfer`).
- **Required Remediation Work:** Pure **frontend live-wiring**:
  1. Refactor `apps/web/lib/api/client.ts` to call live endpoints with CSRF token injection and error handling.
  2. Implement the Leader Attention & Escalation Inbox UI component.
  3. Wire Scoped Org Tree visualization in `organization/page.tsx` and `overview/page.tsx`.
  4. Integrate EDC "Verify & Sign-off" action into Task Drawer.

### 15.15 Exact V1 Deployment Acceptance Criteria
1. Full end-to-end task lifecycle (Create $\rightarrow$ In Progress $\rightarrow$ Blocker $\rightarrow$ Escalate $\rightarrow$ Leader Resolve $\rightarrow$ Verify $\rightarrow$ Complete) operates against the live PostgreSQL database.
2. 0 mock fallbacks in execution and organization flows.
3. IDOR and unauthorized cross-department access blocked with `403 Forbidden` / `404 Not Found`.
4. Automated employee transfer dynamically switches Leader visibility without manual data patching.
5. All backend pytest tests (457+) and frontend test suites pass with 0 errors.


---

## 16. Phase 3 Architecture & Product Decisions (MD Operational Command Center)

**Status:** PROPOSED

### 16.1 Product Purpose & Priority
The MD is the operational commander of the hospital. The MD interface answers:
- What needs my attention?
- Where is the organization stuck?
- Who owns the problem?
- What actions do I need to take?
**Priority Flow:** Attention $\rightarrow$ Organization $\rightarrow$ Work $\rightarrow$ Departments $\rightarrow$ Escalations $\rightarrow$ Quick Action.
**Crucial Constraint:** Do NOT redesign LAKSHYA. MD Workspace is not a new application, but a role-specific view of the unified system leveraging the same unified backend and frontend components.

### 16.2 MD Home Information Hierarchy
The MD Workspace (anchored on the /overview route conditionally rendering full-scope data) consists of:
1. **Attention Required:**
   - Critical blockers, Tier 3 escalations, overdue commitments, high-priority risks, and items explicitly awaiting MD sign-off.
2. **Organization Snapshot:**
   - Full canonical Organization Chart visualization (GET /api/v1/organizations/tree).
   - Shows reporting structure, vacancies, active staff, and basic workload metrics.
3. **Hospital Work & Visibility:**
   - Organization-wide WorkItems accessible with filters (Department, Leader, Owner, Status, Priority).
4. **Department Workload:**
   - A simplified operational overview per department (active, overdue, blocked, completed). No speculative complex BI platforms.
5. **Organization-wide Escalations:**
   - Full visibility into the escalation engine showing originating employee, current leader, reason, age, and state.
6. **Smart Intake (Execution):**
   - Retain the NLP Smart Intake system. Converts natural language instructions ("Anita should coordinate with Quality...") into a reviewable plan before committing as structured WorkItems respecting RACI. No autonomous AI execution.

### 16.3 Organizational Graph as the Source of Truth
- The canonical organization chart continues to dictate visibility and authority dynamically.
- When the MD executes an employee transfer (POST /api/v1/organizations/transfer), it automatically adjusts the downstream reporting subtree, escalation paths, and department visibility without manual synchronization.
- Historical WorkItem ownership remains intact post-transfer.

### 16.4 MD Scope & Authority Rules
| Action / Context | Policy | Details / Enforcement |
| :--- | :--- | :--- |
| **View Entire Organization** | ALLOW | Access to the root canonical organization tree. |
| **View All Operational Work** | ALLOW | Full read visibility across all departments. |
| **Create/Assign Operational Work** | ALLOW | Can assign work anywhere in the organization. |
| **Modify Priority / Deadline** | ALLOW | Authority to mutate constraints on any operational task. |
| **Transfer Employees** | ALLOW | Can execute atomic organizational transfers. |
| **Bypass Audit Logging** | DENY | Every mutation strictly audited (WorkItemActivity, AuditLog). |
| **Bypass RACI / EDC Rules** | DENY | Must respect formal commitment verification and accountability logic. |

### 16.5 Consistency & UI Re-Use
- The Employee, Leader, and MD experiences are identical in design language, sharing the Header, Wisdom of the Day (Kaizen) banner, Task Detail Drawer, RACI displays, and Escalation modales.
- The distinction lies entirely in **Scope, Authority, and Actions**, securely governed by the backend.
- HR modules (payroll, appraisal, recruitment) and speculative AI agents are explicitly out of scope for Phase 3.

