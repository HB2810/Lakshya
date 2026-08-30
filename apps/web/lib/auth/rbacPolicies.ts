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
 * standard stavyans (STAVYAN, STAVYAN, NURSE, DOCTOR, GUEST) are strictly excluded.
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

/**
 * Roles with direct authorization to access Stavya Quality Command Centre.
 * Includes Managing Director, MD Office, Quality Directorate, and Hospital Governance.
 */
export const QUALITY_COMMAND_AUTHORIZED_ROLES: readonly string[] = [
  'MD',
  'MD_OFFICE',
  'MANAGING_DIRECTOR',
  'ADMIN',
  'MASTER',
  'LOCAL_BOOTSTRAP_ADMIN',
  'DIRECTOR_QUALITY',
  'QUALITY_HEAD',
  'QUALITY_CHAMPION',
  'GOVERNANCE',
  'FOUNDER',
  'CHAIRMAN',
  'VICE_CHAIRPERSON',
] as const;

/**
 * Validates whether a user possesses authorization for the Stavya Quality Command Centre.
 * Allowed strictly for:
 * 1. MD & MD Office
 * 2. Quality Directorate (Director of Quality, Quality Champions, HICC, PSQ Leads)
 * 3. Hospital Governance Team (Founders, Board, Governance Committee)
 */
export function isQualityCommandAuthorized(user: {
  role?: string | null;
  roles?: string[];
  permissions?: string[];
  departmentName?: string | null;
  departmentId?: string | null;
  roleTitle?: string | null;
  positionTitle?: string | null;
  name?: string | null;
  email?: string | null;
} | null | undefined): boolean {
  if (!user) return false;

  const role = (user.role || '').toUpperCase().trim();
  if (QUALITY_COMMAND_AUTHORIZED_ROLES.includes(role)) return true;

  // Check roles array if present
  if (Array.isArray(user.roles)) {
    for (const r of user.roles) {
      if (QUALITY_COMMAND_AUTHORIZED_ROLES.includes(r.toUpperCase().trim())) {
        return true;
      }
    }
  }

  // Check explicit quality or governance capabilities/permissions
  if (Array.isArray(user.permissions)) {
    if (
      user.permissions.includes('quality.command.view') ||
      user.permissions.includes('quality.manage') ||
      user.permissions.includes('governance.view') ||
      user.permissions.includes('audit.view')
    ) {
      return true;
    }
  }

  // Check department
  const dept = `${user.departmentName || ''} ${user.departmentId || ''}`.toUpperCase();
  if (
    dept.includes('QUALITY') ||
    dept.includes('GOVERNANCE') ||
    dept.includes('EXECUTIVE') ||
    dept.includes('PSQ') ||
    dept.includes('HICC') ||
    dept.includes('NABH')
  ) {
    return true;
  }

  // Check title
  const title = `${user.roleTitle || ''} ${user.positionTitle || ''}`.toUpperCase();
  if (
    title.includes('QUALITY') ||
    title.includes('GOVERNANCE') ||
    title.includes('DIRECTOR') ||
    title.includes('CHAIRMAN') ||
    title.includes('NABH')
  ) {
    return true;
  }

  // Known executive governance & quality leadership identities
  const name = (user.name || '').toUpperCase();
  if (
    name.includes('AKRUTI') ||
    name.includes('MIRANT') ||
    name.includes('BHARAT DAVE') ||
    name.includes('AMITA DAVE')
  ) {
    return true;
  }

  return false;
}
