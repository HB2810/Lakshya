import { FiveWhyAnalysis, FishboneDiagram, FMEADocument, FMEARow } from '../../types/rca';

export const INITIAL_FIVE_WHY_ANALYSES: FiveWhyAnalysis[] = [];

export const INITIAL_FISHBONE_DIAGRAM: FishboneDiagram = {
  id: 'fish-zero',
  problemEffect: '',
  department: 'Hospital Operations',
  date: new Date().toISOString().substring(0, 10),
  categories: [
    { key: 'people', label: 'People / Staffing', causes: [] },
    { key: 'process', label: 'Process / Workflow', causes: [] },
    { key: 'equipment', label: 'Equipment / IT Hardware', causes: [] },
    { key: 'materials', label: 'Materials & Forms', causes: [] },
    { key: 'measurement', label: 'Measurement & Metrics', causes: [] },
    { key: 'environment', label: 'Environment / Facility', causes: [] },
  ],
};

export const INITIAL_FMEA_DOCUMENT: FMEADocument = {
  id: 'fmea-zero',
  processName: '',
  department: 'Central Sterile Services Department (CSSD) & OT',
  leaderName: '',
  reviewDate: new Date().toISOString().substring(0, 10),
  rows: [],
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
