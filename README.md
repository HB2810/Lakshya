# Stavya One — Hospital Management & Employee Companion Operating System

> **Automation-First Management Operating System & Employee Work/Life Companion for Stavya Spine Hospital**  
> Converting institutional objectives, meetings, decisions, and clinical commitments into structured execution, accountability, automated follow-up, and real-time management intelligence, combined with a privacy-first personal wellbeing and companion space for every hospital staff member.

---

## 🏛️ Project Overview

**Stavya One** is designed specifically for Stavya Spine Hospital, initially powering the **Managing Director (MD) Office** and progressively scaling across all clinical, nursing, administrative, and engineering departments.

### Dual-Lane Architecture & Workflow Engine

1. **Stavya Workspace (Hospital-Governed):**
   $$\text{Objective} \longrightarrow \text{Priority} \longrightarrow \text{Milestone} \longrightarrow \text{Commitment} \longrightarrow \text{Execution} \longrightarrow \text{Outcome}$$
   - **Meeting Engine:** Meeting $\rightarrow$ Decision $\rightarrow$ Action Item $\rightarrow$ Task
   - **Exception Engine:** Issue $\rightarrow$ Stuck/Need $\rightarrow$ Contextual Escalation $\rightarrow$ Resolution
   - **Accountability Engine:** Task $\rightarrow$ Dynamic RACI Matrix $\rightarrow$ Deadline $\rightarrow$ Outcome
   - **NABH 6th Edition Command Centre:** Gated quality audits, chapter compliance, and role-based task delegation.

2. **Personal Vault (Employee-Owned & Device-Local):**
   - **Ask One AI Companion:** Everyday work & life assistant with conversational navigation and safety boundaries.
   - **Everyday Wellbeing (Health Journal):** Restorative sleep, movement steps, hydration glasses, and mood tracking stored locally on device.
   - **Money Clarity (Wealth Plan):** Private monthly budgeting and savings target clarity, completely isolated from hospital payroll and HR.
   - **Life Beyond Work (Goals & Rhythm):** Personal habits, weekly rhythm tracking, and private reminders.
   - **Privacy Control Centre:** Dual-zone privacy map, instant JSON data export, and browser-side vault wipe controls.

---

## 📂 Repository Structure

```text
stavya-one/
├── apps/
│   ├── web/                    # Next.js 14 Frontend Application
│   │   ├── app/                # App Router (Overview, Execution, Ask One, Health, Wealth, Life, Privacy, Org, Policies)
│   │   ├── components/         # Modular UI Components (Companion, Org Chart, Stepper, RACI, Drawers)
│   │   ├── lib/                # Auth, API client, Services (privateVault, stavyaGateway), Mocks, Permissions
│   │   ├── types/              # TypeScript definitions (Companion, Auth, WorkItems, Org, Strategy)
│   │   └── __tests__/          # Vitest Automated Test Suites (18 test files, 140 tests)
│   │
│   └── api/                    # FastAPI Backend Application
│       ├── app/                # Core API, Routers, Database Models, Services, Schemas
│       ├── alembic/            # Database Migrations & Version Control
│       ├── tests/              # Pytest Backend Suites (210 tests)
│       └── Dockerfile          # Production Backend Container Spec
│
├── docs/                       # Product, Architecture & Business Rules
│   ├── product/                # PRDs, Feature Specs & User Workflows
│   ├── architecture/           # System Architecture & Database Schema
│   ├── business-rules/         # RACI Rules, Escalation Logic, Governance Policies
│   └── decisions/              # Architectural Decision Records (ADRs)
│
├── AGENTS.md                   # AI Agent Guidelines & Architecture Contracts
└── CHANGELOG.md                # Release History & Version Milestones
```

---

## 👥 Personas & Role-Based Access Control (RBAC)

| Role | Access Level | Primary Features & Views |
| :--- | :--- | :--- |
| **MD (Managing Director)** | Executive Command | Full Hospital Command Center, 214 Staff Directory & Privileges, Strategic Milestone Stepper, Pure-White Interactive Org Chart, Department Transfers, Meeting Conversions, RCA Engine, NABH Chapter Readiness |
| **QUALITY / NABH LEAD** | Quality Command | NABH Chapter Champion Readiness Matrix, Auto-Task Generation, SOP Audit Engine, RCA / FMEA Workflows |
| **LEADER (Dept. Heads & Managers)** | Department Operations | Department Workload Grid, Scoped Team Org Tree, Milestone Stepper, Task Assignment, Exception Resolution |
| **STAVYAN (Hospital Staff)** | Execution & Companion | Clean "My Day" Queue, Personal Tasks & Schedule, Stuck/Need Flagging, Ask One Companion, Health Journal, Money Clarity, Life Rhythm (No administrative distractions) |
| **ADMIN / MASTER** | System Security | User Credential Management, Role Assignments, System Password Reset, Security Audits |

---

## 🚀 Quick Start & Deployment

For a full step-by-step operations manual, staff credentials list, and cloud VPS guide, see the [Deployment & Staff Launch Guide](docs/development/DEPLOYMENT_GUIDE.md).

### 1. One-Command Docker Launch (Recommended)

Run the entire full-stack application (PostgreSQL 16, FastAPI backend, and Next.js frontend) with automatic database migrations and initial seeding:

```bash
# Clone and copy environment configuration
cp .env.example .env

# Launch the full stack
docker compose up -d --build
```
- **Frontend:** `http://localhost:3001`
- **Backend API Docs:** `http://localhost:8000/docs`

---

### 2. Local Development (Without Docker)

#### Backend (`apps/api`)
```bash
cd apps/api
# The backend automatically boots an in-memory SQLite database if PostgreSQL is not running!
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run automated tests
.venv/bin/pytest
```

#### Frontend (`apps/web`)
```bash
cd apps/web
npm install
npm run dev

# Run typecheck & automated test suites
npm run typecheck
npm test
```
Access the application at `http://localhost:3001`. Default staff credentials are pre-configured (`Stavya@2026`) with a 214-member directory selector on `/login`.

---

## 🔒 Engineering & Quality Standards

- **Two-Lane Privacy Guarantee:** Client-side device storage for personal wellbeing data; server-side RBAC for hospital operations.
- **Single Main Branch:** Continuous integration directly on `main`.
- **Zero Mock Clutter in Production:** Strict gating of executive dashboards away from standard stavyan views.
- **RACI Validation:** Server-side and client-side enforcement of Responsible, Accountable, Consulted, and Informed ownership.
- **Sequential Delivery Gate:** Zomato-style milestone progression preventing unearned status advances.

---

© Stavya Spine Hospital — All rights reserved.
