# ADR-002: Authentication and Browser Session Strategy

- **Status:** Proposed, pending Stavya identity-system decision
- **Date:** 2026-08-17

## Context

LAKSHYA handles sensitive management data and is primarily a browser application. The existing Stavya identity provider, SSO capability and MFA requirements are unknown.

## Decision

Define authentication behind a backend service interface. For V0.1 foundation, support first-party credentials only if Stavya has no approved SSO, using Argon2id and database-backed opaque sessions. Send the session identifier in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie; store only its hash. Protect unsafe requests with CSRF tokens and Origin checks. Rotate and revoke sessions on security-sensitive changes.

Add OpenID Connect through an adapter when an approved enterprise identity provider is identified. Do not store browser bearer tokens in local storage and do not implement custom OAuth/OIDC federation.

## Alternatives

- Stateless JWT access/refresh tokens in the browser: rejected as the default because revocation and client storage increase risk and complexity.
- Mandatory external identity platform immediately: deferred because the current Stavya identity source and operating constraints are unknown.
- Next.js-owned authentication: rejected; the FastAPI domain/security boundary must remain authoritative.

## Consequences

Database sessions add a small lookup and cleanup requirement but provide immediate revocation and clear audit context. Same-origin routing and CSRF controls become deployment requirements. SSO, MFA, password reset/delivery and account lifecycle remain `REQUIRES BUSINESS DECISION` before implementation approval.

