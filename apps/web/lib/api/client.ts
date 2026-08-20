import { DEMO_USERS, MOCK_DEPARTMENTS, MOCK_ROLES, MOCK_AUDIT_EVENTS } from '../mocks/organizationMock';
import { MOCK_QUARTERLY_DIRECTIONS, MOCK_MONTHLY_PRIORITIES, MOCK_WEEKLY_MILESTONES } from '../mocks/strategyMock';
import { MOCK_COMMITMENTS, MOCK_TASKS, MOCK_STUCK_NEEDS, MOCK_ESCALATIONS } from '../mocks/executionMock';
import { MOCK_MEETINGS, MOCK_DECISIONS } from '../mocks/meetingsMock';
import { getMDOverviewData } from '../mocks/dashboardMock';
import { CurrentUserResponse, Persona, User } from '../../types/auth';
import {
  ApprovePlanPayload,
  StructuredPlanRecommendation,
  WorkItem,
  WorkItemListResponse,
  WorkItemPatchPayload,
} from '../../types/workItem';

/**
 * Extract CSRF token from document cookies (lakshya_csrf).
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )\s*lakshya_csrf\s*=\s*([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Map FastAPI CurrentUserResponse to Frontend User object.
 */
export function mapBackendUserToFrontendUser(res: CurrentUserResponse): User {
  const roleMap: Record<string, Persona> = {
    md: 'MD',
    md_office: 'MD_OFFICE',
    department_head: 'DEPARTMENT_HEAD',
    manager: 'MANAGER',
    employee: 'EMPLOYEE',
  };

  const primaryRoleKey = (res.roles[0] || 'employee').toLowerCase();
  const primaryRole: Persona = roleMap[primaryRoleKey] || 'EMPLOYEE';

  return {
    id: res.user.id,
    name: res.user.full_name || res.user.email,
    email: res.user.email,
    role: primaryRole,
    roleTitle: res.roles.join(', ').toUpperCase() || 'User',
    departmentId: res.user.department_id || (res.department_ids[0] ?? ''),
    departmentName: 'Stavya Spine Hospital',
    roles: res.roles,
    permissions: res.permissions,
    organizationId: res.organization_id,
    organizationSlug: res.organization_slug,
    mustChangePassword: res.must_change_password,
  };
}

const API_BASE_URL = typeof window !== 'undefined' ? '/api/v1' : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + '/api/v1';

/**
 * Helper fetch wrapper with credentials and CSRF injection.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const csrfToken = getCsrfToken();
  if (csrfToken && options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || errorDetail;
    } catch {
      // ignore json parse error
    }
    const error: Error & { status?: number; code?: string } = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Service Layer Client for LAKSHYA Frontend.
 * Integrates with FastAPI auth endpoints with fallback for offline demo development.
 */
export const apiClient = {
  auth: {
    async getMe(): Promise<{ response: CurrentUserResponse; user: User }> {
      try {
        const data = await apiFetch<CurrentUserResponse>('/auth/me', { method: 'GET' });
        return { response: data, user: mapBackendUserToFrontendUser(data) };
      } catch (err: unknown) {
        const error = err as { status?: number };
        if (error.status === 401) {
          throw error;
        }
        // Fallback for dev mode when backend is unreachable
        if (process.env.NODE_ENV === 'development') {
          const fallbackUser = DEMO_USERS.MD;
          const mockResponse: CurrentUserResponse = {
            user: {
              id: fallbackUser.id,
              email: fallbackUser.email,
              full_name: fallbackUser.name,
              is_active: true,
              organization_id: 'org-stavya-001',
            },
            organization_id: 'org-stavya-001',
            organization_slug: 'stavya-spine',
            session: {
              id: 'sess-dev-001',
              issued_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              last_activity_at: new Date().toISOString(),
            },
            roles: ['md'],
            permissions: [
              'user.read', 'user.create', 'department.read', 'objective.read',
              'priority.read', 'priority.create', 'milestone.read', 'meeting.read',
              'decision.read', 'commitment.read', 'task.read', 'dashboard.md.read',
              'organization.read', 'identity.user.read'
            ],
            department_ids: [fallbackUser.departmentId],
            must_change_password: false,
          };
          return { response: mockResponse, user: mapBackendUserToFrontendUser(mockResponse) };
        }
        throw err;
      }
    },

    async login(email: string, password?: string, organization_slug?: string): Promise<{ response: CurrentUserResponse; user: User }> {
      try {
        const body: Record<string, string> = { email, password: password || 'password' };
        if (organization_slug) {
          body.organization_slug = organization_slug;
        }
        const data = await apiFetch<CurrentUserResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return { response: data, user: mapBackendUserToFrontendUser(data) };
      } catch (err: unknown) {
        // Fallback for dev demo quick login when backend returns 401 or network error
        if (process.env.NODE_ENV === 'development') {
          const matchKey = (Object.keys(DEMO_USERS).find(k => DEMO_USERS[k as Persona].email === email) || 'MD') as Persona;
          const demoUser = DEMO_USERS[matchKey];
          const mockResponse: CurrentUserResponse = {
            user: {
              id: demoUser.id,
              email: demoUser.email,
              full_name: demoUser.name,
              is_active: true,
              organization_id: 'org-stavya-001',
            },
            organization_id: 'org-stavya-001',
            organization_slug: 'stavya-spine',
            session: {
              id: `sess-${demoUser.id}`,
              issued_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              last_activity_at: new Date().toISOString(),
            },
            roles: [demoUser.role.toLowerCase()],
            permissions: [
              'user.read', 'department.read', 'objective.read', 'priority.read',
              'milestone.read', 'meeting.read', 'decision.read', 'commitment.read',
              'task.read', 'dashboard.md.read'
            ],
            department_ids: [demoUser.departmentId],
            must_change_password: false,
          };
          return { response: mockResponse, user: mapBackendUserToFrontendUser(mockResponse) };
        }
        throw err;
      }
    },

    async logout(): Promise<void> {
      try {
        await apiFetch<void>('/auth/logout', { method: 'POST' });
      } catch {
        // Silently complete logout housekeeping
      }
    },
  },

  workItems: {
    async intake(text: string): Promise<StructuredPlanRecommendation> {
      return await apiFetch<StructuredPlanRecommendation>('/work-items/intake', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
    },

    async approve(payload: ApprovePlanPayload): Promise<WorkItemListResponse> {
      return await apiFetch<WorkItemListResponse>('/work-items/approve', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async list(filters?: { owner_id?: string; status?: string; parent_id?: string }): Promise<WorkItemListResponse> {
      const queryParams = new URLSearchParams();
      if (filters?.owner_id) queryParams.append('owner_id', filters.owner_id);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.parent_id) queryParams.append('parent_id', filters.parent_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await apiFetch<WorkItemListResponse>(`/work-items${query}`, { method: 'GET' });
    },

    async patch(id: string, patch: WorkItemPatchPayload): Promise<WorkItem> {
      return await apiFetch<WorkItem>(`/work-items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
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
