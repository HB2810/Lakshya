# ADR-001: Technology Stack

- **Status:** Proposed
- **Date:** 2026-08-17
- **Decision owners:** LAKSHYA architecture and product owner

## Context

LAKSHYA V0.1 needs a secure browser application, relational transaction model, strong validation, auditable automation and a development path usable by the assigned frontend/backend agents. It does not yet need independent service scaling or advanced infrastructure.

## Decision

Accept the proposed core stack with supporting choices:

- Frontend: Next.js, TypeScript, Tailwind CSS and shadcn/ui.
- Backend: FastAPI, Python, Pydantic v2 and SQLAlchemy 2.x.
- Database: PostgreSQL.
- Packaging/development: Docker images and Docker Compose for local integration.
- Tests: Pytest, Vitest and Playwright, plus real-PostgreSQL integration tests.
- Migrations: Alembic (required addition).
- Architecture: modular monolith with separate web, API and worker processes.
- Initial asynchronous transport: PostgreSQL transactional outbox and job tables; no message broker in V0.1.

Pin exact runtime/library versions during the foundation phase after compatibility and support review; this ADR intentionally does not freeze versions before implementation begins.

## Evaluation

Next.js/TypeScript is appropriate for role-specific dashboards and workflows, supports accessible server rendering and has a mature test/component ecosystem. Tailwind and shadcn/ui accelerate a consistent interface while retaining source ownership; the team must create design tokens and accessibility gates rather than accept generated defaults blindly.

FastAPI/Pydantic align with explicit API contracts and future controlled AI/data work. SQLAlchemy/Alembic provide a mature relational and migration layer. The cost is two languages and two dependency ecosystems; the existing agent responsibility split makes that acceptable, and the OpenAPI contract limits drift.

PostgreSQL fits the normalized, transactional and audit-heavy domain. JSON-only/document storage would weaken relationship constraints. Docker improves reproducibility, but Compose alone is not a production platform.

Pytest, Vitest and Playwright cover their intended layers. Playwright must remain a focused critical-path suite; most business-policy coverage belongs in fast backend tests.

## Rejected alternatives

- Microservices: premature operational and consistency cost.
- Next.js-only full-stack backend: would concentrate domain policy in a UI framework and conflict with the approved Python backend direction.
- MongoDB/document database: poor fit for RACI, dependencies, scoped relationships and integrity requirements.
- Celery/Redis or Kafka from day one: extra moving parts without established throughput need. The outbox boundary allows later adoption.
- Kubernetes as a V0.1 requirement: deployment environment and scale do not justify it yet.

## Consequences

The team operates Node and Python toolchains and must prevent API drift through generated OpenAPI and contract tests. PostgreSQL is required in CI for meaningful integration tests. Domain module boundaries need review discipline because the database is shared. A future broker, SSO adapter or read model can be added without restructuring the core domain.

