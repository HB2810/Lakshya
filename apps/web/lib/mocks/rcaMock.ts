import { FiveWhyAnalysis, FishboneDiagram, FMEADocument, FMEARow } from '../../types/rca';

export const INITIAL_FIVE_WHY_ANALYSES: FiveWhyAnalysis[] = [
  {
    id: 'rca-001',
    title: 'Post-Op Antibiotic Administration Delay in Spine OT-2',
    problemStatement: 'Prophylactic IV antibiotic administration was delayed by 45 minutes past the recommended pre-incision window for Patient STV-8821.',
    department: 'Spine Surgery & OT',
    incidentDate: '2026-08-20',
    severity: 'HIGH',
    whys: [
      'Why did the delay occur? The antibiotic infusion was not started 60 minutes before skin incision.',
      'Why was it not started on time? The OT nurse did not receive the reconstituted medication from the central inpatient pharmacy.',
      'Why was medication not sent? The electronic order status showed "Pending Pharmacy Clinical Verification".',
      'Why was verification delayed? The night-shift clinical pharmacist was handling an emergency cardiac arrest resuscitation elsewhere.',
      'Why was there no automated backup or priority routing? OT-critical preoperative medications were categorized in the standard medication queue without stat escalation alerts.',
    ],
    rootCause: 'Lack of automated stat queue segregation and visual escalation protocol for time-sensitive pre-incision surgical medications.',
    countermeasures: 'Implement an automated "STAT Surgical Window" routing rule in the EMR pharmacy queue with instant audio-visual alerts 90 minutes before scheduled OT incision.',
    capaList: [
      {
        id: 'capa-1',
        actionType: 'CORRECTIVE',
        actionTitle: 'Configure STAT surgical pre-op medication flag in pharmacy management module',
        assignedTo: 'Priyesh Shah (IT & Digital Health)',
        targetDate: '2026-08-30',
        status: 'IN_PROGRESS',
      },
      {
        id: 'capa-2',
        actionType: 'PREVENTIVE',
        actionTitle: 'Establish dedicated OT satellite medication stock buffer for prophylactic antibiotics',
        assignedTo: 'Sister Sunita Rao (Nursing Head)',
        targetDate: '2026-09-05',
        status: 'PENDING',
      },
    ],
    status: 'UNDER_INVESTIGATION',
    createdAt: '2026-08-21T09:00:00Z',
    createdBy: 'Dr. Rohan Sharma',
  },
];

export const INITIAL_FISHBONE_DIAGRAM: FishboneDiagram = {
  id: 'fish-001',
  problemEffect: 'Peak Hour OPD Patient Waiting Time Exceeding 45 Minutes',
  department: 'Hospital Operations & OPD',
  date: '2026-08-24',
  categories: [
    {
      key: 'people',
      label: 'People / Staffing',
      causes: [
        'Reception registration bottleneck during morning shift change',
        'Specialist surgeon delayed due to prolonged emergency spine surgery',
        'Float nursing shortage during peak 10 AM - 12 PM slot',
      ],
    },
    {
      key: 'process',
      label: 'Process / Workflow',
      causes: [
        'Manual billing paper reconciliation before doctor consultation',
        'No digital pre-registration token system for follow-up patients',
        'Lack of dynamic doctor slot load balancing across consult rooms',
      ],
    },
    {
      key: 'equipment',
      label: 'Equipment / IT Hardware',
      causes: [
        'Slow thermal barcode printers at registration desks',
        'Occasional local Wi-Fi packet drops in OPD block B',
      ],
    },
    {
      key: 'materials',
      label: 'Materials & Forms',
      causes: [
        'Physical paper file retrieval from archives takes 12-15 minutes',
        'Duplicate intake forms filled by walk-in patients',
      ],
    },
    {
      key: 'measurement',
      label: 'Measurement & Metrics',
      causes: [
        'Waiting time calculated at checkout rather than real-time station transitions',
        'No visual queue display monitors in patient waiting lounge',
      ],
    },
    {
      key: 'environment',
      label: 'Environment / Facility',
      causes: [
        'Sub-waiting area congestion near radiology department',
        'Single corridor shared between new OPD registrations and diagnostics',
      ],
    },
  ],
};

export const INITIAL_FMEA_DOCUMENT: FMEADocument = {
  id: 'fmea-001',
  processName: 'Spine Surgical Implant Traceability & Pre-Op Sterilization Protocol',
  department: 'Central Sterile Services Department (CSSD) & OT',
  leaderName: 'Dr. Rohan Sharma & Ananya Patel',
  reviewDate: '2026-08-25',
  rows: [
    {
      id: 'row-1',
      processStep: '1. CSSD Autoclave Loading & Sterilization Cycle',
      potentialFailureMode: 'Inadequate autoclave temperature/pressure hold time',
      potentialEffects: 'Non-sterile spine pedicle screws leading to Surgical Site Infection (SSI)',
      severity: 9,
      potentialCauses: 'Defective steam solenoid valve or faulty thermal sensor calibration',
      occurrence: 2,
      currentControls: 'Biological indicator vial daily test & digital autoclave log graph',
      detection: 3,
      rpn: 54, // 9 * 2 * 3
      recommendedAction: 'Install automated redundant digital data logger with cycle-abort alarm lock',
      responsiblePerson: 'Amit Patel (Biomedical Lead)',
      targetDate: '2026-09-10',
      actionTaken: 'Redundant logger connected with auto-lock interlock mechanism.',
      revisedSeverity: 9,
      revisedOccurrence: 1,
      revisedDetection: 1,
      revisedRpn: 9,
    },
    {
      id: 'row-2',
      processStep: '2. Implant Consignment Receiving & Barcode Verification',
      potentialFailureMode: 'Mismatched titanium cage size scanned into patient EMR',
      potentialEffects: 'Surgeon opens wrong sterile implant size during surgery, causing intra-op delay',
      severity: 7,
      potentialCauses: 'Similar vendor packaging labels and manual human entry without 2D matrix scan',
      occurrence: 4,
      currentControls: 'Single visual cross-check by scrub nurse on tray setup',
      detection: 5,
      rpn: 140, // 7 * 4 * 5 (HIGH RISK)
      recommendedAction: 'Mandate double-operator 2D barcode scanner verification prior to tray opening',
      responsiblePerson: 'Priyesh Shah (IT & Digital Health)',
      targetDate: '2026-09-02',
      actionTaken: 'Double-scan EMR validation rule deployed on nursing tablets.',
      revisedSeverity: 7,
      revisedOccurrence: 1,
      revisedDetection: 2,
      revisedRpn: 14,
    },
    {
      id: 'row-3',
      processStep: '3. Intra-Op Sterility Barrier Inspection',
      potentialFailureMode: 'Micro-puncture in double-wrap sterile barrier wrap',
      potentialEffects: 'Implant contamination upon transfer to sterile field',
      severity: 8,
      potentialCauses: 'Sharp tray corner impact during transport from CSSD hoist',
      occurrence: 3,
      currentControls: 'Visual inspection under examination light before opening',
      detection: 4,
      rpn: 96, // 8 * 3 * 4
      recommendedAction: 'Upgrade to rigid sealed sterilization containers with silicone corner guards',
      responsiblePerson: 'Sister Sunita Rao (OT In-Charge)',
      targetDate: '2026-09-15',
    },
  ],
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();
const notify = () => listeners.forEach(fn => fn());

export let rcaList: FiveWhyAnalysis[] = [...INITIAL_FIVE_WHY_ANALYSES];
export let fishboneData: FishboneDiagram = { ...INITIAL_FISHBONE_DIAGRAM };
export let fmeaDoc: FMEADocument = { ...INITIAL_FMEA_DOCUMENT };

export const rcaStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getFiveWhyList(): FiveWhyAnalysis[] {
    return rcaList;
  },
  addFiveWhy(item: Partial<FiveWhyAnalysis>): FiveWhyAnalysis {
    const newItem: FiveWhyAnalysis = {
      id: `rca-${Date.now()}`,
      title: item.title || 'Untitled 5-Why Investigation',
      problemStatement: item.problemStatement || '',
      department: item.department || 'Hospital Operations',
      incidentDate: item.incidentDate || new Date().toISOString().substring(0, 10),
      severity: item.severity || 'MEDIUM',
      whys: item.whys || ['', '', '', '', ''],
      rootCause: item.rootCause || '',
      countermeasures: item.countermeasures || '',
      capaList: item.capaList || [],
      status: 'UNDER_INVESTIGATION',
      createdAt: new Date().toISOString(),
      createdBy: item.createdBy || 'Priyesh Shah',
    };
    rcaList = [newItem, ...rcaList];
    notify();
    return newItem;
  },
  updateFiveWhy(id: string, updates: Partial<FiveWhyAnalysis>) {
    rcaList = rcaList.map(r => (r.id === id ? { ...r, ...updates } : r));
    notify();
  },
  getFishbone(): FishboneDiagram {
    return fishboneData;
  },
  updateFishboneProblemEffect(newEffect: string) {
    fishboneData = {
      ...fishboneData,
      problemEffect: newEffect,
    };
    notify();
  },
  updateFishboneCategoryLabel(categoryKey: string, newLabel: string) {
    fishboneData = {
      ...fishboneData,
      categories: fishboneData.categories.map(c =>
        c.key === categoryKey ? { ...c, label: newLabel } : c
      ),
    };
    notify();
  },
  addFishboneCause(categoryKey: string, causeText: string) {
    fishboneData = {
      ...fishboneData,
      categories: fishboneData.categories.map(c =>
        c.key === categoryKey ? { ...c, causes: [...c.causes, causeText] } : c
      ),
    };
    notify();
  },
  updateFishboneCause(categoryKey: string, causeIndex: number, newText: string) {
    fishboneData = {
      ...fishboneData,
      categories: fishboneData.categories.map(c =>
        c.key === categoryKey
          ? {
              ...c,
              causes: c.causes.map((cause, idx) => (idx === causeIndex ? newText : cause)),
            }
          : c
      ),
    };
    notify();
  },
  removeFishboneCause(categoryKey: string, causeIndex: number) {
    fishboneData = {
      ...fishboneData,
      categories: fishboneData.categories.map(c =>
        c.key === categoryKey
          ? { ...c, causes: c.causes.filter((_, idx) => idx !== causeIndex) }
          : c
      ),
    };
    notify();
  },
  resetFishbone() {
    fishboneData = { ...INITIAL_FISHBONE_DIAGRAM };
    notify();
  },
  getFMEA(): FMEADocument {
    return fmeaDoc;
  },
  addFMEARow(row: Partial<FMEARow>): FMEARow {
    const s = row.severity || 5;
    const o = row.occurrence || 5;
    const d = row.detection || 5;
    const newRow: FMEARow = {
      id: `fmea-row-${Date.now()}`,
      processStep: row.processStep || 'New Process Step',
      potentialFailureMode: row.potentialFailureMode || '',
      potentialEffects: row.potentialEffects || '',
      severity: s,
      potentialCauses: row.potentialCauses || '',
      occurrence: o,
      currentControls: row.currentControls || '',
      detection: d,
      rpn: s * o * d,
      recommendedAction: row.recommendedAction || '',
      responsiblePerson: row.responsiblePerson || 'Unassigned',
      targetDate: row.targetDate || new Date(Date.now() + 604800000).toISOString().substring(0, 10),
      actionTaken: row.actionTaken,
      revisedSeverity: row.revisedSeverity,
      revisedOccurrence: row.revisedOccurrence,
      revisedDetection: row.revisedDetection,
      revisedRpn:
        row.revisedSeverity && row.revisedOccurrence && row.revisedDetection
          ? row.revisedSeverity * row.revisedOccurrence * row.revisedDetection
          : undefined,
    };
    fmeaDoc = {
      ...fmeaDoc,
      rows: [newRow, ...fmeaDoc.rows],
    };
    notify();
    return newRow;
  },
  updateFMEARow(id: string, updates: Partial<FMEARow>) {
    fmeaDoc = {
      ...fmeaDoc,
      rows: fmeaDoc.rows.map(r => {
        if (r.id !== id) return r;
        const merged = { ...r, ...updates };
        merged.rpn = merged.severity * merged.occurrence * merged.detection;
        if (merged.revisedSeverity && merged.revisedOccurrence && merged.revisedDetection) {
          merged.revisedRpn = merged.revisedSeverity * merged.revisedOccurrence * merged.revisedDetection;
        }
        return merged;
      }),
    };
    notify();
  },
};
