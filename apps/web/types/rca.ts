export interface CAPAItem {
  id: string;
  actionType: 'CORRECTIVE' | 'PREVENTIVE';
  actionTitle: string;
  assignedTo: string;
  targetDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'VERIFIED';
}

export interface FiveWhyAnalysis {
  id: string;
  title: string;
  problemStatement: string;
  department: string;
  incidentDate: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  whys: [string, string, string, string, string]; // Why 1 to Why 5
  rootCause: string;
  countermeasures: string;
  capaList: CAPAItem[];
  status: 'DRAFT' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  createdBy: string;
}

export interface FishboneCategory {
  key: 'people' | 'process' | 'equipment' | 'materials' | 'measurement' | 'environment';
  label: string;
  causes: string[];
}

export interface FishboneDiagram {
  id: string;
  problemEffect: string;
  department: string;
  date: string;
  categories: FishboneCategory[];
}

export interface FMEARow {
  id: string;
  processStep: string;
  potentialFailureMode: string;
  potentialEffects: string;
  severity: number; // 1 - 10
  potentialCauses: string;
  occurrence: number; // 1 - 10
  currentControls: string;
  detection: number; // 1 - 10
  rpn: number; // severity * occurrence * detection
  recommendedAction: string;
  responsiblePerson: string;
  targetDate: string;
  actionTaken?: string;
  revisedSeverity?: number;
  revisedOccurrence?: number;
  revisedDetection?: number;
  revisedRpn?: number;
}

export interface FMEADocument {
  id: string;
  processName: string;
  department: string;
  leaderName: string;
  reviewDate: string;
  rows: FMEARow[];
}
