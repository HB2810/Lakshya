import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { NeedsMDAttentionView } from '../components/leader/NeedsMDAttentionView';
import { apiClient } from '../lib/api/client';
import { MDAttentionSummary } from '../types/mdAttention';
import * as AuthContextModule from '../lib/auth/AuthContext';

const mockSummary: MDAttentionSummary = {
  total_items: 4,
  critical_overdue_count: 1,
  high_impact_blocker_count: 1,
  decision_awaiting_count: 1,
  evidence_verification_count: 1,
  at_risk_milestone_count: 0,
  repeated_deferrals_count: 0,
  items: [
    {
      id: 'att-1',
      category: 'CRITICAL_OVERDUE',
      title: 'PACS Gateway Migration & DICOM Cache',
      source: 'Meeting: Daily Spine Surgery Sync',
      owner_name: 'Priyesh Shah',
      accountable_name: 'Dr. Rohan Sharma',
      department_name: 'IT & Digital Health',
      due_at: '2026-08-25T10:00:00Z',
      due_age_days: 4,
      impact: 'Critical pathway deliverable delayed past due date.',
      requested_action: 'Require owner to submit verified recovery plan.',
      evidence_state: 'OVERDUE — Incomplete',
      audit_provenance: 'work_items.id=wi-pacs-101',
      why_included: 'Rule: High/Urgent priority item breached scheduled delivery target.',
      priority: 'urgent',
      entity_id: 'wi-pacs-101',
      entity_type: 'work_item',
    },
    {
      id: 'att-2',
      category: 'HIGH_IMPACT_BLOCKER',
      title: '[BLOCKED] OT-1 C-Arm Firmware Calibration',
      source: 'Direct Directive',
      owner_name: 'Amit Patel',
      accountable_name: 'Het Bhatt',
      department_name: 'Clinical Operations',
      due_at: null,
      due_age_days: null,
      impact: 'Missing vendor unlock key for C-Arm image calibration.',
      requested_action: 'Issue executive override or contact vendor leadership.',
      evidence_state: 'BLOCKED — StuckNeedItem Active',
      audit_provenance: 'work_items.id=wi-carm-102 (status=blocked)',
      why_included: 'Rule: Unresolved HIGH urgency blocker reported.',
      priority: 'high',
      entity_id: 'wi-carm-102',
      entity_type: 'work_item',
    },
    {
      id: 'att-3',
      category: 'DECISION_AWAITING_AUTHORITY',
      title: 'L3 Escalation: Vendor SLA Contract Non-Compliance',
      source: 'Level 3 Executive Escalation',
      owner_name: 'Priyesh Shah',
      accountable_name: 'Dr. Rohan Sharma',
      department_name: 'MD Office Strategic Cell',
      due_at: null,
      due_age_days: null,
      impact: 'Vendor refuses SLA contract without executive signoff.',
      requested_action: 'Review escalation details and render authoritative resolution directive.',
      evidence_state: 'ESCALATED_L3 — Pending MD Decision',
      audit_provenance: 'work_item_escalations.id=esc-001',
      why_included: 'Rule: Pending L3 escalation awaiting MD decision authority.',
      priority: 'urgent',
      entity_id: 'wi-carm-102',
      entity_type: 'work_item_escalation',
    },
    {
      id: 'att-4',
      category: 'EVIDENCE_AWAITING_VERIFICATION',
      title: 'Verification Pending: Biomedical Autoclave Protocol Audit',
      source: 'NABH Quality Audit Protocol',
      owner_name: 'Sister Sunita Rao',
      accountable_name: 'Het Bhatt',
      department_name: 'Nursing & Clinical Operations',
      due_at: null,
      due_age_days: null,
      impact: 'Reported complete by nursing team. Evidence must be independently audited.',
      requested_action: 'Audit physical checklist evidence before marking VERIFIED in registry.',
      evidence_state: 'REPORTED_COMPLETE (Awaiting Independent Signoff)',
      audit_provenance: 'work_items.id=wi-auto-104',
      why_included: 'Rule: Claimed completion is never equated with VERIFIED/CLOSED without independent evidence.',
      priority: 'high',
      entity_id: 'wi-auto-104',
      entity_type: 'work_item',
    },
  ],
};

const mockMDAuth = {
  user: {
    id: 'usr-md-01',
    name: 'Dr. Rohan Sharma',
    email: 'md@stavya.local',
    role: 'MD' as const,
    roleTitle: 'Managing Director',
    departmentId: 'dept-md-01',
    departmentName: 'MD Office',
    organizationSlug: 'stavya-spine',
    permissions: ['dashboard.md.read', 'organization.read'],
  },
  isAuthenticated: true,
  isLoading: false,
  activePersona: 'MD' as const,
  mustChangePassword: false,
  login: vi.fn(),
  logout: vi.fn(),
  switchPersona: vi.fn(),
  can: (cap: string) => cap === 'dashboard.md.read' || cap === 'organization.read',
};

const mockEmployeeAuth = {
  user: {
    id: 'usr-emp-01',
    name: 'Sister Sunita Rao',
    email: 'employee@stavya.local',
    role: 'EMPLOYEE' as const,
    roleTitle: 'Staff Nurse',
    departmentId: 'dept-nursing-01',
    departmentName: 'Nursing',
    organizationSlug: 'stavya-spine',
    permissions: ['work_item.read'],
  },
  isAuthenticated: true,
  isLoading: false,
  activePersona: 'EMPLOYEE' as const,
  mustChangePassword: false,
  login: vi.fn(),
  logout: vi.fn(),
  switchPersona: vi.fn(),
  can: (_cap: string) => false,
};

describe('Needs MD Attention Executive Engine Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Renders Needs MD Attention overview with summary badges and category cards for MD', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(mockMDAuth);
    vi.spyOn(apiClient.mdAttention, 'getSummary').mockResolvedValueOnce(mockSummary);

    render(<NeedsMDAttentionView />);

    expect(await screen.findByText(/Needs MD Attention/i)).toBeDefined();
    expect(screen.getByText(/4 Total Active Exceptions/i)).toBeDefined();
    expect(screen.getByText(/PACS Gateway Migration & DICOM Cache/i)).toBeDefined();
    expect(screen.getByText(/OT-1 C-Arm Firmware Calibration/i)).toBeDefined();
    expect(screen.getByText(/Vendor SLA Contract Non-Compliance/i)).toBeDefined();
    expect(screen.getByText(/Biomedical Autoclave Protocol Audit/i)).toBeDefined();
  });

  it('2. Filters items by category when clicking category halo cards', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(mockMDAuth);
    vi.spyOn(apiClient.mdAttention, 'getSummary').mockResolvedValueOnce(mockSummary);

    render(<NeedsMDAttentionView />);

    await screen.findByText(/Needs MD Attention/i);

    // Click "Critical Overdue" filter
    const overdueCard = screen.getByRole('button', { name: /Critical Overdue 1/i });
    fireEvent.click(overdueCard);

    // Should only show the overdue item
    expect(screen.getByText(/PACS Gateway Migration & DICOM Cache/i)).toBeDefined();
    expect(screen.queryByText(/OT-1 C-Arm Firmware Calibration/i)).toBeNull();
  });

  it('3. Renders empty state when 0 items require MD attention', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(mockMDAuth);
    vi.spyOn(apiClient.mdAttention, 'getSummary').mockResolvedValueOnce({
      total_items: 0,
      critical_overdue_count: 0,
      high_impact_blocker_count: 0,
      decision_awaiting_count: 0,
      evidence_verification_count: 0,
      at_risk_milestone_count: 0,
      repeated_deferrals_count: 0,
      items: [],
    });

    render(<NeedsMDAttentionView />);

    expect(await screen.findByText(/All Executive Items Clear/i)).toBeDefined();
    expect(screen.getByText(/No active escalations, overdue blockers, or unverified items/i)).toBeDefined();
  });

  it('4. Renders error state with retry button on API failure', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(mockMDAuth);
    vi.spyOn(apiClient.mdAttention, 'getSummary').mockRejectedValueOnce(new Error('Internal Gateway Timeout'));

    render(<NeedsMDAttentionView />);

    expect(await screen.findByText(/Error loading Needs MD Attention telemetry/i)).toBeDefined();
    expect(screen.getByText(/Internal Gateway Timeout/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeDefined();
  });

  it('5. Strictly gates against standard employees and renders unauthorized message', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(mockEmployeeAuth);

    render(<NeedsMDAttentionView />);

    // Should immediately render access restriction banner for employee persona
    expect(await screen.findByText(/Access Restricted — MD \/ MD Office Only/i)).toBeDefined();
  });
});
