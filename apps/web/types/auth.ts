export type Persona = 'MD' | 'MD_OFFICE' | 'DEPARTMENT_HEAD' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Persona;
  roleTitle: string;
  departmentId: string;
  departmentName: string;
  avatarUrl?: string;
}

export type Capability =
  | 'user.read'
  | 'user.create'
  | 'user.update'
  | 'department.read'
  | 'department.create'
  | 'role.read'
  | 'role.assign'
  | 'objective.read'
  | 'objective.create'
  | 'quarterly_direction.read'
  | 'quarterly_direction.create'
  | 'priority.read'
  | 'priority.create'
  | 'priority.change'
  | 'priority.activate'
  | 'milestone.read'
  | 'milestone.create'
  | 'milestone.complete'
  | 'meeting.read'
  | 'meeting.create'
  | 'meeting.complete'
  | 'decision.read'
  | 'decision.create'
  | 'decision.approve'
  | 'commitment.read'
  | 'commitment.create'
  | 'commitment.submit'
  | 'commitment.approve'
  | 'commitment.owner.change'
  | 'commitment.deadline.change'
  | 'commitment.priority.change'
  | 'commitment.completion.approve'
  | 'commitment.reopen'
  | 'task.read'
  | 'task.create'
  | 'task.assign'
  | 'task.deadline.change'
  | 'task.priority.change'
  | 'task.complete'
  | 'task.reopen'
  | 'raci.read'
  | 'raci.manage'
  | 'stuck.read'
  | 'stuck.create'
  | 'stuck.resolve'
  | 'escalation.read'
  | 'escalation.create'
  | 'escalation.acknowledge'
  | 'escalation.resolve'
  | 'dashboard.md.read'
  | 'dashboard.department.read'
  | 'audit.read'
  | 'audit.export';

export interface AuthSession {
  user: User;
  isAuthenticated: boolean;
  csrfToken: string;
}
