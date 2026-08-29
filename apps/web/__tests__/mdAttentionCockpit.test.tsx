import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { NeedsMDAttentionView } from '../components/leader/NeedsMDAttentionView';
import { MDAttentionItemDrawer } from '../components/leader/MDAttentionItemDrawer';
import { apiClient } from '../lib/api/client';
import { MDAttentionItem } from '../types/mdAttention';
import { DEMO_USERS } from '../lib/mocks/organizationMock';
import { isMDAttentionAuthorized, isLeaderOrAbove } from '../lib/auth/rbacPolicies';

const mockAttentionItem: MDAttentionItem = {
  id: 'att-test-1',
  category: 'CRITICAL_OVERDUE',
  title: 'Audit Sterilization Logs for Modular OT 3',
  source: 'WorkItem: WI-101',
  owner_name: 'Priyesh Shah',
  accountable_name: 'Dr. Mirant Dave (MD)',
  department_name: 'Clinical Operations',
  due_at: '2026-08-25T10:00:00Z',
  original_due_at: '2026-08-20T10:00:00Z',
  due_age_days: 4,
  deferral_count: 1,
  deferral_history: [
    {
      id: 'def-1',
      author_name: 'Dr. Mirant Dave (MD)',
      activity_type: 'DEADLINE_EXTENSION',
      note: 'Granted 5-day grace period for calibration.',
      created_at: '2026-08-20T12:00:00Z',
    },
  ],
  impact: 'Surgical sterility protocol delayed past scheduled audit cycle.',
  requested_action: 'Require physical DoD signoff logs before approval.',
  requested_decision: 'Authorize emergency re-audit or reassign clinical lead.',
  evidence_state: 'INCOMPLETE — Missing Signatures',
  evidence_list: [
    {
      name: 'Physical OT Sterilization Sheet #OT-03',
      submitted_by: 'Priyesh Shah',
      submitted_at: '2026-08-24T15:00:00Z',
      status: 'PENDING_REVIEW',
      notes: 'Initial autoclave readings attached.',
    },
  ],
  activity_history: [
    {
      id: 'act-1',
      author_name: 'Priyesh Shah',
      activity_type: 'STATUS_CHANGE',
      note: 'Task marked blocked due to sensor delay.',
      previous_status: 'in_progress',
      new_status: 'blocked',
      progress_percent: 60,
      created_at: '2026-08-22T09:00:00Z',
    },
  ],
  audit_provenance: 'work_items.id=wi-101',
  why_included: 'Rule: Critical priority item breached scheduled delivery target.',
  priority: 'high',
  status: 'in_progress',
  description: 'Full statutory sterilization audit for all modular operating theatres.',
  version: 2,
  entity_id: 'wi-101',
  entity_type: 'work_item',
  is_synthetic: false,
  allowed_actions: [
    'REQUEST_EVIDENCE',
    'VERIFY_EVIDENCE',
    'RECORD_DECISION',
    'EXECUTIVE_OVERRIDE',
    'GRANT_EXTENSION',
    'REASSIGN_RACI',
  ],
  disabled_actions: {},
};

describe('Needs MD Attention Executive Cockpit Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Renders Access Restricted banner for standard EMPLOYEE role', async () => {
    vi.spyOn(apiClient.auth, 'getMe').mockResolvedValue({
      user: { ...DEMO_USERS.EMPLOYEE, role: 'EMPLOYEE' },
      response: { must_change_password: false } as any,
    });

    render(
      <AuthProvider>
        <NeedsMDAttentionView />
      </AuthProvider>
    );

    const banner = await screen.findByText(/Access Restricted — MD \/ MD Office Only/i);
    expect(banner).toBeDefined();
  });

  it('2. Renders Executive Cockpit summary for MD role', async () => {
    vi.spyOn(apiClient.auth, 'getMe').mockResolvedValue({
      user: { ...DEMO_USERS.MD, role: 'MD' },
      response: { must_change_password: false } as any,
    });

    vi.spyOn(apiClient.mdAttention, 'getSummary').mockResolvedValue({
      total_items: 1,
      critical_overdue_count: 1,
      high_impact_blocker_count: 0,
      decision_awaiting_count: 0,
      evidence_verification_count: 0,
      at_risk_milestone_count: 0,
      repeated_deferrals_count: 0,
      items: [mockAttentionItem],
      is_synthetic_fallback: false,
    });

    render(
      <AuthProvider>
        <NeedsMDAttentionView />
      </AuthProvider>
    );

    expect(await screen.findByText('Needs MD Attention')).toBeDefined();
    expect(await screen.findByText('Audit Sterilization Logs for Modular OT 3')).toBeDefined();
    expect(screen.getByText(/Priyesh Shah/i)).toBeDefined();
  });

  it('3. Opens MDAttentionItemDrawer on item click and displays read-first details', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <MDAttentionItemDrawer
        item={mockAttentionItem}
        isOpen={true}
        onClose={handleClose}
        onActionSuccess={handleSuccess}
      />
    );

    // Verify Title & Rule
    expect(screen.getByText('Audit Sterilization Logs for Modular OT 3')).toBeDefined();
    expect(screen.getByText(/Rule: Critical priority item breached scheduled delivery target/i)).toBeDefined();

    // Verify RACI
    expect(screen.getByText('Responsible (R) — Execution')).toBeDefined();
    expect(screen.getByText('Accountable (A) — Final Sign-off')).toBeDefined();

    // Verify Timeline & Deferrals
    expect(screen.getByText(/1 Extension\(s\)/i)).toBeDefined();
    expect(screen.getByText(/Granted 5-day grace period for calibration/i)).toBeDefined();

    // Verify Evidence List
    expect(screen.getByText('Physical OT Sterilization Sheet #OT-03')).toBeDefined();

    // Verify Action Buttons
    expect(screen.getByRole('button', { name: /Request Evidence/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Approve Closure/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Reject Evidence/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Record Decision/i })).toBeDefined();
  });

  it('4. Triggers Request Evidence modal with mandatory rationale', async () => {
    const requestEvidenceSpy = vi.spyOn(apiClient.mdAttention, 'requestEvidence').mockResolvedValue({
      success: true,
      message: 'Evidence request sent to accountable owner.',
      action_type: 'REQUEST_EVIDENCE',
      entity_id: 'wi-101',
      entity_type: 'work_item',
      updated_at: new Date().toISOString(),
    });

    render(
      <MDAttentionItemDrawer
        item={mockAttentionItem}
        isOpen={true}
        onClose={vi.fn()}
        onActionSuccess={vi.fn()}
      />
    );

    // Click Request Evidence button
    const requestBtn = screen.getByRole('button', { name: /Request Evidence/i });
    fireEvent.click(requestBtn);

    // Modal appears
    expect(screen.getByText('Request Concrete DoD Evidence')).toBeDefined();

    // Type notes into textarea
    const textarea = screen.getByPlaceholderText(/Upload scanned physical NABH sterilization logbook/i);
    fireEvent.change(textarea, {
      target: { value: 'Please attach signed batch logs by 5 PM.' },
    });

    // Confirm action
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Authorize/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(requestEvidenceSpy).toHaveBeenCalledWith({
        work_item_id: 'wi-101',
        request_notes: 'Please attach signed batch logs by 5 PM.',
        deadline_extension_days: 3,
        expected_version: 2,
      });
    });
  });

  it('5. Triggers Evidence Verification (Approve & Close) with DoD confirmation notes', async () => {
    const verifyEvidenceSpy = vi.spyOn(apiClient.mdAttention, 'verifyEvidence').mockResolvedValue({
      success: true,
      message: 'Evidence verification completed: VERIFIED_CLOSED.',
      action_type: 'VERIFY_EVIDENCE',
      entity_id: 'wi-101',
      entity_type: 'work_item',
      updated_at: new Date().toISOString(),
    });

    render(
      <MDAttentionItemDrawer
        item={mockAttentionItem}
        isOpen={true}
        onClose={vi.fn()}
        onActionSuccess={vi.fn()}
      />
    );

    // Click Approve Closure
    const approveBtn = screen.getByRole('button', { name: /Approve Closure/i });
    fireEvent.click(approveBtn);

    // Modal appears
    expect(screen.getByText('Approve & Formally Close Deliverable')).toBeDefined();

    // Enter audit notes
    const textarea = screen.getByPlaceholderText(/Verified OT sterilization logs against checklist/i);
    fireEvent.change(textarea, {
      target: { value: 'Physical sheets inspected and stamped. NABH compliance verified.' },
    });

    // Confirm action
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Authorize/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(verifyEvidenceSpy).toHaveBeenCalledWith({
        work_item_id: 'wi-101',
        verification_result: 'VERIFIED_CLOSED',
        verification_notes: 'Physical sheets inspected and stamped. NABH compliance verified.',
        expected_version: 2,
      });
    });
  });

  it('6. Verifies frontend canonical Allow/Deny RBAC policy matrix', () => {
    const allowedMDRoles = [
      'MD',
      'md',
      'MD_OFFICE',
      'md_office',
      'MANAGING_DIRECTOR',
      'managing_director',
      'ADMIN',
      'admin',
      'MASTER',
      'master',
      'LOCAL_BOOTSTRAP_ADMIN',
      'local_bootstrap_admin',
    ];

    const deniedMDRoles = [
      'DEPARTMENT_HEAD',
      'department_head',
      'MANAGER',
      'manager',
      'LEADER',
      'leader',
      'LEADERS',
      'leaders',
      'EMPLOYEE',
      'employee',
      'STAVYAN',
      'stavyan',
      'NURSE',
      'nurse',
      'DOCTOR',
      'doctor',
      'GUEST',
      'guest',
      '',
      undefined,
    ];

    for (const role of allowedMDRoles) {
      expect(isMDAttentionAuthorized(role)).toBe(true);
    }

    for (const role of deniedMDRoles) {
      expect(isMDAttentionAuthorized(role)).toBe(false);
    }

    // Verify isLeaderOrAbove
    expect(isLeaderOrAbove('DEPARTMENT_HEAD')).toBe(true);
    expect(isLeaderOrAbove('MANAGER')).toBe(true);
    expect(isLeaderOrAbove('LEADER')).toBe(true);
    expect(isLeaderOrAbove('EMPLOYEE')).toBe(false);
    expect(isLeaderOrAbove('STAVYAN')).toBe(false);
  });

  it('7. Handles 409 Optimistic Concurrency Conflict gracefully in Drawer', async () => {
    vi.spyOn(apiClient.mdAttention, 'verifyEvidence').mockRejectedValue({
      status: 409,
      code: 'conflict',
      message: 'Item has been modified by another leader or user.',
    });

    render(
      <MDAttentionItemDrawer
        item={mockAttentionItem}
        isOpen={true}
        onClose={vi.fn()}
        onActionSuccess={vi.fn()}
      />
    );

    const approveBtn = screen.getByRole('button', { name: /Approve Closure/i });
    fireEvent.click(approveBtn);

    const textarea = screen.getByPlaceholderText(/Verified OT sterilization logs against checklist/i);
    fireEvent.change(textarea, {
      target: { value: 'Valid verification notes for concurrency test.' },
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Authorize/i });
    fireEvent.click(confirmBtn);

    const conflictMsg = await screen.findByText(/Concurrency Conflict/i);
    expect(conflictMsg).toBeDefined();
  });

  it('8. Closes drawer on Escape key press (keyboard accessibility)', () => {
    const handleClose = vi.fn();

    render(
      <MDAttentionItemDrawer
        item={mockAttentionItem}
        isOpen={true}
        onClose={handleClose}
        onActionSuccess={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
