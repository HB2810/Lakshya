import { PolicySOPItem } from '../../types/policy';

export const INITIAL_POLICIES_AND_SOPS: PolicySOPItem[] = [
  {
    "id": "sop-001",
    "code": "SOP-SPINE-OT-01",
    "title": "Spine Surgical Implant Traceability & Pre-Op Sterilization Protocol",
    "category": "SURGICAL_OT",
    "department": "Spine Surgery & CSSD",
    "version": "v2.4",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Dr. Rohan Sharma (Head of Spine Surgery)",
    "approver": "Managing Director (MD Office)",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Mandatory 2D barcode double-scan verification for all pedicle screw implant trays prior to OT sterile field transfer.",
    "keyGuidelines": [
      "Dual-operator barcode scan required on nursing tablet before opening tray wrap",
      "Class 5 chemical indicator strip verification recorded in digital CSSD logbook",
      "Immediate quarantine protocol if biological indicator test fails at 24-hour reading"
    ],
    "downloadsCount": 142
  },
  {
    "id": "sop-002",
    "code": "SOP-CLIN-INF-04",
    "title": "Hospital-Wide Surgical Site Infection (SSI) Surveillance & Reporting",
    "category": "INFECTION_CONTROL",
    "department": "Infection Control Committee",
    "version": "v3.1",
    "effectiveDate": "2026-05-15",
    "reviewDate": "2027-05-15",
    "author": "Dr. Rajesh Verma (Infection Control Officer)",
    "approver": "Clinical Governance Board",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Standardized 30-day post-operative surveillance guidelines for spine arthrodesis and decompression procedures.",
    "keyGuidelines": [
      "Prophylactic IV antibiotic administration completed within 60 mins of skin incision",
      "Mandatory post-discharge follow-up tele-consultation at Day 7, Day 14, and Day 30",
      "Automatic stat alert to MD Office for any deep fascial wound dehiscence"
    ],
    "downloadsCount": 98
  },
  {
    "id": "aac-005",
    "code": "AAC-005",
    "title": "Triage Algorithm",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter AAC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Dr Preety Ajay Krishnan",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Triage Algorithm complying with NABH 6th Edition requirements for Chapter AAC.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/AAC_005_Triage_Algorithm.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter AAC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "aac-006",
    "code": "AAC-006",
    "title": "Emergency Activation",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter AAC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Dr Preety Ajay Krishnan",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Emergency Activation complying with NABH 6th Edition requirements for Chapter AAC.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Draft_Workflows/AAC_006_Emergency_Activation.md"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter AAC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-003",
    "code": "COP-003",
    "title": "Surgical Safety Checklist",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Surgical Safety Checklist complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/COP_003_Surgical_Safety_Checklist.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-004",
    "code": "COP-004",
    "title": "Level Verification Workflow",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Level Verification Workflow complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/COP_004_Level_Verification_Workflow.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-008",
    "code": "COP-008",
    "title": "Emergency OT Prioritisation",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Emergency OT Prioritisation complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/COP_008_Emergency_OT_Prioritization.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-012",
    "code": "COP-012",
    "title": "Mechanical Ventilation",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Mechanical Ventilation complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Draft_Workflows/COP_012_Mechanical_Ventilation.md"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-013",
    "code": "COP-013",
    "title": "Difficult Airway",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Difficult Airway complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/COP_013_Difficult_Airway.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-014",
    "code": "COP-014",
    "title": "Clinical Deterioration / MEWS",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Clinical Deterioration / MEWS complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/COP_014_Clinical_Deterioration_MEWS.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-015",
    "code": "COP-015",
    "title": "Code Blue",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Code Blue complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/COP_015_Code_Blue.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-016",
    "code": "COP-016",
    "title": "Sepsis Management",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Sepsis Management complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/COP_016_Sepsis_Management.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-027",
    "code": "COP-027",
    "title": "Required control document \u2014 official title to confirm",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-028",
    "code": "COP-028",
    "title": "Blood Transfusion",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Blood Transfusion complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/COP_028_Blood_Transfusion.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "cop-029",
    "code": "COP-029",
    "title": "Massive Haemorrhage",
    "category": "CLINICAL_OPERATIONS",
    "department": "NABH Chapter COP",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Massive Haemorrhage complying with NABH 6th Edition requirements for Chapter COP.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/COP_029_Massive_Haemorrhage.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter COP.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "fms-003",
    "code": "FMS-003",
    "title": "Fire Response",
    "category": "FACILITY_SAFETY",
    "department": "NABH Chapter FMS",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Zankhana Chirag Joshi",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Fire Response complying with NABH 6th Edition requirements for Chapter FMS.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/FMS_003_Fire_Response.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter FMS.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "fms-004",
    "code": "FMS-004",
    "title": "Disaster Management",
    "category": "FACILITY_SAFETY",
    "department": "NABH Chapter FMS",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Zankhana Chirag Joshi",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Disaster Management complying with NABH 6th Edition requirements for Chapter FMS.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/FMS_004_Disaster_Management.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter FMS.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "fms-012",
    "code": "FMS-012",
    "title": "Required control document \u2014 official title to confirm",
    "category": "FACILITY_SAFETY",
    "department": "NABH Chapter FMS",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Zankhana Chirag Joshi",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter FMS.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter FMS.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "fms-024",
    "code": "FMS-024",
    "title": "MRI Safety",
    "category": "FACILITY_SAFETY",
    "department": "NABH Chapter FMS",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Zankhana Chirag Joshi",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for MRI Safety complying with NABH 6th Edition requirements for Chapter FMS.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/FMS_024_MRI_Safety.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter FMS.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "hic-003",
    "code": "HIC-003",
    "title": "CSSD Sterilisation",
    "category": "GENERAL",
    "department": "NABH Chapter HIC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for CSSD Sterilisation complying with NABH 6th Edition requirements for Chapter HIC.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/HIC_003_CSSD_Sterilization.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter HIC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ims-012",
    "code": "IMS-012",
    "title": "IT Disaster / Downtime",
    "category": "IT_DATA_SECURITY",
    "department": "NABH Chapter IMS",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Vatsal Maheshkumar Vaghasiya",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for IT Disaster / Downtime complying with NABH 6th Edition requirements for Chapter IMS.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/IMS_012_IT_Disaster.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IMS.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ims-018",
    "code": "IMS-018",
    "title": "Critical Results Communication",
    "category": "IT_DATA_SECURITY",
    "department": "NABH Chapter IMS",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Vatsal Maheshkumar Vaghasiya",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Critical Results Communication complying with NABH 6th Edition requirements for Chapter IMS.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/IMS_018_Critical_Results.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IMS.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-001",
    "code": "IPC-001",
    "title": "Required control document \u2014 official title to confirm",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-008",
    "code": "IPC-008",
    "title": "SSI Prevention",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for SSI Prevention complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/IPC_008_SSI_Prevention.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-009",
    "code": "IPC-009",
    "title": "VAP Bundle",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for VAP Bundle complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/IPC_009_VAP_Bundle.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-010",
    "code": "IPC-010",
    "title": "CLABSI Bundle",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for CLABSI Bundle complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/IPC_010_CLABSI_Bundle.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-011",
    "code": "IPC-011",
    "title": "CAUTI Bundle",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for CAUTI Bundle complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/IPC_011_CAUTI_Bundle.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-012",
    "code": "IPC-012",
    "title": "Required control document \u2014 official title to confirm",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-015",
    "code": "IPC-015",
    "title": "Required control document \u2014 official title to confirm",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-016",
    "code": "IPC-016",
    "title": "Required control document \u2014 official title to confirm",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-018",
    "code": "IPC-018",
    "title": "Required control document \u2014 official title to confirm",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-022",
    "code": "IPC-022",
    "title": "Required control document \u2014 official title to confirm",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-024",
    "code": "IPC-024",
    "title": "Required control document \u2014 official title to confirm",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-026",
    "code": "IPC-026",
    "title": "Required control document \u2014 official title to confirm",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "ipc-027",
    "code": "IPC-027",
    "title": "Required control document \u2014 official title to confirm",
    "category": "INFECTION_CONTROL",
    "department": "NABH Chapter IPC",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Brijesh Hasmukhkumar Bhatt",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter IPC.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter IPC.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "mom-009",
    "code": "MOM-009",
    "title": "Medication Administration",
    "category": "PHARMACY",
    "department": "NABH Chapter MOM",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Preena",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Medication Administration complying with NABH 6th Edition requirements for Chapter MOM.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/MOM_009_Medication_Administration.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter MOM.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "mom-011",
    "code": "MOM-011",
    "title": "High-Alert Medicines",
    "category": "PHARMACY",
    "department": "NABH Chapter MOM",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Preena",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for High-Alert Medicines complying with NABH 6th Edition requirements for Chapter MOM.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/MOM_011_High_Alert_Meds.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter MOM.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "mom-013",
    "code": "MOM-013",
    "title": "Narcotics Management",
    "category": "PHARMACY",
    "department": "NABH Chapter MOM",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Preena",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "DRAFT",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Narcotics Management complying with NABH 6th Edition requirements for Chapter MOM.",
    "keyGuidelines": [
      "Training Status: TRAINING NOT EVIDENCED",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: Export_Ready_SOPs/MOM_013_Narcotics_Management.txt"
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter MOM.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "mom-014",
    "code": "MOM-014",
    "title": "Required control document \u2014 official title to confirm",
    "category": "PHARMACY",
    "department": "NABH Chapter MOM",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Preena",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter MOM.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter MOM.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "pre-005",
    "code": "PRE-005",
    "title": "Required control document \u2014 official title to confirm",
    "category": "GOVERNANCE",
    "department": "NABH Chapter PRE",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Dr Bhavana Amarpal Kashyap",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter PRE.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter PRE.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  },
  {
    "id": "rom-016",
    "code": "ROM-016",
    "title": "Required control document \u2014 official title to confirm",
    "category": "GOVERNANCE",
    "department": "NABH Chapter ROM",
    "version": "v1.0",
    "effectiveDate": "2026-06-01",
    "reviewDate": "2027-06-01",
    "author": "Dr Mirant Bharat Dave",
    "approver": "AUTHORISED CLINICAL / ADMINISTRATIVE APPROVER TO CONFIRM",
    "status": "ACTIVE",
    "isNABHMandatory": true,
    "contentSummary": "Hospital standard operating procedure for Required control document \u2014 official title to confirm complying with NABH 6th Edition requirements for Chapter ROM.",
    "keyGuidelines": [
      "Training Status: NOT READY FOR TRAINING",
      "Implementation Status: UNVERIFIED",
      "Verification Sign-off: UNVERIFIED",
      "Source Reference: "
    ],
    "scope": "All clinical and administrative units across Stavya Spine Hospital under NABH Chapter ROM.",
    "checklist": [
      "Staff training and attendance signed",
      "Daily operational verification log updated",
      "Periodic audit sign-off by Chapter Champion"
    ],
    "downloadsCount": 45
  }
];

export const CATEGORY_LABELS: Record<string, string> = {
  ALL: 'All Categories',
  CLINICAL_OPERATIONS: 'Clinical & Patient Care (AAC/COP)',
  INFECTION_CONTROL: 'Infection Control & Safety (IPC/PSQ)',
  PHARMACY: 'Medication Management (MOM)',
  FACILITY_SAFETY: 'Facility & Equipment (FMS)',
  IT_DATA_SECURITY: 'Information Systems (IMS)',
  HUMAN_RESOURCES: 'Human Resources (HRM)',
  GOVERNANCE: 'Governance & Rights (ROM/PRE)',
  SURGICAL_OT: 'Spine OT & Surgical Procedures',
  GENERAL: 'General Hospital SOPs',
};

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
      id: 'sop-' + Date.now(),
      code: item.code || ('SOP-GEN-' + String(policyList.length + 1).padStart(3, '0')),
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
