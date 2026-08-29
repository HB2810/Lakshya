import { describe, it, expect, beforeEach } from 'vitest';
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
      const created = rcaStore.addFiveWhy({
        title: 'Investigation for CAPA test',
        problemStatement: 'Problem for test',
        whys: ['Why 1', 'Why 2', 'Why 3', 'Why 4', 'Why 5'],
        rootCause: 'Root cause',
      });
      rcaStore.updateFiveWhy(created.id, {
        status: 'RESOLVED',
        capaList: [
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

      const updated = rcaStore.getFiveWhyList().find(r => r.id === created.id);
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
      rcaStore.addFishboneCause('people', 'Temporary test cause');
      const fishbone = rcaStore.getFishbone();
      const peopleCat = fishbone.categories.find(c => c.key === 'people')!;
      const initialCount = peopleCat.causes.length;

      rcaStore.removeFishboneCause('people', initialCount - 1);
      const updated = rcaStore.getFishbone();
      const updatedPeople = updated.categories.find(c => c.key === 'people')!;
      expect(updatedPeople.causes.length).toBe(initialCount - 1);
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
      const row = rcaStore.addFMEARow({
        processStep: 'FMEA Recalculation Step',
        potentialFailureMode: 'Initial test failure mode',
        severity: 5,
        occurrence: 2,
        detection: 2,
      });

      rcaStore.updateFMEARow(row.id, {
        severity: 10,
        occurrence: 2,
        detection: 5,
        revisedSeverity: 10,
        revisedOccurrence: 1,
        revisedDetection: 1,
      });

      const updated = rcaStore.getFMEA().rows.find(r => r.id === row.id);
      expect(updated?.rpn).toBe(100); // 10 * 2 * 5
      expect(updated?.revisedRpn).toBe(10); // 10 * 1 * 1
    });
  });

  // 4. Quarterly Priorities with 10 Milestones (Zomato-Style Delivery Engine)
  describe('Quarterly Priorities & 10-Milestone Stepper', () => {
    beforeEach(() => {
      strategyStore.resetToZero();
      strategyStore.addQuarterlyPriority({
        title: 'Q3 Precision Spine Surgery & Patient Flow Optimization',
        description: 'End-to-end digital integration of surgical sterile supply chain and OPD queue reduction.',
        reportingAuthority: 'Managing Director (MD Office)',
        department: 'Spine Surgery',
      });
    });

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

    it('allows dynamic addition, editing, and removal of milestone steps up to max 10', () => {
      const qp = strategyStore.getQuarterlyPriorities()[0];
      
      // Edit milestone 1
      strategyStore.updateMilestone(qp.id, 1, {
        title: 'Custom Updated Milestone Title',
        description: 'New custom description',
      });

      let updatedQp = strategyStore.getQuarterlyPriorities().find(p => p.id === qp.id);
      expect(updatedQp?.milestones[0].title).toBe('Custom Updated Milestone Title');

      // Remove step 10
      strategyStore.removeMilestoneStep(qp.id, 10);
      updatedQp = strategyStore.getQuarterlyPriorities().find(p => p.id === qp.id);
      expect(updatedQp?.milestones.length).toBe(9);

      // Add new step
      strategyStore.addMilestoneStep(qp.id, {
        title: 'Re-added 10th Step',
      });
      updatedQp = strategyStore.getQuarterlyPriorities().find(p => p.id === qp.id);
      expect(updatedQp?.milestones.length).toBe(10);
      expect(updatedQp?.milestones[9].title).toBe('Re-added 10th Step');

      // Attempting to exceed 10 throws error
      expect(() => {
        strategyStore.addMilestoneStep(qp.id, { title: '11th step' });
      }).toThrow('Maximum 10 milestone steps allowed');
    });
  });
});
