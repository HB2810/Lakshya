import { describe, it, expect } from 'vitest';
import { rcaStore } from '../lib/mocks/rcaMock';
import { strategyStore } from '../lib/mocks/strategyMock';

describe('LAKSHYA RCA, FMEA & 10-Milestone Strategic Priority Engine Suite', () => {
  // 1. RCA 5-Why Investigation Engine
  describe('5-Why Root Cause Analysis (RCA)', () => {
    it('creates a 5-Why investigation and stores 5 sequential whys', () => {
      const initialCount = rcaStore.getFiveWhyList().length;
      const created = rcaStore.addFiveWhy({
        title: 'OT Sterile Pack Seal Compromise',
        problemStatement: 'Sterile seal was broken on pedicle screw tray in OT-1',
        department: 'CSSD',
        whys: [
          'Why 1: Seal was broken upon unwrapping',
          'Why 2: Tray was stacked under heavy instrument box',
          'Why 3: CSSD trolley had insufficient shelf partitions',
          'Why 4: High surgical case turnover led to rushed loading',
          'Why 5: No standard load limit guidelines displayed on transport carts',
        ],
        rootCause: 'Lack of visual load capacity guidelines on CSSD transport trolleys',
        countermeasures: 'Affix weight-limit warning decals and mandate single-tier tray loading',
      });

      expect(created.id).toBeDefined();
      expect(rcaStore.getFiveWhyList().length).toBe(initialCount + 1);
      expect(created.whys.length).toBe(5);
      expect(created.rootCause).toContain('load capacity');
    });

    it('updates status and adds CAPA items to 5-Why investigation', () => {
      const list = rcaStore.getFiveWhyList();
      const first = list[0];
      rcaStore.updateFiveWhy(first.id, {
        status: 'RESOLVED',
        capaList: [
          ...first.capaList,
          {
            id: 'capa-test-1',
            actionType: 'PREVENTIVE',
            actionTitle: 'Install laser-cut weight markings',
            assignedTo: 'Amit Patel',
            targetDate: '2026-09-01',
            status: 'IN_PROGRESS',
          },
        ],
      });

      const updated = rcaStore.getFiveWhyList().find(r => r.id === first.id);
      expect(updated?.status).toBe('RESOLVED');
      expect(updated?.capaList.length).toBeGreaterThan(0);
    });
  });

  // 2. Ishikawa Fishbone Diagram Tool
  describe('Ishikawa Fishbone Diagram Tool', () => {
    it('supports 6M categories and adds new contributory causes', () => {
      const fishbone = rcaStore.getFishbone();
      expect(fishbone.categories.length).toBe(6);

      const peopleCat = fishbone.categories.find(c => c.key === 'people');
      const initialCauses = peopleCat?.causes.length || 0;

      rcaStore.addFishboneCause('people', 'Surgeon delayed in emergency trauma case');
      const updated = rcaStore.getFishbone();
      const updatedPeopleCat = updated.categories.find(c => c.key === 'people');
      expect(updatedPeopleCat?.causes.length).toBe(initialCauses + 1);
    });

    it('removes cause from fishbone category', () => {
      const fishbone = rcaStore.getFishbone();
      const cat = fishbone.categories[0];
      const initialCount = cat.causes.length;

      rcaStore.removeFishboneCause(cat.key, 0);
      const updated = rcaStore.getFishbone();
      expect(updated.categories[0].causes.length).toBe(initialCount - 1);
    });
  });

  // 3. FMEA Tooling & RPN Calculation
  describe('Failure Mode and Effects Analysis (FMEA)', () => {
    it('accurately calculates RPN as Severity × Occurrence × Detection', () => {
      const row = rcaStore.addFMEARow({
        processStep: 'Test Process Step',
        potentialFailureMode: 'Sensor drift in autoclave',
        potentialEffects: 'Sub-optimal temperature hold',
        severity: 8,
        occurrence: 3,
        detection: 4,
        recommendedAction: 'Calibrate every 48 hours',
      });

      expect(row.rpn).toBe(96); // 8 * 3 * 4
    });

    it('recalculates RPN and revised RPN when parameters are updated', () => {
      const fmea = rcaStore.getFMEA();
      const firstRow = fmea.rows[0];

      rcaStore.updateFMEARow(firstRow.id, {
        severity: 10,
        occurrence: 2,
        detection: 5,
        revisedSeverity: 10,
        revisedOccurrence: 1,
        revisedDetection: 1,
      });

      const updated = rcaStore.getFMEA().rows.find(r => r.id === firstRow.id);
      expect(updated?.rpn).toBe(100); // 10 * 2 * 5
      expect(updated?.revisedRpn).toBe(10); // 10 * 1 * 1
    });
  });

  // 4. Quarterly Priorities with 10 Milestones (Zomato-Style Delivery Engine)
  describe('Quarterly Priorities & 10-Milestone Stepper', () => {
    it('initializes every Quarterly Priority with exactly 10 sequential delivery milestones', () => {
      const qps = strategyStore.getQuarterlyPriorities();
      expect(qps.length).toBeGreaterThan(0);
      qps.forEach(qp => {
        expect(qp.milestones.length).toBe(10);
        expect(qp.milestones[0].stepNumber).toBe(1);
        expect(qp.milestones[9].stepNumber).toBe(10);
      });
    });

    it('advances delivery progress percentage and current step when milestone is completed', () => {
      const qp = strategyStore.getQuarterlyPriorities()[0];
      const initialStep = qp.currentStep;

      strategyStore.updateMilestoneStatus(
        qp.id,
        initialStep,
        'COMPLETED',
        'Verified in clinical review meeting'
      );

      const updatedQp = strategyStore.getQuarterlyPriorities().find(p => p.id === qp.id);
      const completedStep = updatedQp?.milestones.find(m => m.stepNumber === initialStep);

      expect(completedStep?.status).toBe('COMPLETED');
      expect(completedStep?.completedAt).toBeDefined();
      expect(completedStep?.verificationNotes).toContain('Verified in clinical review');
      expect(updatedQp?.progressPercent).toBeGreaterThanOrEqual(10);
    });

    it('creates new Quarterly Priority with auto-generated 10-step delivery milestones', () => {
      const created = strategyStore.addQuarterlyPriority({
        title: 'Q4 Emergency Trauma OT Turnaround Reduction',
        reportingAuthority: 'Managing Director',
        department: 'Emergency & Trauma',
      });

      expect(created.id).toBeDefined();
      expect(created.milestones.length).toBe(10);
      expect(created.milestones[0].status).toBe('IN_PROGRESS');
      expect(created.milestones[1].status).toBe('PENDING');
    });
  });
});
