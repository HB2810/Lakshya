import { MOCK_QUARTERLY_DIRECTIONS, MOCK_MONTHLY_PRIORITIES, MOCK_WEEKLY_MILESTONES } from './strategyMock';
import { MOCK_COMMITMENTS, MOCK_TASKS, MOCK_STUCK_NEEDS, MOCK_ESCALATIONS } from './executionMock';
import { MOCK_MEETINGS, MOCK_DECISIONS } from './meetingsMock';
import { MOCK_AUDIT_EVENTS } from './organizationMock';

export function getMDOverviewData() {
  return {
    greeting: 'Good morning, Managing Director',
    roleLabel: 'Managing Director & MD Office Operating View',
    currentDate: 'Tuesday, 18 August 2026',
    direction: MOCK_QUARTERLY_DIRECTIONS[0],
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
      activePrioritiesCount: MOCK_MONTHLY_PRIORITIES.filter(p => p.status === 'ACTIVE').length,
      milestonesCompletionPercent: 66,
      commitmentsCount: MOCK_COMMITMENTS.length,
      overdueItemsCount: 1,
      blockedItemsCount: MOCK_STUCK_NEEDS.length,
      escalationsCount: MOCK_ESCALATIONS.length,
    },
  };
}
