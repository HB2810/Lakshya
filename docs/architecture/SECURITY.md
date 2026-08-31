# LAKSHYA V0.1 Security Architecture

**Status:** Reconciled security baseline; production threat-model review required

## 1. Security objectives

Protect confidentiality of sensitive organizational/management data, integrity of decisions and accountability records, availability of core coordination workflows, and traceability of privileged or automated actions. Apply least privilege, deny by default, defense in depth, data minimization and secure defaults.

## 2. Trust boundaries and threats

Untrusted boundaries include browsers, uploaded/pasted content, external notification providers, future integrations and future AI providers. Primary threats include credential theft, session hijack/fixation, CSRF, insecure direct object reference, cross-department leakage, privilege escalation, injection, sensitive audit/log leakage, malicious automation configuration and compromised external providers.

A formal deployment-specific threat model is required before production.

## 3. Authentication and sessions

- Local credentials use Argon2id with parameters benchmarked for production and upgrade-on-login.
- Password policy should favor length and breached-password screening over composition rules; exact policy and reset support are `REQUIRES BUSINESS DECISION`.
- Issue random opaque session tokens in `Secure`, `HttpOnly`, `SameSite=Lax`, path-scoped cookies. Store only token hashes.
- Rotate on login, privilege elevation and password change. Revoke on logout, disablement/reset/security action. Enforce absolute and inactivity expiries.
- Unsafe methods require a CSRF token plus Origin/Referer checking. CORS is deny-by-default and same-origin deployment is preferred.
- Rate-limit and monitor login/reset; return generic failures. Single-use reset tokens are short-lived and hashed at rest.
- MFA is strongly recommended for MD, MD Office and access administrators; availability/timing is `REQUIRES BUSINESS DECISION`.
- Keep authentication behind an interface for future OIDC/enterprise SSO. Do not build custom federation.

## 4. Authorization

Server-side RBAC with organization, department and relationship scope is mandatory. Every read, list, aggregate, update and export is scoped. Field/transition permissions separate owner, deadline, priority, RACI, approval, reopen and escalation actions. Administrative access is not implied by the MD persona.

Approved minimum denies are enforced explicitly: Stavyans cannot assign another user, directly change official organizational deadlines, independently change organizational priority, complete a formal Commitment without Accountable/authorized approval, or directly reopen a completed formal Commitment. Manager, Department Head and MD Office assignment is constrained to authorized team, department and organization scope respectively.

Prevent privilege escalation by requiring grantors to possess grantable permission/scope, invalidating authorization state promptly, auditing all grants and testing object-ID substitution. Consider maker-checker approval for high-impact role and escalation-rule changes.

## 5. API and input security

- Validate length, type, enum, date range and relationship invariants with Pydantic and domain policies.
- Use SQLAlchemy parameterization; never concatenate untrusted SQL or sort/filter expressions.
- Encode output by context; sanitize any rich text using a strict allow-list. Prefer plain Markdown/text in V0.1.
- Limit body size, pagination, filter complexity, export range and automation rule complexity.
- Use `application/problem+json` without stack traces or secret/internal details.
- Validate content type, reject unknown sensitive fields and prevent mass assignment through command-specific schemas.
- If uploads are later added: private object storage, random keys, type/size validation, malware scanning and authorized download endpoints.
- Generate correlation IDs and security events for repeated denied/abusive activity.

## 6. Data protection

- TLS for all network paths; supported modern protocol/cipher configuration.
- Encryption at rest for database, backups and any object storage through the deployment platform.
- Minimize personal and meeting-detail data. Classify fields and define who may access sensitive 1:1/management notes.
- Credentials, reset/session tokens and provider secrets never appear in logs, audit payloads or analytics.
- Use redaction allow-lists for before/after audit data and structured logging.
- Backups are encrypted, access-controlled, tested for restore and governed by retention/RPO/RTO decisions.
- Production data must not be copied into development; use synthetic or approved de-identified fixtures.

Field-level application encryption may be added after data classification identifies fields requiring it. It is not a substitute for access control and key management.

## 7. Audit and monitoring

Audit important authentication, authorization administration, owner, deadline, priority, RACI, status, completion, reopening, escalation, Decision, Commitment, automation-rule and export actions. Record actor, service/origin, entity, before/after (redacted), reason where required, time and correlation. Runtime role cannot update/delete audit records; reading/exporting audit is restricted and audited.

Central monitoring should alert on repeated authentication failures, privileged role changes, unusual exports, automation failure/backlog, audit write failure and provider errors. Never allow a business mutation requiring audit to commit when its audit insert fails.

## 8. Secrets and environment configuration

Commit `.env.example` only with placeholders. Production secrets come from an approved secret manager/orchestrator and are distinct by environment/service. Rotate database, session-signing/CSRF, email/provider and integration credentials. Prefer short-lived/workload identity where supported.

Configuration starts in a typed, fail-fast settings layer. Production refuses debug mode, default secrets, insecure cookie settings or permissive CORS. Do not expose environment variables through client bundles (`NEXT_PUBLIC_*`) unless explicitly public.

## 9. Database and infrastructure security

- Separate migration, API, worker and read-only reporting database roles.
- Application roles do not own schemas or receive superuser/DDL rights.
- Restrict database network access to application workloads; require encrypted connections where supported.
- Pin minimal container base images, run as non-root, use read-only filesystem where practical, drop capabilities and scan dependencies/images.
- Separate staging/production accounts, networks, secrets and data.
- Protect administrative endpoints behind normal app authorization and, where available, network controls.
- Apply security headers: CSP, HSTS after HTTPS validation, frame restrictions, nosniff and appropriate referrer policy.

## 10. Rate limiting and availability

Apply stricter per-IP/account limits to login and reset, per-user/organization limits to mutation and export, and cost-based limits to dashboard/audit queries. Limits should use a shared store when horizontally scaled; a database-backed/simple gateway limiter is acceptable initially. Fail safely without blocking emergency authorized access indiscriminately.

Use health/readiness probes, connection/time limits, bounded worker retries, database backup/PITR and tested recovery. Availability target, RPO and RTO are `REQUIRES BUSINESS DECISION`.

## 11. Notifications and integrations

Notifications carry minimal sensitive content; prefer authenticated deep links over full details in email. Provider credentials are scoped and rotated. Webhooks require signature/timestamp verification, replay protection and idempotency. Each integration documents data owner, fields, purpose, retention, sync direction and failure reconciliation.

No advanced external integration is approved for V0.1.

## 12. Future AI security

- AI providers receive only approved, minimized context under a documented data-processing decision.
- Keep sensitive 1:1, credentials, audit internals and unrelated departments out of prompts by default.
- Treat retrieved/user content as untrusted prompt-injection input; tools remain allow-listed and server-authorized.
- AI has no database credentials and cannot directly mutate domain state.
- Persist recommendation provenance, model/prompt version, input references, reviewer and approval outcome.
- Ownership, deadline, priority, RACI, escalation, closure, deletion and management decisions require human approval.
- Define retention/training opt-out, residency and incident obligations before using an external AI provider.

Execution Intelligence uses the same boundary. It receives minimized read-only organizational context and produces a persisted recommendation; it does not receive mutation credentials or bypass application authorization. Workload-aware assignment requires an approved workload/availability source before use. No vector database, autonomous agent runtime or separate AI service is assumed for V0.1.

## 13. Verification gates

Before production: threat model; RBAC policy approval; security test cases for every scope; dependency/secret/container scanning; session/CSRF tests; backup restore; audit completeness test; penetration test proportional to exposure; incident response/runbook; retention and access-review process.

## 14. Required business/deployment decisions

- SSO/identity provider, MFA, password/reset and account-provisioning model.
- Data classification, 1:1 confidentiality and cross-department visibility.
- Hosting/network exposure, region, backups, RPO/RTO and availability.
- Audit/log/data retention and export approval.
- Notification providers/channels and allowed sensitive content.
- Security/operations owner, incident response and periodic access review.
- AI/integration provider governance for future phases.
