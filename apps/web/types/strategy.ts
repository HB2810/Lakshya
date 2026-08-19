export type PriorityStatus = 'DRAFT' | 'ACTIVE' | 'AT_RISK' | 'BLOCKED' | 'COMPLETED';

export interface QuarterlyDirection {
  id: string;
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  title: string;
  description: string;
  objective: string;
  progressPercent: number;
  status: 'ACTIVE' | 'COMPLETED' | 'AT_RISK';
  targetDate: string;
}

export interface MonthlyPriority {
  id: string;
  quarterlyDirectionId: string;
  month: string; // e.g. "August 2026"
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  departmentId: string;
  departmentName: string;
  status: PriorityStatus;
  progressPercent: number;
  targetCompletionDate: string;
  milestonesCount: number;
  commitmentsCount: number;
  oAndOSourceId?: string;
}

export interface WeeklyMilestone {
  id: string;
  monthlyPriorityId: string;
  weekNumber: number; // 1-52
  weekLabel: string; // e.g. "Week 34 (Aug 17 - Aug 23)"
  title: string;
  ownerId: string;
  ownerName: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'AT_RISK' | 'BLOCKED' | 'COMPLETED';
  dueDate: string;
  completionOutcome?: string;
  tasksCount: number;
}
