# LAKSHYA — Agent Instructions

## 1. Project Identity

**Project:** LAKSHYA
**Full Name:** LAKSHYA — MD Office Management Operating System
**Organization:** Stavya Spine
**Primary Environment:** Stavya Spine Hospital, MD Office
**Project Owner:** Het Bhatt

LAKSHYA is an automation-first Management Operating System designed initially for the MD Office and progressively for organizational management across Stavya Spine.

LAKSHYA is not intended to be a generic task-management application.

Its purpose is to convert organizational objectives, priorities, meetings, decisions, instructions, issues, and commitments into structured execution, accountability, automated follow-up, escalation, and management intelligence.

---

# 2. Product Philosophy

The fundamental LAKSHYA workflow is:

**Objective → Priority → Milestone → Commitment → Execution → Outcome**

Supporting systems:

**Meeting → Decision → Action → Task**

**Issue → Stuck/Need → Escalation → Resolution**

**Task → RACI → Deadline → Execution → Outcome**

The system should minimize manual administrative work.

### Core principle

> If LAKSHYA can reliably derive information from existing data, the user should not be required to enter that information again.

Users should capture information once.

LAKSHYA should automate:

* Task creation
* Ownership
* Follow-up
* Reminders
* Status tracking
* Escalation
* Meeting follow-up
* Management summaries
* Exception detection
* Relevant notifications

---

# 3. Primary Users

The initial system should support:

1. MD
2. MD Office
3. Department Heads
4. Managers
5. Stavyans

The same organizational data may be visible differently depending on role and responsibility.

---

# 4. Initial Product Scope

LAKSHYA V0.1 focuses on:

1. Authentication
2. Organization
3. Departments
4. Users
5. Roles and permissions
6. MD Dashboard
7. Meetings
8. Meeting decisions
9. Monthly priorities
10. Weekly milestones
11. Tasks / commitments
12. RACI
13. Dependencies
14. Stuck / Need
15. Escalation
16. Notifications
17. Audit Log

The following should NOT be implemented in V0.1 unless explicitly approved:

* AI meeting transcription
* Autonomous AI agents
* Predictive analytics
* Advanced KPI engine
* RCA / 5-Why
* O&O workflows
* WhatsApp automation
* Mobile application
* Advanced external integrations

These are future phases.

---

# 5. AI Principles

AI is an assistant, not the organizational authority.

AI may:

* Extract information
* Summarize meetings
* Detect action items
* Suggest tasks
* Suggest owners
* Suggest RACI
* Classify priorities
* Detect possible blockers
* Generate summaries
* Identify patterns
* Recommend actions
* Assist with RCA
* Assist with management reporting

AI must NOT silently:

* Change ownership
* Change deadlines
* Change priority
* Change RACI
* Escalate stavyans
* Close organizational tasks
* Delete important records
* Make management decisions

For important organizational actions:

**AI Recommendation → Human Approval → System Action**

Deterministic system rules may execute automatically when explicitly defined and approved.

---

# 6. Engineering Principles

## 6.1 Source of Truth

The GitHub repository is the source of truth for the software.

The `/docs` directory is the source of truth for product and architecture decisions.

Do not invent undocumented business rules when an existing rule is available.

---

## 6.2 Architecture

Do not make architectural changes casually.

Before changing architecture:

1. Understand the existing architecture.
2. Check the relevant documentation.
3. Check existing implementation.
4. Determine whether the proposed change is actually necessary.
5. Document significant architectural decisions.
6. Ensure affected agents understand the change.

---

## 6.3 Database

All database changes must use migrations.

Never modify production database structure manually.

Important organizational data must be auditable.

Prefer normalized relational structures where appropriate.

Avoid storing critical business relationships only inside unstructured JSON.

---

## 6.4 Security

Security is a core requirement.

The system must implement:

* Authentication
* Authorization
* Role-based access control
* Server-side permission validation
* Audit logging
* Secure password handling
* Secure session/token handling
* Input validation
* Protection against unauthorized data access

Never rely solely on frontend permissions.

---

## 6.5 Auditability

Important actions must be traceable.

Examples:

* Task created
* Task assigned
* Owner changed
* Deadline changed
* Priority changed
* RACI changed
* Task completed
* Task reopened
* Escalation created
* Escalation resolved
* Decision created
* Decision modified

Where appropriate, capture:

* Actor
* Action
* Entity
* Previous value
* New value
* Timestamp
* Source

---

# 7. Business Principles

## 7.1 Task is not the only object

LAKSHYA must distinguish between:

* Objective
* Priority
* Milestone
* Commitment
* Task
* Decision
* Issue
* Escalation
* Outcome

Do not collapse all of these into a generic "task" model.

---

## 7.2 Meeting is an execution source

Meetings may produce:

* Decisions
* Actions
* Tasks
* Follow-ups
* Priorities
* Escalations

A meeting action should be traceable back to its originating meeting.

---

## 7.3 MD Instructions are execution sources

A direct MD instruction may create an organizational commitment even if it did not originate from a scheduled meeting.

The system must eventually support:

**MD Instruction → Commitment → Owner → Deadline → Follow-up**

---

## 7.4 Stuck / Need is first-class

A delayed task should not simply show "Delayed".

The system should eventually capture:

* Why it is stuck
* What is needed
* Who can provide it
* Required-by date
* Business impact

---

## 7.5 Escalation is contextual

Do not implement:

**Overdue = Automatically Escalate**

Escalation should consider relevant factors such as:

* Priority
* Criticality
* Business impact
* Delay duration
* Dependency
* Blocker
* Required decision
* Risk

Final escalation rules must be documented before implementation.

---

# 8. RACI

LAKSHYA uses the RACI framework:

* **R — Responsible**
* **A — Accountable**
* **C — Consulted**
* **I — Informed**

RACI should be integrated into execution rather than implemented as a disconnected matrix.

Critical organizational commitments should have an accountable owner.

RACI validation rules must be enforced by the backend.

---

# 9. Agent Responsibilities

LAKSHYA is developed using three primary AI coding environments.

## Codex

Primary responsibility:

* Product-to-technical translation
* Architecture
* System design
* Database architecture
* API architecture
* Security architecture
* Integration design
* Code review
* Architecture review
* Refactoring strategy
* Technical documentation

Codex should primarily answer:

> How should LAKSHYA be engineered correctly?

Codex must not independently redefine product requirements without documenting the change.

---

## Claude Code

Primary responsibility:

* Backend implementation
* Database implementation
* API implementation
* Business logic
* Automation engine
* Tests
* Debugging
* Refactoring
* Performance improvements

Claude Code should primarily answer:

> How do we implement the approved architecture correctly?

Claude Code must follow the approved architecture rather than redesigning it during implementation.

---

## Antigravity

Primary responsibility:

* Frontend implementation
* UI/UX
* User workflows
* Dashboard design
* Responsive design
* Browser testing
* Visual QA
* Frontend interaction quality

Antigravity should primarily answer:

> How should LAKSHYA behave and feel for the user?

Antigravity must follow approved product and architecture decisions.

---

# 10. Agent Collaboration

No agent should assume that it is the only developer working on LAKSHYA.

Before implementing a feature:

1. Read `AGENTS.md`.
2. Read the relevant `/docs` files.
3. Inspect the existing implementation.
4. Check Git status.
5. Understand current branch/state.
6. Identify dependencies.
7. Implement only the assigned scope.
8. Run relevant tests.
9. Update documentation if necessary.
10. Clearly document changes.

Never overwrite another agent's work without understanding it.

---

# 11. Git Rules

`main` must remain stable.

Features should be developed using branches.

Recommended pattern:

```text
feature/<feature-name>
fix/<issue-name>
refactor/<area>
docs/<document-name>
```

Examples:

```text
feature/task-engine
feature/raci
feature/md-dashboard
feature/meeting-engine
fix/escalation-calculation
```

Do not commit directly to `main` for normal feature development.

---

# 12. Documentation Rules

Important decisions must be documented.

Use:

```text
docs/
├── product/
├── architecture/
├── business-rules/
├── ux/
└── decisions/
```

When implementation changes a business rule, update the appropriate documentation.

Code and documentation must not intentionally contradict each other.

---

# 13. Testing Rules

Important business logic requires tests.

Priority areas include:

* Permissions
* RACI validation
* Task state transitions
* Deadline calculations
* Escalation rules
* Notifications
* Meeting action conversion
* Priority logic
* Audit logging

Do not consider a feature complete merely because the UI works.

---

# 14. Existing Stavya Systems

LAKSHYA should integrate with existing Stavya systems where appropriate instead of unnecessarily duplicating functionality.

Potential existing systems include:

* Staff systems
* Meeting systems
* Hospital operational systems
* Other internal Stavya applications

Before creating duplicate functionality, inspect existing system capabilities and document the integration decision.

---

# 15. Development Rule

Build LAKSHYA incrementally.

Do not attempt to implement the entire platform in one operation.

Preferred sequence:

**Architecture → Foundation → Core Workflow → Automation → AI → Intelligence → Integrations**

---

# 16. Definition of Done

A feature is not complete until:

* Business requirement is understood
* Architecture is consistent
* Backend implementation exists where required
* Frontend implementation exists where required
* Authorization is implemented
* Validation exists
* Tests exist for important logic
* Audit requirements are considered
* Documentation is updated
* No known regression is introduced

---

# 17. Final Principle

LAKSHYA must reduce management workload rather than create another administrative workload.

Every feature should be evaluated using:

**Input → Automation → Accountability → Visibility → Action → Outcome**

If a feature requires unnecessary manual maintenance, reconsider the design.

LAKSHYA should help Stavya management answer:

* What matters?
* Who owns it?
* What was committed?
* What is progressing?
* What is stuck?
* What needs a decision?
* What is overdue?
* What needs escalation?
* What outcome was achieved?
* What requires MD attention?
