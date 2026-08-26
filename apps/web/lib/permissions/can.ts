import { Capability, User } from '../../types/auth';

/**
 * Frontend Permission Evaluator (UX helper only; backend enforces authorization).
 * Evaluates whether a given user possesses the requested capability based on
 * official RBAC rules in `RBAC.md` and `BUSINESS_RULES_V0.1.md`.
 */
export function can(capability: Capability, user: User | null): boolean {
  if (!user) return false;

  const { role } = user;

  switch (capability) {
    // 1. Dashboards
    case 'dashboard.md.read':
      return role === 'MD' || role === 'MD_OFFICE';
    case 'dashboard.department.read':
      return role === 'MD' || role === 'MD_OFFICE' || role === 'DEPARTMENT_HEAD' || role === 'MANAGER';

    // 2. Strategy & Priorities
    case 'quarterly_direction.read':
    case 'priority.read':
    case 'milestone.read':
    case 'objective.read':
      return true; // All authenticated users can view strategy hierarchy

    case 'quarterly_direction.create':
    case 'objective.create':
      return role === 'MD' || role === 'MD_OFFICE';

    case 'priority.create':
    case 'priority.change':
    case 'priority.activate':
      return role === 'MD' || role === 'MD_OFFICE';

    case 'milestone.create':
    case 'milestone.complete':
      return role === 'MD' || role === 'MD_OFFICE' || role === 'DEPARTMENT_HEAD' || role === 'MANAGER';

    // 3. Commitments
    case 'commitment.read':
      return true;

    case 'commitment.create':
    case 'commitment.submit':
      return role !== 'EMPLOYEE';

    case 'commitment.approve':
    case 'commitment.completion.approve':
      return role === 'MD' || role === 'MD_OFFICE' || role === 'DEPARTMENT_HEAD';

    case 'commitment.owner.change':
    case 'commitment.deadline.change':
    case 'commitment.priority.change':
    case 'commitment.reopen':
      return role === 'MD' || role === 'MD_OFFICE';

    // 4. Tasks & RACI
    case 'task.read':
    case 'raci.read':
      return true;

    case 'task.create':
      return true; // Employee can create self-task; others by scope

    case 'task.assign':
    case 'task.deadline.change':
    case 'task.priority.change':
      return role !== 'EMPLOYEE'; // Employee cannot reassign others or alter official deadlines

    case 'task.complete':
      return true; // Assignee can complete normal task

    case 'task.reopen':
      return role !== 'EMPLOYEE';

    case 'raci.manage':
      return role !== 'EMPLOYEE';

    // 5. Stuck / Need & Escalations
    case 'stuck.read':
    case 'stuck.create':
      return true;

    case 'stuck.resolve':
      return role !== 'EMPLOYEE';

    case 'escalation.read':
    case 'escalation.create':
      return true;

    case 'escalation.acknowledge':
    case 'escalation.resolve':
      return role === 'MD' || role === 'MD_OFFICE' || role === 'DEPARTMENT_HEAD' || role === 'MANAGER';

    // 6. Meetings & Decisions
    case 'meeting.read':
    case 'decision.read':
      return true;

    case 'meeting.create':
    case 'meeting.complete':
    case 'decision.create':
      return role !== 'EMPLOYEE';

    case 'decision.approve':
      return role === 'MD' || role === 'MD_OFFICE';

    // 7. Organization & Audit
    case 'user.read':
    case 'department.read':
    case 'role.read':
      return true;

    case 'user.create':
    case 'user.update':
    case 'department.create':
    case 'role.assign':
    case 'audit.read':
    case 'audit.export':
      return role === 'MD' || role === 'MD_OFFICE';

    default:
      return false;
  }
}
