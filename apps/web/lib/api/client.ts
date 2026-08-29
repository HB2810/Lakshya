import { DEMO_USERS, MOCK_DEPARTMENTS, MOCK_ROLES, MOCK_AUDIT_EVENTS, MOCK_ORG_TREE, getScopedMockOrgTree } from '../mocks/organizationMock';
import { getAllVerifiedHospitalUsers } from '../data/stavyaHospitalOrgData';
import { MOCK_QUARTERLY_DIRECTIONS, MOCK_MONTHLY_PRIORITIES, MOCK_WEEKLY_MILESTONES, strategyStore } from '../mocks/strategyMock';
import { QuarterlyPriority, MilestoneStep } from '../../types/strategy';
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
  WorkItemRACI,
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
    managing_director: 'MD',
    md_office: 'MD_OFFICE',
    department_head: 'DEPARTMENT_HEAD',
    manager: 'MANAGER',
    leader: 'LEADER',
    leaders: 'LEADER',
    master: 'MASTER',
    admin: 'MASTER',
    stavyan: 'STAVYAN',
    stavyans: 'STAVYAN',
  };

  const primaryRoleKey = (res.roles[0] || 'stavyan').toLowerCase();
  const primaryRole: Persona = roleMap[primaryRoleKey] || 'STAVYAN';

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

let backendOfflineUntil = 0;

export function isBackendOffline(): boolean {
  return Date.now() < backendOfflineUntil;
}

export function markBackendOffline(seconds = 30): void {
  backendOfflineUntil = Date.now() + seconds * 1000;
}

function shouldUseLocalFallback(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === undefined || status >= 500;
}

function mapBackendWorkItem(item: any): WorkItem {
  return {
    ...item,
    progressPercent: item.progressPercent ?? item.progress_percent ?? 0,
    blocker_details: item.blocker_details ? {
      ...item.blocker_details,
      needDescription: item.blocker_details.needDescription ?? item.blocker_details.need_description,
      helpedByPersonOrDept: item.blocker_details.helpedByPersonOrDept ?? item.blocker_details.helped_by_person_or_dept,
      reportedAt: item.blocker_details.reportedAt ?? item.blocker_details.reported_at,
    } : item.blocker_details,
    activity_history: (item.activity_history || []).map((activity: any) => ({
      ...activity,
      timestamp: activity.timestamp ?? activity.created_at,
      authorId: activity.authorId ?? activity.author_id,
      authorName: activity.authorName ?? activity.author_name,
      type: activity.type ?? activity.activity_type,
      previousStatus: activity.previousStatus ?? activity.previous_status,
      newStatus: activity.newStatus ?? activity.new_status,
      progressPercent: activity.progressPercent ?? activity.progress_percent,
    })),
  } as WorkItem;
}

const API_BASE_URL = typeof window !== 'undefined' ? '/api/v1' : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + '/api/v1';

/**
 * Helper fetch wrapper with credentials and CSRF injection.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (isBackendOffline()) {
    const error: Error & { status?: number } = new Error('Backend is currently offline (Circuit Breaker active)');
    error.status = 503;
    throw error;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const csrfToken = getCsrfToken();
  if (csrfToken && options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (networkErr) {
    // Backend server on port 8000 is not running or unreachable
    markBackendOffline(30);
    throw networkErr;
  }

  if (!response.ok) {
    if (response.status >= 500) {
      markBackendOffline(30);
    }
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
          const fallbackUser = DEMO_USERS.STAVYAN;
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
            roles: ['stavyan'],
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
      const idKey = emailOrId.trim().toUpperCase();
      const emailMap: Record<string, string> = {
        'STAVYANS-101': 'stavyan@stavya.local',
        'STAVYANS-001': 'md@stavya.local',
        'STAVYANS-002': 'leader@stavya.local',
        'STAVYANS-000': 'master@stavya.local',
        'STAVYAN': 'stavyan@stavya.local',
        'LEADER': 'leader@stavya.local',
        'LEADERS': 'leader@stavya.local',
        'MD': 'md@stavya.local',
        'MD_OFFICE': 'md@stavya.local',
        'MANAGING_DIRECTOR': 'md@stavya.local',
        'MASTER': 'master@stavya.local',
        'ADMIN': 'master@stavya.local',
      };
      const resolvedEmail = emailMap[idKey] || emailOrId.trim();
      const resolvedPassword = (password === '1234' || password === '••••••••••••') ? 'password123' : (password || 'password123');

      try {
        const body: Record<string, string> = { email: resolvedEmail, password: resolvedPassword };
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

          // Validate password if provided in development demo
          if (password && password !== '1234' && password !== 'password123' && password !== '••••••••••••' && password !== 'securepass123') {
            throw new Error('Invalid password. (Expected: 1234)');
          }

          // Alias and Staff ID mapping to DEMO_USERS key
          const aliasMap: Record<string, keyof typeof DEMO_USERS> = {
            'STAVYANS-001': 'MD',
            'MD': 'MD',
            'MD@STAVYA.LOCAL': 'MD',
            'MD@STAVYASPINE.COM': 'MD',
            'MANAGING_DIRECTOR': 'MD',
            'MD_OFFICE': 'MD_OFFICE',
            'HET.BHATT@STAVYASPINE.COM': 'MD_OFFICE',

            'STAVYANS-002': 'LEADER',
            'LEADER': 'LEADER',
            'LEADERS': 'LEADERS',
            'LEADER@STAVYA.LOCAL': 'LEADER',
            'LEADER@STAVYASPINE.COM': 'LEADER',
            'DEPARTMENT_HEAD': 'DEPARTMENT_HEAD',
            'MANAGER': 'MANAGER',
            'ROHAN.SHARMA@STAVYASPINE.COM': 'DEPARTMENT_HEAD',
            'ANANYA.PATEL@STAVYASPINE.COM': 'MANAGER',

            'STAVYANS-101': 'STAVYAN',
            'STAVYAN': 'STAVYAN',
            'STAVYAN@STAVYA.LOCAL': 'STAVYAN',
            'STAVYANS': 'STAVYAN',
            'PRIYESH.SHAH@STAVYASPINE.COM': 'STAVYAN',
            'SUNITA.RAO@STAVYA.LOCAL': 'STAVYAN',

            'STAVYANS-000': 'MASTER',
            'MASTER': 'MASTER',
            'ADMIN': 'ADMIN',
            'MASTER@STAVYA.LOCAL': 'MASTER',
            'ADMIN@STAVYASPINE.COM': 'ADMIN',
            'HR': 'HR',
            'HR@STAVYASPINE.COM': 'HR',
          };

          const matchedKey = aliasMap[normalized] || (
            Object.keys(DEMO_USERS).find(
              k => DEMO_USERS[k].email.toUpperCase() === normalized || k.toUpperCase() === normalized
            ) as keyof typeof DEMO_USERS | undefined
          );

          if (matchedKey && DEMO_USERS[matchedKey]) {
            const demoUser = DEMO_USERS[matchedKey];
            const roleLower = (demoUser.role || 'stavyan').toLowerCase();

            let permissions: string[] = ['user.read', 'department.read', 'task.read', 'task.create', 'task.complete'];
            if (roleLower === 'md' || roleLower === 'managing_director' || roleLower === 'md_office') {
              permissions = [
                'user.read', 'department.read', 'objective.read', 'objective.create',
                'priority.read', 'priority.create', 'milestone.read', 'milestone.create',
                'meeting.read', 'meeting.create', 'decision.read', 'decision.create',
                'commitment.read', 'commitment.create', 'task.read', 'task.create',
                'task.complete', 'dashboard.md.read', 'escalation.read', 'escalation.resolve',
                'decision.approve', 'commitment.approve', 'audit.export'
              ];
            } else if (roleLower === 'leader' || roleLower === 'leaders' || roleLower === 'department_head' || roleLower === 'manager') {
              permissions = [
                'user.read', 'department.read', 'task.read', 'task.create', 'task.complete',
                'task.assign', 'meeting.read', 'priority.read', 'milestone.read', 'stuck.create',
                'stuck.resolve', 'dashboard.department.read'
              ];
            } else if (roleLower === 'master' || roleLower === 'admin') {
              permissions = ['*'];
            }

            const userRoles = (roleLower === 'stavyans' || roleLower === 'stavyan') 
              ? ['stavyans', 'stavyan'] 
              : [roleLower];

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
              roles: userRoles,
              permissions,
              department_ids: [demoUser.departmentId],
              must_change_password: false,
            };
            return { response: mockResponse, user: mapBackendUserToFrontendUser(mockResponse) };
          }

          throw new Error('Invalid Staff ID / Username. Please use STAVYANS-001 (MD), STAVYANS-002 (Leader), STAVYANS-101 (Staff), or STAVYANS-000 (Admin) with password 1234.');
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
      try {
        return await apiFetch<StructuredPlanRecommendation>('/work-items/intake', {
          method: 'POST',
          body: JSON.stringify({ text }),
        });
      } catch (err) {
        console.warn('Backend intake API unavailable, returning local structured plan:', err);
        return {
          plan: {
            title: text.length > 50 ? text.substring(0, 47) + '...' : text,
            priority: 'medium',
            suggested_owner_id: 'usr-stav-101',
            items: [
              {
                client_id: `plan-${Date.now()}-1`,
                title: text,
                priority: 'medium',
              }
            ]
          }
        };
      }
    },

    async approve(payload: ApprovePlanPayload): Promise<WorkItemListResponse> {
      try {
        const created: WorkItem[] = [];
        for (const item of payload.items || []) {
          const result = await apiFetch<any>('/work_items', {
            method: 'POST',
            body: JSON.stringify({
              title: item.title,
              description: item.description || payload.description || payload.title,
              priority: item.priority || payload.priority || 'medium',
              owner_id: item.owner_id || item.suggested_owner_id || payload.owner_id,
              owner_name: item.owner_name,
              due_at: item.due_at || payload.due_at,
              origin_meeting_id: payload.origin_meeting_id,
              source_type: payload.source_type || 'MANUAL',
              source_title: payload.title,
              raci: item.raci,
            }),
          });
          created.push(mapBackendWorkItem(result));
        }
        return { items: created, total: created.length };
      } catch (err) {
        if (!shouldUseLocalFallback(err)) throw err;
        console.warn('Backend work-items approve endpoint unavailable, saving to local store:', err);
        const created: WorkItem[] = [];
        (payload.items || []).forEach(item => {
          const newItem = workItemStore.createWorkItem({
            title: item.title,
            description: item.description || payload.description || payload.title || item.title,
            priority: item.priority || payload.priority || 'medium',
            owner_id: item.owner_id || item.suggested_owner_id || payload.owner_id || 'usr-stav-101',
            owner_name: item.owner_name,
            due_at: item.due_at || payload.due_at,
            source_type: payload.source_type || 'MANUAL',
            source_title: payload.title,
            raci: item.raci,
          });
          created.push(newItem);
        });
        return { items: created, total: created.length };
      }
    },

    async list(filters?: { owner_id?: string; status?: string; parent_id?: string }): Promise<WorkItemListResponse> {
      try {
        const queryParams = new URLSearchParams();
        if (filters?.owner_id) queryParams.append('owner_id', filters.owner_id);
        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.parent_id) queryParams.append('parent_id', filters.parent_id);
        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const items = await apiFetch<any[]>(`/work_items${query}`, { method: 'GET' });
        const mapped = items.map(mapBackendWorkItem);
        return { items: mapped, total: mapped.length };
      } catch (err) {
        if (!shouldUseLocalFallback(err)) throw err;
        console.warn('Backend work-items list unavailable, returning local store work items:', err);
        const items = workItemStore.getWorkItems(filters);
        return { items, total: items.length };
      }
    },

    async create(item: Partial<WorkItem>): Promise<WorkItem> {
      try {
        const result = await apiFetch<any>('/work_items', {
          method: 'POST',
          body: JSON.stringify(item),
        });
        return mapBackendWorkItem(result);
      } catch (err) {
        if (!shouldUseLocalFallback(err)) throw err;
        console.warn('Backend work-items create endpoint unavailable, creating in local store:', err);
        return workItemStore.createWorkItem(item, item.owner_name || 'Assigned Staff');
      }
    },

    async patch(id: string, patch: WorkItemPatchPayload): Promise<WorkItem> {
      try {
        const result = await apiFetch<any>(`/work_items/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        return mapBackendWorkItem(result);
      } catch (err) {
        if (!shouldUseLocalFallback(err)) throw err;
        console.warn('Backend work-items patch unavailable, updating local store:', err);
        if (patch.status) {
          return workItemStore.updateStatus(id, patch.status);
        }
        if (patch.progressPercent !== undefined) {
          return workItemStore.updateProgress(id, patch.progressPercent);
        }
        return workItemStore.patchWorkItem(id, patch);
      }
    },

    async replaceRaci(id: string, raci: WorkItemRACI, reason: string): Promise<WorkItem> {
      try {
        const result = await apiFetch<any>(`/work_items/${id}/raci`, {
          method: 'PUT',
          body: JSON.stringify({ ...raci, reason }),
        });
        return mapBackendWorkItem(result);
      } catch (err) {
        if (!shouldUseLocalFallback(err)) throw err;
        console.warn('Backend RACI endpoint unavailable, updating local work item:', err);
        return workItemStore.patchWorkItem(id, {
          raci,
          update_note: `RACI changed. Reason: ${reason}`,
        });
      }
    },

    async verify(id: string, note?: string): Promise<WorkItem> {
      try {
        const query = note ? `?note=${encodeURIComponent(note)}` : '';
        const result = await apiFetch<any>(`/work_items/${id}/verify${query}`, {
          method: 'POST',
        });
        return mapBackendWorkItem(result);
      } catch (err) {
        if (!shouldUseLocalFallback(err)) throw err;
        console.warn('Backend verify endpoint unavailable, updating locally:', err);
        return workItemStore.updateStatus(id, 'completed', 'Leader', note);
      }
    },

    escalations: {
      async inbox(): Promise<any[]> {
        try {
          return await apiFetch<any[]>('/work_items/escalations/inbox', { method: 'GET' });
        } catch (err) {
          console.warn('Backend escalations inbox unavailable, returning empty inbox:', err);
          return [];
        }
      },
      async resolve(id: string, payload: { resolution_note?: string }): Promise<any> {
        try {
          return await apiFetch<any>(`/work_items/escalations/${id}/resolve`, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
        } catch (err) {
          console.warn('Backend escalation resolve unavailable, returning local success:', err);
          return { id, status: 'RESOLVED', resolution_note: payload.resolution_note };
        }
      }
    }
  },

  dashboard: {
    async getMDOverview() {
      return getMDOverviewData();
    },
  },

  strategy: {
    async getQuarterlyPriorities(filters?: { year?: number; quarter?: string }): Promise<QuarterlyPriority[]> {
      try {
        const queryParams = new URLSearchParams();
        if (filters?.year) queryParams.append('year', filters.year.toString());
        if (filters?.quarter) queryParams.append('quarter', filters.quarter);
        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const data = await apiFetch<any[]>(`/strategy/quarterly-priorities${query}`, { method: 'GET' });
        return data.map((item: any) => ({
          id: item.id,
          year: item.year,
          quarter: item.quarter,
          title: item.title,
          description: item.description || '',
          strategicObjective: item.strategic_objective || item.title,
          reportingAuthority: item.reporting_authority || 'Managing Director',
          department: item.department || 'Hospital Operations',
          status: item.status,
          progressPercent: item.progress_percent || 0,
          currentStep: item.current_step || 1,
          targetDate: item.target_date || '2026-09-30',
          milestones: (item.milestones || []).map((m: any) => ({
            stepNumber: m.step_number,
            title: m.title,
            description: m.description || '',
            ownerName: m.owner_name || 'Lead',
            targetDate: m.target_date || '',
            completedAt: m.completed_at || undefined,
            status: m.status,
            keyDeliverable: m.key_deliverable || '',
            verificationNotes: m.verification_notes || undefined,
          })),
        }));
      } catch (err) {
        console.warn('Backend strategy endpoint unavailable, falling back to local store:', err);
        return strategyStore.getQuarterlyPriorities();
      }
    },

    async getQuarterlyDirections(): Promise<QuarterlyPriority[]> {
      return this.getQuarterlyPriorities();
    },

    async createQuarterlyPriority(payload: {
      title: string;
      description?: string;
      reportingAuthority?: string;
      department?: string;
      quarter?: string;
      year?: number;
    }): Promise<QuarterlyPriority> {
      try {
        const backendPayload = {
          title: payload.title,
          description: payload.description,
          reporting_authority: payload.reportingAuthority || 'Managing Director',
          department: payload.department || 'Hospital Operations',
          quarter: payload.quarter || 'Q3',
          fy_start_year: payload.year || 2026,
        };
        const item = await apiFetch<any>('/strategy/quarterly-priorities', {
          method: 'POST',
          body: JSON.stringify(backendPayload),
        });
        return {
          id: item.id,
          year: item.year,
          quarter: item.quarter,
          title: item.title,
          description: item.description || '',
          strategicObjective: item.strategic_objective || item.title,
          reportingAuthority: item.reporting_authority,
          department: item.department,
          status: item.status,
          progressPercent: item.progress_percent,
          currentStep: item.current_step,
          targetDate: item.target_date,
          milestones: (item.milestones || []).map((m: any) => ({
            stepNumber: m.step_number,
            title: m.title,
            description: m.description || '',
            ownerName: m.owner_name,
            targetDate: m.target_date,
            completedAt: m.completed_at,
            status: m.status,
            keyDeliverable: m.key_deliverable,
            verificationNotes: m.verification_notes,
          })),
        };
      } catch {
        return strategyStore.addQuarterlyPriority(payload as any);
      }
    },

    async updateMilestone(
      priorityId: string,
      stepNumber: number,
      payload: Partial<MilestoneStep> & { verificationNotes?: string }
    ): Promise<QuarterlyPriority> {
      try {
        const item = await apiFetch<any>(`/strategy/quarterly-priorities/${priorityId}/milestones/${stepNumber}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: payload.status,
            verification_notes: payload.verificationNotes,
            title: payload.title,
            description: payload.description,
            key_deliverable: payload.keyDeliverable,
            owner_name: payload.ownerName,
            target_date: payload.targetDate,
          }),
        });
        return {
          id: item.id,
          year: item.year,
          quarter: item.quarter,
          title: item.title,
          description: item.description || '',
          strategicObjective: item.strategic_objective || item.title,
          reportingAuthority: item.reporting_authority,
          department: item.department,
          status: item.status,
          progressPercent: item.progress_percent,
          currentStep: item.current_step,
          targetDate: item.target_date,
          milestones: (item.milestones || []).map((m: any) => ({
            stepNumber: m.step_number,
            title: m.title,
            description: m.description || '',
            ownerName: m.owner_name,
            targetDate: m.target_date,
            completedAt: m.completed_at,
            status: m.status,
            keyDeliverable: m.key_deliverable,
            verificationNotes: m.verification_notes,
          })),
        };
      } catch {
        strategyStore.updateMilestone(priorityId, stepNumber, payload);
        return strategyStore.getQuarterlyPriorities().find((p: QuarterlyPriority) => p.id === priorityId)!;
      }
    },

    async addMilestoneStep(priorityId: string, data?: Partial<MilestoneStep>) {
      strategyStore.addMilestoneStep(priorityId, data);
      return strategyStore.getQuarterlyPriorities().find((p: QuarterlyPriority) => p.id === priorityId)!;
    },

    async removeMilestoneStep(priorityId: string, stepNumber: number) {
      strategyStore.removeMilestoneStep(priorityId, stepNumber);
      return strategyStore.getQuarterlyPriorities().find((p: QuarterlyPriority) => p.id === priorityId)!;
    },

    async updatePriority(priorityId: string, data: Partial<QuarterlyPriority>) {
      strategyStore.updateQuarterlyPriority(priorityId, data);
      return strategyStore.getQuarterlyPriorities().find((p: QuarterlyPriority) => p.id === priorityId)!;
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
      try {
        const data = await apiFetch<{items: any[]}>('/departments', { method: 'GET' });
        return data.items;
      } catch (err) {
        console.warn('Departments API unavailable, using local mock departments:', err);
        return MOCK_DEPARTMENTS;
      }
    },
    async getUsers() {
      try {
        const data = await apiFetch<{items: any[]}>('/users', { method: 'GET' });
        return data.items.map((item) => ({
          id: item.id,
          name: item.name || item.full_name || item.email,
          email: item.email,
          role: item.role || 'EMPLOYEE',
          roleTitle: item.roleTitle || item.position_title || 'Stavya team member',
          departmentId: item.departmentId || item.department_id || '',
          departmentName: item.departmentName || 'Stavya Spine Hospital',
          organizationId: item.organizationId || item.organization_id,
        }));
      } catch (err) {
        console.warn('Users API offline, using verified Stavya hospital personnel directory:', err);
        return getAllVerifiedHospitalUsers();
      }
    },
    async tree() {
      try {
        const response = await apiFetch<any>('/organizations/tree', { method: 'GET' });
        return response || MOCK_ORG_TREE;
      } catch (err) {
        console.warn('Tree API unavailable, returning local canonical mock tree:', err);
        return MOCK_ORG_TREE;
      }
    },
    async treeScoped() {
      try {
        const response = await apiFetch<any>('/organizations/tree/scoped', { method: 'GET' });
        return response || MOCK_ORG_TREE;
      } catch (err) {
        console.warn('Scoped Tree API unavailable, returning local scoped mock tree:', err);
        return getScopedMockOrgTree();
      }
    },
    async getRoles() {
      try {
        const data = await apiFetch<{items: any[]}>('/roles', { method: 'GET' });
        return data.items;
      } catch (err) {
        console.warn('Roles API unavailable, using local mock roles:', err);
        return MOCK_ROLES;
      }
    },
    async getAuditEvents(params?: { limit?: number; offset?: number; action?: string; entity_type?: string }) {
      try {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());
        if (params?.action) queryParams.append('action', params.action);
        if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const res = await apiFetch<{ items: any[]; total: number }>(`/audit/events${query}`, { method: 'GET' });
        return res.items;
      } catch (err) {
        console.warn('Audit API error, using local fallback events:', err);
        return MOCK_AUDIT_EVENTS;
      }
    },
    async transfer(payload: { user_id: string; new_position_id: string; started_on?: string; transfer_reason?: string }) {
      try {
        return await apiFetch<any>('/organizations/transfer', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Backend transfer API unavailable, completing transfer simulation locally:', err);
        return {
          id: `asgn-${Date.now()}`,
          organization_id: 'org-stavya-001',
          user_id: payload.user_id,
          position_id: payload.new_position_id,
          is_primary: true,
          started_on: payload.started_on || new Date().toISOString().split('T')[0],
          transfer_reason: payload.transfer_reason,
          is_current: true,
        };
      }
    },
  },

  audit: {
    async listEvents(params?: {
      start_time?: string;
      end_time?: string;
      action?: string;
      entity_type?: string;
      entity_id?: string;
      actor_id?: string;
      limit?: number;
      offset?: number;
    }) {
      try {
        const queryParams = new URLSearchParams();
        if (params?.start_time) queryParams.append('start_time', params.start_time);
        if (params?.end_time) queryParams.append('end_time', params.end_time);
        if (params?.action) queryParams.append('action', params.action);
        if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
        if (params?.entity_id) queryParams.append('entity_id', params.entity_id);
        if (params?.actor_id) queryParams.append('actor_id', params.actor_id);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());
        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await apiFetch<{ items: any[]; total: number; limit: number; offset: number }>(
          `/audit/events${query}`,
          { method: 'GET' }
        );
      } catch (err) {
        console.warn('Audit API query error, using local fallback:', err);
        return { items: MOCK_AUDIT_EVENTS, total: MOCK_AUDIT_EVENTS.length, limit: 50, offset: 0 };
      }
    },
  },

  analytics: {
    async getOperationalAnalytics(): Promise<any> {
      try {
        return await apiFetch<any>('/analytics/operational', { method: 'GET' });
      } catch (err) {
        console.warn('Analytics API unavailable, returning fallback metrics:', err);
        return null;
      }
    },
  },

  calendar: {
    async getEvents(params?: { start_time?: string; end_time?: string; event_type?: string }) {
      try {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        const url = `/calendar/events${query ? `?${query}` : ''}`;
        return await apiFetch<any[]>(url, { method: 'GET' });
      } catch (err) {
        console.warn('Calendar events API error:', err);
        return [];
      }
    },
    async createEvent(payload: any) {
      return await apiFetch<any>('/calendar/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async deleteEvent(eventId: string) {
      return await apiFetch<any>(`/calendar/events/${eventId}`, {
        method: 'DELETE',
      });
    },
    async getIntegrationStatus() {
      try {
        return await apiFetch<any>('/calendar/integrations', { method: 'GET' });
      } catch {
        return null;
      }
    },
    async getGoogleAuthUrl() {
      return await apiFetch<{ auth_url: string; is_simulated: boolean }>('/calendar/integrations/google/auth-url', {
        method: 'GET',
      });
    },
    async connectGoogle(authCode: string, redirectUri: string, accountEmail?: string) {
      return await apiFetch<any>('/calendar/integrations/google/connect', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'GOOGLE',
          auth_code: authCode,
          redirect_uri: redirectUri,
          account_email: accountEmail,
        }),
      });
    },
    async disconnectGoogle() {
      return await apiFetch<any>('/calendar/integrations/disconnect', {
        method: 'POST',
      });
    },
    async triggerSync() {
      return await apiFetch<any>('/calendar/sync', {
        method: 'POST',
      });
    },
  },
    mdAttention: {
    async getSummary(): Promise<import('../../types/mdAttention').MDAttentionSummary> {
      try {
        const res = await apiFetch<import('../../types/mdAttention').MDAttentionSummary>('/md-attention', {
          method: 'GET',
        });
        return {
          ...res,
          is_synthetic_fallback: false,
        };
      } catch (err: any) {
        if (err?.status === 403) {
          throw err;
        }
        // Resilient fallback for local mock / offline mode
        const allItems = workItemStore.getWorkItems();
        const items: import('../../types/mdAttention').MDAttentionItem[] = [];

        // 1. Critical overdue
        allItems
          .filter(i => (i.status === 'todo' || i.status === 'in_progress' || i.status === 'blocked') && (i.priority === 'high' || i.priority === 'urgent'))
          .forEach(i => {
            items.push({
              id: `att-overdue-${i.id}`,
              category: 'CRITICAL_OVERDUE',
              title: i.title,
              source: i.source_title || `${i.source_type || 'MANUAL'} Source`,
              owner_name: i.owner_name || 'Priyesh Shah',
              accountable_name: i.raci?.accountable_name || 'Het Bhatt (MD)',
              department_name: i.department_name || 'Spine Surgery & Clinical Operations',
              due_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              original_due_at: new Date(Date.now() - 86400000 * 5).toISOString(),
              due_age_days: 2,
              deferral_count: 1,
              deferral_history: [
                {
                  id: 'def-1',
                  author_name: 'Dr. Mirant Dave (MD)',
                  activity_type: 'DEADLINE_EXTENSION',
                  note: 'Granted 3-day recovery extension for OT equipment check.',
                  created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
                }
              ],
              impact: 'Critical pathway deliverable delayed past due date. Threatens patient workflow.',
              requested_action: 'Require owner to submit recovery milestone plan or escalate resource allocation.',
              requested_decision: 'Grant emergency extension or assign clinical co-lead.',
              evidence_state: 'OVERDUE — Incomplete',
              evidence_list: [],
              activity_history: (i.activity_history || []).map(a => ({
                id: a.id,
                author_name: a.authorName || 'Staff Member',
                activity_type: a.type,
                note: a.note,
                previous_status: a.previousStatus,
                new_status: a.newStatus,
                progress_percent: a.progressPercent,
                created_at: a.timestamp,
              })),
              audit_provenance: `work_items.id=${i.id} [SYNTHETIC FALLBACK]`,
              why_included: 'Rule: High/Urgent priority item breached scheduled delivery target.',
              priority: i.priority,
              status: i.status,
              description: i.description,
              version: 1,
              entity_id: i.id,
              entity_type: 'work_item',
              is_synthetic: true,
              allowed_actions: ['GRANT_EXTENSION', 'REQUEST_EVIDENCE', 'REASSIGN_RACI', 'RECORD_DECISION'],
              disabled_actions: {
                VERIFY_EVIDENCE: 'Item is not yet completed; cannot verify evidence.',
              },
            });
          });

        // 2. High-impact blockers
        allItems
          .filter(i => i.status === 'blocked' || i.status === 'stuck')
          .forEach(i => {
            items.push({
              id: `att-blocker-${i.id}`,
              category: 'HIGH_IMPACT_BLOCKER',
              title: `[BLOCKED] ${i.title}`,
              source: i.source_title || 'Meeting: Daily Spine Surgery Sync',
              owner_name: i.owner_name || 'Priyesh Shah',
              accountable_name: i.raci?.accountable_name || 'Het Bhatt (MD)',
              department_name: i.department_name || 'IT & Digital Health',
              due_at: null,
              original_due_at: null,
              due_age_days: null,
              deferral_count: 0,
              deferral_history: [],
              impact: i.blocker_details?.needDescription || 'External vendor delay on PACS API credentials.',
              requested_action: 'Issue executive override or contact vendor leadership directly.',
              requested_decision: 'Authorize executive unblock directive.',
              evidence_state: 'BLOCKED — StuckNeedItem Active',
              evidence_list: [],
              activity_history: (i.activity_history || []).map(a => ({
                id: a.id,
                author_name: a.authorName || 'Staff Member',
                activity_type: a.type,
                note: a.note,
                previous_status: a.previousStatus,
                new_status: a.newStatus,
                progress_percent: a.progressPercent,
                created_at: a.timestamp,
              })),
              audit_provenance: `work_items.id=${i.id} (status=blocked) [SYNTHETIC FALLBACK]`,
              why_included: `Rule: Unresolved blocker reported: ${i.blocker_details?.reason || 'Vendor delay'}`,
              priority: i.priority,
              status: i.status,
              description: i.description,
              version: 1,
              entity_id: i.id,
              entity_type: 'work_item',
              blocker_details: i.blocker_details,
              is_synthetic: true,
              allowed_actions: ['EXECUTIVE_OVERRIDE', 'RECORD_DECISION', 'REASSIGN_RACI', 'GRANT_EXTENSION', 'REQUEST_EVIDENCE'],
              disabled_actions: {
                VERIFY_EVIDENCE: 'Deliverable is currently blocked; unblock before closure.',
              },
            });
          });

        // 3. Evidence awaiting verification
        allItems
          .filter(i => i.status === 'completed')
          .forEach(i => {
            items.push({
              id: `att-verify-${i.id}`,
              category: 'EVIDENCE_AWAITING_VERIFICATION',
              title: `Verification Pending: ${i.title}`,
              source: i.source_title || 'SOP Verification Protocol',
              owner_name: i.owner_name || 'Sister Sunita Rao',
              accountable_name: 'Het Bhatt (MD)',
              department_name: i.department_name || 'Nursing & Clinical Operations',
              due_at: null,
              original_due_at: null,
              due_age_days: null,
              deferral_count: 0,
              deferral_history: [],
              impact: 'Reported complete by staff. Must be independently verified against Definition of Done.',
              requested_action: 'Audit physical checklist evidence before marking VERIFIED in registry.',
              requested_decision: 'Approve closure or reject evidence.',
              evidence_state: 'REPORTED_COMPLETE (Awaiting Independent Signoff)',
              evidence_list: [
                {
                  name: 'Physical NABH Protocol Inspection Checklist',
                  submitted_by: i.owner_name || 'Sister Sunita Rao',
                  submitted_at: new Date(Date.now() - 3600000 * 4).toISOString(),
                  status: 'PENDING_REVIEW',
                  notes: 'Signed sterilisation batch register sheet #OT-2026-088.',
                }
              ],
              activity_history: (i.activity_history || []).map(a => ({
                id: a.id,
                author_name: a.authorName || 'Staff Member',
                activity_type: a.type,
                note: a.note,
                previous_status: a.previousStatus,
                new_status: a.newStatus,
                progress_percent: a.progressPercent,
                created_at: a.timestamp,
              })),
              audit_provenance: `work_items.id=${i.id} [SYNTHETIC FALLBACK]`,
              why_included: 'Rule: Claimed completion is never equated with VERIFIED/CLOSED without independent evidence.',
              priority: i.priority,
              status: i.status,
              description: i.description,
              version: 1,
              entity_id: i.id,
              entity_type: 'work_item',
              is_synthetic: true,
              allowed_actions: ['VERIFY_EVIDENCE', 'REQUEST_EVIDENCE', 'RECORD_DECISION', 'REASSIGN_RACI'],
              disabled_actions: {
                EXECUTIVE_OVERRIDE: 'Deliverable has no active blocker to override.',
              },
            });
          });

        const counts = {
          critical_overdue_count: items.filter(x => x.category === 'CRITICAL_OVERDUE').length,
          high_impact_blocker_count: items.filter(x => x.category === 'HIGH_IMPACT_BLOCKER').length,
          decision_awaiting_count: items.filter(x => x.category === 'DECISION_AWAITING_AUTHORITY').length,
          evidence_verification_count: items.filter(x => x.category === 'EVIDENCE_AWAITING_VERIFICATION').length,
          at_risk_milestone_count: items.filter(x => x.category === 'AT_RISK_MILESTONE').length,
          repeated_deferrals_count: items.filter(x => x.category === 'REPEATED_DEFERRAL').length,
        };

        return {
          total_items: items.length,
          ...counts,
          items,
          is_synthetic_fallback: true,
        };
      }
    },

    async resolveEscalation(payload: import('../../types/mdAttention').ResolveEscalationPayload): Promise<import('../../types/mdAttention').CockpitActionResponse> {
      return await apiFetch<import('../../types/mdAttention').CockpitActionResponse>('/md-attention/resolve-escalation', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async verifyEvidence(payload: import('../../types/mdAttention').VerifyEvidencePayload): Promise<import('../../types/mdAttention').CockpitActionResponse> {
      return await apiFetch<import('../../types/mdAttention').CockpitActionResponse>('/md-attention/verify-evidence', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async requestEvidence(payload: import('../../types/mdAttention').RequestEvidencePayload): Promise<import('../../types/mdAttention').CockpitActionResponse> {
      return await apiFetch<import('../../types/mdAttention').CockpitActionResponse>('/md-attention/request-evidence', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async recordDecision(payload: import('../../types/mdAttention').RecordDecisionPayload): Promise<import('../../types/mdAttention').CockpitActionResponse> {
      return await apiFetch<import('../../types/mdAttention').CockpitActionResponse>('/md-attention/record-decision', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async executiveOverride(payload: import('../../types/mdAttention').ExecutiveOverridePayload): Promise<import('../../types/mdAttention').CockpitActionResponse> {
      return await apiFetch<import('../../types/mdAttention').CockpitActionResponse>('/md-attention/executive-override', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async grantExtension(payload: import('../../types/mdAttention').GrantExtensionPayload): Promise<import('../../types/mdAttention').CockpitActionResponse> {
      return await apiFetch<import('../../types/mdAttention').CockpitActionResponse>('/md-attention/grant-extension', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async reassignRaci(payload: import('../../types/mdAttention').ReassignRaciPayload): Promise<import('../../types/mdAttention').CockpitActionResponse> {
      return await apiFetch<import('../../types/mdAttention').CockpitActionResponse>('/md-attention/reassign-raci', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },
};
