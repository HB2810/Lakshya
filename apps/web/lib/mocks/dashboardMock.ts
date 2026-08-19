import { MOCK_QUARTERLY_DIRECTIONS, MOCK_MONTHLY_PRIORITIES, MOCK_WEEKLY_MILESTONES } from './strategyMock';
import { MOCK_COMMITMENTS, MOCK_TASKS, MOCK_STUCK_NEEDS, MOCK_ESCALATIONS } from './executionMock';
import { MOCK_MEETINGS, MOCK_DECISIONS } from './meetingsMock';
import { MOCK_AUDIT_EVENTS } from './organizationMock';

export function getMDOverviewData() {
  const activePriorities = MOCK_MONTHLY_PRIORITIES.filter(p => p.status === 'ACTIVE');
  const completedMilestones = MOCK_WEEKLY_MILESTONES.filter(m => m.status === 'COMPLETED');
  const milestonesPercent = MOCK_WEEKLY_MILESTONES.length > 0 
    ? Math.round((completedMilestones.length / MOCK_WEEKLY_MILESTONES.length) * 100) 
    : 0;

  const currentDirection = MOCK_QUARTERLY_DIRECTIONS[0] || {
    id: 'qd-zero',
    year: 2026,
    quarter: 'Q3',
    title: 'No Active Strategic Direction Set',
    description: 'Create a new quarterly direction or monthly priority to begin organizational tracking.',
    objective: 'Define initial executive targets for Stavya Spine Hospital.',
    progressPercent: 0,
    status: 'ACTIVE',
    targetDate: '2026-09-30',
  };

  return {
    greeting: 'Good afternoon, Executive Leadership',
    roleLabel: 'LAKSHYA MD Office Operating System — Active Workspace',
    currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    direction: currentDirection,
    priorities: MOCK_MONTHLY_PRIORITIES,
    milestones: MOCK_WEEKLY_MILESTONES,
    commitments: MOCK_COMMITMENTS,
    tasks: MOCK_TASKS,
    stuckNeeds: MOCK_STUCK_NEEDS,
    escalations: MOCK_ESCALATIONS,
    upcomingMeetings: MOCK_MEETINGS.filter(m => m.status === 'SCHEDULED'),
    pendingDecisions: MOCK_DECISIONS.filter(d => d.status === 'PENDING_APPROVAL' || d.status === 'APPROVED'),
    recentActivities: MOCK_AUDIT_EVENTS,
    stats: {
      activePrioritiesCount: activePriorities.length,
      milestonesCompletionPercent: milestonesPercent,
      commitmentsCount: MOCK_COMMITMENTS.length,
      overdueItemsCount: MOCK_TASKS.filter(t => t.status === 'OVERDUE').length,
      blockedItemsCount: MOCK_STUCK_NEEDS.length,
      escalationsCount: MOCK_ESCALATIONS.length,
    },
  };
}
