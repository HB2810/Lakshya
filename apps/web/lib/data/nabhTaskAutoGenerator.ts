// NABH 6th Edition Autonomous Task Auto-Generation Engine
// Generates recurring statutory compliance, clinical audits, committee agendas, and quality indicator tasks
// Aligned with the 10 Core Chapters of NABH 6th Edition Standards and designated Chapter Champions

import { WorkItem, WorkItemPriority, WorkItemStatus, WorkItemRACI, WorkItemEDC } from '../../types/workItem';
import { NABH_6TH_EDITION_CHAMPIONS, NabhChapterChampionProfile } from './nabhReadinessChecklistData';

export type NabhTaskCadence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL' | 'PER_EVENT';

export interface NabhTaskTemplate {
  templateId: string;
  chapter: string;
  chapterTitle: string;
  code: string;
  title: string;
  description: string;
  cadence: NabhTaskCadence;
  priority: WorkItemPriority;
  championId: string;
  championName: string;
  championRole: string;
  departmentId: string;
  departmentName: string;
  committeeName: string;
  statutoryMandate: boolean;
  weight: number; // 1-5
  edc: {
    expectedOutcome: string;
    definitionOfDone: string;
    evidenceRequired: string;
    completionCriteria: string[];
  };
}

export interface NabhAutoGenerationOptions {
  cycleName?: string;
  targetChapters?: string[];
  targetCadences?: NabhTaskCadence[];
  targetDate?: string;
  priorityOverride?: WorkItemPriority;
  appendTimestamp?: boolean;
}

export interface NabhGenerationStats {
  totalGenerated: number;
  byCadence: Record<NabhTaskCadence, number>;
  byChapter: Record<string, number>;
  byPriority: Record<string, number>;
  statutoryCount: number;
}

// Master Statutory & Clinical NABH 6th Edition Recurring Task Templates
export const NABH_TASK_TEMPLATES: NabhTaskTemplate[] = [
  // ==========================================
  // CHAPTER 1: AAC (Access, Assessment & Continuity) - Champion: Dr. Preety Krishnan (e048)
  // ==========================================
  {
    templateId: 'tmpl-aac-01',
    chapter: 'AAC',
    chapterTitle: 'Access, Assessment & Continuity of Care',
    code: 'AAC.1.1',
    title: 'Daily OPD Triage & Registration Waiting Time Audit',
    description: 'Audit patient registration queue flow, verify ABDM UHID capture rate (>90%), and ensure waiting time to initial clinical consult is under 20 minutes.',
    cadence: 'DAILY',
    priority: 'high',
    championId: 'e048',
    championName: 'Dr. Preety Ajay Krishnan',
    championRole: 'Lead Clinical Coordinator & Chapter Lead',
    departmentId: 'dept-aac',
    departmentName: 'Clinical Coordination & Diagnostics',
    committeeName: 'OPD Flow & Triage Committee',
    statutoryMandate: true,
    weight: 4,
    edc: {
      expectedOutcome: 'Zero registration bottlenecks and average OPD consultation wait time under 20 minutes.',
      definitionOfDone: 'Daily sample audit of 30 OPD tickets logged in HIMS with ABDM verification status confirmed.',
      evidenceRequired: 'HIMS timestamp log printout and Triage Register sign-off.',
      completionCriteria: [
        'ABDM UHID linkage verified for all registered patients',
        'Average queue-to-consult TAT calculated and logged',
        'Zero unattended high-triage emergency walk-ins'
      ]
    }
  },
  {
    templateId: 'tmpl-aac-02',
    chapter: 'AAC',
    chapterTitle: 'Access, Assessment & Continuity of Care',
    code: 'AAC.2.3',
    title: 'Initial Clinical Assessment 24-Hour Compliance Audit',
    description: 'Verify that complete medical and nursing assessments for all admitted inpatients are finalized within 24 hours of admission.',
    cadence: 'DAILY',
    priority: 'urgent',
    championId: 'e048',
    championName: 'Dr. Preety Ajay Krishnan',
    championRole: 'Lead Clinical Coordinator & Chapter Lead',
    departmentId: 'dept-aac',
    departmentName: 'Clinical Coordination & Diagnostics',
    committeeName: 'Clinical Audit & Documentation Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: '100% IPD admission cases have initial doctor and nursing assessment completed within 24 hours.',
      definitionOfDone: 'Chart audit of all IPD admissions in past 24 hours with timestamps and signature verifications.',
      evidenceRequired: 'Digital IPD chart audit checklist signed by Chapter Champion.',
      completionCriteria: [
        'Doctor initial clinical notes completed <24h',
        'Nursing nutritional and fall-risk assessment completed <4h',
        'Initial care plan formulated and recorded'
      ]
    }
  },
  {
    templateId: 'tmpl-aac-03',
    chapter: 'AAC',
    chapterTitle: 'Access, Assessment & Continuity of Care',
    code: 'AAC.4.2',
    title: 'Critical Laboratory & Radiology Alert TAT Log',
    description: 'Review critical diagnostic value notification registers (e.g. panic potassium, critical cord compression MRI alerts) ensuring physician call-back within 30 minutes.',
    cadence: 'WEEKLY',
    priority: 'high',
    championId: 'e048',
    championName: 'Dr. Preety Ajay Krishnan',
    championRole: 'Lead Clinical Coordinator & Chapter Lead',
    departmentId: 'dept-aac',
    departmentName: 'Clinical Coordination & Diagnostics',
    committeeName: 'Diagnostic Quality & Lab Safety Committee',
    statutoryMandate: true,
    weight: 4,
    edc: {
      expectedOutcome: '100% critical diagnostic alerts communicated to treating spine surgeon/physician within 30 minutes.',
      definitionOfDone: 'Weekly critical result register verified with time-of-discovery and time-of-communication stamps.',
      evidenceRequired: 'Laboratory critical value logbook and HIMS alert audit report.',
      completionCriteria: [
        'Zero unacknowledged critical diagnostic alerts',
        'Escalation log documented for delayed clinician responses',
        'Read-back confirmation recorded for verbal telephone alerts'
      ]
    }
  },
  {
    templateId: 'tmpl-aac-04',
    chapter: 'AAC',
    chapterTitle: 'Access, Assessment & Continuity of Care',
    code: 'AAC.6.1',
    title: 'Discharge Summary Handover & TAT Review',
    description: 'Verify that comprehensive discharge summaries with medication reconciliation are handed over to patients within 2 hours of clinical discharge clearance.',
    cadence: 'MONTHLY',
    priority: 'medium',
    championId: 'e048',
    championName: 'Dr. Preety Ajay Krishnan',
    championRole: 'Lead Clinical Coordinator & Chapter Lead',
    departmentId: 'dept-aac',
    departmentName: 'Clinical Coordination & Diagnostics',
    committeeName: 'Discharge & Continuum Committee',
    statutoryMandate: false,
    weight: 3,
    edc: {
      expectedOutcome: 'Average discharge processing time under 120 minutes with zero medication discharge discrepancies.',
      definitionOfDone: 'Monthly sample analysis of 50 discharge summaries across spine surgery and rehabilitation units.',
      evidenceRequired: 'Monthly discharge TAT tracking report and patient copy receipt logs.',
      completionCriteria: [
        'Prescription advice, red-flag symptoms, and follow-up date included',
        'Discharge summary delivered to patient at time of leaving hospital',
        'Emergency contact helpline provided on summary'
      ]
    }
  },

  // ==========================================
  // CHAPTER 2: COP (Care of Patients) - Champion: Brijesh Bhatt (e026) & Dr. Bharat Dave (e001)
  // ==========================================
  {
    templateId: 'tmpl-cop-01',
    chapter: 'COP',
    chapterTitle: 'Care of Patients & Safe Spine Surgery',
    code: 'COP.3.1',
    title: 'WHO Surgical Safety Checklist 3-Part Verification Audit',
    description: 'Audit 100% spine surgery OT cases for Sign-In (before induction), Time-Out (before incision), and Sign-Out (before leaving OT) compliance.',
    cadence: 'DAILY',
    priority: 'urgent',
    championId: 'e026',
    championName: 'Brijesh Hasmukhkumar Bhatt',
    championRole: 'Clinical Nurse Specialist & OT Coordinator',
    departmentId: 'dept-cop',
    departmentName: 'Operation Theatre & Anaesthesia',
    committeeName: 'OT Safety & Infection Control Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: '100% adherence to WHO 3-part Surgical Safety Checklist in all spine surgery theatres.',
      definitionOfDone: 'Daily verification of physical and digital SSC forms signed by surgeon, anaesthetist, and scrub nurse.',
      evidenceRequired: 'Completed WHO Checklist records in OT register + surgeon signatures.',
      completionCriteria: [
        'Correct patient, surgical site marking, and spinal level confirmation',
        'Implant, neuromonitoring, and fluoroscopy check verified in Time-Out',
        'Instrument, sponge, and needle count documented in Sign-Out'
      ]
    }
  },
  {
    templateId: 'tmpl-cop-02',
    chapter: 'COP',
    chapterTitle: 'Care of Patients & Safe Spine Surgery',
    code: 'COP.4.4',
    title: 'Emergency Crash Cart & Defibrillator Daily Check',
    description: 'Verify OT, ICU, and ward emergency crash carts: defibrillator battery self-test, intact seal, oxygen cylinder pressure (>1000 psi), and zero expired emergency medications.',
    cadence: 'DAILY',
    priority: 'urgent',
    championId: 'e026',
    championName: 'Brijesh Hasmukhkumar Bhatt',
    championRole: 'Clinical Nurse Specialist & OT Coordinator',
    departmentId: 'dept-cop',
    departmentName: 'Operation Theatre & Anaesthesia',
    committeeName: 'Resuscitation Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: 'All 6 hospital crash carts 100% functional with zero expired drugs and active defibrillator self-test.',
      definitionOfDone: 'Daily checklist signed by shift charge nurses and verified by COP Champion.',
      evidenceRequired: 'Crash cart daily inspection log sheets with barcode seal numbers.',
      completionCriteria: [
        'Defibrillator shock test passed and printed',
        'Laryngoscope blades, endotracheal tubes, and suction units tested',
        'Emergency drug expiry matrix up-to-date (>30 days buffer)'
      ]
    }
  },
  {
    templateId: 'tmpl-cop-03',
    chapter: 'COP',
    chapterTitle: 'Care of Patients & Safe Spine Surgery',
    code: 'COP.6.2',
    title: 'Post-Operative Pain Assessment & Scoring Audit',
    description: 'Audit patient pain scores using Numerical Rating Scale (NRS) / Visual Analogue Scale (VAS) at scheduled 4-hour intervals post spine surgery with timely analgesia intervention.',
    cadence: 'WEEKLY',
    priority: 'medium',
    championId: 'e026',
    championName: 'Brijesh Hasmukhkumar Bhatt',
    championRole: 'Clinical Nurse Specialist & OT Coordinator',
    departmentId: 'dept-cop',
    departmentName: 'Operation Theatre & Anaesthesia',
    committeeName: 'Pain Management Committee',
    statutoryMandate: false,
    weight: 3,
    edc: {
      expectedOutcome: 'Zero unmanaged severe pain episodes (VAS >7) without documented clinician re-evaluation within 30 min.',
      definitionOfDone: 'Weekly chart audit of 25 post-op spine surgery files.',
      evidenceRequired: 'Post-operative pain flow-sheet audit report.',
      completionCriteria: [
        'Pain scores recorded every 4h for first 48h post-op',
        'Analgesic effectiveness re-assessed 30 min after IV administration',
        'Patient satisfaction with pain management documented'
      ]
    }
  },
  {
    templateId: 'tmpl-cop-04',
    chapter: 'COP',
    chapterTitle: 'Care of Patients & Safe Spine Surgery',
    code: 'COP.7.1',
    title: 'Hospital-Wide Code Blue Mock Resuscitation Drill',
    description: 'Execute unannounced Code Blue drill to evaluate emergency resuscitation response team arrival time (<3 minutes), CPR quality, and team communication.',
    cadence: 'QUARTERLY',
    priority: 'high',
    championId: 'e026',
    championName: 'Brijesh Hasmukhkumar Bhatt',
    championRole: 'Clinical Nurse Specialist & OT Coordinator',
    departmentId: 'dept-cop',
    departmentName: 'Operation Theatre & Anaesthesia',
    committeeName: 'Resuscitation Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: 'Code Blue team response under 180 seconds with flawless CPR and defibrillation algorithm.',
      definitionOfDone: 'Mock drill executed with timed video observation, debriefing meeting, and CAPA report.',
      evidenceRequired: 'Code Blue drill evaluation rubric signed by MD & Anaesthesia Head.',
      completionCriteria: [
        'First responder CPR initiated <30 seconds',
        'Code Blue team arrival with crash cart <3 minutes',
        'Post-drill debriefing notes and corrective actions documented'
      ]
    }
  },

  // ==========================================
  // CHAPTER 3: MOM (Management of Medication) - Champion: Jatin Pathak (e133) & Dr. Kashyap Shah (e062)
  // ==========================================
  {
    templateId: 'tmpl-mom-01',
    chapter: 'MOM',
    chapterTitle: 'Management of Medication & Safe Pharmacy',
    code: 'MOM.2.2',
    title: 'High-Risk & LASA (Look-Alike Sound-Alike) Drug Storage Audit',
    description: 'Inspect hospital pharmacy, ICU, and OT drug storage for physical separation, red-flag tagging of High-Risk electrolytes (Concentrated KCl, NaCl 3%), and tall-man lettering on LASA drugs.',
    cadence: 'WEEKLY',
    priority: 'urgent',
    championId: 'e133',
    championName: 'Jatin Jayantilal Pathak',
    championRole: 'Chief Pharmacist & MOM Chapter Champion',
    departmentId: 'dept-mom',
    departmentName: 'Pharmacy & Drug Administration',
    committeeName: 'Pharmaco-Vigilance & Therapeutics Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: '100% compliance in physical segregation and double-signoff labeling of high-alert medications.',
      definitionOfDone: 'Physical audit of pharmacy main store, 3 ward emergency trays, and 4 OT drug carts.',
      evidenceRequired: 'Weekly High-Risk Medication audit checklist with photographic evidence of tagging.',
      completionCriteria: [
        'Concentrated electrolytes restricted to pharmacy and ICU only',
        'LASA warning stickers affixed on all storage bins',
        'Zero unlabelled decanted medication containers found'
      ]
    }
  },
  {
    templateId: 'tmpl-mom-02',
    chapter: 'MOM',
    chapterTitle: 'Management of Medication & Safe Pharmacy',
    code: 'MOM.3.1',
    title: 'Pharmacy Refrigerator Cold Chain (2°C - 8°C) Twice-Daily Log',
    description: 'Verify digital data loggers and physical thermometer records for temperature-sensitive drugs (biologics, muscle relaxants, vaccines) with alarm testing.',
    cadence: 'DAILY',
    priority: 'high',
    championId: 'e133',
    championName: 'Jatin Jayantilal Pathak',
    championRole: 'Chief Pharmacist & MOM Chapter Champion',
    departmentId: 'dept-mom',
    departmentName: 'Pharmacy & Drug Administration',
    committeeName: 'Pharmacy Operations Committee',
    statutoryMandate: true,
    weight: 4,
    edc: {
      expectedOutcome: 'Unbroken cold chain between 2°C and 8°C with zero temperature excursion incidents.',
      definitionOfDone: 'Morning and evening temperature readings logged with calibrated digital sensor.',
      evidenceRequired: 'Daily temperature chart signed by Duty Pharmacist and verified by MOM Lead.',
      completionCriteria: [
        'Morning temperature recorded between 08:00 - 09:00',
        'Evening temperature recorded between 18:00 - 19:00',
        'Immediate backup power generator contingency checked'
      ]
    }
  },
  {
    templateId: 'tmpl-mom-03',
    chapter: 'MOM',
    chapterTitle: 'Management of Medication & Safe Pharmacy',
    code: 'MOM.5.2',
    title: 'Weekly Antimicrobial Stewardship Programme (AMSP) Clinical Round',
    description: 'Conduct multidisciplinary AMSP rounds with Microbiologist and Spine Surgeons reviewing restricted antibiotic usage (Meropenem, Colistin, Linezolid) against culture sensitivity reports.',
    cadence: 'WEEKLY',
    priority: 'urgent',
    championId: 'e133',
    championName: 'Jatin Jayantilal Pathak',
    championRole: 'Chief Pharmacist & MOM Chapter Champion',
    departmentId: 'dept-mom',
    departmentName: 'Pharmacy & Drug Administration',
    committeeName: 'Antimicrobial Stewardship Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: 'Appropriate rational antibiotic usage aligned with Stavya Spine Antibiotic Policy.',
      definitionOfDone: 'Weekly clinical round register of all IPD patients on reserve/restricted antimicrobials.',
      evidenceRequired: 'AMSP clinical round sheet with de-escalation recommendations and surgeon sign-offs.',
      completionCriteria: [
        'Antibiotic justification form verified for all Group-3 antibiotics',
        'Culture-directed de-escalation initiated within 48h of microbiology report',
        'Defined Daily Dose (DDD) tracked for top 5 antibiotics'
      ]
    }
  },
  {
    templateId: 'tmpl-mom-04',
    chapter: 'MOM',
    chapterTitle: 'Management of Medication & Safe Pharmacy',
    code: 'MOM.7.1',
    title: 'Adverse Drug Reaction (ADR) Reporting & Pharmacovigilance Review',
    description: 'Collect, investigate, and report all suspected ADRs to IPC-PvPI portal; review medication near-misses and prescription error trends.',
    cadence: 'MONTHLY',
    priority: 'high',
    championId: 'e133',
    championName: 'Jatin Jayantilal Pathak',
    championRole: 'Chief Pharmacist & MOM Chapter Champion',
    departmentId: 'dept-mom',
    departmentName: 'Pharmacy & Drug Administration',
    committeeName: 'Pharmaco-Vigilance & Therapeutics Committee',
    statutoryMandate: true,
    weight: 4,
    edc: {
      expectedOutcome: 'Zero unreported adverse drug events with monthly causality analysis and clinical feedback.',
      definitionOfDone: 'Monthly ADR summary dossier compiled and submitted to Medical Director.',
      evidenceRequired: 'Completed CDSCO/PvPI yellow forms and pharmacy error logbook.',
      completionCriteria: [
        'All reported ADRs assessed using Naranjo Causality Algorithm',
        'Critical ADRs escalated to treating surgeon within 1 hour',
        'Medication safety bulletin published to nursing staff'
      ]
    }
  },

  // ==========================================
  // CHAPTER 4: PRE (Patient Rights & Education) - Champion: Dr. Bhavana Kashyap (e058)
  // ==========================================
  {
    templateId: 'tmpl-pre-01',
    chapter: 'PRE',
    chapterTitle: 'Patient Rights, Education & Grievance Governance',
    code: 'PRE.1.2',
    title: 'Vernacular Informed Consent Form & Clinical Risk Disclosure Audit',
    description: 'Audit 100% surgical admission files for valid informed consent in patient preferred language (Gujarati / Hindi / English) with specific surgical risks, blood transfusion, and anesthesia consent.',
    cadence: 'WEEKLY',
    priority: 'urgent',
    championId: 'e058',
    championName: 'Dr. Bhavana Amarpal Kashyap',
    championRole: 'Head of Patient Relations & PRE Chapter Lead',
    departmentId: 'dept-pre',
    departmentName: 'Patient Experience & Medical Social Services',
    committeeName: 'Ethics & Patient Rights Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: '100% compliant informed consent documentation prior to any invasive surgical procedure.',
      definitionOfDone: 'Weekly sample audit of 30 pre-operative files.',
      evidenceRequired: 'Informed consent audit scoring sheet signed by PRE Champion.',
      completionCriteria: [
        'Consent obtained in patient-understood language',
        'Surgeon, patient/surrogate, and witness signatures present with date/time',
        'Separate anesthesia and blood transfusion consent verified'
      ]
    }
  },
  {
    templateId: 'tmpl-pre-02',
    chapter: 'PRE',
    chapterTitle: 'Patient Rights, Education & Grievance Governance',
    code: 'PRE.3.1',
    title: '24-Hour Patient Grievance Redressal SLA Compliance Review',
    description: 'Review patient feedback drop-boxes, digital grievance QR portal, and verbal escalations, ensuring 100% grievances acknowledged within 2 hours and resolved within 24 hours.',
    cadence: 'WEEKLY',
    priority: 'high',
    championId: 'e058',
    championName: 'Dr. Bhavana Amarpal Kashyap',
    championRole: 'Head of Patient Relations & PRE Chapter Lead',
    departmentId: 'dept-pre',
    departmentName: 'Patient Experience & Medical Social Services',
    committeeName: 'Grievance Redressal Committee',
    statutoryMandate: true,
    weight: 4,
    edc: {
      expectedOutcome: '100% patient grievances closed within the statutory 24-hour resolution SLA.',
      definitionOfDone: 'Grievance register reconciliation with root cause categorization and resolution letters.',
      evidenceRequired: 'Weekly Grievance Redressal Logbook signed by MD Office.',
      completionCriteria: [
        'Zero open grievances exceeding 24h SLA',
        'Patient satisfaction with resolution recorded via telephonic follow-up',
        'Systemic root causes escalated to relevant Department Head'
      ]
    }
  },
  {
    templateId: 'tmpl-pre-03',
    chapter: 'PRE',
    chapterTitle: 'Patient Rights, Education & Grievance Governance',
    code: 'PRE.4.3',
    title: 'Patient Education Material & Discharge Counseling Audit',
    description: 'Verify that written vernacular spine ergonomics, surgical wound care, and medication guides are provided to patients with documented teach-back comprehension.',
    cadence: 'MONTHLY',
    priority: 'medium',
    championId: 'e058',
    championName: 'Dr. Bhavana Amarpal Kashyap',
    championRole: 'Head of Patient Relations & PRE Chapter Lead',
    departmentId: 'dept-pre',
    departmentName: 'Patient Experience & Medical Social Services',
    committeeName: 'Patient Education Committee',
    statutoryMandate: false,
    weight: 3,
    edc: {
      expectedOutcome: 'High patient health literacy regarding post-discharge spine precautions and warning signs.',
      definitionOfDone: 'Monthly interview audit of 20 discharged patients evaluating comprehension of care plan.',
      evidenceRequired: 'Patient education documentation audit summary.',
      completionCriteria: [
        'Multilingual spine care booklets distributed',
        'Teach-back method documented in nursing discharge checklist',
        'Emergency 24x7 helpline details explained to patient'
      ]
    }
  },

  // ==========================================
  // CHAPTER 5: IPC (Infection Prevention & Control) - Champion: Dr. Akruti Dave (e069)
  // ==========================================
  {
    templateId: 'tmpl-ipc-01',
    chapter: 'IPC',
    chapterTitle: 'Hospital Infection Prevention & Clinical Zero-Harm',
    code: 'IPC.1.2',
    title: 'Daily WHO 5-Moments Hand Hygiene Compliance Spot-Checks',
    description: 'Conduct unannounced direct observations of doctors, nurses, and allied staff across OT, ICU, and inpatient wards against WHO 5 Moments of Hand Hygiene (>85% benchmark).',
    cadence: 'DAILY',
    priority: 'high',
    championId: 'e069',
    championName: 'Dr. Akruti Mirant Dave',
    championRole: 'Director of Quality & Patient Safety',
    departmentId: 'dept-ipc',
    departmentName: 'Infection Prevention & Control (IPC)',
    committeeName: 'Hospital Infection Control Committee (HICC)',
    statutoryMandate: true,
    weight: 4,
    edc: {
      expectedOutcome: 'Hospital-wide hand hygiene compliance exceeding 85% with zero supply stockouts.',
      definitionOfDone: 'Minimum 20 hand hygiene opportunities observed per shift and recorded in IPC tool.',
      evidenceRequired: 'Daily IPC Hand Hygiene observation log sheets.',
      completionCriteria: [
        'Observations recorded across all 5 WHO clinical moments',
        'Alcohol hand-rub dispensers verified at all point-of-care beds',
        'Immediate peer correction for observed non-compliance'
      ]
    }
  },
  {
    templateId: 'tmpl-ipc-02',
    chapter: 'IPC',
    chapterTitle: 'Hospital Infection Prevention & Clinical Zero-Harm',
    code: 'IPC.3.1',
    title: 'CSSD Sterilization Autoclave Biological & Chemical Indicator Audit',
    description: 'Verify daily Bowie-Dick tests, Class 5 integrating chemical indicators for every surgical load, and Class 6 / Geobacillus stearothermophilus biological spore ampoules for implant cycles.',
    cadence: 'DAILY',
    priority: 'urgent',
    championId: 'e069',
    championName: 'Dr. Akruti Mirant Dave',
    championRole: 'Director of Quality & Patient Safety',
    departmentId: 'dept-ipc',
    departmentName: 'Infection Prevention & Control (IPC)',
    committeeName: 'CSSD & Sterilization Quality Sub-Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: '100% validated sterile surgical instrument packs with zero autoclave sterilization failures.',
      definitionOfDone: 'Physical verification of autoclave physical parameters (134°C, 2.1 bar, 15 min) and biological incubation.',
      evidenceRequired: 'Autoclave cycle barcode printouts + negative biological indicator incubation logs.',
      completionCriteria: [
        'Biological indicator incubated for 24h/48h with negative growth',
        'Pack integrity, double-wrap, and expiry date stamp verified',
        'Implant loads quarantined until biological indicator clearance'
      ]
    }
  },
  {
    templateId: 'tmpl-ipc-03',
    chapter: 'IPC',
    chapterTitle: 'Hospital Infection Prevention & Clinical Zero-Harm',
    code: 'IPC.4.2',
    title: 'Biomedical Waste (BMW) Color-Coded Segregation & Manifest Audit',
    description: 'Inspect hospital waste generation points (OT, ICU, Lab, Wards) for strict Yellow/Red/White/Blue segregation, puncture-proof sharps container limits (3/4 full), and Barcode GPS manifest compliance.',
    cadence: 'WEEKLY',
    priority: 'high',
    championId: 'e069',
    championName: 'Dr. Akruti Mirant Dave',
    championRole: 'Director of Quality & Patient Safety',
    departmentId: 'dept-ipc',
    departmentName: 'Infection Prevention & Control (IPC)',
    committeeName: 'Bio-Medical Waste Management Committee',
    statutoryMandate: true,
    weight: 4,
    edc: {
      expectedOutcome: '100% compliance with BMW Rules 2016 and zero needle-stick injury due to improper disposal.',
      definitionOfDone: 'Weekly physical inspection of 8 waste generation zones + common storage room log reconciliation.',
      evidenceRequired: 'Weekly BMW Inspection Checklist and Authorized Common Waste Facility Manifest receipts.',
      completionCriteria: [
        'Zero mixed municipal and clinical waste violations',
        'Sharp containers replaced at 3/4th mark and chemically disinfected',
        'Barcoded bag weight matched with CBWTF collection slips'
      ]
    }
  },
  {
    templateId: 'tmpl-ipc-04',
    chapter: 'IPC',
    chapterTitle: 'Hospital Infection Prevention & Clinical Zero-Harm',
    code: 'IPC.6.1',
    title: 'Hospital-Acquired Infection (HAI) Surveillance & HICC Monthly Dossier',
    description: 'Calculate and analyze monthly HAI rates: Surgical Site Infection (SSI) in spine surgeries, Catheter-Associated UTI (CAUTI), and Central Line-Associated Bloodstream Infection (CLABSI) with Antibiogram trending.',
    cadence: 'MONTHLY',
    priority: 'urgent',
    championId: 'e069',
    championName: 'Dr. Akruti Mirant Dave',
    championRole: 'Director of Quality & Patient Safety',
    departmentId: 'dept-ipc',
    departmentName: 'Infection Prevention & Control (IPC)',
    committeeName: 'Hospital Infection Control Committee (HICC)',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: 'SSI rate <1.0%, CAUTI rate <1.5 per 1000 device days, and CLABSI rate 0 per 1000 catheter days.',
      definitionOfDone: 'HAI data collected from 100% surgical cases, validated by Infection Control Nurse, and reviewed in monthly HICC.',
      evidenceRequired: 'Monthly HICC Surveillance Report signed by Microbiologist, Quality Director, and MD.',
      completionCriteria: [
        'Post-discharge 30-day spine surgery SSI surveillance completed',
        'Quarterly hospital cumulative Antibiogram updated',
        'Corrective Action Plan (CAPA) initiated for any cluster or spike'
      ]
    }
  },

  // ==========================================
  // CHAPTER 6: PSQ (Continuous Quality Improvement) - Champion: Dr. Akruti Dave (e069)
  // ==========================================
  {
    templateId: 'tmpl-psq-01',
    chapter: 'PSQ',
    chapterTitle: 'Continuous Quality Improvement & Patient Safety',
    code: 'PSQ.1.1',
    title: 'Monthly Submission & Benchmark Trending for 48 NABH Quality KPIs',
    description: 'Collect, compute numerators and denominators, and trend all 48 NABH 6th Edition Quality and Clinical Indicators across clinical, nursing, pharmacy, diagnostic, infection, facility, and managerial domains.',
    cadence: 'MONTHLY',
    priority: 'urgent',
    championId: 'e069',
    championName: 'Dr. Akruti Mirant Dave',
    championRole: 'Director of Quality & Patient Safety',
    departmentId: 'dept-psq',
    departmentName: 'Quality & Clinical Excellence',
    committeeName: 'Apex Quality Steering Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: '100% of 48 mandatory NABH quality indicators validated, trended, and meeting national benchmarks.',
      definitionOfDone: 'Data entry completed in Quality Command Center with automatic run charts and control limit alerts.',
      evidenceRequired: 'Monthly 48-KPI Quality Dashboard Dossier with outlier commentary and CAPA.',
      completionCriteria: [
        'Data validated against raw registers by Chapter Champions',
        'Statistical process control run charts generated',
        'Presentation to Executive Governance Board and MD'
      ]
    }
  },
  {
    templateId: 'tmpl-psq-02',
    chapter: 'PSQ',
    chapterTitle: 'Continuous Quality Improvement & Patient Safety',
    code: 'PSQ.2.3',
    title: 'Incident Reporting, Sentinel Event & 5-Why Root Cause Analysis (RCA)',
    description: 'Review all clinical, operational, medication, and fall incidents reported in the month; execute 5-Why RCA on high-severity events and track preventive action closure within 14 days.',
    cadence: 'MONTHLY',
    priority: 'high',
    championId: 'e069',
    championName: 'Dr. Akruti Mirant Dave',
    championRole: 'Director of Quality & Patient Safety',
    departmentId: 'dept-psq',
    departmentName: 'Quality & Clinical Excellence',
    committeeName: 'Patient Safety & Clinical Governance Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: 'Zero recurrence of high-severity safety incidents through systemic 5-Why corrective actions.',
      definitionOfDone: 'Monthly incident log audit with 100% RCA reports completed for Sentinel & Major events.',
      evidenceRequired: '5-Why RCA investigation documents and CAPA sign-off certificates.',
      completionCriteria: [
        'Incident investigation initiated within 24 hours of reporting',
        'Root cause identified beyond individual blame (systemic fix)',
        'CAPA implemented, audited, and verified effective after 30 days'
      ]
    }
  },
  {
    templateId: 'tmpl-psq-03',
    chapter: 'PSQ',
    chapterTitle: 'Continuous Quality Improvement & Patient Safety',
    code: 'PSQ.4.1',
    title: 'Executive Clinical Safety Walkthrough with MD Office',
    description: 'Conduct bi-weekly executive patient safety walkthrough across critical clinical zones with Managing Director and Quality Director identifying potential clinical risks and frontline bottlenecks.',
    cadence: 'WEEKLY',
    priority: 'medium',
    championId: 'e069',
    championName: 'Dr. Akruti Mirant Dave',
    championRole: 'Director of Quality & Patient Safety',
    departmentId: 'dept-psq',
    departmentName: 'Quality & Clinical Excellence',
    committeeName: 'Executive Safety Leadership Committee',
    statutoryMandate: false,
    weight: 3,
    edc: {
      expectedOutcome: 'Visible leadership commitment to zero-harm culture and rapid resolution of frontline barriers.',
      definitionOfDone: 'Walkthrough conducted with 1 clinical and 1 support department evaluated per round.',
      evidenceRequired: 'Executive Walkthrough action item log signed by MD.',
      completionCriteria: [
        'Direct dialogue with frontline nursing and technical staff',
        'Immediate safety hazards logged and assigned with 48h SLA',
        'Action items tracked to resolution in LAKSHYA Task Engine'
      ]
    }
  },

  // ==========================================
  // CHAPTER 7: ROM (Responsibilities of Management) - Champion: Dr. Mirant Dave (e071)
  // ==========================================
  {
    templateId: 'tmpl-rom-01',
    chapter: 'ROM',
    chapterTitle: 'Responsibilities of Management & Governance',
    code: 'ROM.1.2',
    title: 'Monthly Convening of 10 Statutory Governance Committees',
    description: 'Ensure scheduled monthly convening, quorum validation (>75%), minutes recording, and action tracker updates for all 10 statutory hospital governance committees.',
    cadence: 'MONTHLY',
    priority: 'urgent',
    championId: 'e071',
    championName: 'Dr. Mirant Bharat Dave',
    championRole: 'Managing Director & Strategic Lead',
    departmentId: 'dept-rom',
    departmentName: 'Executive Governance & MD Office',
    committeeName: 'Executive Governance Board',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: '100% active, auditable statutory governance with zero overdue committee actions.',
      definitionOfDone: 'Minutes of Meeting (MOM) published within 48h with action items linked in LAKSHYA.',
      evidenceRequired: 'Signed Committee MOM dossiers with attendance rosters.',
      completionCriteria: [
        'All 10 committee meetings convened per approved calendar',
        'Action items assigned with explicit RACI and deadlines',
        'Previous meeting action closure audited and confirmed'
      ]
    }
  },
  {
    templateId: 'tmpl-rom-02',
    chapter: 'ROM',
    chapterTitle: 'Responsibilities of Management & Governance',
    code: 'ROM.2.1',
    title: 'Statutory Licenses & Legal Compliance Register Audit',
    description: 'Verify active validity, renewal lead-times (>60 days), and display compliance for AERB (C-Arm/X-Ray), Fire Safety NOC, PCB Consent to Operate, Spirit License, and Clinical Establishment Registration.',
    cadence: 'MONTHLY',
    priority: 'urgent',
    championId: 'e071',
    championName: 'Dr. Mirant Bharat Dave',
    championRole: 'Managing Director & Strategic Lead',
    departmentId: 'dept-rom',
    departmentName: 'Executive Governance & MD Office',
    committeeName: 'Legal & Regulatory Compliance Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: '100% current statutory licenses with zero legal lapses or non-compliance penalties.',
      definitionOfDone: 'Monthly review of Master Legal Compliance Register and regulatory submission portal receipts.',
      evidenceRequired: 'Updated Statutory License Register with validity expiry matrix.',
      completionCriteria: [
        'AERB RSO certificates and TLD badge returns confirmed current',
        'Fire NOC, BMW authorization, and Pharmacy licenses valid',
        'Renewal applications initiated for any license expiring within 90 days'
      ]
    }
  },
  {
    templateId: 'tmpl-rom-03',
    chapter: 'ROM',
    chapterTitle: 'Responsibilities of Management & Governance',
    code: 'ROM.4.3',
    title: 'Medical Record Completeness (MRD) & Discharge Coding Audit',
    description: 'Audit 50 discharged patient case files for completeness of clinical documentation, ICD-10/PCS coding accuracy, doctor signatures, and storage compliance under EHR guidelines.',
    cadence: 'MONTHLY',
    priority: 'high',
    championId: 'e071',
    championName: 'Dr. Mirant Bharat Dave',
    championRole: 'Managing Director & Strategic Lead',
    departmentId: 'dept-rom',
    departmentName: 'Executive Governance & MD Office',
    committeeName: 'Medical Records Review Committee',
    statutoryMandate: true,
    weight: 4,
    edc: {
      expectedOutcome: 'Medical record completeness rate >95% within 7 days of discharge.',
      definitionOfDone: 'Monthly MRD audit sheet completed with deficiency intimations sent to clinicians.',
      evidenceRequired: 'Monthly MRD Completeness Audit Report and ICD-10 coding register.',
      completionCriteria: [
        'Operation notes, anesthesia records, and discharge summaries fully signed',
        'Investigation reports filed and indexed chronologically',
        'Digital archiving and offsite physical security verified'
      ]
    }
  },

  // ==========================================
  // CHAPTER 8: FMS (Facility Management & Safety) - Champion: Vatsal Vaghasiya (e198) & Zankhana Joshi (e148)
  // ==========================================
  {
    templateId: 'tmpl-fms-01',
    chapter: 'FMS',
    chapterTitle: 'Facility Management, Engineering & Safety',
    code: 'FMS.1.1',
    title: 'Daily Medical Gas Pipeline System (MGPS) Manifold Inspection',
    description: 'Inspect Medical Oxygen, Nitrous Oxide, Medical Air, and Vacuum manifold cylinder banks, main line pressures (4.2 bar), automatic changeover switches, and alarm panel functions.',
    cadence: 'DAILY',
    priority: 'urgent',
    championId: 'e198',
    championName: 'Vatsal Maheshkumar Vaghasiya',
    championRole: 'Biomedical & Operations Lead',
    departmentId: 'dept-fms',
    departmentName: 'Biomedical Engineering & Safety',
    committeeName: 'Hospital Safety & Disaster Management Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: 'Uninterrupted medical gas supply with zero pressure drops across OT and ICU ventilators.',
      definitionOfDone: 'Morning, afternoon, and night shift physical inspection log signed by duty engineer.',
      evidenceRequired: 'MGPS Daily Pressure Logbook and automatic alarm test checklist.',
      completionCriteria: [
        'Primary and secondary cylinder bank pressures recorded',
        'Liquid medical oxygen (LMO) / manifold reserve >48 hours',
        'High/Low pressure visual and audio alarms tested functional'
      ]
    }
  },
  {
    templateId: 'tmpl-fms-02',
    chapter: 'FMS',
    chapterTitle: 'Facility Management, Engineering & Safety',
    code: 'FMS.2.2',
    title: 'Hospital Fire Safety, Smoke Detector & Hydrant Quarterly Mock Drill',
    description: 'Conduct quarterly unannounced fire emergency drill, verify smoke detectors, fire alarm panel (FACP), wet risers, fire extinguishers (expiry/pressure), and emergency exit illumination.',
    cadence: 'QUARTERLY',
    priority: 'urgent',
    championId: 'e198',
    championName: 'Vatsal Maheshkumar Vaghasiya',
    championRole: 'Biomedical & Operations Lead',
    departmentId: 'dept-fms',
    departmentName: 'Biomedical Engineering & Safety',
    committeeName: 'Hospital Safety & Disaster Management Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: 'Total facility evacuation readiness with staff trained on RACE and PASS protocols.',
      definitionOfDone: 'Fire drill conducted with local Fire Department observer, timed evacuation, and debriefing.',
      evidenceRequired: 'Quarterly Fire Mock Drill Report with video/photo evidence and attendance list.',
      completionCriteria: [
        'Emergency stairwells and panic bar fire doors verified unblocked',
        'Staff demonstrated practical extinguisher operation (PASS)',
        'Deficiencies rectified within 7 days of drill'
      ]
    }
  },
  {
    templateId: 'tmpl-fms-03',
    chapter: 'FMS',
    chapterTitle: 'Facility Management, Engineering & Safety',
    code: 'FMS.4.1',
    title: 'Biomedical Equipment Planned Preventive Maintenance (PPM) & Calibration',
    description: 'Execute monthly scheduled PPM on critical life-support devices (ventilators, anaesthesia workstations, OT C-Arms, defibrillators, cautery units) and verify calibration certificates.',
    cadence: 'MONTHLY',
    priority: 'high',
    championId: 'e198',
    championName: 'Vatsal Maheshkumar Vaghasiya',
    championRole: 'Biomedical & Operations Lead',
    departmentId: 'dept-fms',
    departmentName: 'Biomedical Engineering & Safety',
    committeeName: 'Biomedical Quality & Equipment Committee',
    statutoryMandate: true,
    weight: 4,
    edc: {
      expectedOutcome: '100% equipment uptime with zero intra-operative machine breakdowns.',
      definitionOfDone: 'Monthly PPM schedule completed for all tagged devices with updated green PPM stickers.',
      evidenceRequired: 'Biomedical Service Reports and NABL-accredited calibration certificates.',
      completionCriteria: [
        'Electrical safety test (leakage current) performed',
        'PPM status updated in LAKSHYA equipment asset register',
        'Standby replacement units verified operational'
      ]
    }
  },

  // ==========================================
  // CHAPTER 9: HRM (Human Resource Management) - Champion: Manilal Hadat (e131) & Payal Mehta
  // ==========================================
  {
    templateId: 'tmpl-hrm-01',
    chapter: 'HRM',
    chapterTitle: 'Human Resource Management & Staff Competency',
    code: 'HRM.1.3',
    title: 'Monthly Staff In-Service Quality, Safety & Infection Control Training',
    description: 'Coordinate and track mandatory monthly in-service training sessions ensuring each hospital employee achieves >20 hours of annual training across CPR, Fire, NABH, and POSH.',
    cadence: 'MONTHLY',
    priority: 'high',
    championId: 'e131',
    championName: 'Manilal Mangilal Hadat',
    championRole: 'Human Resources Manager & HRM Chapter Champion',
    departmentId: 'dept-hrm',
    departmentName: 'Human Resources & Workforce Management',
    committeeName: 'Staff Training & Development Committee',
    statutoryMandate: true,
    weight: 4,
    edc: {
      expectedOutcome: '100% staff achieve mandatory training quota with post-training competency score >80%.',
      definitionOfDone: 'Monthly training sessions conducted with pre/post test evaluation and sign-in rosters.',
      evidenceRequired: 'HR Training Attendance sheets and LMS competency assessment scores.',
      completionCriteria: [
        'Monthly topics aligned with annual NABH training calendar',
        'Make-up sessions arranged for absent staff',
        'Individual staff training hours updated in HR employee dossier'
      ]
    }
  },
  {
    templateId: 'tmpl-hrm-02',
    chapter: 'HRM',
    chapterTitle: 'Human Resource Management & Staff Competency',
    code: 'HRM.3.1',
    title: 'Annual Clinical Credentialing & Surgical Privileging Review',
    description: 'Audit primary source verification (Medical Council, degree, fellowship certificates) and re-evaluate clinical privileges for all consultant surgeons, anaesthetists, and medical officers.',
    cadence: 'ANNUAL',
    priority: 'urgent',
    championId: 'e131',
    championName: 'Manilal Mangilal Hadat',
    championRole: 'Human Resources Manager & HRM Chapter Champion',
    departmentId: 'dept-hrm',
    departmentName: 'Human Resources & Workforce Management',
    committeeName: 'Credentialing & Privileging Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: '100% clinical staff have verified credentials and formal privilege delineation approved by MD.',
      definitionOfDone: 'Annual audit of all doctor and nurse credential files with signed privilege matrices.',
      evidenceRequired: 'Signed Credentialing & Privileging dossiers with MD Office approval.',
      completionCriteria: [
        'State Medical Council registration validity confirmed',
        'Specific surgical procedures delineated based on logbook and experience',
        'Zero clinical staff practicing without active formal privileges'
      ]
    }
  },
  {
    templateId: 'tmpl-hrm-03',
    chapter: 'HRM',
    chapterTitle: 'Human Resource Management & Staff Competency',
    code: 'HRM.5.2',
    title: 'Staff Occupational Health, Vaccination & Needle-Stick Tracker',
    description: 'Audit staff Hepatitis-B vaccination status, annual health check-up coverage (>80%), and post-exposure prophylaxis (PEP) readiness for needle-stick injuries.',
    cadence: 'QUARTERLY',
    priority: 'medium',
    championId: 'e131',
    championName: 'Manilal Mangilal Hadat',
    championRole: 'Human Resources Manager & HRM Chapter Champion',
    departmentId: 'dept-hrm',
    departmentName: 'Human Resources & Workforce Management',
    committeeName: 'Staff Health & Safety Committee',
    statutoryMandate: true,
    weight: 3,
    edc: {
      expectedOutcome: '100% clinical staff immunized against Hepatitis-B with active occupational safety protection.',
      definitionOfDone: 'Quarterly review of employee health files and immunization registers.',
      evidenceRequired: 'Occupational Health Clinic report and Hep-B Anti-HBs titer records.',
      completionCriteria: [
        'Non-responders identified and booster doses scheduled',
        'Zero unresolved needle-stick injury exposures',
        'Annual health check camps organized for high-risk staff'
      ]
    }
  },

  // ==========================================
  // CHAPTER 10: IMS (Information Management System) - Champion: Vatsal Vaghasiya (e198) & Dr. Preety Krishnan (e048)
  // ==========================================
  {
    templateId: 'tmpl-ims-01',
    chapter: 'IMS',
    chapterTitle: 'Information Management, Digital Health & Cybersecurity',
    code: 'IMS.1.1',
    title: 'Daily HIMS Automated Database Backup & Offsite Cloud Replication Verification',
    description: 'Verify execution of daily incremental and weekly full database backups of HIMS, PACS imaging archives, and financial ledgers with offsite encrypted cloud replication.',
    cadence: 'DAILY',
    priority: 'urgent',
    championId: 'e198',
    championName: 'Vatsal Maheshkumar Vaghasiya',
    championRole: 'Biomedical & Operations Lead',
    departmentId: 'dept-ims',
    departmentName: 'Information Technology & Digital Systems',
    committeeName: 'IT Governance & Cyber Security Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: 'RPO (Recovery Point Objective) <1 hour and RTO (Recovery Time Objective) <4 hours for critical hospital data.',
      definitionOfDone: 'Automated backup log check and hash verification email reviewed by IT Lead.',
      evidenceRequired: 'Daily Backup Completion Notification log with SHA-256 hash checksums.',
      completionCriteria: [
        'Local NAS and Cloud S3 replication confirmed successful',
        'Backup file size integrity checked against previous day',
        'Immediate alert triggered for any backup error'
      ]
    }
  },
  {
    templateId: 'tmpl-ims-02',
    chapter: 'IMS',
    chapterTitle: 'Information Management, Digital Health & Cybersecurity',
    code: 'IMS.3.2',
    title: 'Duplicate Medical Record Number (MRN) & Data Integrity Audit',
    description: 'Execute automated HIMS algorithm to identify and merge duplicate patient records (matching Mobile / Aadhaar / Name) ensuring unique longitudinal health records.',
    cadence: 'WEEKLY',
    priority: 'medium',
    championId: 'e198',
    championName: 'Vatsal Maheshkumar Vaghasiya',
    championRole: 'Biomedical & Operations Lead',
    departmentId: 'dept-ims',
    departmentName: 'Information Technology & Digital Systems',
    committeeName: 'Medical Records & IT Steering Committee',
    statutoryMandate: false,
    weight: 3,
    edc: {
      expectedOutcome: 'Hospital duplicate MRN rate below 0.1% across all outpatient and inpatient registrations.',
      definitionOfDone: 'Weekly HIMS reconciliation query execution and clinical record merge log sign-off.',
      evidenceRequired: 'Weekly HIMS Duplicate Resolution Audit Report.',
      completionCriteria: [
        'Potential duplicate matches reviewed by MRD lead',
        'Safe clinical merging executed preserving all historical notes',
        'Frontline registration staff re-trained on duplicate prevention'
      ]
    }
  },
  {
    templateId: 'tmpl-ims-03',
    chapter: 'IMS',
    chapterTitle: 'Information Management, Digital Health & Cybersecurity',
    code: 'IMS.5.1',
    title: 'DISHA Health Data Privacy, User Access Rights & Cyber Security Audit',
    description: 'Audit HIMS user accounts for role-based access control (RBAC), revoke access for exited employees, review firewall logs, and ensure compliance with Digital Information Security in Healthcare (DISHA).',
    cadence: 'MONTHLY',
    priority: 'high',
    championId: 'e198',
    championName: 'Vatsal Maheshkumar Vaghasiya',
    championRole: 'Biomedical & Operations Lead',
    departmentId: 'dept-ims',
    departmentName: 'Information Technology & Digital Systems',
    committeeName: 'IT Governance & Cyber Security Committee',
    statutoryMandate: true,
    weight: 5,
    edc: {
      expectedOutcome: 'Zero unauthorized access incidents, 100% active 2FA for admin accounts, and full patient data privacy.',
      definitionOfDone: 'Monthly user account reconciliation against HR exit list and firewall vulnerability review.',
      evidenceRequired: 'Monthly IT Security Audit Certificate signed by IT Head and MD.',
      completionCriteria: [
        'Inactive accounts (>30 days) automatically disabled',
        'Privileged admin audit log reviewed for suspicious access',
        'Anti-virus definitions and operating system security patches updated'
      ]
    }
  }
];

export class NabhTaskAutoGenerator {
  private templates: NabhTaskTemplate[] = [];

  constructor() {
    this.templates = [...NABH_TASK_TEMPLATES];
  }

  public getTemplates(): NabhTaskTemplate[] {
    return this.templates;
  }

  /**
   * Automatically generate WorkItems from NABH templates based on configuration
   */
  public generateTasks(options: NabhAutoGenerationOptions = {}): WorkItem[] {
    const cycle = options.cycleName || 'Active Cycle';
    const now = new Date();
    const targetDateIso = options.targetDate || new Date(now.getTime() + 7 * 86400000).toISOString();
    const nowIso = now.toISOString();

    let filteredTemplates = [...this.templates];

    if (options.targetChapters && options.targetChapters.length > 0) {
      const upperChapters = options.targetChapters.map(c => c.toUpperCase());
      filteredTemplates = filteredTemplates.filter(t => upperChapters.includes(t.chapter.toUpperCase()));
    }

    if (options.targetCadences && options.targetCadences.length > 0) {
      filteredTemplates = filteredTemplates.filter(t => options.targetCadences!.includes(t.cadence));
    }

    return filteredTemplates.map((template, idx) => {
      const workItemId = `wi-autonabh-${template.chapter.toLowerCase()}-${template.cadence.toLowerCase()}-${template.code.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}${idx}`;
      
      // RACI Matrix definition based on Chapter & Governance Rules
      const isExecutiveGovernance = template.chapter === 'ROM';
      const accountableId = isExecutiveGovernance ? 'e071' : 'e069';
      const accountableName = isExecutiveGovernance 
        ? 'Dr. Mirant Bharat Dave (MD)' 
        : 'Dr. Akruti Mirant Dave (Director Quality)';

      const raci: WorkItemRACI = {
        accountable_id: accountableId,
        accountable_name: accountableName,
        responsible_id: template.championId,
        responsible_name: template.championName,
        consulted_names: [template.committeeName, 'Quality Directorate'],
        informed_names: ['Executive Governance Board', 'MD Office'],
      };

      const edc: WorkItemEDC = {
        expected_outcome: template.edc.expectedOutcome,
        definition_of_done: template.edc.definitionOfDone,
        evidence_required: template.edc.evidenceRequired,
        completion_criteria: template.edc.completionCriteria,
      };

      const priority: WorkItemPriority = options.priorityOverride || template.priority;

      const title = `[NABH-6th ${template.chapter} | ${template.cadence}] ${template.title}`;

      return {
        id: workItemId,
        organization_id: 'org-stavya-001',
        created_by: 'Autonomous NABH 6th Edition Engine',
        version: 1,
        source_type: 'nabh_autogenerated',
        source_title: `NABH Chapter ${template.chapter} (${template.cadence})`,
        title,
        description: `${template.description}\n\nEvidence Required: ${template.edc.evidenceRequired}\nCommittee: ${template.committeeName}`,
        department_id: template.departmentId,
        department_name: template.departmentName,
        owner_id: template.championId,
        owner_name: template.championName,
        priority,
        status: 'todo',
        progressPercent: 0,
        due_at: targetDateIso,
        created_at: nowIso,
        updated_at: nowIso,
        raci,
        edc,
        tags: [
          'NABH_6TH_EDITION',
          'AUTOGENERATED',
          `CHAPTER_${template.chapter}`,
          `CADENCE_${template.cadence}`,
          `CYCLE_${cycle.replace(/\s+/g, '_').toUpperCase()}`,
          template.statutoryMandate ? 'STATUTORY_MANDATE' : 'QUALITY_IMPROVEMENT'
        ],
        activity_history: [
          {
            id: `act-gen-${Date.now()}-${idx}`,
            timestamp: nowIso,
            authorId: 'system-nabh-engine',
            authorName: 'Autonomous NABH Engine',
            type: 'CREATED',
            note: `Auto-generated according to NABH 6th Edition Standard ${template.code} for ${template.cadence} compliance. Accountable: ${accountableName}, Responsible: ${template.championName}.`
          }
        ]
      };
    });
  }

  public getStats(): NabhGenerationStats {
    const byCadence: Record<NabhTaskCadence, number> = {
      DAILY: 0,
      WEEKLY: 0,
      MONTHLY: 0,
      QUARTERLY: 0,
      BIANNUAL: 0,
      ANNUAL: 0,
      PER_EVENT: 0
    };

    const byChapter: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let statutoryCount = 0;

    this.templates.forEach(t => {
      byCadence[t.cadence] = (byCadence[t.cadence] || 0) + 1;
      byChapter[t.chapter] = (byChapter[t.chapter] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      if (t.statutoryMandate) statutoryCount++;
    });

    return {
      totalGenerated: this.templates.length,
      byCadence,
      byChapter,
      byPriority,
      statutoryCount
    };
  }
}

export const nabhTaskAutoGenerator = new NabhTaskAutoGenerator();
