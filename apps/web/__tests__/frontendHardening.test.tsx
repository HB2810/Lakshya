import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { can } from '../lib/permissions/can';
import { DEMO_USERS } from '../lib/mocks/organizationMock';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable, Column } from '../components/ui/DataTable';
import { EmptyState, LoadingState, ErrorState } from '../components/ui/States';
import { Header } from '../components/layout/Header';
import { AuthProvider } from '../lib/auth/AuthContext';
import LoginPage from '../app/login/page';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: () => '/overview',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('LAKSHYA Frontend Hardening & Security Audit Suite', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // 1. RBAC Permission Evaluator Comprehensive Tests
  describe('RBAC Permission Matrix', () => {
    it('MD persona has full executive dashboard and decision capability', () => {
      expect(can('dashboard.md.read', DEMO_USERS.MD)).toBe(true);
      expect(can('decision.approve', DEMO_USERS.MD)).toBe(true);
      expect(can('commitment.approve', DEMO_USERS.MD)).toBe(true);
      expect(can('audit.export', DEMO_USERS.MD)).toBe(true);
    });

    it('MD Office persona has org-wide task assignment and stuck resolution', () => {
      expect(can('dashboard.md.read', DEMO_USERS.MD_OFFICE)).toBe(true);
      expect(can('task.assign', DEMO_USERS.MD_OFFICE)).toBe(true);
      expect(can('stuck.resolve', DEMO_USERS.MD_OFFICE)).toBe(true);
    });

    it('Department Head persona has department scope permissions', () => {
      expect(can('dashboard.md.read', DEMO_USERS.DEPARTMENT_HEAD)).toBe(false);
      expect(can('dashboard.department.read', DEMO_USERS.DEPARTMENT_HEAD)).toBe(true);
      expect(can('task.assign', DEMO_USERS.DEPARTMENT_HEAD)).toBe(true);
    });

    it('Manager persona has team task scope permissions', () => {
      expect(can('dashboard.department.read', DEMO_USERS.MANAGER)).toBe(true);
      expect(can('task.assign', DEMO_USERS.MANAGER)).toBe(true);
    });

    it('Employee persona is strictly denied reassignment, deadline change, and commitment approval', () => {
      const emp = DEMO_USERS.EMPLOYEE;
      expect(can('dashboard.md.read', emp)).toBe(false);
      expect(can('task.assign', emp)).toBe(false);
      expect(can('task.deadline.change', emp)).toBe(false);
      expect(can('commitment.approve', emp)).toBe(false);
      expect(can('commitment.reopen', emp)).toBe(false);
      expect(can('task.create', emp)).toBe(true);
      expect(can('task.complete', emp)).toBe(true);
    });
  });

  // 2. Production Environment Safety Guards
  describe('Production Environment Guards', () => {
    it('HIDES persona switcher in Production mode', () => {
      vi.stubEnv('NODE_ENV', 'production');
      render(
        <AuthProvider>
          <Header />
        </AuthProvider>
      );
      expect(screen.queryByText(/Persona:/i)).toBeNull();
      expect(screen.queryByText(/Switch Persona Perspective/i)).toBeNull();
    });

    it('HIDES quick login buttons in Production mode', () => {
      vi.stubEnv('NODE_ENV', 'production');
      render(<LoginPage />);
      expect(screen.queryByText(/Quick Persona Sign-In Demo/i)).toBeNull();
      expect(screen.queryByText(/Dr. Dave/i)).toBeNull();
    });

    it('SHOWS demo tools in Development mode', () => {
      vi.stubEnv('NODE_ENV', 'development');
      render(
        <AuthProvider>
          <Header />
        </AuthProvider>
      );
      expect(screen.getByText(/Persona: MD/i)).toBeDefined();
    });
  });

  // 3. Reusable Component Integrity Tests
  describe('UI Component Library', () => {
    it('renders Button with variants and loading state', () => {
      const { rerender } = render(<Button variant="primary">Submit</Button>);
      expect(screen.getByText('Submit')).toBeDefined();

      rerender(<Button isLoading>Submitting</Button>);
      expect(screen.getByText('Submitting')).toBeDefined();
    });

    it('renders StatusBadge with normalized statuses', () => {
      render(
        <div>
          <StatusBadge status="IN_PROGRESS" />
          <StatusBadge status="BLOCKED" />
          <StatusBadge status="COMPLETED" />
          <StatusBadge status="OVERDUE" />
        </div>
      );
      expect(screen.getByText('In Progress')).toBeDefined();
      expect(screen.getByText('Blocked')).toBeDefined();
      expect(screen.getByText('Completed')).toBeDefined();
      expect(screen.getByText('Overdue')).toBeDefined();
    });

    it('renders DataTable with custom columns and empty state', () => {
      const columns: Column<{ id: string; name: string }>[] = [
        { key: 'name', header: 'Name' },
      ];
      const { rerender } = render(<DataTable columns={columns} data={[{ id: '1', name: 'Item Alpha' }]} />);
      expect(screen.getByText('Item Alpha')).toBeDefined();

      rerender(<DataTable columns={columns} data={[]} />);
      expect(screen.getByText('No records found')).toBeDefined();
    });

    it('renders EmptyState, LoadingState, and ErrorState components', () => {
      render(
        <div>
          <EmptyState title="No Work" description="Empty work queue" />
          <LoadingState message="Loading telemetry..." />
          <ErrorState message="Connection failure" />
        </div>
      );
      expect(screen.getByText('No Work')).toBeDefined();
      expect(screen.getByText('Loading telemetry...')).toBeDefined();
      expect(screen.getByText('Connection failure')).toBeDefined();
    });
  });
});
