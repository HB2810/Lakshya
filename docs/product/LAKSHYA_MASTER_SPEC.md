# LAKSHYA — Master Product Specification

**Product:** LAKSHYA
**Full Name:** MD Office Management Operating System
**Organization:** Stavya Spine
**Initial Deployment:** Stavya Spine MD Office
**Version:** V0.1 Foundation
**Product Owner:** Het Bhatt

---

# 1. Product Vision

LAKSHYA is an automation-first Management Operating System for Stavya Spine.

Its primary purpose is to convert organizational objectives, priorities, meetings, decisions, instructions, issues, and commitments into structured execution and management intelligence.

LAKSHYA should enable the MD Office to move from:

**Information → Discussion → Follow-up**

to:

**Objective → Commitment → Accountability → Execution → Outcome**

The system should reduce manual coordination and provide management with a clear view of what requires attention.

---

# 2. Problem Statement

Management work is distributed across:

* Meetings
* Conversations
* Emails
* Messages
* Spreadsheets
* Individual task lists
* Department systems
* Informal instructions
* Follow-up discussions

This creates common problems:

* Commitments are forgotten
* Ownership is unclear
* Deadlines are missed
* Tasks become stuck silently
* Decisions are difficult to trace
* Meeting actions require manual follow-up
* Escalations happen late
* MD attention is consumed by low-value information
* Management lacks a single execution view

LAKSHYA is intended to create a unified execution layer.

---

# 3. Product Objective

LAKSHYA should answer five fundamental management questions:

### 1. What matters?

Priorities, objectives and milestones.

### 2. Who owns it?

RACI and accountability.

### 3. What is happening?

Execution and progress.

### 4. What is blocked?

Stuck / Need, dependencies and issues.

### 5. What requires attention?

Escalations, decisions, risks and management intelligence.

---

# 4. Core Product Model

The primary execution chain is:

```text
Objective
    ↓
Priority
    ↓
Milestone
    ↓
Commitment
    ↓
Task
    ↓
Execution
    ↓
Outcome
```

Supporting chains:

```text
Meeting
    ↓
Decision
    ↓
Action
    ↓
Task
```

```text
Issue
    ↓
Stuck / Need
    ↓
Escalation
    ↓
Resolution
```

```text
Task
    ↓
RACI
    ↓
Deadline
    ↓
Execution
    ↓
Outcome
```

---

# 5. Initial Users

## MD

Primary management user.

Needs:

* Organizational overview
* What's Up
* Critical issues
* Decisions required
* Major priorities
* Escalations
* Meeting context
* Performance information

The MD should not need to inspect every individual task.

---

## MD Office

Responsible for coordination, tracking, meeting management and follow-up.

Needs:

* Meeting management
* Priorities
* Task tracking
* Follow-up
* Escalation management
* MD briefing
* Reporting

---

## Department Head

Needs:

* Department priorities
* Team tasks
* Ownership
* Delays
* Dependencies
* Escalations
* Performance

---

## Manager

Needs:

* Team execution
* Task assignment
* Progress
* Stuck items
* Deadlines
* Follow-up

---

## Stavyan

Needs:

* My tasks
* My commitments
* My meetings
* My priorities
* My deadlines
* My stuck / need items

---

# 6. Core Modules

V0.1 contains:

1. Authentication
2. Organization
3. Departments
4. Users
5. Roles and permissions
6. Dashboard
7. Meetings
8. Decisions
9. Monthly Priorities
10. Weekly Milestones
11. Tasks / Commitments
12. RACI
13. Dependencies
14. Stuck / Need
15. Escalation
16. Notifications
17. Audit Log

---

# 7. Priority Framework

LAKSHYA separates strategic importance from individual execution.

The hierarchy is:

```text
Objective
    ↓
Monthly Priority
    ↓
Weekly Milestone
    ↓
Task
```

## Monthly Priority

Defines what deserves organizational attention during the month.

Examples:

* Improve OPD patient flow
* Complete hospital website migration
* Implement new MRI workflow

---

## Weekly Milestone

Defines measurable progress expected during a specific week.

Example:

**Monthly Priority:**

Improve OPD patient flow.

**Weekly Milestone:**

Complete waiting-time data integration.

---

## Task

Defines the executable action required to achieve the milestone.

Example:

Fix OPD dashboard API waiting-time calculation.

---

# 8. Meeting Framework

LAKSHYA supports:

## Major Meeting

High-level organizational or MD-level meeting.

Used for:

* Strategic decisions
* Major issues
* Cross-department matters
* Organizational priorities

---

## Cross Functional Team Meeting

Meeting involving multiple departments.

Used for:

* Dependencies
* Shared projects
* Operational coordination
* Cross-functional execution

---

## 1:1 Meeting

One-to-one management meeting.

Used for:

* Individual review
* Accountability
* Support
* Development
* Specific commitments

---

## Scheduled Meeting

Meeting planned in advance.

---

## Non-Scheduled Meeting

Unplanned discussion that may still generate official decisions or commitments.

A non-scheduled interaction must be capable of producing:

**Decision → Action → Task → Follow-up**

---

# 9. Meeting Lifecycle

The intended lifecycle is:

```text
Meeting Created
      ↓
Agenda
      ↓
Meeting
      ↓
Discussion
      ↓
Decision / Action
      ↓
AI or Manual Extraction
      ↓
Human Approval
      ↓
Task / Commitment
      ↓
RACI
      ↓
Deadline
      ↓
Follow-up
```

Future versions may support automatic transcription and AI extraction.

---

# 10. Decision Management

Important decisions must be recorded independently from tasks.

A decision should eventually capture:

* Decision
* Decision maker
* Date
* Context
* Source meeting
* Related priority
* Related task
* Responsible person
* Impact
* Status

The objective is to make management decisions traceable and searchable.

---

# 11. Task / Commitment Model

A LAKSHYA task is more than a simple todo.

A commitment may contain:

* Title
* Description
* Source
* Objective
* Priority
* Milestone
* Owner
* Accountable person
* RACI
* Deadline
* Status
* Progress
* EC
* Time Spent
* Dependency
* Stuck / Need
* Escalation
* Outcome
* Remarks
* Audit history

The exact meaning and calculation of EC will be finalized during business-rule analysis.

---

# 12. Task Sources

A task may originate from:

* Monthly Priority
* Weekly Milestone
* Major Meeting
* Cross Functional Meeting
* 1:1 Meeting
* Non-Scheduled Meeting
* MD Instruction
* Department Request
* Issue
* Follow-up
* Future integrated systems

The source should remain traceable.

---

# 13. MD Instruction

LAKSHYA must eventually support direct MD instructions.

Example:

> "Get the OPD dashboard issue resolved by Friday."

The system should be able to convert this into:

```text
Instruction
    ↓
Commitment
    ↓
Owner
    ↓
Deadline
    ↓
RACI
    ↓
Follow-up
```

AI may assist with extracting structured information, but important organizational actions should remain human-approved.

---

# 14. RACI Framework

LAKSHYA uses:

**R — Responsible**

Person performing the work.

**A — Accountable**

Person ultimately accountable for the result.

**C — Consulted**

Person whose input is required.

**I — Informed**

Person who needs to know.

RACI should be associated with meaningful commitments rather than maintained as an isolated matrix.

---

# 15. Stuck / Need

Stuck / Need is a first-class execution concept.

A user should be able to report:

### Stuck reason

* Waiting for Person
* Waiting for Decision
* Waiting for Information
* Waiting for Vendor
* Technical Issue
* Resource Issue
* Approval
* Dependency
* Other

### Need

What is required to continue?

### From

Who or what can provide it?

### Required By

When is it needed?

### Impact

What happens if the blocker is not resolved?

This information should feed the management intelligence and escalation system.

---

# 16. Escalation Framework

Escalation must be based on organizational context.

The system should eventually consider:

* Priority
* Criticality
* Business impact
* Deadline
* Delay duration
* Progress
* Dependency
* Stuck reason
* Required decision
* Risk

Initial conceptual levels:

```text
L0 — Normal
L1 — Attention
L2 — Escalated
L3 — Management / MD Attention
```

These levels are provisional and must be validated against Stavya's actual MD Office escalation process before production implementation.

---

# 17. Automation Philosophy

LAKSHYA is automation-first.

The system should automatically:

* Generate reminders
* Detect overdue tasks
* Identify pending commitments
* Surface blockers
* Calculate escalation conditions
* Prepare meeting context
* Connect meeting actions to tasks
* Generate management summaries
* Surface decisions requiring attention

The goal is:

**Capture Once → Automate the Rest**

---

# 18. AI Philosophy

AI should assist management workflows without becoming the management authority.

AI may:

* Summarize
* Extract
* Classify
* Suggest
* Recommend
* Predict
* Search
* Generate reports

Important actions should use:

```text
AI Recommendation
        ↓
Human Approval
        ↓
System Action
```

Deterministic automation can execute predefined rules automatically.

---

# 19. MD Dashboard

The MD dashboard should be an **exception and decision dashboard**, not a task list.

The first screen should eventually answer:

### What's Up?

* Critical issues
* Major delays
* Decisions required
* Escalations
* Important upcoming commitments

### Organizational Execution

* Priority completion
* Weekly milestone status
* Critical tasks
* Overdue commitments
* Stuck items

### Management Attention

* Decision required
* Escalation
* Risk
* Significant deviation

The MD should understand the organizational state quickly without reviewing every task.

---

# 20. Department Dashboard

Department-level users should see:

* Department priorities
* Weekly milestones
* Team tasks
* Delayed tasks
* Stuck items
* Dependencies
* Escalations
* Workload
* Relevant KPIs

---

# 21. Stavyan Dashboard

Stavyans should see:

* My tasks
* My commitments
* My priorities
* My meetings
* Upcoming deadlines
* Overdue items
* My stuck / need items

---

# 22. Notifications

Notifications should be meaningful rather than excessive.

Potential notification events:

* Task assigned
* Task approaching deadline
* Task overdue
* Stuck item created
* Dependency resolved
* Escalation created
* Decision required
* Meeting action assigned
* Priority changed

Notification rules should eventually be configurable.

---

# 23. Audit Trail

Important changes must be recorded.

Examples:

* Task creation
* Task assignment
* Owner change
* Deadline change
* Priority change
* RACI change
* Status change
* Task completion
* Task reopening
* Escalation
* Decision modification

Audit records should capture:

* Actor
* Entity
* Action
* Previous value
* New value
* Timestamp
* Source

---

# 24. Management Intelligence

Future versions should provide:

### What's Up

What requires management attention now?

### DRM

Daily operational review.

### MIS

Management Information System.

### MD Review

High-level management review.

Eventually LAKSHYA should transform raw execution data into:

**Information → Insight → Decision → Action**

---

# 25. Future Improvement Engine

Future versions should support:

* Issues
* RCA
* 5-Why
* Corrective Action
* Preventive Action
* O&O
* Verification
* Recurrence tracking

Conceptual flow:

```text
Issue
 ↓
RCA
 ↓
Root Cause
 ↓
Corrective Action
 ↓
Owner
 ↓
Deadline
 ↓
Verification
 ↓
Outcome
```

---

# 26. Future Performance Engine

Future versions may connect execution with:

* KPI
* Department performance
* NABH requirements
* JCI requirements
* Corporate objectives
* Strategic goals

Conceptual relationship:

```text
Objective
 ↓
KPI
 ↓
Priority
 ↓
Milestone
 ↓
Task
 ↓
Outcome
 ↓
KPI Result
```

---

# 27. Future AI Intelligence

Future AI capabilities may include:

### Meeting Intelligence

Meeting transcript → decisions → actions → tasks.

### Weekly Intelligence

Tasks + priorities + blockers → weekly management summary.

### MD Briefing

Generate a concise MD briefing containing:

* What went well
* What is delayed
* What is stuck
* What requires decision
* What requires escalation
* What changed

### Risk Prediction

Potentially predict:

* Deadline risk
* Milestone failure
* Dependency risk
* Workload risk
* Repeated delays

Predictive functionality must remain advisory unless explicitly approved.

---

# 28. Existing Stavya Systems

LAKSHYA should not unnecessarily duplicate existing Stavya systems.

Potential integrations may include:

* Staff systems
* Meeting systems
* Hospital operational systems
* Existing dashboards
* Other internal applications

Before implementing a duplicate module, the existing system should be evaluated.

---

# 29. V0.1 Scope

## Included

```text
Authentication
Organization
Departments
Users
Roles
Permissions
MD Dashboard
Meetings
Meeting Decisions
Monthly Priorities
Weekly Milestones
Tasks
RACI
Dependencies
Stuck / Need
Escalation
Notifications
Audit Log
```

## Excluded from V0.1

```text
AI Meeting Transcription
Autonomous AI Agents
Predictive Analytics
Advanced KPI Engine
RCA / 5-Why
O&O
WhatsApp Automation
Mobile Application
Advanced External Integrations
```

---

# 30. V0.1 Success Criteria

LAKSHYA V0.1 should allow Stavya's MD Office to:

1. Create and manage organizational priorities.
2. Define weekly milestones.
3. Conduct and record meetings.
4. Record decisions.
5. Convert decisions into commitments.
6. Assign accountable owners.
7. Apply RACI.
8. Track execution.
9. Record blockers.
10. Identify overdue work.
11. Trigger defined escalation workflows.
12. Notify relevant users.
13. Maintain an audit trail.
14. Give the MD a concise management overview.

---

# 31. Development Strategy

LAKSHYA will be developed using three AI coding environments:

### Codex

Architecture and technical leadership.

### Claude Code

Backend and engineering implementation.

### Antigravity

Frontend, UX and browser/visual implementation.

GitHub is the source of truth.

All agents must follow `AGENTS.md`.

---

# 32. Development Sequence

```text
Phase 1
Product + Architecture Foundation

        ↓

Phase 2
Authentication + Organization + RBAC

        ↓

Phase 3
Priorities + Milestones

        ↓

Phase 4
Tasks + RACI + Dependencies

        ↓

Phase 5
Meetings + Decisions

        ↓

Phase 6
Stuck / Need + Escalation

        ↓

Phase 7
Notifications + Automation

        ↓

Phase 8
MD Dashboard + Management Intelligence

        ↓

Phase 9
AI Assistance

        ↓

Phase 10
KPI + RCA + Advanced Intelligence
```

---

# 33. Product Principle

LAKSHYA must not become another administrative burden.

Every feature must answer:

**What information is captured?**

**What can be automated?**

**Who is accountable?**

**Who needs visibility?**

**What action happens next?**

**What outcome is produced?**

The ultimate objective is:

> **LAKSHYA should help the MD Office spend less time chasing work and more time making decisions.**
