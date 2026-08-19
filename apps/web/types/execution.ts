export type ExecutionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'AT_RISK'
  | 'BLOCKED'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'CANCELLED';

export type ExecutionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RACIRole = 'R' | 'A' | 'C' | 'I';

export interface RACIMember {
  userId: string;
  userName: string;
  userRoleTitle: string;
  departmentName: string;
  role: RACIRole;
}

export interface Commitment {
  id: string;
  code: string; // e.g. "CM-2026-089"
  title: string;
  description: string;
  monthlyPriorityId?: string;
  weeklyMilestoneId?: string;
  sourceType: 'MD_INSTRUCTION' | 'MEETING_DECISION' | 'DEPARTMENT_REQUEST' | 'MONTHLY_PRIORITY';
  sourceTitle: string;
  responsibleId: string;
  responsibleName: string;
  accountableId: string;
  accountableName: string;
  raci: RACIMember[];
  priority: ExecutionPriority;
  status: ExecutionStatus;
  progressPercent: number;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  outcome?: string;
  isStuck: boolean;
  stuckReason?: string;
  escalationLevel?: number; // 0, 1, 2, 3
}

export interface Task {
  id: string;
  code: string; // e.g. "TK-2026-402"
  commitmentId?: string;
  weeklyMilestoneId?: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assigneeRoleTitle: string;
  departmentId: string;
  departmentName: string;
  raci: RACIMember[];
  priority: ExecutionPriority;
  status: ExecutionStatus;
  progressPercent: number;
  dueDate: string;
  estimatedHours?: number;
  loggedHours?: number;
  isStuck: boolean;
  stuckNeedId?: string;
  hasDependency: boolean;
  prerequisiteTaskIds?: string[];
}

export interface StuckNeedItem {
  id: string;
  taskId: string;
  taskTitle: string;
  reportedByUserId: string;
  reportedByUserName: string;
  stuckReasonCategory:
    | 'WAITING_PERSON'
    | 'WAITING_DECISION'
    | 'WAITING_INFO'
    | 'VENDOR_DELAY'
    | 'TECHNICAL'
    | 'RESOURCE'
    | 'APPROVAL'
    | 'DEPENDENCY';
  stuckReasonDetails: string;
  needDescription: string;
  providedByUserId: string;
  providedByUserName: string;
  requiredByDate: string;
  businessImpact: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface Escalation {
  id: string;
  code: string; // e.g. "ESC-042"
  targetType: 'TASK' | 'COMMITMENT' | 'STUCK_NEED';
  targetId: string;
  targetTitle: string;
  level: 0 | 1 | 2 | 3; // L0=Normal, L1=Attention, L2=Escalated, L3=MD Attention
  levelName: string;
  reason: string;
  impact: string;
  reportedByUserId: string;
  reportedByUserName: string;
  assignedToUserId: string;
  assignedToUserName: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionSummary?: string;
}
