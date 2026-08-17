# ADR-005: Application-Level Append-Only Audit Trail

- **Status:** Proposed
- **Date:** 2026-08-17

## Context

LAKSHYA must trace important human, integration and automated changes with actor, source and before/after context. Ordinary application logs and database timestamps cannot meet this need.

## Decision

Create an application-level append-only `audit_events` table. Insert the audit event in the same transaction as every audited mutation. Record organization, actor or service actor, action, entity, timestamp, source, correlation/causation, reason and schema-versioned redacted before/after values.

The runtime database role cannot update/delete audit rows. Audit read/export uses separate explicit permissions and is audited. Domain events and audit events remain distinct: the former drive consumers; the latter provide human/security evidence.

## Alternatives

- Application logs only: rejected because retention, structure, atomicity and access are insufficient.
- Database triggers only: rejected as the primary method because they lack business command, human reason and request context.
- Full event sourcing: rejected as unnecessary complexity for V0.1.
- Blanket temporal/history tables: insufficient for actor/source/reason and too broad as the sole audit system.
- Hash chain/external immutable ledger now: deferred until threat model or regulatory need justifies it.

## Consequences

Every mutation use case must specify its audit action and redaction schema; audit insert failure aborts the mutation. Storage grows and requires an approved retention/export policy. Database-level controls and backups remain necessary because append-only application design alone is not absolute tamper proof.

