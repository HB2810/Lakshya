import { QuarterlyDirection, QuarterlyPriority, MonthlyPriority, WeeklyMilestone, MilestoneStep } from '../../types/strategy';

export const INITIAL_10_MILESTONES: MilestoneStep[] = [
  {
    stepNumber: 1,
    title: 'Executive Charter & Clinical Stakeholder Kickoff',
    description: 'Align MD Office, Spine Surgery department heads, and IT leadership on precision target metrics.',
    ownerName: 'Dr. Rohan Sharma',
    targetDate: '2026-07-10',
    completedAt: '2026-07-09',
    status: 'COMPLETED',
    keyDeliverable: 'Signed Project Charter & KPI Targets Document',
    verificationNotes: 'Approved in MD Office Strategic Council meeting.',
  },
  {
    stepNumber: 2,
    title: 'Baseline OT Flow & Patient Waiting Time Audit',
    description: 'Comprehensive time-motion study of OPD queue-to-consult and pre-op OT transfer timelines.',
    ownerName: 'Ananya Patel (Operations Lead)',
    targetDate: '2026-07-20',
    completedAt: '2026-07-19',
    status: 'COMPLETED',
    keyDeliverable: 'Detailed 40-page Operational Bottleneck Analysis Report',
    verificationNotes: 'Identified 42-minute average registration lag.',
  },
  {
    stepNumber: 3,
    title: 'Digital Queue & Smart Token Routing Architecture Design',
    description: 'Architecture specification for dynamic patient token dispatch and consult room display screens.',
    ownerName: 'Priyesh Shah (IT & Digital Health)',
    targetDate: '2026-07-31',
    completedAt: '2026-07-30',
    status: 'COMPLETED',
    keyDeliverable: 'System Architecture & WebSocket Protocol Specs',
    verificationNotes: 'Tested in sandbox environment with 100 concurrent clients.',
  },
  {
    stepNumber: 4,
    title: 'Hardware Procurement & Barcode Scanner Deployment',
    description: 'Installation of high-speed 2D barcode scanners and thermal printers at OPD and CSSD checkposts.',
    ownerName: 'Amit Patel (Biomedical Lead)',
    targetDate: '2026-08-15',
    completedAt: '2026-08-14',
    status: 'COMPLETED',
    keyDeliverable: '32 Barcode Checkpoint Stations Operational',
    verificationNotes: 'All CSSD and OT-2 scanners calibrated.',
  },
  {
    stepNumber: 5,
    title: 'Pilot Deployment in Spine OT-1 & OPD Block A',
    description: 'Live test rollout of digital pre-op verification and queue display monitors for first 150 patients.',
    ownerName: 'Priyesh Shah & Sister Sunita Rao',
    targetDate: '2026-08-28',
    status: 'IN_PROGRESS',
    keyDeliverable: 'Live Pilot Telemetry & Error Rate < 0.5%',
    verificationNotes: 'Currently tracking active patient journeys in OT-1.',
  },
  {
    stepNumber: 6,
    title: 'Mid-Quarter Quality & Safety Compliance Review',
    description: 'Audit patient safety checklists, sterile barrier logs, and infection control compliance.',
    ownerName: 'Dr. Rohan Sharma (Clinical Head)',
    targetDate: '2026-09-05',
    status: 'PENDING',
    keyDeliverable: 'Mid-Term NABH Quality Compliance Certificate',
  },
  {
    stepNumber: 7,
    title: 'Hospital-wide Staff Training & Nursing SOP Rollout',
    description: 'Conduct hands-on training sessions for 60+ nurses, ward attendants, and front-desk coordinators.',
    ownerName: 'Sister Sunita Rao (Nursing Head)',
    targetDate: '2026-09-12',
    status: 'PENDING',
    keyDeliverable: '100% Staff Certification & SOP Handbooks Distributed',
  },
  {
    stepNumber: 8,
    title: 'Full Hospital Integration Across All Surgical Theatres',
    description: 'Expand digital tracking to OT-2, OT-3, Physiotherapy, and Radiology diagnostic transfers.',
    ownerName: 'Ananya Patel & Priyesh Shah',
    targetDate: '2026-09-20',
    status: 'PENDING',
    keyDeliverable: 'Hospital-Wide Enterprise System Activation',
  },
  {
    stepNumber: 9,
    title: 'Executive Stress-Testing & Security Audit Verification',
    description: 'Simulate peak OPD surge volume and complete disaster recovery backup drill.',
    ownerName: 'Priyesh Shah (IT & Digital Health)',
    targetDate: '2026-09-25',
    status: 'PENDING',
    keyDeliverable: 'Zero-Downtime Resilience Audit Report',
  },
  {
    stepNumber: 10,
    title: 'Final Outcome Measurement, MD Sign-Off & Governance Handoff',
    description: 'Synthesize final waiting-time reduction data (target: -35% waiting time) and formal MD executive sign-off.',
    ownerName: 'Managing Director & Dr. Rohan Sharma',
    targetDate: '2026-09-30',
    status: 'PENDING',
    keyDeliverable: 'Final Strategic Priority Outcome Dossier & Permanent SOP',
  },
];

export const INITIAL_QUARTERLY_PRIORITIES: QuarterlyPriority[] = [
  {
    id: 'qp-001',
    year: 2026,
    quarter: 'Q3',
    title: 'Q3 Precision Spine Surgery & Patient Flow Optimization',
    description: 'End-to-end digital integration of surgical sterile supply chain and OPD queue reduction to cut patient wait time by 35%.',
    strategicObjective: 'Deliver flawless pre-op sterile implant traceability and sub-20 min OPD waiting time across Stavya Spine Hospital.',
    reportingAuthority: 'Managing Director (MD Office)',
    department: 'Spine Surgery & Hospital Operations',
    status: 'ACTIVE',
    progressPercent: 45,
    currentStep: 5, // Currently on step 5 of 10
    targetDate: '2026-09-30',
    milestones: INITIAL_10_MILESTONES,
  },
  {
    id: 'qp-002',
    year: 2026,
    quarter: 'Q3',
    title: 'Q3 Digital Health EMR Migration & Diagnostic Automation',
    description: 'Transition hospital core electronic medical records to high-availability database cluster with instant PACS imaging access.',
    strategicObjective: 'Achieve 99.99% diagnostic system uptime and sub-second MRI scan viewing latency in consultation rooms.',
    reportingAuthority: 'Head of IT & Digital Health',
    department: 'IT & Digital Health',
    status: 'ACTIVE',
    progressPercent: 30,
    currentStep: 3,
    targetDate: '2026-09-30',
    milestones: INITIAL_10_MILESTONES.map((m, idx) => ({
      ...m,
      title: `EMR Track Stage ${idx + 1}: ${m.title}`,
      status: idx < 3 ? 'COMPLETED' : idx === 3 ? 'IN_PROGRESS' : 'PENDING',
      completedAt: idx < 3 ? '2026-07-25' : undefined,
    })),
  },
];

export let MOCK_QUARTERLY_DIRECTIONS: QuarterlyPriority[] = [...INITIAL_QUARTERLY_PRIORITIES];
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

  updateMilestoneStatus(priorityId: string, stepNumber: number, newStatus: MilestoneStep['status'], notes?: string) {
    MOCK_QUARTERLY_DIRECTIONS = MOCK_QUARTERLY_DIRECTIONS.map(qp => {
      if (qp.id !== priorityId) return qp;
      const updatedMilestones = qp.milestones.map(m => {
        if (m.stepNumber !== stepNumber) return m;
        return {
          ...m,
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date().toISOString().substring(0, 10) : undefined,
          verificationNotes: notes || m.verificationNotes,
        };
      });

      const completedCount = updatedMilestones.filter(m => m.status === 'COMPLETED').length;
      const progressPercent = Math.round((completedCount / 10) * 100);
      const nextInProgress = updatedMilestones.find(m => m.status === 'IN_PROGRESS' || m.status === 'PENDING')?.stepNumber || 10;

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

  addQuarterlyPriority(newQp: Partial<QuarterlyPriority>): QuarterlyPriority {
    const id = `qp-${Date.now()}`;
    const milestones: MilestoneStep[] = Array.from({ length: 10 }, (_, i) => ({
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
