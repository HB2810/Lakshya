export type PriorityStatus = 'DRAFT' | 'ACTIVE' | 'AT_RISK' | 'BLOCKED' | 'COMPLETED';

export type MilestoneStepStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'BLOCKED';

export interface MilestoneStep {
  stepNumber: number; // 1 to 10
  title: string;
  description: string;
  ownerName: string;
  targetDate: string;
  completedAt?: string;
  status: MilestoneStepStatus;
  keyDeliverable: string;
  verificationNotes?: string;
}

export interface QuarterlyPriority {
  id: string;
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  title: string;
  description: string;
  strategicObjective: string;
  reportingAuthority: string;
  department: string;
  status: PriorityStatus;
  progressPercent: number;
  currentStep: number; // 1 to 10
  targetDate: string;
  milestones: MilestoneStep[]; // Exactly 10 milestones representing sequential rollout
}

export interface QuarterlyDirection extends QuarterlyPriority {}

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
