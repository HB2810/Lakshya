import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { evaluateRaciGovernance } from '../lib/raci/governance';
import { RaciSection } from '../components/work/sections/RaciSection';
import { AuthProvider } from '../lib/auth/AuthContext';
import { apiClient } from '../lib/api/client';
import { WorkItem } from '../types/workItem';
import { User } from '../types/auth';

const mockStaff: User[] = [
  {
    id: 'user-resp-1',
    name: 'Sister Sunita Rao',
    email: 'sunita@stavya.local',
    role: 'EMPLOYEE',
    roleTitle: 'Senior Spine Nurse',
    departmentId: 'dept-spine',
    departmentName: 'Spine Surgery',
    positionTitle: 'Senior Spine Nurse & OT Incharge',
    organizationId: 'org-stavya-001',
  },
  {
    id: 'user-acc-1',
    name: 'Dr. Mirant Dave (MD)',
    email: 'md@stavya.local',
    role: 'MD',
    roleTitle: 'Managing Director',
    departmentId: 'dept-mdoffice',
    departmentName: 'MD Office',
    positionTitle: 'Managing Director',
    organizationId: 'org-stavya-001',
  },
  {
    id: 'user-lead-1',
    name: 'Priyesh Shah',
    email: 'leader@stavya.local',
    role: 'LEADER',
    roleTitle: 'IT Lead',
    departmentId: 'dept-it',
    departmentName: 'IT & Digital Health',
    positionTitle: 'Lead Digital Health Architect',
    organizationId: 'org-stavya-001',
  },
  {
    id: 'user-audit-1',
    name: 'Quality Auditor',
    email: 'audit@stavya.local',
    role: 'EMPLOYEE',
    roleTitle: 'NABH Auditor',
    departmentId: 'dept-ops',
    departmentName: 'Hospital Operations',
    positionTitle: 'Lead Clinical Auditor',
    organizationId: 'org-stavya-001',
  },
];

const mockWorkItem: WorkItem = {
  id: 'wi-raci-001',
  organization_id: 'org-stavya-001',
  title: 'Calibrate OT Autoclave Sensors for Spine Surgery',
  status: 'in_progress',
  priority: 'high',
  owner_id: 'user-resp-1',
  owner_name: 'Sister Sunita Rao',
  department_id: 'dept-spine',
  department_name: 'Spine Surgery',
  created_by: 'user-acc-1',
  due_at: '2026-09-01T10:00:00Z',
  progressPercent: 40,
  raci: {
    responsible_id: 'user-resp-1',
    responsible_name: 'Sister Sunita Rao',
    accountable_id: 'user-acc-1',
    accountable_name: 'Dr. Mirant Dave (MD)',
    consulted_ids: ['user-lead-1'],
    consulted_names: ['Priyesh Shah'],
    informed_ids: ['user-audit-1'],
    informed_names: ['Quality Auditor'],
    consultation_expectation: 'Review calibration tolerance values before testing.',
    information_cadence: 'Weekly status report every Friday 5 PM.',
    updated_at: '2026-08-28T12:00:00Z',
    updated_by_name: 'Dr. Mirant Dave (MD)',
  },
  created_at: '2026-08-20T08:00:00Z',
  updated_at: '2026-08-28T12:00:00Z',
  version: 1,
};

describe('LAKSHYA RACI Governance Pure Logic Tests', () => {
  it('1. Validates completely satisfied RACI with 0 issues and ready=true', () => {
    const health = evaluateRaciGovernance(mockWorkItem.raci, mockWorkItem);
    expect(health.ready).toBe(true);
    expect(health.needsAttention).toBe(false);
    expect(health.issues).toHaveLength(0);
    expect(health.responsibleName).toBe('Sister Sunita Rao');
    expect(health.accountableName).toBe('Dr. Mirant Dave (MD)');
    expect(health.consultedCount).toBe(1);
    expect(health.informedCount).toBe(1);
  });

  it('2. Flags missing Responsible or Accountable', () => {
    const health = evaluateRaciGovernance({
      responsible_id: '',
      responsible_name: '',
      accountable_id: '',
      accountable_name: '',
    });
    expect(health.ready).toBe(false);
    expect(health.issues).toContain('Assign one Responsible executor.');
    expect(health.issues).toContain('Assign exactly one Accountable authority.');
  });

  it('3. Enforces Strict Separation of Duty (R != A)', () => {
    const health = evaluateRaciGovernance({
      responsible_id: 'user-1',
      responsible_name: 'Dr. Mirant',
      accountable_id: 'user-1',
      accountable_name: 'Dr. Mirant',
    });
    expect(health.ready).toBe(false);
    expect(health.issues).toContain(
      'Responsible and Accountable must be different until Stavya approves an exception policy.'
    );
  });

  it('4. Enforces Mutual Exclusivity across all RACI roles (no person duplicated)', () => {
    const health = evaluateRaciGovernance({
      responsible_id: 'user-1',
      responsible_name: 'Dr. Mirant',
      accountable_id: 'user-2',
      accountable_name: 'Sister Sunita',
      consulted_ids: ['user-1'],
      consulted_names: ['Dr. Mirant'],
      consultation_expectation: 'Input needed',
    });
    expect(health.ready).toBe(false);
    expect(health.issues.some((issue) => issue.includes('multiple RACI roles'))).toBe(true);
  });

  it('5. Requires Consultation Expectation when C is assigned', () => {
    const health = evaluateRaciGovernance({
      responsible_id: 'user-1',
      responsible_name: 'Dr. Mirant',
      accountable_id: 'user-2',
      accountable_name: 'Sister Sunita',
      consulted_ids: ['user-3'],
      consulted_names: ['Quality Lead'],
      consultation_expectation: '   ', // whitespace only
    });
    expect(health.ready).toBe(false);
    expect(health.issues).toContain(
      'Describe what input is expected from Consulted participants and when.'
    );
  });

  it('6. Requires Information Cadence when I is assigned', () => {
    const health = evaluateRaciGovernance({
      responsible_id: 'user-1',
      responsible_name: 'Dr. Mirant',
      accountable_id: 'user-2',
      accountable_name: 'Sister Sunita',
      informed_ids: ['user-4'],
      informed_names: ['Hospital Ops'],
      information_cadence: '',
    });
    expect(health.ready).toBe(false);
    expect(health.issues).toContain(
      'Describe what updates Informed participants should receive and when.'
    );
  });
});

describe('LAKSHYA RACI Section Component Behavioral Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient.organization, 'getUsers').mockResolvedValue(mockStaff as any);
  });

  it('1. Renders RACI view mode with all 4 roles and status badge', async () => {
    vi.spyOn(apiClient.auth, 'getMe').mockResolvedValue({
      user: {
        id: 'user-resp-1',
        name: 'Sister Sunita Rao',
        email: 'sunita@stavya.local',
        role: 'EMPLOYEE',
        roleTitle: 'Senior Spine Nurse',
        departmentId: 'dept-spine',
        departmentName: 'Spine Surgery',
        permissions: ['task.read'],
      },
      response: { must_change_password: false } as any,
    });

    render(
      <AuthProvider>
        <RaciSection workItem={mockWorkItem} onUpdate={vi.fn()} />
      </AuthProvider>
    );

    expect(await screen.findByText(/RACI Accountability/i)).toBeDefined();
    expect(screen.getByText(/RACI Ready/i)).toBeDefined();
    expect(screen.getByText('Sister Sunita Rao')).toBeDefined();
    expect(screen.getByText('Dr. Mirant Dave (MD)')).toBeDefined();
    expect(screen.getByText('Priyesh Shah')).toBeDefined();
    expect(screen.getByText('Quality Auditor')).toBeDefined();
  });

  it('2. Hides Edit RACI button when user lacks raci.manage permission', async () => {
    vi.spyOn(apiClient.auth, 'getMe').mockResolvedValue({
      user: {
        id: 'user-resp-1',
        name: 'Sister Sunita Rao',
        email: 'sunita@stavya.local',
        role: 'EMPLOYEE',
        roleTitle: 'Senior Spine Nurse',
        departmentId: 'dept-spine',
        departmentName: 'Spine Surgery',
        permissions: ['task.read', 'task.update'], // No raci.manage
      },
      response: { must_change_password: false } as any,
    });

    render(
      <AuthProvider>
        <RaciSection workItem={mockWorkItem} onUpdate={vi.fn()} />
      </AuthProvider>
    );

    await screen.findByText(/RACI Accountability/i);
    expect(screen.queryByRole('button', { name: /Edit RACI/i })).toBeNull();
  });

  it('3. Shows Edit RACI button when user has raci.manage permission and opens editor', async () => {
    vi.spyOn(apiClient.auth, 'getMe').mockResolvedValue({
      user: {
        id: 'user-acc-1',
        name: 'Dr. Mirant Dave (MD)',
        email: 'md@stavya.local',
        role: 'MD',
        roleTitle: 'Managing Director',
        departmentId: 'dept-mdoffice',
        departmentName: 'MD Office',
        permissions: ['raci.manage'],
      },
      response: { must_change_password: false } as any,
    });

    render(
      <AuthProvider>
        <RaciSection workItem={mockWorkItem} onUpdate={vi.fn()} />
      </AuthProvider>
    );

    const editBtn = await screen.findByRole('button', { name: /Edit RACI/i });
    expect(editBtn).toBeDefined();

    fireEvent.click(editBtn);

    // Should switch to editing mode
    expect(screen.getByText(/Assign Responsibility and Accountability/i)).toBeDefined();
    expect(screen.getByLabelText(/Responsible \(R\)/i)).toBeDefined();
    expect(screen.getByLabelText(/Accountable \(A\)/i)).toBeDefined();
    expect(screen.getByText(/Reason for RACI Assignment \/ Change/i)).toBeDefined();
  });

  it('4. Disables Save button when change reason is less than 5 characters or gaps exist', async () => {
    vi.spyOn(apiClient.auth, 'getMe').mockResolvedValue({
      user: {
        id: 'user-acc-1',
        name: 'Dr. Mirant Dave (MD)',
        email: 'md@stavya.local',
        role: 'MD',
        roleTitle: 'Managing Director',
        departmentId: 'dept-mdoffice',
        departmentName: 'MD Office',
        permissions: ['raci.manage'],
      },
      response: { must_change_password: false } as any,
    });

    render(
      <AuthProvider>
        <RaciSection workItem={mockWorkItem} onUpdate={vi.fn()} />
      </AuthProvider>
    );

    const editBtn = await screen.findByRole('button', { name: /Edit RACI/i });
    fireEvent.click(editBtn);

    const saveBtn = screen.getByRole('button', { name: /Save RACI Assignment/i });
    expect(saveBtn).toBeDefined();
    // Initially disabled because change reason is empty
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);

    // Enter short reason (< 5 chars)
    const reasonInput = screen.getByPlaceholderText(/Document why accountability/i);
    fireEvent.change(reasonInput, { target: { value: 'fix' } });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);

    // Enter valid reason (>= 5 chars)
    fireEvent.change(reasonInput, {
      target: { value: 'Realigned clinical accountability for autoclave sensors.' },
    });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it('5. Invokes apiClient.workItems.replaceRaci with valid payload upon saving', async () => {
    vi.spyOn(apiClient.auth, 'getMe').mockResolvedValue({
      user: {
        id: 'user-acc-1',
        name: 'Dr. Mirant Dave (MD)',
        email: 'md@stavya.local',
        role: 'MD',
        roleTitle: 'Managing Director',
        departmentId: 'dept-mdoffice',
        departmentName: 'MD Office',
        permissions: ['raci.manage'],
      },
      response: { must_change_password: false } as any,
    });

    const replaceRaciSpy = vi
      .spyOn(apiClient.workItems, 'replaceRaci')
      .mockResolvedValue({ ...mockWorkItem });
    const onUpdateMock = vi.fn();

    render(
      <AuthProvider>
        <RaciSection workItem={mockWorkItem} onUpdate={onUpdateMock} />
      </AuthProvider>
    );

    const editBtn = await screen.findByRole('button', { name: /Edit RACI/i });
    fireEvent.click(editBtn);

    const reasonInput = screen.getByPlaceholderText(/Document why accountability/i);
    fireEvent.change(reasonInput, {
      target: { value: 'Clinical audit reallocation to senior nurse.' },
    });

    const saveBtn = screen.getByRole('button', { name: /Save RACI Assignment/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(replaceRaciSpy).toHaveBeenCalledTimes(1);
      expect(replaceRaciSpy).toHaveBeenCalledWith(
        'wi-raci-001',
        expect.objectContaining({
          responsible_id: 'user-resp-1',
          accountable_id: 'user-acc-1',
        }),
        'Clinical audit reallocation to senior nurse.'
      );
      expect(onUpdateMock).toHaveBeenCalledTimes(1);
    });
  });
});
