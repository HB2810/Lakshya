import { PolicySOPItem } from '../../types/policy';

export const INITIAL_POLICIES_AND_SOPS: PolicySOPItem[] = [
  {
    id: 'sop-001',
    code: 'SOP-SPINE-OT-01',
    title: 'Spine Surgical Implant Traceability & Pre-Op Sterilization Protocol',
    category: 'SURGICAL_OT',
    department: 'Spine Surgery & CSSD',
    version: 'v2.4',
    effectiveDate: '2026-06-01',
    reviewDate: '2027-06-01',
    author: 'Dr. Rohan Sharma (Head of Spine Surgery)',
    approver: 'Managing Director (MD Office)',
    status: 'ACTIVE',
    isNABHMandatory: true,
    contentSummary: 'Mandatory 2D barcode double-scan verification for all pedicle screw implant trays prior to OT sterile field transfer.',
    keyGuidelines: [
      'Dual-operator barcode scan required on nursing tablet before opening tray wrap',
      'Class 5 chemical indicator strip verification recorded in digital CSSD logbook',
      'Immediate quarantine protocol if biological indicator test fails at 24-hour reading',
    ],
    downloadsCount: 142,
  },
  {
    id: 'sop-002',
    code: 'SOP-CLIN-INF-04',
    title: 'Hospital-Wide Surgical Site Infection (SSI) Surveillance & Reporting',
    category: 'INFECTION_CONTROL',
    department: 'Infection Control Committee',
    version: 'v3.1',
    effectiveDate: '2026-05-15',
    reviewDate: '2027-05-15',
    author: 'Dr. Rajesh Verma (Infection Control Officer)',
    approver: 'Clinical Governance Board',
    status: 'ACTIVE',
    isNABHMandatory: true,
    contentSummary: 'Standardized 30-day post-operative surveillance guidelines for spine arthrodesis and decompression procedures.',
    keyGuidelines: [
      'Prophylactic IV antibiotic administration completed within 60 mins of skin incision',
      'Mandatory post-discharge follow-up tele-consultation at Day 7, Day 14, and Day 30',
      'Automatic stat alert to MD Office for any deep fascial wound dehiscence',
    ],
    downloadsCount: 98,
  },
  {
    id: 'sop-003',
    code: 'SOP-EMR-SEC-09',
    title: 'Patient Electronic Medical Record (EMR) Access & HIPAA Compliance',
    category: 'IT_DATA_SECURITY',
    department: 'IT & Digital Health',
    version: 'v1.8',
    effectiveDate: '2026-07-01',
    reviewDate: '2027-07-01',
    author: 'Priyesh Shah (IT Lead)',
    approver: 'Managing Director',
    status: 'ACTIVE',
    isNABHMandatory: true,
    contentSummary: 'Strict role-based access control (RBAC), multi-factor authentication, and PACS diagnostic image encryption policies.',
    keyGuidelines: [
      'Automatic session termination after 10 minutes of inactivity on all nursing station terminals',
      'Direct audit logging for all patient spine MRI/CT scan downloads',
      'Zero local storage of unencrypted patient personal health information (PHI)',
    ],
    downloadsCount: 76,
  },
  {
    id: 'sop-004',
    code: 'SOP-NURS-TRI-02',
    title: 'Spine OPD Emergency Triage & Red-Flag Protocol',
    category: 'NURSING',
    department: 'OPD & Emergency',
    version: 'v2.0',
    effectiveDate: '2026-04-10',
    reviewDate: '2027-04-10',
    author: 'Sister Sunita Rao (Nursing Superintendent)',
    approver: 'Dr. Rohan Sharma',
    status: 'ACTIVE',
    isNABHMandatory: false,
    contentSummary: 'Rapid triage identification and fast-track admission path for cauda equina syndrome and acute spinal cord compression.',
    keyGuidelines: [
      'Immediate stat neuro-spine resident bedside assessment within 15 minutes of arrival',
      'Emergency MRI Spine protocol order priority flag activation in PACS',
      'Bedside sensory and motor dermatome mapping checklist completed prior to bed assignment',
    ],
    downloadsCount: 115,
  },
  {
    id: 'sop-005',
    code: 'SOP-BIOM-CAL-06',
    title: 'OT Fluoroscopy C-Arm & Intra-Op Neuro-Monitoring Calibration Policy',
    category: 'BIOMEDICAL_SAFETY',
    department: 'Biomedical Engineering',
    version: 'v1.5',
    effectiveDate: '2026-03-20',
    reviewDate: '2027-03-20',
    author: 'Amit Patel (Biomedical Lead)',
    approver: 'Hospital Operations Head',
    status: 'UNDER_REVIEW',
    isNABHMandatory: true,
    contentSummary: 'Daily laser alignment, radiation dose verification, and IONM electrode impedance calibration SOP.',
    keyGuidelines: [
      'Daily morning calibration test shoot recorded in Biomedical QA binder',
      'Lead apron radiation leakage check every 6 months with documentation',
      'Preventive maintenance contract (PMC) log certified by authorized vendor engineers',
    ],
    downloadsCount: 53,
  },
];

type Listener = () => void;
const listeners: Set<Listener> = new Set();
const notify = () => listeners.forEach(fn => fn());

export let policyList: PolicySOPItem[] = [...INITIAL_POLICIES_AND_SOPS];

export const policyStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getPolicies(): PolicySOPItem[] {
    return policyList;
  },
  addPolicy(item: Partial<PolicySOPItem>): PolicySOPItem {
    const newItem: PolicySOPItem = {
      id: `sop-${Date.now()}`,
      code: item.code || `SOP-GEN-${String(policyList.length + 1).padStart(3, '0')}`,
      title: item.title || 'Untitled Hospital Policy / SOP',
      category: item.category || 'ADMINISTRATIVE',
      department: item.department || 'Hospital Administration',
      version: item.version || 'v1.0',
      effectiveDate: item.effectiveDate || new Date().toISOString().substring(0, 10),
      reviewDate: item.reviewDate || new Date(Date.now() + 31536000000).toISOString().substring(0, 10),
      author: item.author || 'Hospital Quality Committee',
      approver: item.approver || 'Managing Director',
      status: item.status || 'ACTIVE',
      isNABHMandatory: item.isNABHMandatory ?? true,
      contentSummary: item.contentSummary || '',
      keyGuidelines: item.keyGuidelines || ['Standard hospital adherence required.'],
      documentUrl: item.documentUrl,
      fileName: item.fileName,
      fileSize: item.fileSize,
      fileType: item.fileType,
      scope: item.scope || 'All clinical, nursing, and administrative units across Stavya Spine Hospital.',
      checklist: item.checklist || ['Verification before commencement', 'Step-by-step adherence to sterile protocol', 'Post-procedure logging in EMR'],
      downloadsCount: 0,
    };
    policyList = [newItem, ...policyList];
    notify();
    return newItem;
  },
};
