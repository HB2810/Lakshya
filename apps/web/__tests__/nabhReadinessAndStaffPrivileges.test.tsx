import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { nabhReadinessStore } from '../lib/mocks/nabhReadinessStore';
import { NABH_6TH_EDITION_CHECKLIST_ITEMS, NABH_6TH_EDITION_CHAMPIONS } from '../lib/data/nabhReadinessChecklistData';
import { hospitalStaffAuthStore } from '../lib/auth/hospitalStaffAuth';
import { NabhChampionReadinessDashboardWidget } from '../components/organization/NabhChampionReadinessDashboardWidget';
import { HospitalStaffPrivilegeManager } from '../components/organization/HospitalStaffPrivilegeManager';
import { workItemStore } from '../lib/mocks/workItemMock';
import LoginPage from '../app/login/page';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock AuthContext
let mockUser = {
  id: 'e001',
  name: 'Dr. Mirant Bharat Dave (MD)',
  email: 'dr.mirant.dave@stavyaspine.com',
  role: 'MANAGING_DIRECTOR',
  roleTitle: 'Managing Director',
  departmentName: 'Executive Governance & MD Office',
  capabilities: ['SUPER_ADMIN', 'QUALITY_COMMAND_VIEW', 'TASK_MANAGE', 'RACI_MANAGE', 'AUDIT_VIEW'],
  permissions: ['*'],
};

vi.mock('../lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    can: () => true,
    login: vi.fn(async (code: string) => {
      const acc = hospitalStaffAuthStore.authenticate(code);
      return hospitalStaffAuthStore.toFrontendUser(acc);
    }),
  }),
}));

describe('NABH 6th Edition Readiness Checklist & 214 Staff Privilege Suite', () => {
  beforeEach(() => {
    workItemStore.resetData();
    nabhReadinessStore.resetData();
    nabhReadinessStore.syncChecklistToWorkItems();
    hospitalStaffAuthStore.resetToDefaults();
  });

  describe('1. NABH 6th Edition Chapter Champion Readiness Checklist Data & Store', () => {
    it('contains all 10 standard chapters with designated Chapter Champions', () => {
      expect(NABH_6TH_EDITION_CHAMPIONS.length).toBe(10);
      const chapters = ['AAC', 'COP', 'MOM', 'PRE', 'IPC', 'PSQ', 'ROM', 'FMS', 'HRM', 'IMS'];
      chapters.forEach((chap) => {
        const champ = NABH_6TH_EDITION_CHAMPIONS.find((c) => c.chapter === chap);
        expect(champ).toBeDefined();
        expect(champ?.championName).toBeTruthy();
        expect(champ?.priorityDirectives.length).toBeGreaterThan(0);
      });
    });

    it('contains comprehensive checklist items across all chapters with statutory mandates', () => {
      expect(NABH_6TH_EDITION_CHECKLIST_ITEMS.length).toBeGreaterThanOrEqual(50);

      // Check Safe Surgery COP checklist
      const ssiItem = NABH_6TH_EDITION_CHECKLIST_ITEMS.find((i) => i.id === 'chk-cop-01');
      expect(ssiItem).toBeDefined();
      expect(ssiItem?.title).toContain('WHO Surgical Safety Checklist');
      expect(ssiItem?.statutoryMandate).toBe(true);

      // Check Antimicrobial Stewardship MOM checklist
      const amspItem = NABH_6TH_EDITION_CHECKLIST_ITEMS.find((i) => i.id === 'chk-mom-01');
      expect(amspItem).toBeDefined();
      expect(amspItem?.title).toContain('Antimicrobial Stewardship');
    });

    it('synchronizes checklist items into active workItemStore To-Dos with proper RACI', () => {
      const workItems = workItemStore.getWorkItems();
      const nabhWorkItems = workItems.filter((w) => w.tags?.includes('NABH_6TH_EDITION'));
      expect(nabhWorkItems.length).toBeGreaterThanOrEqual(50);

      // Verify RACI is populated
      const sampleItem = nabhWorkItems[0];
      expect(sampleItem.raci?.responsible_name).toBeTruthy();
      expect(sampleItem.raci?.accountable_name).toBeTruthy();
      expect(sampleItem.raci?.consulted_names?.length).toBeGreaterThan(0);
    });

    it('calculates weighted readiness percentage and updates status on sign-off', () => {
      const initialSummary = nabhReadinessStore.getReadinessSummary();
      expect(initialSummary.total).toBeGreaterThanOrEqual(50);
      expect(initialSummary.readinessPercent).toBeGreaterThan(0);

      // Update status of an in-progress item
      const updated = nabhReadinessStore.updateItemStatus(
        'chk-aac-03',
        'VERIFIED',
        'Verified in PACS system.',
        'Dr. Preety Krishnan'
      );
      expect(updated?.status).toBe('VERIFIED');
      expect(updated?.verifiedBy).toBe('Dr. Preety Krishnan');

      const newSummary = nabhReadinessStore.getReadinessSummary();
      expect(newSummary.verified).toBe(initialSummary.verified + 1);
    });
  });

  describe('2. Hospital Staff Authentication & 214 Employee Logins', () => {
    it('creates employee accounts for all 214 hospital staff from the org chart', () => {
      const allAccounts = hospitalStaffAuthStore.getAllAccounts();
      expect(allAccounts.length).toBeGreaterThanOrEqual(210);

      // Verify MD account
      const mdAccount = hospitalStaffAuthStore.getAccountByCode('STAVYA-001');
      expect(mdAccount).toBeDefined();
      expect(mdAccount?.name).toContain('Mirant');
      expect(mdAccount?.role).toBe('MANAGING_DIRECTOR');

      // Verify Chapter Champion accounts
      const aacLead = hospitalStaffAuthStore.getAccountById('e048');
      expect(aacLead).toBeDefined();
      expect(aacLead?.isChapterChampion).toBe(true);

      const copLead = hospitalStaffAuthStore.getAccountById('e026');
      expect(copLead).toBeDefined();
      expect(copLead?.isChapterChampion).toBe(true);
    });

    it('authenticates employees via Employee Code, ID, Email, or Name', () => {
      // By Code
      const acc1 = hospitalStaffAuthStore.authenticate('STAVYA-001', '1234');
      expect(acc1.name).toContain('Mirant');

      // By ID
      const acc2 = hospitalStaffAuthStore.authenticate('e048', 'Stavya@2026');
      expect(acc2.name).toContain('Preety');

      // By Name
      const acc3 = hospitalStaffAuthStore.authenticate('Jatin Pathak', '1234');
      expect(acc3.name).toContain('Jatin');
    });

    it('rejects suspended accounts and incorrect passwords', () => {
      // Suspend an account
      hospitalStaffAuthStore.setAccessStatus('e133', 'SUSPENDED');

      expect(() => {
        hospitalStaffAuthStore.authenticate('e133', '1234');
      }).toThrow(/SUSPENDED/);

      // Incorrect password
      expect(() => {
        hospitalStaffAuthStore.authenticate('STAVYA-001', 'wrongpass999');
      }).toThrow(/Invalid credentials/);
    });
  });

  describe('3. Master Admin Privilege Management', () => {
    it('allows Master Admin to update roles, access status, and granular capabilities', () => {
      // Grant Quality Command Centre access to an employee
      const updated = hospitalStaffAuthStore.toggleCapability('e101', 'QUALITY_COMMAND_VIEW', true);
      expect(updated.capabilities).toContain('QUALITY_COMMAND_VIEW');

      // Revoke capability
      const revoked = hospitalStaffAuthStore.toggleCapability('e101', 'QUALITY_COMMAND_VIEW', false);
      expect(revoked.capabilities).not.toContain('QUALITY_COMMAND_VIEW');

      // Change Role
      const promoted = hospitalStaffAuthStore.updateEmployeePrivileges('e101', {
        role: 'LEADER',
        roleTitle: 'Senior Clinical Lead',
      });
      expect(promoted.role).toBe('LEADER');
      expect(promoted.roleTitle).toBe('Senior Clinical Lead');
    });
  });

  describe('4. UI Component Rendering', () => {
    it('renders NabhChampionReadinessDashboardWidget with readiness score and filters', () => {
      render(<NabhChampionReadinessDashboardWidget />);

      expect(screen.getByText(/Hospital Accreditation Readiness Checklist/i)).toBeDefined();
      expect(screen.getByText(/Overall Score/i)).toBeDefined();
      expect(screen.getByText(/Pending Tasks/i)).toBeDefined();

      // Chapter progress meters
      expect(screen.getByText('AAC')).toBeDefined();
      expect(screen.getByText('COP')).toBeDefined();
      expect(screen.getByText('MOM')).toBeDefined();
      expect(screen.getByText('IPC')).toBeDefined();

      // Search checklist items
      const searchInput = screen.getByPlaceholderText(/Search checklist, code, champion/i);
      fireEvent.change(searchInput, { target: { value: 'COP.1.1' } });
      expect(screen.getByText(/WHO Surgical Safety Checklist OT Adherence/i)).toBeDefined();
    });

    it('renders HospitalStaffPrivilegeManager with 214 staff accounts and admin controls', () => {
      render(<HospitalStaffPrivilegeManager />);

      expect(screen.getByText(/Hospital Staff Privilege & Access Governance/i)).toBeDefined();
      expect(screen.getByText(/Total Staff/i)).toBeDefined();
      expect(screen.getAllByText(/Active Logins/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/NABH Champions/i).length).toBeGreaterThan(0);

      // Filter by tier
      fireEvent.click(screen.getByText(/Executive Governance/i));
      expect(screen.getByText(/Dr. Mirant Bharat Dave/i)).toBeDefined();
    });

    it('renders Login Page with 214 Staff Directory 1-Click Login modal', () => {
      render(<LoginPage />);

      expect(screen.getByText(/Hospital Operating System & NABH 6th Edition Command/i)).toBeDefined();
      expect(screen.getByText(/214 Staff Directory/i)).toBeDefined();

      // Open Directory modal
      fireEvent.click(screen.getByText(/Browse All 214 Hospital Staff Accounts/i));
      expect(screen.getByText(/1-Click Login for All 214 Hospital Staff/i)).toBeDefined();
    });
  });
});
