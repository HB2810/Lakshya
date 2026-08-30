import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  NABH_STANDARDS_KPIS, 
  NabhQualityIndicator, 
  KpiDataSource 
} from '../lib/data/stavyaNabhData';
import { KpiDataCaptureModal, KpiCaptureAuditRecord } from '../components/organization/KpiDataCaptureModal';
import { StavyaQualityCommandCentre } from '../components/organization/NabhCommandCentreView';
import { AuthProvider } from '../lib/auth/AuthContext';
import KPIPage from '../app/(app)/kpi/page';

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
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/quality',
}));

describe('LAKSHYA KPI Data Entry & Capture Source Engine Suite', () => {
  describe('1. 100% Audit Coverage Across All 48 NABH 6th Edition Indicators', () => {
    it('verifies that all 48 NABH quality indicators have an explicit dataSource definition', () => {
      expect(NABH_STANDARDS_KPIS).toHaveLength(48);

      NABH_STANDARDS_KPIS.forEach((kpi: NabhQualityIndicator) => {
        expect(kpi.dataSource).toBeDefined();
        const ds = kpi.dataSource;

        // Primary systems & physical register assertions
        expect(ds.sourceSystem).toBeTruthy();
        expect(ds.sourceSystem.length).toBeGreaterThan(3);

        expect(ds.sourceRegister).toBeTruthy();
        expect(ds.sourceRegister.length).toBeGreaterThan(3);

        // Data collector & accountability assertions
        expect(ds.dataCollectorRole).toBeTruthy();
        expect(ds.dataCollectorRole.length).toBeGreaterThan(3);
        expect(ds.verificationAuthority).toBeTruthy();

        // Capture method & frequency assertions
        expect(['AUTOMATED_HIMS_PULL', 'MANUAL_PHYSICAL_REGISTER', 'DIGITAL_TABLET_ENTRY', 'HYBRID_VERIFIED_AUDIT']).toContain(ds.captureMethod);
        expect(['DAILY_POINT_OF_CARE', 'PER_SURGICAL_EVENT', 'SHIFT_WISE', 'WEEKLY_AUDIT', 'MONTHLY_CENSUS', 'PER_INCIDENT']).toContain(ds.captureFrequency);

        // Raw capture field origin assertions
        expect(ds.numeratorSource).toBeTruthy();
        expect(ds.numeratorSource.length).toBeGreaterThan(5);

        expect(ds.denominatorSource).toBeTruthy();
        expect(ds.denominatorSource.length).toBeGreaterThan(5);
      });
    });

    it('verifies clinical data sources for major surgical & infection safety indicators', () => {
      const ssiKpi = NABH_STANDARDS_KPIS.find(k => k.code === 'NABH-IPC-02');
      expect(ssiKpi).toBeDefined();
      expect(ssiKpi?.dataSource.sourceSystem).toContain('HAI Surveillance');
      expect(ssiKpi?.dataSource.sourceRegister).toContain('SSI');
      expect(ssiKpi?.dataSource.dataCollectorRole).toContain('Infection Control Nurse');

      const sscKpi = NABH_STANDARDS_KPIS.find(k => k.code === 'NABH-COP-01');
      expect(sscKpi).toBeDefined();
      expect(sscKpi?.dataSource.sourceSystem).toContain('Operation Theatre');
      expect(sscKpi?.dataSource.sourceRegister).toContain('Surgical Safety Checklist');
      expect(sscKpi?.dataSource.dataCollectorRole).toContain('Scrub Nurse');
      expect(sscKpi?.dataSource.captureFrequency).toBe('PER_SURGICAL_EVENT');

      const mgpsKpi = NABH_STANDARDS_KPIS.find(k => k.code === 'NABH-FMS-01');
      expect(mgpsKpi).toBeDefined();
      expect(mgpsKpi?.dataSource.sourceSystem).toContain('Biomedical Gas Plant');
      expect(mgpsKpi?.dataSource.sourceRegister).toContain('MGPS Manifold');
      expect(mgpsKpi?.dataSource.dataCollectorRole).toContain('Biomedical');
      expect(mgpsKpi?.dataSource.captureFrequency).toBe('SHIFT_WISE');
    });
  });

  describe('2. Interactive Point-of-Care Data Capture & Mathematical Calculation Modal', () => {
    const mockIndicator: NabhQualityIndicator = {
      id: 'kpi-cop-01',
      code: 'NABH-COP-01',
      chapter: 'COP',
      category: 'CLINICAL_SAFETY',
      name: 'WHO 3-Part Surgical Safety Checklist Compliance',
      description: 'Sign-off on Sign-In, Time-Out, and Sign-Out before surgical incision.',
      numerator: 'Cases with tri-signed WHO SSC',
      denominator: 'Total spine surgeries performed',
      formula: '(Cases with tri-signed WHO SSC / Total spine surgeries) * 100',
      targetValue: 100.0,
      actualValue: 98.6,
      unit: 'PERCENTAGE',
      frequency: 'DAILY',
      warningThreshold: 95.0,
      criticalThreshold: 90.0,
      isHigherBetter: true,
      status: 'GREEN',
      leadId: 'e026',
      leadName: 'Brijesh Bhatt',
      leadRole: 'Nursing Superintendent & COP Champion',
      department: 'OT Complex',
      lastAuditDate: '2026-08-28',
      nextAuditDate: '2026-09-04',
      trend: 'IMPROVING',
      benchmark: 'National Benchmark 100%',
      dataSource: {
        sourceSystem: 'Operation Theatre EMR & Physical Surgical Register',
        sourceRegister: 'WHO 3-Part Surgical Safety Checklist Register & OT Major Book',
        dataCollectorRole: 'OT Floor Incharge & Scrub Nurse Coordinator',
        dataCollectorId: 'e026',
        dataCollectorName: 'Brijesh Hasmukhkumar Bhatt',
        captureFrequency: 'PER_SURGICAL_EVENT',
        captureMethod: 'MANUAL_PHYSICAL_REGISTER',
        numeratorSource: 'Surgeon, Anaesthetist, and Scrub Nurse tri-signed WHO SSC physical records',
        denominatorSource: 'Total spine surgeries performed in OT 1, 2, 3, 4 from OT Major Register',
        verificationAuthority: 'Dr. Bharat Dave (Chairman) & OT Safety Committee',
        retentionPeriodYears: 10,
      },
    };

    it('renders KpiDataCaptureModal with complete data source information', () => {
      const handleClose = vi.fn();
      const handleSave = vi.fn();

      render(
        <AuthProvider>
          <KpiDataCaptureModal
            indicator={mockIndicator}
            isOpen={true}
            onClose={handleClose}
            onSave={handleSave}
          />
        </AuthProvider>
      );

      // Verify modal headers and source details
      expect(screen.getByText(/Point-of-Care Statutory Data Entry/i)).toBeDefined();
      expect(screen.getByText('NABH-COP-01')).toBeDefined();
      expect(screen.getByText(/Operation Theatre EMR & Physical Surgical Register/i)).toBeDefined();
      expect(screen.getByText(/WHO 3-Part Surgical Safety Checklist Register & OT Major Book/i)).toBeDefined();
      expect(screen.getByText(/OT Floor Incharge & Scrub Nurse Coordinator/i)).toBeDefined();
    });

    it('calculates actual percentage accurately from raw numerator and denominator inputs', () => {
      let savedRecord: KpiCaptureAuditRecord | null = null;
      const handleSave = vi.fn((kpi, audit) => {
        savedRecord = audit;
      });

      render(
        <AuthProvider>
          <KpiDataCaptureModal
            indicator={mockIndicator}
            isOpen={true}
            onClose={vi.fn()}
            onSave={handleSave}
          />
        </AuthProvider>
      );

      // Enter Numerator = 48, Denominator = 50 -> 96.00% (Target 100%, Warning 95% -> GREEN status)
      const numInput = screen.getByPlaceholderText('e.g. 48');
      const denInput = screen.getByPlaceholderText('e.g. 50');

      fireEvent.change(numInput, { target: { value: '48' } });
      fireEvent.change(denInput, { target: { value: '50' } });

      // Calculated value should be 96%
      expect(screen.getByText('96')).toBeDefined();
      expect(screen.getByText(/Complies with Benchmark/i)).toBeDefined();

      // Submit Form
      const submitBtn = screen.getByRole('button', { name: /Save & Submit Entry/i });
      fireEvent.click(submitBtn);

      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(savedRecord).toBeDefined();
      expect((savedRecord as any).rawNumerator).toBe(48);
      expect((savedRecord as any).rawDenominator).toBe(50);
      expect((savedRecord as any).calculatedValue).toBe(96);
      expect((savedRecord as any).resultingStatus).toBe('GREEN');
    });

    it('detects threshold breach (AMBER / RED) when values fall below critical limit', () => {
      let savedRecord: KpiCaptureAuditRecord | null = null;
      const handleSave = vi.fn((kpi, audit) => {
        savedRecord = audit;
      });

      render(
        <AuthProvider>
          <KpiDataCaptureModal
            indicator={mockIndicator}
            isOpen={true}
            onClose={vi.fn()}
            onSave={handleSave}
          />
        </AuthProvider>
      );

      // Enter Numerator = 40, Denominator = 50 -> 80.00% (Critical threshold < 90% -> RED status)
      const numInput = screen.getByPlaceholderText('e.g. 48');
      const denInput = screen.getByPlaceholderText('e.g. 50');

      fireEvent.change(numInput, { target: { value: '40' } });
      fireEvent.change(denInput, { target: { value: '50' } });

      expect(screen.getByText('80')).toBeDefined();
      expect(screen.getByText(/Critical Non-Compliance/i)).toBeDefined();

      const submitBtn = screen.getByRole('button', { name: /Save & Submit Entry/i });
      fireEvent.click(submitBtn);

      expect((savedRecord as any).resultingStatus).toBe('RED');
    });
  });

  describe('3. Command Centre View & Card Expansion with Auditable Origins', () => {
    it('renders Quality Command Centre with expandable Data Source & Method breakdown', () => {
      render(
        <AuthProvider>
          <StavyaQualityCommandCentre />
        </AuthProvider>
      );

      // Click View Data Source & Method on a card
      const expandButtons = screen.getAllByRole('button', { name: /View Data Source & Method/i });
      expect(expandButtons.length).toBeGreaterThan(0);
      fireEvent.click(expandButtons[0]);

      // Check for source metadata labels
      expect(screen.getAllByText(/Source System/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Physical\/Digital Register/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Data Collector Role/i).length).toBeGreaterThan(0);
    });
  });

  describe('4. Hospital-Wide Executive KPI Dashboard Source Traceability', () => {
    it('renders Hospital Core KPIs with capture system and register info', () => {
      render(
        <AuthProvider>
          <KPIPage />
        </AuthProvider>
      );

      expect(screen.getByText(/Hospital Commitment Execution Rate/i)).toBeDefined();
      expect(screen.getAllByText(/Capture System & Register/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Data Collector & Cadence/i).length).toBeGreaterThan(0);
    });
  });
});
