# ADR-004: Transactional Outbox and Database-Backed Automation

- **Status:** Proposed
- **Date:** 2026-08-17

## Context

Reminders, escalation evaluation, notifications and decision conversion must run reliably and be auditable. V0.1 volume is unknown and should not incur a distributed platform prematurely.

## Decision

Use a transactional outbox, scheduled-job tables and a separate worker/scheduler process built from the FastAPI backend codebase. Assume at-least-once execution. Require semantic idempotency keys, immutable rule versions, bounded retries, failure review and recorded fact/effect evidence. Use PostgreSQL row claiming and an advisory lock for scheduler leadership.

Rules implement a constrained `Trigger -> Conditions -> Actions` model. They cannot execute user code/SQL or directly invoke arbitrary integrations. Business mutation, audit event and outbox event commit atomically.

## Alternatives

- Synchronous notifications/automation in API requests: rejected because provider latency/failure would affect transactions.
- Celery/Redis, RabbitMQ or Kafka immediately: deferred until measured load, external consumer or availability needs justify another service.
- General BPM/workflow engine: rejected for V0.1 scope and governance complexity.
- Database polling without an outbox/execution record: rejected because reliability and causality would be weak.

## Consequences

PostgreSQL bears moderate queue work and needs cleanup/index monitoring. Handlers must be idempotent and operational failures need ownership. Stable event/action ports allow later broker migration. Thresholds and automation authority remain business configuration, not code constants.

