import { QuarterlyDirection, QuarterlyPriority, MonthlyPriority, WeeklyMilestone, MilestoneStep } from '../../types/strategy';

export const INITIAL_10_MILESTONES: MilestoneStep[] = [];

export const INITIAL_QUARTERLY_PRIORITIES: QuarterlyPriority[] = [];

export let MOCK_QUARTERLY_DIRECTIONS: QuarterlyPriority[] = [];
export let MOCK_MONTHLY_PRIORITIES: MonthlyPriority[] = [];
export let MOCK_WEEKLY_MILESTONES: WeeklyMilestone[] = [];

type Listener = () => void;
const listeners: Set<Listener> = new Set();
const notify = () => listeners.forEach(fn => fn());

export const strategyStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getQuarterlyDirections(): QuarterlyPriority[] {
    return MOCK_QUARTERLY_DIRECTIONS;
  },

  getQuarterlyPriorities(): QuarterlyPriority[] {
    return MOCK_QUARTERLY_DIRECTIONS;
  },

  getMonthlyPriorities(): MonthlyPriority[] {
    return MOCK_MONTHLY_PRIORITIES;
  },

  getWeeklyMilestones(): WeeklyMilestone[] {
    return MOCK_WEEKLY_MILESTONES;
  },

  updateMilestone(priorityId: string, stepNumber: number, data: Partial<MilestoneStep>) {
    MOCK_QUARTERLY_DIRECTIONS = MOCK_QUARTERLY_DIRECTIONS.map(qp => {
      if (qp.id !== priorityId) return qp;
      const updatedMilestones = qp.milestones.map(m => {
        if (m.stepNumber !== stepNumber) return m;
        const newStatus = data.status !== undefined ? data.status : m.status;
        return {
          ...m,
          ...data,
          status: newStatus,
          completedAt:
            newStatus === 'COMPLETED'
              ? data.completedAt || m.completedAt || new Date().toISOString().substring(0, 10)
              : undefined,
          verificationNotes:
            data.verificationNotes !== undefined ? data.verificationNotes : m.verificationNotes,
        };
      });

      const totalMilestones = updatedMilestones.length || 1;
      const completedCount = updatedMilestones.filter(m => m.status === 'COMPLETED').length;
      const progressPercent = Math.round((completedCount / totalMilestones) * 100);
      const nextInProgress =
        updatedMilestones.find(m => m.status === 'IN_PROGRESS' || m.status === 'PENDING')?.stepNumber ||
        totalMilestones;

      return {
        ...qp,
        milestones: updatedMilestones,
        progressPercent,
        currentStep: nextInProgress,
        status: progressPercent === 100 ? 'COMPLETED' : 'ACTIVE',
      };
    });
    notify();
  },

  updateMilestoneStatus(priorityId: string, stepNumber: number, newStatus: MilestoneStep['status'], notes?: string) {
    this.updateMilestone(priorityId, stepNumber, { status: newStatus, verificationNotes: notes });
  },

  addMilestoneStep(priorityId: string, stepData?: Partial<MilestoneStep>) {
    MOCK_QUARTERLY_DIRECTIONS = MOCK_QUARTERLY_DIRECTIONS.map(qp => {
      if (qp.id !== priorityId) return qp;
      if (qp.milestones.length >= 10) {
        throw new Error('Maximum 10 milestone steps allowed per priority');
      }

      const nextNum = qp.milestones.length + 1;
      const newStep: MilestoneStep = {
        stepNumber: nextNum,
        title: stepData?.title || `Milestone Step ${nextNum}: New Checkpoint`,
        description: stepData?.description || `Execution milestone checkpoint #${nextNum}`,
        ownerName: stepData?.ownerName || qp.reportingAuthority || 'Assigned Lead',
        targetDate: stepData?.targetDate || new Date(Date.now() + nextNum * 604800000).toISOString().substring(0, 10),
        status: 'PENDING',
        keyDeliverable: stepData?.keyDeliverable || `Deliverable for Step #${nextNum}`,
        verificationNotes: stepData?.verificationNotes,
      };

      const updatedMilestones = [...qp.milestones, newStep];
      const completedCount = updatedMilestones.filter(m => m.status === 'COMPLETED').length;
      const progressPercent = Math.round((completedCount / updatedMilestones.length) * 100);

      return {
        ...qp,
        milestones: updatedMilestones,
        progressPercent,
      };
    });
    notify();
  },

  removeMilestoneStep(priorityId: string, stepNumber: number) {
    MOCK_QUARTERLY_DIRECTIONS = MOCK_QUARTERLY_DIRECTIONS.map(qp => {
      if (qp.id !== priorityId) return qp;
      if (qp.milestones.length <= 1) {
        throw new Error('A priority must have at least 1 milestone step');
      }

      const filtered = qp.milestones.filter(m => m.stepNumber !== stepNumber);
      // Re-index remaining steps 1..N
      const reIndexed = filtered.map((m, idx) => ({
        ...m,
        stepNumber: idx + 1,
      }));

      const completedCount = reIndexed.filter(m => m.status === 'COMPLETED').length;
      const progressPercent = Math.round((completedCount / reIndexed.length) * 100);
      const nextInProgress =
        reIndexed.find(m => m.status === 'IN_PROGRESS' || m.status === 'PENDING')?.stepNumber ||
        reIndexed.length;

      return {
        ...qp,
        milestones: reIndexed,
        progressPercent,
        currentStep: nextInProgress,
      };
    });
    notify();
  },

  updateQuarterlyPriority(priorityId: string, data: Partial<QuarterlyPriority>) {
    MOCK_QUARTERLY_DIRECTIONS = MOCK_QUARTERLY_DIRECTIONS.map(qp => {
      if (qp.id !== priorityId) return qp;
      return {
        ...qp,
        ...data,
      };
    });
    notify();
  },

  addQuarterlyPriority(newQp: Partial<QuarterlyPriority>): QuarterlyPriority {
    const id = `qp-${Date.now()}`;
    const stepCount = Math.min(newQp.milestones?.length || 10, 10); // default to 10, max 10
    const milestones: MilestoneStep[] =
      newQp.milestones && newQp.milestones.length > 0
        ? newQp.milestones.slice(0, 10).map((m, i) => ({
            ...m,
            stepNumber: i + 1,
          }))
        : Array.from({ length: stepCount }, (_, i) => ({
            stepNumber: i + 1,
            title: `Milestone Step ${i + 1}: Implementation Checkpoint`,
            description: `Specific execution milestone ${i + 1} for ${newQp.title || 'Quarterly Priority'}.`,
            ownerName: newQp.reportingAuthority || 'Assigned Lead',
            targetDate: new Date(Date.now() + (i + 1) * 604800000).toISOString().substring(0, 10),
            status: i === 0 ? 'IN_PROGRESS' : 'PENDING',
            keyDeliverable: `Deliverable milestone checkpoint #${i + 1}`,
          }));

    const qp: QuarterlyPriority = {
      id,
      year: newQp.year || 2026,
      quarter: newQp.quarter || 'Q3',
      title: newQp.title || 'Untitled Quarterly Priority',
      description: newQp.description || '',
      strategicObjective: newQp.strategicObjective || '',
      reportingAuthority: newQp.reportingAuthority || 'Managing Director',
      department: newQp.department || 'Hospital Operations',
      status: 'ACTIVE',
      progressPercent: 0,
      currentStep: 1,
      targetDate: newQp.targetDate || '2026-09-30',
      milestones,
    };

    MOCK_QUARTERLY_DIRECTIONS = [qp, ...MOCK_QUARTERLY_DIRECTIONS];
    notify();
    return qp;
  },

  resetToZero() {
    MOCK_QUARTERLY_DIRECTIONS = [];
    MOCK_MONTHLY_PRIORITIES = [];
    MOCK_WEEKLY_MILESTONES = [];
    notify();
  },
};
