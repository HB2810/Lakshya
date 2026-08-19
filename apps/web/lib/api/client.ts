import { DEMO_USERS, MOCK_DEPARTMENTS, MOCK_ROLES, MOCK_AUDIT_EVENTS } from '../mocks/organizationMock';
import { MOCK_QUARTERLY_DIRECTIONS, MOCK_MONTHLY_PRIORITIES, MOCK_WEEKLY_MILESTONES } from '../mocks/strategyMock';
import { MOCK_COMMITMENTS, MOCK_TASKS, MOCK_STUCK_NEEDS, MOCK_ESCALATIONS } from '../mocks/executionMock';
import { MOCK_MEETINGS, MOCK_DECISIONS } from '../mocks/meetingsMock';
import { getMDOverviewData } from '../mocks/dashboardMock';

/**
 * Service Layer Client for LAKSHYA Frontend.
 * Currently uses Mock Adapters. In Phase 2, this will route requests to FastAPI.
 */
export const apiClient = {
  auth: {
    async getMe(personaKey = 'MD') {
      return DEMO_USERS[personaKey] || DEMO_USERS.MD;
    },
    async login(email: string) {
      const match = Object.values(DEMO_USERS).find(u => u.email === email);
      return match || DEMO_USERS.MD;
    },
  },

  dashboard: {
    async getMDOverview() {
      return getMDOverviewData();
    },
  },

  strategy: {
    async getQuarterlyDirections() {
      return MOCK_QUARTERLY_DIRECTIONS;
    },
    async getMonthlyPriorities() {
      return MOCK_MONTHLY_PRIORITIES;
    },
    async getWeeklyMilestones() {
      return MOCK_WEEKLY_MILESTONES;
    },
  },

  execution: {
    async getCommitments() {
      return MOCK_COMMITMENTS;
    },
    async getTasks() {
      return MOCK_TASKS;
    },
    async getStuckNeeds() {
      return MOCK_STUCK_NEEDS;
    },
    async getEscalations() {
      return MOCK_ESCALATIONS;
    },
  },

  meetings: {
    async getMeetings() {
      return MOCK_MEETINGS;
    },
    async getDecisions() {
      return MOCK_DECISIONS;
    },
  },

  organization: {
    async getDepartments() {
      return MOCK_DEPARTMENTS;
    },
    async getUsers() {
      return Object.values(DEMO_USERS);
    },
    async getRoles() {
      return MOCK_ROLES;
    },
    async getAuditEvents() {
      return MOCK_AUDIT_EVENTS;
    },
  },
};
