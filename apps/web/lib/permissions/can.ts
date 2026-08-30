import { Capability, User } from '../../types/auth';

/**
 * Frontend Permission Evaluator (UX helper only; backend enforces authorization).
 * Evaluates whether a given user possesses the requested capability based on
 * official RBAC rules in `RBAC.md` and `BUSINESS_RULES_V0.1.md`.
 */
export function can(capability: Capability, user: User | null): boolean {
  if (!user) return false;

  const { role } = user;
  const isMD = role === 'MD' || role === 'MANAGING_DIRECTOR' || role === 'MD_OFFICE';
  const isAdmin = role === 'ADMIN' || role === 'MASTER';
  const isLeader = role === 'LEADER' || role === 'LEADERS' || role === 'DEPARTMENT_HEAD' || role === 'MANAGER';
  const isHR = role === 'HR';
  const isStaff = role === 'STAVYANS' || role === 'STAVYAN';

  if (isAdmin) return true; // Master Admin has full platform access

  switch (capability) {
    // 1. Dashboards
    case 'dashboard.md.read':
      return isMD;
    case 'dashboard.department.read':
      return isMD || isLeader || isHR;

    // 2. Strategy & Priorities
    case 'quarterly_direction.read':
    case 'priority.read':
    case 'milestone.read':
    case 'objective.read':
      return true; // All authenticated users can view strategy hierarchy

    case 'quarterly_direction.create':
    case 'objective.create':
    case 'priority.create':
    case 'priority.change':
    case 'priority.activate':
      return isMD;

    case 'milestone.create':
    case 'milestone.complete':
      return isMD || isLeader;

    // 3. Commitments
    case 'commitment.read':
      return true;

    case 'commitment.create':
    case 'commitment.submit':
      return !isStaff;

    case 'commitment.approve':
    case 'commitment.completion.approve':
      return isMD || isLeader;

    case 'commitment.owner.change':
    case 'commitment.deadline.change':
    case 'commitment.priority.change':
    case 'commitment.reopen':
      return isMD;

    // 4. Tasks, RACI & Team Leadership Execution
    case 'task.read':
    case 'raci.read':
      return true;

    case 'task.create':
      return true; // Staff can create self-task; others by scope

    case 'task.assign':
    case 'task.deadline.change':
    case 'task.priority.change':
    case 'team.tasks.delegate':
      return !isStaff; // Incharges, Leaders, MD, Admin can delegate tasks

    case 'task.complete':
      return true; // Assignee can complete normal task

    case 'team.tasks.verify':
    case 'team.tasks.audit':
    case 'commitment.completion.approve':
      return isMD || isLeader; // Incharges, Leaders, and Governance can verify and audit

    case 'team.tasks.view_all':
      return isMD; // Full hospital-wide macro visibility

    case 'team.tasks.realtime_progress':
      return !isStaff; // Leaders, HODs, Incharges, Governance see real-time team progress

    case 'task.reopen':
    case 'raci.manage':
      return !isStaff;

    // 5. Stuck / Need & Escalations
    case 'stuck.read':
    case 'stuck.create':
      return true;

    case 'stuck.resolve':
      return !isStaff;

    case 'escalation.read':
    case 'escalation.create':
      return true;

    case 'escalation.acknowledge':
    case 'escalation.resolve':
      return isMD || isLeader;

    // 6. Meetings & Decisions
    case 'meeting.read':
    case 'decision.read':
      return true;

    case 'meeting.create':
    case 'meeting.complete':
    case 'decision.create':
      return !isStaff;

    case 'decision.approve':
      return isMD;

    // 7. Organization & Audit
    case 'user.read':
    case 'department.read':
    case 'role.read':
      return true;

    case 'user.create':
    case 'user.update':
      return isMD || isHR;

    case 'department.create':
    case 'role.assign':
    case 'audit.read':
    case 'audit.export':
      return isMD;

    default:
      return false;
  }
}
