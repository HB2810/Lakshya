# LAKSHYA MD Office Pilot V1 — Product Scope & UX Specification

**Document Version:** 1.0  
**Status:** Approved Pilot Specification  
**Deployment Scope:** Stavya Spine Hospital MD Office  
**Parent System:** SSIE Task Assignment & Execution Intelligence Engine  
**Product Owner:** Het Bhatt  

---

## 1. Pilot Purpose & Objectives

LAKSHYA V1 is the pilot deployment of the broader **SSIE Task Engine**. 

Its primary purpose is to serve the **MD Office team** at Stavya Spine Hospital to:
1. Validate the core execution hierarchy ($\text{Objective} \rightarrow \text{Priority} \rightarrow \text{Milestone} \rightarrow \text{Commitment} \rightarrow \text{Task}$).
2. Test human-in-the-loop task generation and RACI assignment workflows.
3. Validate automated blocker logging (`Stuck/Need`) and multi-tier escalation logic.
4. Test the meeting-to-task conversion pipeline.
5. Establish a clean, uncluttered user experience for hospital leadership.

---

## 2. Simplified Primary Navigation Architecture

Rather than exposing every backend domain entity as a separate top-level navigation item (which creates administrative clutter), LAKSHYA Pilot V1 organizes all features into **5 coherent user-centric navigation hubs**:

```text
========================================================================================
                          LAKSHYA PILOT V1 NAVIGATION HIERARCHY
========================================================================================

 ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
 │    1. HOME    │  │  2. MY WORK   │  │   3. TEAM     │  │  4. MEETINGS  │  │5. ORGANIZATION│
 └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
         │                  │                  │                  │                  │
         ├─ Exec Overview   ├─ My Commitments  ├─ Dept Workload   ├─ Schedule Mtg    ├─ User Directory
         ├─ Direction Banner├─ Assigned Tasks  ├─ RACI Matrix     ├─ Decisions Reg   ├─ RACI Governance
         ├─ KPI Stat Halos  ├─ Pending Approvals├─ Active Blockers  ├─ Auto Task Pipe  ├─ RBAC Roles
         └─ Attention Items └─ Stuck Reported  └─ Resource Load   └─ Action Items    └─ System Config
```

---

## 3. Coherent Execution Hierarchy Presentation

While backend data models maintain separate normalized tables (`QuarterlyDirection`, `MonthlyPriority`, `WeeklyMilestone`, `Commitment`, `Task`), the frontend presents these as **one unified, collapsible execution tree**:

```text
Q3 2026 Strategic Direction: OPD Flow Optimization & Patient Experience
  └── Monthly Priority: Improve OPD Patient Flow & Waiting Time Tracking (August 2026)
        └── Weekly Milestone: W34 — Deploy Waiting Time API & Reception Displays
              └── Commitment CM-2026-089: Deploy Real-Time OPD Display System
                    ├── Task TK-401: Configure TV Displays (Priyesh Shah - R)
                    └── Task TK-403: Receptionist Workflow Briefing (Ananya Patel - R)
```

Users navigate the tree fluidly without switching pages.

---

## 4. Navigation Hub Specifications

### 4.1 Hub 1: HOME (Executive Dashboard)
- **Target Persona**: MD, MD Office Lead, Executive Management.
- **Key Components**:
  - **Executive Hero Banner**: Current workspace tag, date & live clock, personalized greeting.
  - **KPI Metric Stat Cards**: Active Priorities Count, Milestone Progress %, Active Commitments, Attention/Blocked Count.
  - **Current Strategic Direction Card**: Active quarterly objective with gradient progress fill bar.
  - **Monthly Priorities Grid**: Active monthly targets with progress indicators.
  - **Active Commitments Table**: High-priority commitments with RACI ownership & target dates.
  - **Attention Required Section**: Exception queue rendering active `Stuck/Need` items and Level 1/2/3 Escalations.

### 4.2 Hub 2: MY WORK (Personal Execution Hub)
- **Target Persona**: All users (MD, MD Office Lead, Dept Head, Manager, Contributor).
- **Key Components**:
  - **My Commitments Tab**: Commitments where the current user is designated as Responsible (R) or Accountable (A).
  - **My Tasks Tab**: Execution tasks assigned directly to the logged-in user.
  - **Pending Approvals Inbox**: Staged smart task recommendations, meeting action conversions, and commitment signoffs awaiting user click.
  - **My Reported Blockers**: Tasks flagged as stuck by the user, with live provider status updates.

### 4.3 Hub 3: TEAM (Department Workload & RACI Hub)
- **Target Persona**: MD Office Lead, Department Heads, Operations Managers.
- **Key Components**:
  - **Department Workload Grid**: Visual capacity and task load across team members (e.g. Priyesh Shah: 3 active tasks, Ananya Patel: 2 active commitments).
  - **RACI Distribution Matrix**: Consolidated table showing who is Accountable vs Responsible across all active commitments.
  - **Team Blockers & Needs**: Open `Stuck/Need` items categorized by required provider.

### 4.4 Hub 4: MEETINGS (Meetings & Decision Pipeline)
- **Target Persona**: All users.
- **Key Components**:
  - **Scheduled Meetings Register**: Major Executive Reviews, Cross-Functional Syncs, 1:1 Reviews.
  - **Official Decisions Register**: Approved organizational decisions linked to resulting commitments.
  - **Meeting Action Conversion Tool**: Quick modal parsing meeting outcomes into staged commitments with assigned RACI owners.

### 4.5 Hub 5: ORGANIZATION (Directory, RACI Rules & Administration)
- **Target Persona**: MD Office Lead, System Administrators.
- **Key Components**:
  - **User & Department Directory**: User roles, role titles, and department mappings.
  - **RACI Governance & Validation Rules**: System RACI constraints (e.g. *"Every commitment must have exactly 1 Accountable owner"*).
  - **Role-Based Access Control (RBAC)**: Permission matrix viewer.
  - **Audit Log**: Immutable event log tracking commitment creation, owner changes, deadline adjustments, and escalations.

---

## 5. MD Office User Journeys

### Journey 1: MD (Managing Director)
1. Logs in $\rightarrow$ lands on **HOME**.
2. Scans **KPI Stat Cards** and **Attention Required** exception card.
3. Clicks on an **L3 Escalation** (e.g. *"PACS API credentials overdue by 48h"*).
4. Reviews business impact summary and approves proposed resolution or reassigns accountable provider.

### Journey 2: MD Office Lead (Het Bhatt)
1. Receives directive during executive meeting.
2. Navigates to **MEETINGS** $\rightarrow$ records decision $\rightarrow$ clicks **"Convert to Commitment"**.
3. System suggests:
   - **Commitment**: *Deploy OPD Display System*
   - **Responsible (R)**: Ananya Patel
   - **Accountable (A)**: Het Bhatt
   - **Target Date**: 22 Aug 2026
4. Het reviews and clicks **[Approve & Dispatch]**.
5. Engine creates commitment, generates sub-tasks, and dispatches notifications.

### Journey 3: Contributor (Priyesh Shah)
1. Logs in $\rightarrow$ lands on **MY WORK**.
2. Opens assigned task: *Configure OPD WebSocket Endpoint*.
3. External vendor fails to deliver OAuth credentials.
4. Clicks **[Report Blocker / Stuck]** $\rightarrow$ selects reason: `VENDOR_DELAY` $\rightarrow$ describes need.
5. System flags task as `BLOCKED`, creates `StuckNeedItem`, and routes notification to Accountable owner (Het Bhatt).

---

## 6. Pilot Implementation Boundaries (What is NOT in V1)

To ensure rapid validation and zero distraction, the following items are **explicitly excluded from V1**:

1. ❌ Complex separate top-level pages for directions/priorities/milestones/tasks.
2. ❌ AI meeting audio recording or automated speech-to-text transcription.
3. ❌ Automated financial or payroll software integrations.
4. ❌ External WhatsApp or SMS messaging bots.
5. ❌ Native mobile app builds.
6. ❌ Multi-hospital enterprise cross-tenant routing.

---

## 7. Summary Matrix

| Metric / Dimension | Pilot V1 Specification |
| :--- | :--- |
| **Primary Workspace** | `MD_OFFICE` |
| **Target User Group** | MD, MD Office Lead, Dept Heads, Managers, Engineers |
| **Primary Navigation Hubs** | 5 (Home, My Work, Team, Meetings, Organization) |
| **Execution Chain** | Objective $\rightarrow$ Priority $\rightarrow$ Milestone $\rightarrow$ Commitment $\rightarrow$ Task |
| **Approval Guardrail** | Human approval mandatory for task instantiation |
| **Escalation Levels** | L1 (Dept), L2 (Management), L3 (MD Executive) |
| **Data Architecture** | Generalized SSIE schema (multi-workspace ready) |
