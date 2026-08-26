import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, getCsrfToken, mapBackendUserToFrontendUser } from '../lib/api/client';
import { CurrentUserResponse } from '../types/auth';

describe('FastAPI Authentication Client Integration (Vertical Slice 01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('extracts CSRF token from document cookie correctly', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'lakshya_session=abc123token; lakshya_csrf=test_csrf_secret_99; path=/',
    });

    const token = getCsrfToken();
    expect(token).toBe('test_csrf_secret_99');
  });

  it('maps backend CurrentUserResponse into frontend User object', () => {
    const mockResponse: CurrentUserResponse = {
      user: {
        id: 'usr-1001',
        email: 'het.bhatt@stavyaspine.com',
        full_name: 'Het Bhatt',
        is_active: true,
        organization_id: 'org-stavya-01',
        department_id: 'dept-md-office',
      },
      organization_id: 'org-stavya-01',
      organization_slug: 'stavya-spine',
      session: {
        id: 'sess-999',
        issued_at: '2026-08-19T10:00:00Z',
        expires_at: '2026-08-19T18:00:00Z',
        last_activity_at: '2026-08-19T10:05:00Z',
      },
      roles: ['md_office'],
      permissions: ['identity.user.read', 'organization.read', 'commitment.create'],
      department_ids: ['dept-md-office'],
      must_change_password: false,
    };

    const frontendUser = mapBackendUserToFrontendUser(mockResponse);

    expect(frontendUser.id).toBe('usr-1001');
    expect(frontendUser.email).toBe('het.bhatt@stavyaspine.com');
    expect(frontendUser.name).toBe('Het Bhatt');
    expect(frontendUser.role).toBe('MD_OFFICE');
    expect(frontendUser.organizationSlug).toBe('stavya-spine');
    expect(frontendUser.permissions).toContain('commitment.create');
    expect(frontendUser.mustChangePassword).toBe(false);
  });

  it('authenticates user via FastAPI /auth/login payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: 'usr-md-001',
          email: 'md@stavyaspine.com',
          full_name: 'Dr. Bharat Modi',
          is_active: true,
          organization_id: 'org-01',
        },
        organization_id: 'org-01',
        organization_slug: 'stavya-spine',
        session: {
          id: 'sess-001',
          issued_at: '2026-08-19T10:00:00Z',
          expires_at: '2026-08-19T18:00:00Z',
          last_activity_at: '2026-08-19T10:00:00Z',
        },
        roles: ['md'],
        permissions: ['dashboard.md.read', 'priority.create'],
        department_ids: [],
        must_change_password: false,
      }),
    });

    global.fetch = mockFetch;

    const { user, response } = await apiClient.auth.login('md@stavyaspine.com', 'securepass123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );

    expect(user.role).toBe('MD');
    expect(response.organization_slug).toBe('stavya-spine');
  });

  it('fetches active identity via /auth/me with credentials: include', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: 'usr-002',
          email: 'dept@stavyaspine.com',
          full_name: 'Dr. Sharma',
          is_active: true,
          organization_id: 'org-01',
        },
        organization_id: 'org-01',
        organization_slug: 'stavya-spine',
        session: {
          id: 'sess-002',
          issued_at: '2026-08-19T10:00:00Z',
          expires_at: '2026-08-19T18:00:00Z',
          last_activity_at: '2026-08-19T10:00:00Z',
        },
        roles: ['department_head'],
        permissions: ['department.read'],
        department_ids: ['dept-ortho'],
        must_change_password: false,
      }),
    });

    global.fetch = mockFetch;

    const { user } = await apiClient.auth.getMe();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      })
    );

    expect(user.role).toBe('DEPARTMENT_HEAD');
  });
});
