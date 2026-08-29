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

## 14. Explicitly Excluded Functionality (Out of Scope for V1)
- ❌ HRMS features (payroll, leave applications, appraisal scores, recruitment).
- ❌ Autonomous AI task modifications (AI can summarize, never reassign or change deadlines).
- ❌ Unrestricted open-browser search across non-permitted departments.
- ❌ WhatsApp / external chat sync engines (V1 uses in-app contextual follow-ups).
- ❌ Complex predictive KPI analytics.
