import { DEMO_USERS, MOCK_DEPARTMENTS, MOCK_ROLES, MOCK_AUDIT_EVENTS } from '../mocks/organizationMock';
import { MOCK_QUARTERLY_DIRECTIONS, MOCK_MONTHLY_PRIORITIES, MOCK_WEEKLY_MILESTONES } from '../mocks/strategyMock';
import { MOCK_COMMITMENTS, MOCK_TASKS, MOCK_STUCK_NEEDS, MOCK_ESCALATIONS } from '../mocks/executionMock';
import { MOCK_MEETINGS, MOCK_DECISIONS, meetingStore } from '../mocks/meetingsMock';
import { workItemStore } from '../mocks/workItemMock';
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
import {
  AgendaItemCreatePayload,
  DecisionCreatePayload,
  Meeting,
  MeetingAgendaItem,
  MeetingCreatePayload,
  MeetingDecision,
  MeetingDetail,
  MeetingListResponse,
} from '../../types/meeting';

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
          const fallbackUser = DEMO_USERS.EMPLOYEE;
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
            roles: ['employee'],
            permissions: [
              'user.read', 'department.read', 'task.read', 'task.create', 'task.complete', 'stuck.create'
            ],
            department_ids: [fallbackUser.departmentId],
            must_change_password: false,
          };
          return { response: mockResponse, user: mapBackendUserToFrontendUser(mockResponse) };
        }
        throw err;
      }
    },

    async login(emailOrId: string, password?: string, organization_slug?: string): Promise<{ response: CurrentUserResponse; user: User }> {
      try {
        const body: Record<string, string> = { email: emailOrId, password: password || '1234' };
        if (organization_slug) {
          body.organization_slug = organization_slug;
        }
        const data = await apiFetch<CurrentUserResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return { response: data, user: mapBackendUserToFrontendUser(data) };
      } catch (err: unknown) {
        // Fallback for dev demo when backend is offline
        if (process.env.NODE_ENV === 'development') {
          const normalized = emailOrId.trim().toUpperCase();
          
          // Validate credentials: STAVYANS-101 with password 1234
          if (normalized === 'STAVYANS-101' || normalized === 'PRIYESH.SHAH@STAVYASPINE.COM') {
            if (password && password !== '1234' && password !== '••••••••••••') {
              throw new Error('Invalid password for STAVYANS-101. (Expected: 1234)');
            }
            const demoUser = DEMO_USERS.STAVYANS;
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
              roles: ['stavyans', 'employee'],
              permissions: [
                'user.read', 'department.read', 'task.read', 'task.create', 'task.complete', 'stuck.create'
              ],
              department_ids: [demoUser.departmentId],
              must_change_password: false,
            };
            return { response: mockResponse, user: mapBackendUserToFrontendUser(mockResponse) };
          }

          // Check if it matches any other supported system role
          const matchKey = Object.keys(DEMO_USERS).find(
            k => DEMO_USERS[k].email.toUpperCase() === normalized || k.toUpperCase() === normalized
          );

          if (matchKey && DEMO_USERS[matchKey]) {
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

          throw new Error('Invalid Staff ID / Username. Please use STAVYANS-101 and password 1234.');
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

    async verify(id: string, note?: string): Promise<WorkItem> {
      const query = note ? `?note=${encodeURIComponent(note)}` : '';
      return await apiFetch<WorkItem>(`/work-items/${id}/verify${query}`, {
        method: 'POST',
      });
    },

    escalations: {
      async inbox(): Promise<any[]> {
        return await apiFetch<any[]>('/work-items/escalations/inbox', { method: 'GET' });
      },
      async resolve(id: string, payload: { resolution_note?: string }): Promise<any> {
        return await apiFetch<any>(`/work-items/escalations/${id}/resolve`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    }
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
    async list(status?: string): Promise<MeetingListResponse> {
      try {
        const query = status ? `?status=${encodeURIComponent(status)}` : '';
        return await apiFetch<MeetingListResponse>(`/meetings${query}`, { method: 'GET' });
      } catch {
        const items = meetingStore.getMeetings();
        const filtered = status ? items.filter(m => m.status === status) : items;
        return { items: filtered, total: filtered.length };
      }
    },

    async create(payload: MeetingCreatePayload): Promise<Meeting> {
      try {
        return await apiFetch<Meeting>('/meetings', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch {
        // Fallback for Phase 3: Create local meeting item and enqueue real Phase 3 calendar event if possible
        const newMeeting = meetingStore.addMeeting(payload);
        try {
          const startTimeIso = new Date(`${payload.meeting_date}T10:00:00Z`).toISOString();
          const endTimeIso = new Date(new Date(`${payload.meeting_date}T10:00:00Z`).getTime() + (payload.duration_minutes || 60) * 60000).toISOString();
          await apiClient.calendar.createEvent({
            title: payload.title,
            description: `Scheduled Operational Meeting (${payload.location || 'MD Office Boardroom'})`,
            event_type: 'LAKSHYA_MEETING',
            start_time: startTimeIso,
            end_time: endTimeIso,
            timezone: 'Asia/Kolkata',
            provider: 'LAKSHYA',
          });
        } catch {
          // Ignore if calendar event creation fails or lacks permission
        }
        return newMeeting;
      }
    },

    async getDetail(id: string): Promise<MeetingDetail> {
      try {
        return await apiFetch<MeetingDetail>(`/meetings/${id}`, { method: 'GET' });
      } catch {
        const m = meetingStore.getMeetings().find(item => item.id === id) || MOCK_MEETINGS[0];
        return {
          meeting: m,
          agenda: [],
          decisions: [],
          summary: null,
        };
      }
    },

    async addAgenda(id: string, payload: AgendaItemCreatePayload): Promise<MeetingAgendaItem> {
      return await apiFetch<MeetingAgendaItem>(`/meetings/${id}/agenda`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async logDecision(id: string, payload: DecisionCreatePayload): Promise<MeetingDecision> {
      return await apiFetch<MeetingDecision>(`/meetings/${id}/decisions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async extractWork(id: string): Promise<StructuredPlanRecommendation> {
      return await apiFetch<StructuredPlanRecommendation>(`/meetings/${id}/extract-work`, {
        method: 'POST',
      });
    },
  },

  organization: {
    async getDepartments() {
      const data = await apiFetch<{items: any[]}>('/departments', { method: 'GET' });
      return data.items;
    },
    async getUsers() {
      const data = await apiFetch<{items: any[]}>('/users', { method: 'GET' });
      return data.items;
    },
    async treeScoped() {
      // For now, if the backend fails or doesn't have it, we return a mock fallback 
      // or try to fetch from the actual endpoint.
      try {
        const response = await apiFetch<any>('/organizations/tree/scoped', { method: 'GET' });
        return response;
      } catch {
        return null; // Handle fallback gracefully in component
      }
    },
    async getRoles() {
      const data = await apiFetch<{items: any[]}>('/roles', { method: 'GET' });
      return data.items;
    },
    async getAuditEvents() {
      return MOCK_AUDIT_EVENTS; // Mock fallback kept as no v1 audit endpoint exists
    },
  },

  calendar: {
    async getEvents(params?: { start_time?: string; end_time?: string; event_type?: string }) {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      const url = `/calendar/events${query ? `?${query}` : ''}`;
      return await apiFetch<any[]>(url, { method: 'GET' });
    },
    async createEvent(payload: any) {
      return await apiFetch<any>('/calendar/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async getIntegrationStatus() {
      return await apiFetch<any>('/calendar/integrations', { method: 'GET' });
    },
  },
};
