# LAKSHYA — MD Office Management Operating System

> **Automation-First Management Operating System for Stavya Spine Hospital**  
> Converting institutional objectives, meetings, decisions, and clinical commitments into structured execution, accountability, automated follow-up, and real-time management intelligence.

---

## 🏛️ Project Overview

**LAKSHYA** is designed specifically for Stavya Spine Hospital, initially powering the **Managing Director (MD) Office** and progressively scaling across all clinical and operational departments.

### Fundamental Workflow Engine
$$\text{Objective} \longrightarrow \text{Priority} \longrightarrow \text{Milestone} \longrightarrow \text{Commitment} \longrightarrow \text{Execution} \longrightarrow \text{Outcome}$$

- **Meeting Engine:** Meeting $\rightarrow$ Decision $\rightarrow$ Action Item $\rightarrow$ Task
- **Exception Engine:** Issue $\rightarrow$ Stuck/Need $\rightarrow$ Contextual Escalation $\rightarrow$ Resolution
- **Accountability Engine:** Task $\rightarrow$ Dynamic RACI Matrix $\rightarrow$ Deadline $\rightarrow$ Outcome

---

## 📂 Repository Structure

The repository is structured as a clean, standardized monorepo:

```text
lakshya-md-office/
├── apps/
│   ├── web/                    # Next.js 14 Frontend Application
│   │   ├── app/                # App Router (Overview, Execution, Strategy, Org, Policies)
│   │   ├── components/         # Modular UI Components (Org Chart, Stepper, RACI, Drawers)
│   │   ├── lib/                # Auth, API client, Data stores, Mocks, Permissions
│   │   ├── types/              # TypeScript definitions (Auth, WorkItems, Org, Strategy)
│   │   └── __tests__/          # Vitest Automated Test Suites (59 unit & integration tests)
│   │
│   └── api/                    # FastAPI Backend Application
│       ├── app/                # Core API, Routers, Database Models, Services, Schemas
│       ├── alembic/            # Database Migrations & Version Control
│       ├── tests/              # Pytest Backend Suites
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
| **MD (Managing Director)** | Executive Command | Full Hospital Command Center, 211 Staff Tracker, Strategic Milestone Stepper, Pure-White Interactive Org Chart, Department Transfers, Meeting Conversions, RCA Engine |
| **LEADER (Dept. Heads & Managers)** | Department Operations | Department Workload Grid, Scoped Team Org Tree, Milestone Stepper, Task Assignment, Exception Resolution |
| **EMPLOYEE (Hospital Staff)** | Personal Execution | Clean "My Day" Queue, Personal Tasks & Schedule, Stuck/Need Flagging, Task Completion (No administrative distractions) |
| **ADMIN / MASTER** | System Security | User Credential Management, Role Assignments, System Password Reset, Security Audits |

---

## 🚀 Quick Start Guide

### 1. Frontend (`apps/web`)

```bash
# Navigate to the frontend directory
cd apps/web

# Install dependencies
npm install

# Run development server (Port 3000)
npm run dev

# Run typecheck & automated test suites
npm run typecheck
npm test
```

### 2. Backend (`apps/api`)

```bash
# Navigate to the backend directory
cd apps/api

# Activate Python virtual environment
.\.venv\Scripts\Activate.ps1   # Windows PowerShell

# Start FastAPI server (Port 8000)
python -m uvicorn app.main:app --reload --port 8000
```

---

## 🔒 Engineering & Quality Standards

- **Single Main Branch:** Continuous integration directly on `main`.
- **Zero Mock Clutter in Production:** Strict gating of executive dashboards away from standard employee views.
- **RACI Validation:** Server-side and client-side enforcement of Responsible, Accountable, Consulted, and Informed ownership.
- **Sequential Delivery Gate:** Zomato-style milestone progression preventing unearned status advances.

---

© Stavya Spine Hospital — All rights reserved.
