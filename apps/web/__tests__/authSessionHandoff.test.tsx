import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../app/login/page';
import { AuthProvider } from '../lib/auth/AuthContext';
import { apiClient, getCsrfToken } from '../lib/api/client';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LAKSHYA Safari Session Handoff & Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiClient.auth, 'getMe').mockRejectedValue(new Error('Unauthenticated'));
  });

  it('1. Extracts CSRF token from document cookies without requiring Secure flag over HTTP', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'lakshya_csrf=test-csrf-token-123; other_cookie=xyz',
    });

    const token = getCsrfToken();
    expect(token).toBe('test-csrf-token-123');
  });

  it('2. Normal login with STAVYANS-001 and password 1234 establishes backend session', async () => {
    const loginSpy = vi.spyOn(apiClient.auth, 'login').mockResolvedValue({
      user: {
        id: 'user-md-1',
        name: 'Dr. Mirant Dave (MD)',
        email: 'md@stavya.local',
        role: 'MD',
        roleTitle: 'Managing Director',
        departmentId: 'dept-md',
        departmentName: 'MD Office',
        permissions: ['dashboard.md.read', 'raci.manage'],
      },
      response: {
        user: {
          id: 'user-md-1',
          email: 'md@stavya.local',
          full_name: 'Dr. Mirant Dave (MD)',
          is_active: true,
          organization_id: 'org-stavya-001',
        },
        organization_id: 'org-stavya-001',
        organization_slug: 'stavya-spine',
        session: {
          id: 'sess-md-1',
          issued_at: '2026-08-29T15:00:00Z',
          expires_at: '2026-08-30T03:00:00Z',
          last_activity_at: '2026-08-29T15:00:00Z',
        },
        roles: ['md'],
        permissions: ['dashboard.md.read', 'raci.manage'],
        department_ids: ['dept-md'],
        must_change_password: false,
      } as any,
    });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const staffInput = screen.getByPlaceholderText(/e\.g\. STAVYANS-101/i);
    const passwordInput = screen.getByPlaceholderText(/Enter password/i);
    const submitBtn = await screen.findByRole('button', { name: /Sign In/i });

    fireEvent.change(staffInput, { target: { value: 'STAVYANS-001' } });
    fireEvent.change(passwordInput, { target: { value: '1234' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('STAVYANS-001', '1234', undefined);
      expect(mockPush).toHaveBeenCalledWith('/overview');
    });
  });

  it('3. One-Click MD Office login establishes session and redirects to /overview', async () => {
    const loginSpy = vi.spyOn(apiClient.auth, 'login').mockResolvedValue({
      user: {
        id: 'user-md-1',
        name: 'Dr. Mirant Dave (MD)',
        email: 'md@stavya.local',
        role: 'MD',
        roleTitle: 'Managing Director',
        departmentId: 'dept-md',
        departmentName: 'MD Office',
        permissions: ['dashboard.md.read'],
      },
      response: {
        user: {
          id: 'user-md-1',
          email: 'md@stavya.local',
          full_name: 'Dr. Mirant Dave (MD)',
          is_active: true,
          organization_id: 'org-stavya-001',
        },
        organization_id: 'org-stavya-001',
        organization_slug: 'stavya-spine',
        session: {
          id: 'sess-md-1',
          issued_at: '2026-08-29T15:00:00Z',
          expires_at: '2026-08-30T03:00:00Z',
          last_activity_at: '2026-08-29T15:00:00Z',
        },
        roles: ['md'],
        permissions: ['dashboard.md.read'],
        department_ids: ['dept-md'],
        must_change_password: false,
      } as any,
    });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const mdQuickBtn = screen.getByRole('button', { name: /MD Office \(STAVYANS-001\)/i });
    expect(mdQuickBtn).toBeDefined();

    fireEvent.click(mdQuickBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('STAVYANS-001', '1234', undefined);
      expect(mockPush).toHaveBeenCalledWith('/overview');
    });
  });
});
