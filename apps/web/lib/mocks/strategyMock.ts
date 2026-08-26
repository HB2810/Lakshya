import { QuarterlyDirection, MonthlyPriority, WeeklyMilestone } from '../../types/strategy';

export let MOCK_QUARTERLY_DIRECTIONS: QuarterlyDirection[] = [];
export let MOCK_MONTHLY_PRIORITIES: MonthlyPriority[] = [];
export let MOCK_WEEKLY_MILESTONES: WeeklyMilestone[] = [];

type Listener = () => void;
const listeners: Set<Listener> = new Set();

const notify = () => {
  listeners.forEach(fn => fn());
};

export const strategyStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getQuarterlyDirections() {
    return MOCK_QUARTERLY_DIRECTIONS;
  },

  getMonthlyPriorities() {
    return MOCK_MONTHLY_PRIORITIES;
  },

  getWeeklyMilestones() {
    return MOCK_WEEKLY_MILESTONES;
  },

  addQuarterlyDirection(newDir: Partial<QuarterlyDirection>): QuarterlyDirection {
    const id = `qd-${Date.now()}`;
    const direction: QuarterlyDirection = {
      id,
      year: newDir.year || 2026,
      quarter: newDir.quarter || 'Q3',
      title: newDir.title || 'Untitled Strategic Direction',
      description: newDir.description || '',
      objective: newDir.objective || '',
      progressPercent: 0,
      status: 'ACTIVE',
      targetDate: newDir.targetDate || '2026-09-30',
    };
    MOCK_QUARTERLY_DIRECTIONS.unshift(direction);
    notify();
    return direction;
  },

  addMonthlyPriority(newPriority: Partial<MonthlyPriority>): MonthlyPriority {
    const id = `mp-${Date.now()}`;
    const priority: MonthlyPriority = {
      id,
      quarterlyDirectionId: newPriority.quarterlyDirectionId || 'qd-default',
      month: newPriority.month || 'August 2026',
      title: newPriority.title || 'Untitled Monthly Priority',
      description: newPriority.description || '',
      ownerId: newPriority.ownerId || 'usr-mgr-004',
      ownerName: newPriority.ownerName || 'Ananya Patel',
      departmentId: newPriority.departmentId || 'dept-ops',
      departmentName: newPriority.departmentName || 'Operations',
      status: 'ACTIVE',
      progressPercent: 0,
      targetCompletionDate: newPriority.targetCompletionDate || '2026-08-31',
      milestonesCount: 0,
      commitmentsCount: 0,
    };
    MOCK_MONTHLY_PRIORITIES.unshift(priority);
    notify();
    return priority;
  },

  resetToZero() {
    MOCK_QUARTERLY_DIRECTIONS = [];
    MOCK_MONTHLY_PRIORITIES = [];
    MOCK_WEEKLY_MILESTONES = [];
    notify();
  },
};
