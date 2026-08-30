import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { workItemStore, INITIAL_WORK_ITEMS } from '../lib/mocks/workItemMock';
import OverviewPage from '../app/(app)/overview/page';
import ExecutionPage from '../app/(app)/execution/page';
import PoliciesPage from '../app/(app)/policies/page';
import { Sidebar } from '../components/layout/Sidebar';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/overview',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock apiClient to use workItemStore for tests
vi.mock('../lib/api/client', async () => {
  const actual = await vi.importActual('../lib/api/client') as any;
  const { workItemStore } = await vi.importActual('../lib/mocks/workItemMock') as any;
  const { strategyStore } = await vi.importActual('../lib/mocks/strategyMock') as any;

  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      workItems: {
        ...actual.apiClient.workItems,
        list: vi.fn().mockImplementation(async (filters) => {
          const items = workItemStore.getWorkItems(filters);
          return { items, total: items.length };
        }),
        patch: vi.fn().mockImplementation(async (id, payload) => {
          let updated: any;
          if (payload.status) {
            updated = workItemStore.updateStatus(id, payload.status, 'Test User', payload.update_note);
          }
          if (payload.progressPercent !== undefined) {
            updated = workItemStore.updateProgress(id, payload.progressPercent, payload.update_note, 'Test User');
          }
          if (payload.status === 'blocked' && payload.blocker_details) {
            updated = workItemStore.reportBlocker(id, payload.blocker_details, 'Test User');
          }
          return updated || workItemStore.getWorkItemById(id);
        }),
      },
    },
  };
});

describe('LAKSHYA Stavyan Execution Workspace Suite', () => {
  beforeEach(() => {
    // Reset work items to initial state
    const items = workItemStore.getWorkItems();
    if (items.length !== INITIAL_WORK_ITEMS.length) {
      // Re-seed if modified
    }
  });

  it('1. Loads canonical WorkItems for STAVYAN stavyan with meeting-originated tasks', () => {
    workItemStore.createWorkItem({
      title: 'Verify OPD Network Stability & PACS Gateway Sync',
      source_type: 'MEETING',
      source_title: 'Daily Spine Surgery Operations Sync',
      owner_id: 'usr-stav-101',
    });

    const items = workItemStore.getWorkItems({ owner_id: 'usr-stav-101' });
    expect(items.length).toBeGreaterThanOrEqual(1);

    const meetingTask = items.find(i => i.source_type === 'MEETING');
    expect(meetingTask).toBeDefined();
    expect(meetingTask?.source_title).toContain('Spine Surgery');
  });

  it('2. Supports starting work and transitions status from todo to in_progress with activity log', () => {
    const newItem = workItemStore.createWorkItem({
      title: 'Calibrate OR-3 Spinal Endoscopy Camera',
      status: 'todo',
      priority: 'high',
      owner_id: 'usr-stav-101',
    });

    expect(newItem.status).toBe('todo');

    const updated = workItemStore.updateStatus(newItem.id, 'in_progress', 'Priyesh Shah', 'Started camera calibration');
    expect(updated.status).toBe('in_progress');
    expect(updated.activity_history?.[0].type).toBe('STATUS_CHANGE');
    expect(updated.activity_history?.[0].note).toBe('Started camera calibration');
  });

  it('3. Supports progress updates and logs activity timeline', () => {
    const item = workItemStore.createWorkItem({
      title: 'Sanity validation on PACS server',
      owner_id: 'usr-stav-101',
    });
    const updated = workItemStore.updateProgress(item.id, 85, 'Completed 85% of sanity validation.');

    expect(updated.progressPercent).toBe(85);
    expect(updated.activity_history?.[0].type).toBe('PROGRESS_UPDATE');
    expect(updated.activity_history?.[0].progressPercent).toBe(85);
  });

  it('4. Supports structured blocker reporting with reason, need, helper, and urgency', () => {
    const newItem = workItemStore.createWorkItem({
      title: 'Install Spinal Navigation Software Patch',
      status: 'in_progress',
      owner_id: 'usr-stav-101',
    });

    const blocked = workItemStore.reportBlocker(
      newItem.id,
      {
        reason: 'License server validation timeout',
        needDescription: 'Firewall port 8080 whitelist required from Network Administrator',
        helpedByPersonOrDept: 'Het Bhatt (MD Office Lead)',
        urgency: 'HIGH',
      },
      'Priyesh Shah'
    );

    expect(blocked.status).toBe('blocked');
    expect(blocked.blocked_reason).toBe('License server validation timeout');
    expect(blocked.blocker_details?.needDescription).toContain('Firewall port 8080');
    expect(blocked.blocker_details?.urgency).toBe('HIGH');
  });

  it('5. Supports completing work item with timestamp and completion log', () => {
    const newItem = workItemStore.createWorkItem({
      title: 'Verify OT Emergency Power Generator Relay',
      status: 'in_progress',
      owner_id: 'usr-stav-101',
    });

    const completed = workItemStore.updateStatus(newItem.id, 'completed', 'Priyesh Shah', 'Successfully verified relay switch.');
    expect(completed.status).toBe('completed');
    expect(completed.completed_at).toBeDefined();
    expect(completed.progressPercent).toBe(100);
  });

  it('6. Renders My Day overview page with greeting and Primary Next Action spotlight', async () => {
    render(
      <AuthProvider>
        <OverviewPage />
      </AuthProvider>
    );

    expect(await screen.findByText(/MY DAY/i)).toBeDefined();
    expect(screen.getByText(/Today's Work Queue/i)).toBeDefined();
  });

  it('7. Renders My Work page with filters (All, Today, Upcoming, Overdue, Blocked, Completed)', async () => {
    render(
      <AuthProvider>
        <ExecutionPage />
      </AuthProvider>
    );

    const elements = await screen.findAllByText(/MY WORK/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Today')).toBeDefined();
    expect(screen.getByText('Upcoming')).toBeDefined();
    expect(screen.getByText('Overdue')).toBeDefined();
    expect(screen.getByText('Blocked')).toBeDefined();
    expect(screen.getByText('Completed')).toBeDefined();
  });

  it('8. Sidebar navigation shows clean stavyan items for standard STAVYAN role', () => {
    render(
      <AuthProvider>
        <Sidebar />
      </AuthProvider>
    );

    expect(screen.getByText('My Day')).toBeDefined();
    expect(screen.getByText('My Work')).toBeDefined();
    expect(screen.getByText('Calendar')).toBeDefined();
    expect(screen.getByText('Meetings')).toBeDefined();
    expect(screen.getByText('Policies & SOPs')).toBeDefined();
  });

  it('9. Gating in Policies & SOPs hides authoring button for standard stavyan', () => {
    render(
      <AuthProvider>
        <PoliciesPage />
      </AuthProvider>
    );

    // Standard stavyan does NOT see '+ Upload / Author New SOP'
    expect(screen.queryByText('+ Upload / Author New SOP')).toBeNull();
    // But sees the searchable approved protocol catalog
    expect(screen.getByText(/Clinical Governance & NABH Protocols/i)).toBeDefined();
  });

  it('10. Renders Hospital Shift & Handover Quick Bar and Emergency Codes button on My Day', async () => {
    render(
      <AuthProvider>
        <OverviewPage />
      </AuthProvider>
    );

    expect(await screen.findByText(/HOSPITAL DUTY ROSTER/i)).toBeDefined();
    expect(screen.getByText(/Post Handover Memo/i)).toBeDefined();
    expect(screen.getByText(/Emergency Codes/i)).toBeDefined();
  });

  it('11. Renders 1-click status action buttons (✓ Done / ▶ Start) on My Work queue cards', async () => {
    render(
      <AuthProvider>
        <ExecutionPage />
      </AuthProvider>
    );

    const doneButtons = await screen.findAllByText(/✓ Done/i);
    expect(doneButtons.length).toBeGreaterThan(0);
  });

  it('12. Supports interactive SOP viewing and compliance acknowledgment in Policies', async () => {
    render(
      <AuthProvider>
        <PoliciesPage />
      </AuthProvider>
    );

    // Click on the first SOP View Details button
    const viewButtons = await screen.findAllByText(/View Details/i);
    expect(viewButtons.length).toBeGreaterThan(0);
    fireEvent.click(viewButtons[0]);
    expect(await screen.findByText(/Live Clinical Execution Checklist/i)).toBeDefined();
    expect(screen.getByText(/Acknowledge SOP Read & Understood/i)).toBeDefined();
  });
});
