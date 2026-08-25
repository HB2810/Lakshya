# LAKSHYA — Complete Project Overview

## 1. Project Identity

**Product:** LAKSHYA  
**Full name:** MD Office Management Operating System  
**Initial organization:** Stavya Spine  
**Current foundation:** V0.1  
**Product owner:** Het Bhatt

LAKSHYA is an automation-first organizational execution and management operating system. Its purpose is to convert management information, meetings, decisions, instructions, priorities and commitments into accountable execution.

The central transformation is:

```text
Information → Discussion → Follow-up
```

into:

```text
Objective → Commitment → Accountability → Execution → Outcome
```

LAKSHYA is therefore not intended to be a generic task-management application. It is a management execution layer that connects organizational direction with measurable operational work.

---

## 2. Problem Being Solved

Management work is commonly distributed across meetings, conversations, email, messaging applications, spreadsheets, personal task lists and department-specific systems. This fragmentation creates recurring operational failures:

- commitments are forgotten;
- ownership is unclear;
- deadlines are missed;
- blocked work remains invisible;
- decisions are difficult to trace;
- meeting follow-up is manual;
- escalation happens too late;
- senior management receives too much low-value information;
- there is no single view of organizational execution.

LAKSHYA provides a structured execution system designed to answer five management questions:

1. **What matters?** — objectives, priorities and milestones.
2. **Who owns it?** — accountability and RACI.
3. **What is happening?** — execution and progress.
4. **What is blocked?** — dependencies, Stuck/Need and issues.
5. **What requires attention?** — escalations, decisions, risks and exceptions.

---

## 3. Core Execution Model

The project models organizational execution as a connected hierarchy:

```text
Quarterly Direction
        ↓
Objective
        ↓
Monthly Priority
        ↓
Weekly Milestone
        ↓
Commitment
        ↓
Task
        ↓
Execution
        ↓
Outcome
```

Supporting workflows include:

```text
Meeting
   ↓
Decision
   ↓
Approved Commitment / Task
   ↓
Execution
```

```text
Task / Commitment
        ↓
Stuck / Need
        ↓
Escalation
        ↓
Resolution
```

The architecture distinguishes between a **Commitment**, which represents an official organizational obligation, and a **Task**, which represents executable work. This distinction is important because formal commitments have stronger approval, accountability and completion rules.

---

## 4. V0.1 Functional Scope

### Foundation and access

- Authentication
- Organizations
- Departments
- Users
- Roles and permissions
- Scoped authorization
- Session management

### Strategy and planning

- Quarterly directions
- Objectives
- Monthly priorities
- Weekly milestones
- O&O source provenance

### Execution

- Commitments
- Tasks
- RACI
- Ownership and accountability
- Deadlines
- Priority management
- Dependencies
- Outcomes and completion workflows

### Meetings and decisions

- Major meetings
- Cross-functional meetings
- 1:1 meetings
- Scheduled and non-scheduled meetings
- Participants
- Decisions
- Decision approval
- Conversion of approved decisions into commitments

### Management attention

- Stuck/Need reporting
- Escalations
- Escalation acknowledgement and resolution
- Decisions requiring attention

### Platform services

- Notifications
- Automation rules
- Transactional outbox
- Background worker and scheduler
- Audit log
- MD dashboard
- Department dashboard
- Personal dashboard

---

## 5. Primary Users

### Managing Director

The MD dashboard is designed as an **exception and decision dashboard**, not a list of every task. It should surface critical issues, major delays, decisions required, escalations and significant organizational deviations.

### MD Office

Responsible for coordination, meeting management, follow-up, priority tracking, escalation and management reporting.

### Department Head

Focuses on departmental priorities, milestones, team execution, dependencies, delays and escalations.

### Manager

Focuses on team execution, assignment, progress, blockers and deadlines.

### Employee

Uses LAKSHYA for personal tasks, commitments, meetings, deadlines and Stuck/Need reporting.

---

## 6. RACI and Accountability Model

LAKSHYA uses the standard RACI model:

- **R — Responsible:** performs the work.
- **A — Accountable:** owns the final result.
- **C — Consulted:** provides required input.
- **I — Informed:** must be kept aware.

RACI is attached to meaningful commitments and tasks instead of being maintained as an isolated organizational matrix.

A formally approved Commitment requires at least one Responsible person and exactly one Accountable person under the V0.1 architecture. Formal completion follows an approval boundary and cannot be treated as an unrestricted employee status update.

---

## 7. Meeting and Decision Workflow

The intended workflow is:

```text
Meeting Created
      ↓
Agenda
      ↓
Discussion
      ↓
Decision / Proposed Action
      ↓
Human Review / Approval
      ↓
Commitment or Task
      ↓
RACI
      ↓
Deadline
      ↓
Execution and Follow-up
```

A non-scheduled interaction can also produce an official decision or commitment. V0.1 treats extracted actions as proposed commitments or tasks rather than introducing an independent Action aggregate.

AI-assisted meeting extraction is a future capability. V0.1 preserves the workflow and provenance while keeping human approval as the authoritative boundary.

---

## 8. Stuck/Need and Escalation

A blocker is treated as a first-class execution object rather than a comment on a task.

A Stuck/Need item may capture:

- reason for the blocker;
- what is required to continue;
- person or system expected to provide it;
- required-by date;
- business impact;
- resolution and evidence.

Conceptual escalation levels are:

```text
L0 — Normal
L1 — Attention
L2 — Escalated
L3 — Management / MD Attention
```

Escalation rules are intended to consider organizational context such as priority, criticality, impact, deadline, delay duration, dependencies, blocker type, decision requirements and risk.

The exact thresholds remain a business-policy concern and are not hard-coded into the API contract.

---

## 9. System Architecture

LAKSHYA V0.1 uses a **modular monolith**.

```text
Browser
   │
   ▼
TLS Reverse Proxy / Same-Origin Routing
   ├──────────────► Next.js Web Application
   │
   └──────────────► FastAPI Application
                         │
                         ├── PostgreSQL
                         ├── Transactional Outbox
                         └── Integration Adapters
                                  │
                                  ▼
                           Approved External Systems

Automation Worker + Scheduler
          │
          ├── PostgreSQL
          └── Notification Providers
```

### Architectural principles

- The API owns business rules and authorization.
- The browser never writes directly to the database.
- PostgreSQL is the system of record.
- Automation runs asynchronously through deterministic, versioned rules.
- Audit and business mutations are written atomically.
- Long-running provider calls do not execute inside request transactions.
- Module boundaries are enforced through service/application interfaces.
- V0.1 avoids microservices because the domain is still evolving and operational simplicity is more valuable at this stage.

---

## 10. Backend Architecture

The backend technology direction is:

- Python
- FastAPI
- Pydantic
- SQLAlchemy 2.x
- PostgreSQL

Each domain module separates:

1. API schemas and route handlers.
2. Application use cases and authorization.
3. Domain policies and state transitions.
4. Repositories and external adapters.

A typical protected mutation follows:

```text
Request
   ↓
Authenticate
   ↓
CSRF validation where required
   ↓
Resolve organization and scope
   ↓
Load entity within authorized scope
   ↓
Permission and transition validation
   ↓
Business mutation
   ↓
Audit event + Outbox event
   ↓
Atomic commit
```

Route handlers should remain transport-focused. Business logic, escalation calculations, authorization decisions and audit construction belong to application/domain layers.

---

## 11. Frontend Architecture

The frontend technology direction is:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Design principles:

- prefer server-rendered pages for initial loading and accessibility;
- use client components only where interaction requires them;
- organize frontend code by feature;
- use a typed API client as the data-access boundary;
- implement explicit loading, empty and error states;
- use accessible components and shared design tokens;
- do not place permission truth or domain transition logic in the browser.

Dashboard pages should consume purpose-built summary endpoints rather than downloading large task collections and calculating management metrics client-side.

---

## 12. Database Design Principles

PostgreSQL is the authoritative relational database.

Key conventions:

- UUID primary keys;
- `timestamptz` timestamps stored in UTC;
- explicit foreign keys;
- check and unique constraints;
- normalized tables for RACI, ownership, dependencies and execution relationships;
- JSONB only for appropriate flexible structures such as audit snapshots, provider payloads and versioned automation conditions.

Tenant-owned records carry `organization_id`. Department-scoped concepts also carry an appropriate department boundary. Although V0.1 initially serves Stavya, this design preserves safe scoping and avoids a later structural rewrite.

---

## 13. Security Model

### Authentication

V0.1 uses first-party credentials behind an authentication abstraction.

- Password hashing: **Argon2id**.
- Browser sessions: high-entropy opaque identifiers.
- Cookies: `Secure`, `HttpOnly`, `SameSite=Lax`.
- Only hashed session identifiers are stored server-side.
- Sessions rotate at login and privilege changes.
- Sessions are revoked on logout, password reset, account disablement and security response.
- Bearer tokens are not stored in browser local storage.

State-changing requests require CSRF protection and Origin/Referer validation.

### Authorization

Authorization follows:

```text
Permission granted by active role
        AND
Organization scope matches
        AND
Department/resource scope permits access
        AND
Domain transition is valid
```

RBAC is combined with relationship-aware checks for assignees, RACI members, participants, creators and department membership.

Authorization is always enforced server-side. SQL queries must apply visibility scope before filtering, counting and pagination to prevent information leakage.

---

## 14. API Architecture

The REST API is versioned under:

```text
/api/v1
```

Core API conventions include:

- JSON using `snake_case`;
- ISO 8601 timestamps;
- opaque UUID identifiers;
- RFC 9457 `application/problem+json` errors;
- cursor pagination;
- allow-listed filters;
- optimistic concurrency through `ETag` and `If-Match`;
- idempotency keys for retry-prone creation and transition operations;
- OpenAPI as the frontend/backend contract.

Representative resource groups:

```text
/auth
/users
/departments
/roles
/permissions
/objectives
/quarterly-directions
/priorities
/milestones
/meetings
/decisions
/commitments
/tasks
/stuck-items
/escalations
/automation/escalation-rules
/notifications
/dashboards
/audit-events
```

Sensitive state changes use explicit domain commands instead of unrestricted generic `PATCH` operations. Examples include approval, completion, reopening, assignment, deadline change and priority change.

---

## 15. Automation Architecture

LAKSHYA follows the principle:

```text
Capture Once → Automate the Rest
```

Potential deterministic automation includes:

- reminders;
- approaching-deadline detection;
- overdue work detection;
- pending commitment detection;
- blocker visibility;
- escalation rule evaluation;
- meeting context preparation;
- notification generation;
- creation of draft commitments from approved decisions.

Domain changes write:

```text
Business Data
     +
Audit Event
     +
Outbox Event
```

in one transaction.

A worker later claims events or scheduled jobs, evaluates the exact active rule version, performs idempotent actions and records execution attempts and outcomes.

A PostgreSQL-backed outbox/job table is sufficient for V0.1. A message broker can be introduced later without changing domain event contracts.

---

## 16. Notification Model

Notifications are consequences of domain events, not replacements for domain state.

V0.1 is designed around an in-app inbox with optional future provider adapters such as email.

A notification can contain:

- event context;
- recipient;
- template and version;
- channel;
- delivery state;
- deduplication key;
- link to the related entity.

Delivery failures must not roll back business actions such as escalation creation. Retries are bounded, auditable and eventually routed for operational review.

---

## 17. Audit Architecture

Audit data is append-only and separate from ordinary operational history or comments.

Important events include:

- creation;
- assignment and ownership changes;
- deadline changes;
- priority changes;
- RACI changes;
- status transitions;
- completion and reopening;
- escalation;
- decision changes;
- commitment lifecycle changes.

Each event should record:

```text
Organization
Actor or System
Action
Entity Type and ID
Timestamp
Source
Request / Correlation ID
Reason where required
Redacted Before Value
Redacted After Value
```

Audit creation is atomic with the business mutation. Application roles must not be able to edit or delete audit records. Password material, session tokens and secrets must never be written into audit payloads.

---

## 18. Dashboard and Management Intelligence

### MD Dashboard

Designed to answer **What’s Up?** by emphasizing exceptions and decisions:

- critical issues;
- major delays;
- decisions required;
- escalations;
- priority and milestone status;
- critical or overdue commitments;
- stuck items;
- significant organizational deviation.

### Department Dashboard

Focuses on:

- departmental priorities;
- milestones;
- team execution;
- delays;
- dependencies;
- blockers;
- escalations;
- workload and future KPI views.

### Personal Dashboard

Focuses on:

- assigned tasks;
- commitments;
- priorities;
- meetings;
- upcoming deadlines;
- overdue work;
- Stuck/Need items.

Dashboard definitions should document denominators, inclusion rules, timezone handling and freshness.

---

## 19. AI Strategy

AI is an advisory capability, not an autonomous management authority.

The intended control flow is:

```text
Human Request
      ↓
Approved and Minimized Context
      ↓
AI Recommendation
      ↓
Validation and Persistence
      ↓
Human Approval / Rejection / Edit
      ↓
Authorized System Action
      ↓
Audit
```

Future AI use cases may include:

- meeting summarization;
- extraction of decisions and commitments;
- classification;
- management summaries;
- search;
- risk recommendations;
- workload and assignment recommendations;
- progress-versus-plan analysis;
- next-best-action recommendations.

AI must not receive direct database credentials or invoke unrestricted domain mutations. High-impact changes to ownership, deadlines, priority, RACI, escalation, formal completion, reopening or deletion require human approval.

Autonomous agents, predictive analytics and AI meeting transcription are outside the V0.1 implementation scope.

---

## 20. Integrations

LAKSHYA should complement existing Stavya systems rather than duplicate them unnecessarily.

Potential integration areas include:

- staff and identity systems;
- meeting systems;
- hospital operational systems;
- existing dashboards;
- other internal applications.

Each integration should define:

- system of record;
- field ownership;
- sync direction;
- external identity mapping;
- least-privilege credentials;
- idempotency strategy;
- cursor/checkpoint;
- failure reconciliation.

Advanced integrations are outside V0.1 until Stavya validates the relevant systems and ownership boundaries.

---

## 21. Deployment Model

The planned deployment units are:

- Next.js web application;
- FastAPI API;
- automation worker/scheduler;
- PostgreSQL.

Applications are packaged as Docker images.

A production environment requires:

- supported PostgreSQL with encrypted backups and point-in-time recovery;
- TLS termination and same-origin web/API routing;
- separate development, staging and production environments;
- separate credentials per environment;
- structured logs;
- metrics and health/readiness checks;
- alerting;
- controlled database migrations;
- scheduler leadership control using a database advisory lock.

Docker Compose is suitable for local development but is not, by itself, the complete production architecture.

---

## 22. Quality and Testing Strategy

Planned quality layers:

### Backend

- Pytest domain-policy tests;
- authorization tests;
- state-transition tests;
- repository tests;
- API integration tests;
- automation idempotency tests.

### Frontend

- Vitest for frontend logic and components;
- API adapter tests.

### End-to-end

- Playwright for critical role-based workflows.

### Database

- tests against real PostgreSQL rather than SQLite;
- migration upgrade/downgrade checks;
- schema validation.

CI quality gates should include formatting, linting, type checking, tests, dependency scanning, secret scanning and migration review.

---

## 23. Development Strategy

The repository defines a multi-agent development workflow:

- **Codex:** architecture and technical leadership.
- **Claude Code:** backend and engineering implementation.
- **Antigravity:** frontend, UX and browser/visual implementation.
- **GitHub:** source of truth.

All contributors and agents are expected to follow `AGENTS.md` and the documented architecture, business rules and development workflow.

The development sequence is conceptually:

```text
Phase 1  → Product and Architecture Foundation
Phase 2  → Authentication, Organization and RBAC
Phase 3  → Priorities and Milestones
Phase 4  → Tasks, RACI and Dependencies
Phase 5  → Meetings and Decisions
Phase 6  → Stuck/Need and Escalation
Phase 7  → Notifications and Automation
Phase 8  → MD Dashboard and Management Intelligence
Phase 9  → AI Assistance
Phase 10 → Future Integrations and Expansion
```

---

## 24. Current V0.1 Exclusions

The following are intentionally excluded from the initial foundation:

- AI meeting transcription;
- autonomous AI agents;
- predictive analytics;
- advanced KPI engine;
- complete RCA / 5-Why workflow;
- full O&O workflow;
- WhatsApp automation;
- mobile application;
- advanced external integrations;
- vector database and separate AI microservice.

These boundaries are intentional. The V0.1 goal is to establish a reliable execution system before adding intelligence and automation complexity.

---

## 25. Key Architectural Decisions

### Modular monolith instead of microservices

Chosen to reduce operational complexity while domain boundaries are still being validated.

### PostgreSQL as the system of record

Chosen for transactional integrity, relational domain modeling, auditability and operational simplicity.

### API-owned business logic

Prevents business rules and authorization from being duplicated or bypassed in the frontend.

### Transactional outbox

Ensures asynchronous automation and notifications are connected reliably to committed domain changes.

### Explicit domain commands

Prevents sensitive state transitions from being hidden behind unrestricted update endpoints.

### Human approval for high-impact AI recommendations

Maintains accountability and prevents AI from becoming an unauthorized management actor.

### Exception-first management dashboard

Protects MD attention by surfacing what requires action rather than presenting every operational record.

---

## 26. Important Open Decisions and Risks

Some areas are intentionally marked for business validation before production implementation:

- exact escalation thresholds and policies;
- complete RBAC matrix and approval boundaries;
- SSO/OIDC provider decision;
- retention and export policy for audit data;
- notification delivery channels and governance;
- external system-of-record ownership;
- deployment hosting and region;
- recovery and availability objectives;
- hospital-network constraints;
- final definition of EC;
- detailed RACI cardinality rules beyond approved baseline constraints.

The main project risks are unclear access policy, immature escalation policy, changing dashboard definitions, notification fatigue, sensitive management data exposure and unresolved external system ownership.

---

## 27. V0.1 Success Criteria

LAKSHYA V0.1 is successful when Stavya's MD Office can:

1. Create and manage organizational priorities.
2. Define weekly milestones.
3. Conduct and record meetings.
4. Record and approve decisions.
5. Convert decisions into commitments.
6. Assign accountable owners.
7. Apply RACI.
8. Track execution.
9. Record blockers.
10. Identify overdue work.
11. Trigger defined escalation workflows.
12. Notify relevant users.
13. Maintain a trustworthy audit trail.
14. Provide the MD with a concise management overview.

---

## 28. Repository Documentation Map

The repository currently separates documentation by responsibility:

```text
docs/
├── architecture/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── AUTOMATION.md
│   ├── DATABASE.md
│   ├── DOMAIN_MODEL.md
│   └── SECURITY.md
├── business-rules/
│   ├── BUSINESS_RULES_V0.1.md
│   ├── ESCALATION.md
│   ├── RACI.md
│   └── RBAC.md
├── decisions/
├── development/
│   └── GIT_WORKFLOW.md
├── product/
│   └── LAKSHYA_MASTER_SPEC.md
└── LAKSHYA_PROJECT_OVERVIEW.md
```

This document acts as the high-level entry point. The detailed documents remain the authoritative references for their respective domains.

---

## 29. Overall Assessment

LAKSHYA has a strong conceptual foundation because it treats organizational execution as a connected system rather than a collection of isolated tasks. The most important design strengths are:

- explicit distinction between strategy, commitments and executable tasks;
- traceable links from meetings and decisions to execution;
- RACI-based accountability;
- Stuck/Need as a first-class management signal;
- exception-based escalation;
- append-only auditability;
- API-owned authorization and domain transitions;
- deterministic automation separated from future AI assistance;
- a deliberate modular-monolith architecture suitable for V0.1.

The next implementation priority should be to keep the initial scope disciplined. Authentication, RBAC, organizational boundaries, commitments/tasks, RACI, state transitions, audit logging and the transactional outbox form the operational core. AI, predictive intelligence and broad integrations should be added only after this execution foundation is stable and validated in the real Stavya MD Office workflow.

---

## 30. Final Vision

The long-term objective is for LAKSHYA to evolve from a structured execution system into a management intelligence platform:

```text
Information
    ↓
Structured Context
    ↓
Execution Data
    ↓
Insight
    ↓
Decision
    ↓
Action
    ↓
Outcome
```

The governing principle remains:

> **Capture organizational intent once, preserve accountability throughout execution, and surface only the information that requires attention.**
