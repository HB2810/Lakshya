import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StavyaQualityCommandCentre, NabhCommandCentreView } from '../components/organization/NabhCommandCentreView';
import { OmnichannelIntakeHub } from '../components/intake/OmnichannelIntakeHub';
import KPIPage from '../app/(app)/kpi/page';
import RCAPage from '../app/(app)/rca/page';
import { workItemStore } from '../lib/mocks/workItemMock';
import { rcaStore } from '../lib/mocks/rcaMock';
import { NABH_CHAPTERS, NABH_COMMITTEES, NABH_ACTIONS, NABH_POLICIES, NABH_STANDARDS_KPIS } from '../lib/data/stavyaNabhData';
import { STAVYA_STAFF_DATABASE } from '../lib/data/stavyaHospitalOrgData';
import { isQualityCommandAuthorized } from '../lib/auth/rbacPolicies';

// Mock AuthContext
let mockUser = {
  id: 'e069',
  name: 'Dr. Mirant Bharat Dave (MD)',
  email: 'mirant@stavyaspine.com',
  role: 'MANAGING_DIRECTOR',
  roleTitle: 'Managing Director',
  departmentName: 'Executive & Strategic Leadership',
  capabilities: ['SUPER_ADMIN', 'RACI_MANAGE', 'TASK_MANAGE', 'AUDIT_VIEW'],
  permissions: ['quality.command.view', 'quality.manage'],
};

vi.mock('../lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    can: (cap: string) => true,
    impersonate: vi.fn(),
  }),
}));

describe('Stavya Quality Command Centre & Hospital Operating System Suite', () => {
  beforeEach(() => {
    workItemStore.resetData();
    rcaStore.resetData();
    mockUser = {
      id: 'e069',
      name: 'Dr. Mirant Bharat Dave (MD)',
      email: 'mirant@stavyaspine.com',
      role: 'MANAGING_DIRECTOR',
      roleTitle: 'Managing Director',
      departmentName: 'Executive & Strategic Leadership',
      capabilities: ['SUPER_ADMIN', 'RACI_MANAGE', 'TASK_MANAGE', 'AUDIT_VIEW'],
      permissions: ['quality.command.view', 'quality.manage'],
    };
  });

  it('1. Loads and verifies complete NABH dataset structures and 48 quality KPIs', () => {
    expect(NABH_CHAPTERS.length).toBe(10);
    expect(NABH_COMMITTEES.length).toBe(10);
    expect(NABH_ACTIONS.length).toBe(61);
    expect(NABH_POLICIES.length).toBe(39);
    expect(NABH_STANDARDS_KPIS.length).toBe(48);
    expect(Object.keys(STAVYA_STAFF_DATABASE).length).toBeGreaterThanOrEqual(210);

    // Verify all 10 chapters have indicators
    const chapters = ['AAC', 'COP', 'MOM', 'PRE', 'IPC', 'PSQ', 'ROM', 'FMS', 'HRM', 'IMS'];
    chapters.forEach(chap => {
      const indicators = NABH_STANDARDS_KPIS.filter(k => k.chapter === chap);
      expect(indicators.length).toBeGreaterThan(0);
    });

    // Verify critical zero-harm indicators
    const ssiKpi = NABH_STANDARDS_KPIS.find(k => k.code === 'NABH-COP-01');
    expect(ssiKpi).toBeDefined();
    expect(ssiKpi?.actualValue).toBe(0.0);

    const handHygieneKpi = NABH_STANDARDS_KPIS.find(k => k.code === 'NABH-IPC-01');
    expect(handHygieneKpi?.actualValue).toBe(96.4);

    const codeBlueKpi = NABH_STANDARDS_KPIS.find(k => k.code === 'NABH-COP-02');
    expect(codeBlueKpi?.actualValue).toBe(84.0);
  });

  it('2. Enforces strict RBAC visibility policies for Quality Command Centre', () => {
    // Authorized: MD
    expect(isQualityCommandAuthorized({ role: 'MD', name: 'Dr. Mirant Bharat Dave' })).toBe(true);
    expect(isQualityCommandAuthorized({ role: 'MANAGING_DIRECTOR' })).toBe(true);

    // Authorized: Quality Directorate
    expect(isQualityCommandAuthorized({ role: 'DIRECTOR_QUALITY', name: 'Dr. Akruti Mirant Dave' })).toBe(true);
    expect(isQualityCommandAuthorized({ role: 'EMPLOYEE', departmentName: 'Quality & Patient Safety' })).toBe(true);
    expect(isQualityCommandAuthorized({ role: 'LEADER', roleTitle: 'Director of Quality & Patient Safety' })).toBe(true);

    // Authorized: Hospital Governance Team
    expect(isQualityCommandAuthorized({ role: 'CHAIRMAN', name: 'Dr. Bharat Rajendraprasad Dave' })).toBe(true);
    expect(isQualityCommandAuthorized({ role: 'VICE_CHAIRPERSON', name: 'Amita Bharat Dave' })).toBe(true);
    expect(isQualityCommandAuthorized({ role: 'MASTER' })).toBe(true);

    // Unauthorized: Standard Employees & generic non-quality staff
    expect(isQualityCommandAuthorized({ role: 'EMPLOYEE', departmentName: 'Billing & TPA', name: 'Random Staff' })).toBe(false);
    expect(isQualityCommandAuthorized({ role: 'NURSE', departmentName: 'Ward A', name: 'Staff Nurse' })).toBe(false);
  });

  it('3. Renders Stavya Quality Command Centre with all 48 NABH KPIs and sub-tabs for authorized user', () => {
    render(<StavyaQualityCommandCentre />);

    expect(screen.getByText(/Stavya Quality Command Centre \(QCC\)/i)).toBeDefined();
    expect(screen.getByText(/Hospital Clinical Quality, Safety & Accreditation Command/i)).toBeDefined();
    expect(screen.getByText(/Inspection Countdown/i)).toBeDefined();
    expect(screen.getByText(/Readiness Index/i)).toBeDefined();

    // 48 Tracked NABH KPIs
    expect(screen.getByText(/48 Standard KPIs/i)).toBeDefined();
    expect(screen.getAllByText(/All NABH KPIs \(48\)/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Surgical Site Infection \(SSI\) Rate \(Spine Procedures\)/i)).toBeDefined();
    expect(screen.getByText(/WHO 5-Moments Hand Hygiene Adherence Rate/i)).toBeDefined();
    expect(screen.getByText(/Emergency Code Blue Mock Drill Response Time/i)).toBeDefined();

    // Sub-tab buttons
    expect(screen.getByText(/Quality Action Matrix/i)).toBeDefined();
    expect(screen.getAllByText(/10 NABH Chapters/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10 Committees/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SOPs & Policies/i).length).toBeGreaterThan(0);
  });

  it('4. Searches, filters, and expands formula and data source for NABH KPIs', async () => {
    render(<StavyaQualityCommandCentre />);

    const searchInput = screen.getByPlaceholderText(/Search 48 NABH KPIs by title, code/i);
    fireEvent.change(searchInput, { target: { value: 'NABH-COP-01' } });

    expect(screen.getByText(/Surgical Site Infection \(SSI\) Rate/i)).toBeDefined();

    // Expand formula & data source breakdown
    const viewFormulaBtn = screen.getByText(/View Data Source & Method/i);
    fireEvent.click(viewFormulaBtn);

    expect(screen.getByText(/Computation Formula:/i)).toBeDefined();
    expect(screen.getAllByText(/Source System/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Physical\/Digital Register/i).length).toBeGreaterThan(0);
  });

  it('5. Captures and computes a live KPI entry with auditable data source in Quality Command Centre', async () => {
    render(<StavyaQualityCommandCentre />);

    const searchInput = screen.getByPlaceholderText(/Search 48 NABH KPIs by title, code/i);
    fireEvent.change(searchInput, { target: { value: 'NABH-AAC-01' } });

    const captureBtns = screen.getAllByText(/Capture Data Entry/i);
    expect(captureBtns.length).toBeGreaterThan(0);

    fireEvent.click(captureBtns[0]);

    // Check modal opens with Point-of-Care Data Entry terminal
    expect(screen.getByText(/Point-of-Care Statutory Data Entry/i)).toBeDefined();

    const numInput = screen.getByPlaceholderText(/e\.g\. 48/i);
    const denInput = screen.getByPlaceholderText(/e\.g\. 50/i);

    fireEvent.change(numInput, { target: { value: '450' } });
    fireEvent.change(denInput, { target: { value: '30' } });

    fireEvent.click(screen.getByRole('button', { name: /Save & Submit Entry/i }));

    await waitFor(() => {
      expect(screen.getByText(/captured & computed as 15 min/i)).toBeDefined();
    });
  });

  it('6. Filters action items by chapter in Stavya Quality Command Centre', async () => {
    render(<StavyaQualityCommandCentre />);

    // Switch to Action Matrix tab
    fireEvent.click(screen.getByText(/Quality Action Matrix/i));

    const searchInput = screen.getByPlaceholderText(/Search action title, owner, chapter/i);
    fireEvent.change(searchInput, { target: { value: 'Medical Records' } });

    expect(screen.getByText(/Establish Medical Records function/i)).toBeDefined();
  });

  it('7. Successfully performs Action Verification Sign-off in Quality Command Centre', async () => {
    render(<StavyaQualityCommandCentre />);

    // Switch to Action Matrix tab
    fireEvent.click(screen.getByText(/Quality Action Matrix/i));

    const verifyButtons = screen.getAllByText(/Verify Sign-Off/i);
    expect(verifyButtons.length).toBeGreaterThan(0);

    fireEvent.click(verifyButtons[0]);

    // Check modal opens
    expect(screen.getAllByText(/Confirm Verification & Sign Off/i).length).toBeGreaterThan(0);

    const remarksInput = screen.getByPlaceholderText(/Confirm deliverable verified/i);
    fireEvent.change(remarksInput, { target: { value: 'Verified by Quality Board during weekly rounds.' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Verification & Sign Off/i }));

    await waitFor(() => {
      expect(screen.getByText(/officially VERIFIED and signed off!/i)).toBeDefined();
    });
  });

  it('8. Ingests omnichannel WhatsApp/Email messages and deploys into WorkItems', async () => {
    const onCreated = vi.fn();
    render(<OmnichannelIntakeHub onTaskCreated={onCreated} />);

    expect(screen.getByText(/Intelligent Intake Dispatcher/i)).toBeDefined();
    expect(screen.getByText(/WhatsApp \/ Chat/i)).toBeDefined();
    expect(screen.getByText(/Hospital Emails/i)).toBeDefined();

    // Click Approve & Deploy on the first staged item
    const approveButtons = screen.getAllByText(/Approve & Deploy/i);
    expect(approveButtons.length).toBeGreaterThan(0);

    const initialTaskCount = workItemStore.getWorkItems().length;
    fireEvent.click(approveButtons[0]);

    expect(workItemStore.getWorkItems().length).toBeGreaterThan(initialTaskCount);
    expect(onCreated).toHaveBeenCalled();
  });

  it('9. Renders Universal KPI Radar across Hospital, Department, and Individual Staff', () => {
    render(<KPIPage />);

    // Hospital Executive Tab
    expect(screen.getAllByText(/Hospital Execution Index/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/NABH Accreditation Readiness/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Blocker Triage Velocity/i).length).toBeGreaterThan(0);

    // Switch to Department Tab
    fireEvent.click(screen.getByText(/Department Scorecards/i));
    expect(screen.getByText(/Spine Surgery Leadership/i)).toBeDefined();
    expect(screen.getByText(/Nursing Leadership & OT/i)).toBeDefined();

    // Switch to Individual Staff Tab
    fireEvent.click(screen.getByText(/Individual Staff/i));
    expect(screen.getByPlaceholderText(/Search all 213 hospital staff members/i)).toBeDefined();
  });

  it('10. Deploys Kaizen CAPA actions into active WorkItems from RCA page', async () => {
    render(<RCAPage />);

    expect(screen.getByText(/Root Cause Analysis/i)).toBeDefined();
    expect(screen.getByText(/5-Why Sequential Root Cause Cascade/i)).toBeDefined();

    // Deploy a CAPA task
    const deployButtons = screen.getAllByText(/Deploy Task/i);
    expect(deployButtons.length).toBeGreaterThan(0);

    const initialTaskCount = workItemStore.getWorkItems().length;
    fireEvent.click(deployButtons[0]);

    expect(workItemStore.getWorkItems().length).toBeGreaterThan(initialTaskCount);
    expect(screen.getByText(/Deployed CAPA/i)).toBeDefined();
  });
});
