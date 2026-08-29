/**
 * Canonical Authorization Policies for LAKSHYA.
 *
 * Source of truth: docs/business-rules/RBAC.md and AGENTS.md §3, §8
 */

/**
 * Documented roles with Managing Director / MD Office executive authority.
 * Includes documented equivalents (MD, MD_OFFICE, MANAGING_DIRECTOR) and
 * administrative/bootstrap superusers (ADMIN, MASTER).
 *
 * NOTE: Generic leaders (DEPARTMENT_HEAD, MANAGER, LEADER, LEADERS) and
 * standard employees (EMPLOYEE, STAVYAN, NURSE, DOCTOR, GUEST) are strictly excluded.
 */
export const MD_ATTENTION_AUTHORIZED_ROLES: readonly string[] = [
  'MD',
  'MD_OFFICE',
  'MANAGING_DIRECTOR',
  'ADMIN',
  'MASTER',
  'LOCAL_BOOTSTRAP_ADMIN',
] as const;

/**
 * Validates whether a user role possesses MD Executive Cockpit access.
 * Matches backend `MD_ATTENTION_AUTHORIZED_ROLES` policy identically.
 * Generic permission bypasses (e.g. ad-hoc `can(...)`) are disallowed unless
 * enforced identically on the API server.
 */
export function isMDAttentionAuthorized(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase().trim();
  return MD_ATTENTION_AUTHORIZED_ROLES.includes(normalized);
}

/**
 * Validates whether a user role is a generic leader or executive.
 */
export function isLeaderOrAbove(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase().trim();
  return (
    MD_ATTENTION_AUTHORIZED_ROLES.includes(normalized) ||
    ['DEPARTMENT_HEAD', 'MANAGER', 'LEADER', 'LEADERS'].includes(normalized)
  );
}
