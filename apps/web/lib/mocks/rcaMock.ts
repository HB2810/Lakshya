import { FiveWhyAnalysis, FishboneDiagram, FMEADocument, FMEARow } from '../../types/rca';

export const INITIAL_FIVE_WHY_ANALYSES: FiveWhyAnalysis[] = [
  {
    id: 'rca-001',
    title: 'OT 4 Endoscopy Sterilization Disinfection Traceability Delay',
    problemStatement: 'Spine endoscopy procedure delayed by 35 minutes due to missing physical autoclave cycle barcode validation slip.',
    department: 'Operating Theatres & CSSD',
    incidentDate: '2026-08-27',
    severity: 'HIGH',
    whys: [
      'Why #1: Endoscopy optic camera set could not be released into OT sterile field on time.',
      'Why #2: Nursing staff could not locate the printed CSSD biological indicator strip.',
      'Why #3: Night-shift technician logged test in physical notebook instead of digital EMR scanner.',
      'Why #4: Wireless barcode scanner terminal battery was depleted and not docked on charger.',
      'Why #5 (Root Cause): Absence of mandatory end-of-shift charging & dock validation checklist in nursing handover SOP.',
    ],
    rootCause: 'Lack of automated charging dock verification checklist in nursing handover SOP.',
    countermeasures: 'Mandate digital checklist sign-off in LAKSHYA before shift changeover + spare battery dock in OT 4.',
    capaList: [
      {
        id: 'capa-1',
        actionType: 'CORRECTIVE',
        actionTitle: 'Procure dual battery backup dock for OT 4 endoscopy scanner',
        assignedTo: 'Vatsal Maheshkumar Vaghasiya',
        targetDate: '2026-09-02',
        status: 'IN_PROGRESS',
      },
      {
        id: 'capa-2',
        actionType: 'PREVENTIVE',
        actionTitle: 'Revise Nursing Handover SOP to include hardware battery audit',
        assignedTo: 'Brijesh Hasmukhkumar Bhatt',
        targetDate: '2026-09-04',
        status: 'PENDING',
      },
    ],
    status: 'UNDER_INVESTIGATION',
    createdAt: '2026-08-27T10:00:00.000Z',
    createdBy: 'Dr. Akruti Mirant Dave (Director Quality)',
  },
];

export const INITIAL_FISHBONE_DIAGRAM: FishboneDiagram = {
  id: 'fish-001',
  problemEffect: 'OT 4 Endoscopy Surgery Start Delay (35 mins)',
  department: 'Operating Theatres & CSSD',
  date: '2026-08-27',
  categories: [
    { key: 'people', label: 'People / Staffing', causes: ['Night shift tech rushed handover', 'Backup nurse not cross-trained on barcode scanner'] },
    { key: 'process', label: 'Process / Workflow', causes: ['Dual-log redundancy (paper + digital)', 'Handover checklist lacked hardware audit'] },
    { key: 'equipment', label: 'Equipment / IT Hardware', causes: ['Barcode scanner battery drained', 'Dock charging pin oxidized'] },
    { key: 'materials', label: 'Materials & Forms', causes: ['Thermal paper roll ran out in autoclave printer'] },
    { key: 'measurement', label: 'Measurement & Metrics', causes: ['No alert triggered when scanner disconnected'] },
    { key: 'environment', label: 'Environment / Facility', causes: ['Sub-optimal ambient temperature near CSSD autoclave bay'] },
  ],
};

export const INITIAL_FMEA_DOCUMENT: FMEADocument = {
  id: 'fmea-001',
  processName: 'CSSD Surgical Instrument Sterilization & OT Release',
  department: 'Central Sterile Services Department (CSSD) & OT',
  leaderName: 'Brijesh Hasmukhkumar Bhatt',
  reviewDate: '2026-08-28',
  rows: [
    {
      id: 'fmea-row-1',
      processStep: 'Autoclave cycle verification',
      potentialFailureMode: 'Chemical indicator fails to change color completely',
      potentialEffects: 'Risk of non-sterile instrument entering OT field (Critical Patient Harm)',
      severity: 9,
      potentialCauses: 'Steam pressure fluctuation or overloaded tray',
      occurrence: 2,
      currentControls: 'Visual inspection by scrub nurse before opening tray',
      detection: 3,
      rpn: 54,
      recommendedAction: 'Mandatory double-sign verification by CSSD technician and OT Incharge',
      responsiblePerson: 'Manilal Mangilal Hadat',
      targetDate: '2026-09-03',
      actionTaken: 'Implemented dual sign-off protocol in digital CSSD log',
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
  resetData() {
    rcaList = [...INITIAL_FIVE_WHY_ANALYSES];
    fishboneData = { ...INITIAL_FISHBONE_DIAGRAM };
    fmeaDoc = { ...INITIAL_FMEA_DOCUMENT };
    notify();
  }
};
