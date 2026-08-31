# SSIE Task Assignment & Execution Intelligence Engine — Vision & System Architecture

**Document Version:** 1.0  
**Status:** Approved Architectural Vision  
**System:** SSIE Task Engine / LAKSHYA  
**Target Ecosystem:** Stavya Spine Institute & Ecosystem (SSIE)  
**Product Owner:** Het Bhatt  

---

## 1. Executive Summary & Core Motto

> **ARCHITECT FOR SSIE. DESIGN FOR MD OFFICE.**

LAKSHYA is the initial implementation and pilot deployment of a broader **SSIE Task Assignment & Execution Intelligence Engine**. 

While the initial V1 pilot is designed specifically to serve the operational needs of the **MD Office**, the underlying backend architecture, domain model, state transitions, and intelligence pipeline are generalized to serve any department, team, clinical workflow, or operational unit across the wider Stavya Spine hospital ecosystem.

```text
========================================================================================
                          SSIE ECOSYSTEM ARCHITECTURE VISION
========================================================================================

                                  Stavya Spine (SSIE)
                                          │
                                  LAKSHYA Platform
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │  Task & Execution Intelligence Engine (Core)  │
                   └──────────────────────┬──────────────────────┘
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         │                                │                                │
 ┌───────▼────────┐              ┌────────▼───────┐              ┌─────────▼────────┐
 │   MD Office    │              │  IT & Systems  │              │ Clinical / Operations │
 │ (Pilot V1 Scope)│             │ (Future Dept)  │              │  (Future Expansion)  │
 └────────────────┘              └────────────────┘              └──────────────────┘
```

---

## 2. Core Execution Engine Pipeline

The SSIE Task Engine operates on a strict 11-stage execution pipeline designed to eliminate manual administrative maintenance while maintaining strict management oversight:

```text
  INPUT 
    ↓
  UNDERSTAND 
    ↓
  BREAK INTO WORK 
    ↓
  RECOMMEND OWNER 
    ↓
  RECOMMEND DEADLINE 
    ↓
  RECOMMEND PRIORITY 
    ↓
  HUMAN APPROVAL  ───────► [ Reject / Amend ]
    ↓ (Approved)
  CREATE TASKS 
    ↓
  MONITOR 
    ↓
  REMIND 
    ↓
  ESCALATE 
    ↓
  REPORT & OUTCOME
```

### Stage Description

1. **INPUT**: Unstructured operational instructions, meeting transcript notes, MD directives, or high-level project goals.
2. **UNDERSTAND**: Natural language processing extracts core intent, key entities, referenced dates, target outcomes, and contextual constraints.
3. **BREAK INTO WORK**: High-level intent is broken down into structured execution units (Objectives, Milestones, Commitments, Sub-tasks).
4. **RECOMMEND OWNER**: The engine calculates recommended task owners based on department domain, assigned role, explicit responsibility, current active workload, and availability.
5. **RECOMMEND DEADLINE**: Deadlines are calculated based on milestone target dates, task complexity, prerequisite dependencies, and historical cycle times.
6. **RECOMMEND PRIORITY**: Priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) is assigned based on organizational direction alignment and operational risk.
7. **HUMAN APPROVAL BOUNDARY**: Recommendations are staged in a draft state. A human authority (e.g. MD Office Lead or Department Head) reviews, modifies if necessary, and explicitly approves the recommendation.
8. **CREATE TASKS**: Official database entities (Commitments, Tasks, RACI assignments) are instantiated upon approval.
9. **MONITOR**: Deterministic state engine tracks task progress, dependency resolution, and blocker status.
10. **REMIND**: Automated notifications and reminders are dispatched to Responsible leads and Accountable owners.
11. **ESCALATE & REPORT**: Unresolved blockers or overdue milestones trigger multi-tier escalations (L1/L2/L3) and feed executive reports.

---

## 3. Generalized Domain & Workspace Data Model

To ensure the engine is fully reusable across future SSIE departments, **no department-specific logic is hardcoded into the business engine**. MD Office-specific rules are represented purely as data configurations.

### 3.1 Workspace Isolation Principle

```text
GOOD (Generalized Data Model):
------------------------------
workspace = Workspace(id="ws-mdo", code="MD_OFFICE", name="MD Office")
task = Task(workspace_id=workspace.id, title="Prepare OT Checklist")

BAD (Hardcoded Conditional Logic):
----------------------------------
if user.department == "MD_OFFICE":
    apply_special_md_task_logic()  <-- VIOLATION
```

### 3.2 Key Multi-Tenant Entities

- **`Workspace`**: Represents an isolated execution boundary (e.g. `MD_OFFICE`, `IT_OPS`, `SPINE_SURGERY`, `HR_PEOPLE`).
- **`Department`**: Organizational unit within SSIE (e.g. `Hospital Operations`, `IT & Digital Health`, `Spine Surgery`, `Nursing`).
- **`UserRole`**: Role definition linked to permission scopes (`MD`, `MD_OFFICE_LEAD`, `DEPARTMENT_HEAD`, `MANAGER`, `CONTRIBUTOR`).
- **`ExecutionHierarchy`**: Generalized tree node structure supporting flexible nesting:
  $$\text{Quarterly Direction} \longrightarrow \text{Monthly Priority} \longrightarrow \text{Weekly Milestone} \longrightarrow \text{Commitment} \longrightarrow \text{Task}$$
- **`RACIEnvelope`**: Reusable accountability matrix attached to any execution node (Responsible, Accountable, Consulted, Informed).

---

## 4. Smart Task Creation & Decomposition Engine

When a user submits a high-level operational instruction, the engine generates a structured execution plan.

### Example: High-Level Prompt Input
> *"Prepare the Spine Awareness Month event for September."*

### Automated Engine Processing Output (Pending Human Approval)

```json
{
  "suggestedObjective": "Execute Spine Awareness Month Outpatient & Public Campaign",
  "suggestedPriority": "HIGH",
  "suggestedDeadline": "2026-09-01",
  "suggestedTasks": [
    {
      "title": "Finalize Spine OPD Health Talk Schedule & Speaker Roster",
      "recommendedDepartment": "Spine Surgery",
      "recommendedOwnerRole": "Department Head",
      "recommendedAssignee": "Dr. Rohan Sharma",
      "estimatedHours": 12,
      "dueDate": "2026-08-25"
    },
    {
      "title": "Design & Print Patient Spine Education Pamphlets",
      "recommendedDepartment": "Marketing & Communications",
      "recommendedOwnerRole": "Manager",
      "recommendedAssignee": "Ananya Patel",
      "estimatedHours": 20,
      "dueDate": "2026-08-27"
    },
    {
      "title": "Configure Reception Lobby Signage & Token Displays",
      "recommendedDepartment": "IT & Digital Health",
      "recommendedOwnerRole": "Senior Engineer",
      "recommendedAssignee": "Priyesh Shah",
      "estimatedHours": 8,
      "dueDate": "2026-08-28"
    }
  ]
}
```

---

## 5. Smart Assignment Engine Architecture

The smart assignment engine determines optimal ownership recommendations by evaluating six weighted operational factors:

$$\text{Suitability Score} = w_1 \cdot S_{\text{Dept}} + w_2 \cdot S_{\text{Role}} + w_3 \cdot S_{\text{RACI}} + w_4 \cdot (1 - L_{\text{Workload}}) + w_5 \cdot A_{\text{Avail}}$$

```text
Task Type
    ↓
Target Department Match (1.0 weight)
    ↓
Role Capability Match (0.8 weight)
    ↓
RACI History & Skill Fit (0.7 weight)
    ↓
Current Active Workload (Inverse weight)
    ↓
Leave & Availability Check
    ↓
RECOMMENDED ASSIGNEE (Calculated Ranking)
```

The system presents ranked recommendations with justification summaries (e.g. *"Priyesh Shah recommended: 95% skill fit for IT displays, lowest active workload among IT team"*).

---

## 6. Deterministic Automation & Safety Guardrails

AI and automation in LAKSHYA operate under **deterministic state rules**. AI generates proposals; deterministic code executes approved transitions.

### 6.1 Automated Triggers & Actions

| Trigger Event | Automated System Action | Guardrail / Boundary |
| :--- | :--- | :--- |
| **Task Approved & Created** | Notify Responsible (R) & Accountable (A) via email/in-app. | Task status set to `NOT_STARTED`. |
| **Deadline T-48 Hours** | Dispatch reminder to Responsible owner. | Informational alert only. |
| **Deadline Reached & Incomplete** | State transitions to `OVERDUE`. | Logged in audit trail. |
| **Task Flagged as Stuck** | Generate `StuckNeedItem`, identify Provider (A owner), notify provider. | Does not alter task deadline without human input. |
| **Stuck Item Unresolved > 48h** | Auto-calculate Escalation Level (L1/L2/L3) & notify MD Office. | Escalation recorded in executive queue. |
| **Meeting Decision Approved** | Auto-generate draft commitment and assign to meeting organizer/lead. | Staged for formal owner signoff. |
| **All Child Tasks Completed** | Prompt Accountable owner: *"All 4 sub-tasks completed. Mark Commitment as Complete?"* | Requires human click to close parent commitment. |

---

## 7. Multi-Tier Escalation Engine

Escalation in LAKSHYA is contextual and risk-weighted. A task is not escalated simply because it is delayed; escalation considers priority, business impact, dependency depth, and blocker duration.

```text
                          ESCALATION HIERARCHY
                          
     Level 3: MD Office Executive Escalation
     (Critical Priority, Blocker > 48h, High Impact)
                        ▲
                        │
     Level 2: Management / Cross-Department Escalation
     (High Priority, Blocker > 24h, Multi-dept Block)
                        ▲
                        │
     Level 1: Departmental / Supervisor Escalation
     (Medium Priority, Internal Blocker)
```

- **Level 1 (Departmental)**: Notifies Department Head. Target resolution: 24 hours.
- **Level 2 (Management)**: Notifies MD Office Lead & Cross-Functional Leads. Target resolution: 12 hours.
- **Level 3 (MD Office Executive)**: Appears directly on MD Executive Dashboard ("Attention Required"). Target resolution: Immediate MD decision.

---

## 8. Meeting-to-Task Pipeline Architecture

Meetings represent one of the primary execution sources in hospital management. LAKSHYA parses meeting minutes or structured notes into actionable commitments.

```text
Meeting Discussion / Note Input
  "Dr. Rohan will finalize the Lumbar Spine Rehab Protocol by Friday."
                     │
                     ▼
          NLP Detection Pipeline
          ├── Task Title: "Finalize Lumbar Spine Rehab Protocol"
          ├── Identified Owner: Dr. Rohan Sharma (Spine Surgery Head)
          ├── Extracted Deadline: Friday (2026-08-22)
          └── Source: Meeting DEC-2026-031
                     │
                     ▼
          Human Approval Inbox
          ┌─────────────────────────────────────────────────┐
          │  Convert Decision to Official Commitment?       │
          │  Owner: Dr. Rohan Sharma | Due: 22 Aug 2026      │
          │  [ APPROVE & CREATE ]   [ REJECT ]   [ MODIFY ] │
          └─────────────────────────────────────────────────┘
```

---

## 9. Human Approval Guardrails & AI Safety Principles

1. **No Autonomous Ownership Changes**: AI cannot change task ownership without human approval.
2. **No Autonomous Deadline Alterations**: AI cannot extend or shorten committed deadlines.
3. **No Autonomous Task Closure**: Tasks and commitments must be marked complete by the Responsible or Accountable human.
4. **No Autonomous Stavyan Escalation**: Escalation rules are deterministic; AI suggestions must be reviewed before formal HR/management record logging.
5. **Full Audit Traceability**: Every AI proposal, human approval, modification, and execution state change is recorded with actor ID, timestamp, and source diff.

---

## 10. Future SSIE Department Expansion Roadmap

| Phase | Target Workspace | Functional Scope | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Phase 1 (Current)** | `MD_OFFICE` | MD Office Operational Coordination | Executive Overview, Commitments, Meetings, Blockers, RACI. |
| **Phase 2** | `IT_OPS` | IT & Digital Health Infrastructure | System maintenance tasks, vendor integration tracking, PACS links. |
| **Phase 3** | `CLINICAL_OPS` | Spine Surgery & Nursing Workflows | Rehab protocol deployment, OT checklist tracking, patient flow. |
| **Phase 4** | `HR_PEOPLE` | Staffing & Organizational Development | Staff onboarding milestones, credentialing, training commitments. |
| **Phase 5** | `SSIE_ENTERPRISE` | Hospital-Wide Cross-Department Engine | Enterprise task routing, AI workload balancing, predictive bottlenecks. |

---

## 11. Explicit Out-of-Scope (What is Intentionally NOT Built Now)

To maintain strict control and stability during V1 pilot validation, the following capabilities are **explicitly out of scope**:

- ❌ Autonomous AI agents that modify production databases without human confirmation.
- ❌ Direct EHR / Clinical Patient Records database modifications.
- ❌ Live WhatsApp or SMS automated messaging integrations.
- ❌ Mobile native applications (iOS / Android).
- ❌ Advanced predictive machine learning workload models.
- ❌ Autonomous financial or budget authorization engines.
