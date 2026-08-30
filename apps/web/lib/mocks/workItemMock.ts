import { WorkItem, WorkItemActivity, WorkItemStatus, WorkItemPriority, BlockerDetails, WorkItemPatchPayload } from '../../types/workItem';

export const INITIAL_WORK_ITEMS: WorkItem[] = [
  {
    "id": "wi-demo-101",
    "organization_id": "org-stavya-001",
    "title": "OT 4 Endoscopy Sterilization Double-Check Protocol",
    "description": "Perform chemical indicator and autoclave validation for endoscopy instruments before morning surgery roster.",
    "parent_id": null,
    "status": "in_progress",
    "priority": "urgent",
    "owner_id": "usr-stav-101",
    "owner_name": "Priyesh Shah",
    "department_name": "Infrastructure & Engineering",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-08-30T10:00:00.000Z",
    "progressPercent": 60,
    "source_type": "MD_DIRECTIVE",
    "source_title": "Morning MD Directives",
    "raci": {
      "responsible_id": "usr-stav-101",
      "responsible_name": "Priyesh Shah",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "OT Floor Incharge"
      ]
    },
    "edc": {
      "expected_outcome": "Zero CSSD contamination risk for OT 4 endoscopy procedures.",
      "definition_of_done": "Sterilization checklist signed and uploaded with autoclave cycle printout.",
      "evidence_required": "Autoclave cycle barcode printout + physical signature",
      "completion_criteria": [
        "Temperature log confirmed >134\u00b0C for 15 min",
        "Biological indicator negative"
      ]
    },
    "activity_history": [
      {
        "id": "act-demo-1",
        "timestamp": "2026-08-29T08:30:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Direct delegation from morning clinical standup."
      }
    ],
    "created_at": "2026-08-29T08:30:00.000Z",
    "updated_at": "2026-08-29T08:30:00.000Z",
    "version": 1
  },
  {
    "id": "A-001",
    "organization_id": "org-stavya-001",
    "title": "Establish Medical Records function",
    "description": "Required NABH function is absent from the supplied organisation structure. Define accountable owner, staffing, JD, retention and access controls.",
    "parent_id": null,
    "status": "stuck",
    "priority": "urgent",
    "owner_id": "e197",
    "owner_name": "Vatsal Maheshkumar Vaghasiya",
    "department_name": "Infrastructure & Engineering",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-03T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter IMS",
    "raci": {
      "responsible_id": "e197",
      "responsible_name": "Vatsal Maheshkumar Vaghasiya",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Required NABH function is absent from the supplied organisation structure. Define accountable owner, staffing, JD, retention and access controls.",
      "definition_of_done": "Fully documented and verified under NABH Chapter IMS standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-A-001-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (IMS)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "A-002",
    "organization_id": "org-stavya-001",
    "title": "Assign OT 1 scrub owner",
    "description": "Named scrub ownership for OT 1 is not evidenced in the supplied source.",
    "parent_id": null,
    "status": "stuck",
    "priority": "urgent",
    "owner_id": "e026",
    "owner_name": "Brijesh Hasmukhkumar Bhatt",
    "department_name": "Nursing Leadership",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-01T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter COP",
    "raci": {
      "responsible_id": "e026",
      "responsible_name": "Brijesh Hasmukhkumar Bhatt",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Named scrub ownership for OT 1 is not evidenced in the supplied source.",
      "definition_of_done": "Fully documented and verified under NABH Chapter COP standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-A-002-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (COP)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "A-003",
    "organization_id": "org-stavya-001",
    "title": "Complete OT 4 in-house transition",
    "description": "Endoscopy scrub team is recorded as outsourced and being brought in house. Confirm roster, competency and effective date.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e026",
    "owner_name": "Brijesh Hasmukhkumar Bhatt",
    "department_name": "Nursing Leadership",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-10T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter COP",
    "raci": {
      "responsible_id": "e026",
      "responsible_name": "Brijesh Hasmukhkumar Bhatt",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Endoscopy scrub team is recorded as outsourced and being brought in house. Confirm roster, competency and effective date.",
      "definition_of_done": "Fully documented and verified under NABH Chapter COP standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-A-003-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (COP)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "A-004",
    "organization_id": "org-stavya-001",
    "title": "Resolve missing staff master records",
    "description": "Reconcile operational staff not present in the employee master before assigning accountability.",
    "parent_id": null,
    "status": "stuck",
    "priority": "urgent",
    "owner_id": "e154",
    "owner_name": "Payal Manan Mehta",
    "department_name": "Human Resource",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-02T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter HRM",
    "raci": {
      "responsible_id": "e154",
      "responsible_name": "Payal Manan Mehta",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Reconcile operational staff not present in the employee master before assigning accountability.",
      "definition_of_done": "Fully documented and verified under NABH Chapter HRM standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-A-004-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (HRM)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "A-005",
    "organization_id": "org-stavya-001",
    "title": "Clear qualification backlog",
    "description": "Upload and verify qualification evidence for records where education data is absent.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e154",
    "owner_name": "Payal Manan Mehta",
    "department_name": "Human Resource",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-10T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter HRM",
    "raci": {
      "responsible_id": "e154",
      "responsible_name": "Payal Manan Mehta",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Upload and verify qualification evidence for records where education data is absent.",
      "definition_of_done": "Fully documented and verified under NABH Chapter HRM standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-A-005-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (HRM)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "A-006",
    "organization_id": "org-stavya-001",
    "title": "Validate master-data anomalies",
    "description": "Review flagged dates, emails, spelling and category inconsistencies without overwriting source values.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e154",
    "owner_name": "Payal Manan Mehta",
    "department_name": "Human Resource",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-10T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter HRM",
    "raci": {
      "responsible_id": "e154",
      "responsible_name": "Payal Manan Mehta",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Review flagged dates, emails, spelling and category inconsistencies without overwriting source values.",
      "definition_of_done": "Fully documented and verified under NABH Chapter HRM standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-A-006-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (HRM)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CH-AAC",
    "organization_id": "org-stavya-001",
    "title": "AAC chapter evidence and tracer closure",
    "description": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e048",
    "owner_name": "Dr. Preety Ajay Krishnan",
    "department_name": "Radiology",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-06T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter AAC",
    "raci": {
      "responsible_id": "e048",
      "responsible_name": "Dr. Preety Ajay Krishnan",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
      "definition_of_done": "Fully documented and verified under NABH Chapter AAC standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CH-AAC-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (AAC)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CH-COP",
    "organization_id": "org-stavya-001",
    "title": "COP chapter evidence and tracer closure",
    "description": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e026",
    "owner_name": "Brijesh Hasmukhkumar Bhatt",
    "department_name": "Nursing Leadership",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-06T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter COP",
    "raci": {
      "responsible_id": "e026",
      "responsible_name": "Brijesh Hasmukhkumar Bhatt",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
      "definition_of_done": "Fully documented and verified under NABH Chapter COP standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CH-COP-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (COP)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CH-PRE",
    "organization_id": "org-stavya-001",
    "title": "PRE chapter evidence and tracer closure",
    "description": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e058",
    "owner_name": "Dr. Bhavana Amarpal Kashyap",
    "department_name": "Quality",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-06T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter PRE",
    "raci": {
      "responsible_id": "e058",
      "responsible_name": "Dr. Bhavana Amarpal Kashyap",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
      "definition_of_done": "Fully documented and verified under NABH Chapter PRE standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CH-PRE-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (PRE)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CH-IPC",
    "organization_id": "org-stavya-001",
    "title": "IPC chapter evidence and tracer closure",
    "description": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e026",
    "owner_name": "Brijesh Hasmukhkumar Bhatt",
    "department_name": "Nursing Leadership",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-06T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter IPC",
    "raci": {
      "responsible_id": "e026",
      "responsible_name": "Brijesh Hasmukhkumar Bhatt",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
      "definition_of_done": "Fully documented and verified under NABH Chapter IPC standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CH-IPC-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (IPC)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CH-MOM",
    "organization_id": "org-stavya-001",
    "title": "MOM chapter evidence and tracer closure",
    "description": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e161",
    "owner_name": "Preena",
    "department_name": "MD Office",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-06T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter MOM",
    "raci": {
      "responsible_id": "e161",
      "responsible_name": "Preena",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
      "definition_of_done": "Fully documented and verified under NABH Chapter MOM standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CH-MOM-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (MOM)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CH-PSQ",
    "organization_id": "org-stavya-001",
    "title": "PSQ chapter evidence and tracer closure",
    "description": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e055",
    "owner_name": "Dr. Akruti Mirant Dave",
    "department_name": "Governance",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-06T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter PSQ",
    "raci": {
      "responsible_id": "e055",
      "responsible_name": "Dr. Akruti Mirant Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
      "definition_of_done": "Fully documented and verified under NABH Chapter PSQ standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CH-PSQ-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (PSQ)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CH-ROM",
    "organization_id": "org-stavya-001",
    "title": "ROM chapter evidence and tracer closure",
    "description": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e071",
    "owner_name": "Dr. Mirant Bharat Dave",
    "department_name": "Consultant Spine Surgeons",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-06T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ROM",
    "raci": {
      "responsible_id": "e071",
      "responsible_name": "Dr. Mirant Bharat Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ROM standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CH-ROM-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ROM)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CH-FMS",
    "organization_id": "org-stavya-001",
    "title": "FMS chapter evidence and tracer closure",
    "description": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e210",
    "owner_name": "Zankhana Chirag Joshi",
    "department_name": "Facility Operations",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-06T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter FMS",
    "raci": {
      "responsible_id": "e210",
      "responsible_name": "Zankhana Chirag Joshi",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
      "definition_of_done": "Fully documented and verified under NABH Chapter FMS standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CH-FMS-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (FMS)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CH-IMS",
    "organization_id": "org-stavya-001",
    "title": "IMS chapter evidence and tracer closure",
    "description": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e197",
    "owner_name": "Vatsal Maheshkumar Vaghasiya",
    "department_name": "Infrastructure & Engineering",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-06T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter IMS",
    "raci": {
      "responsible_id": "e197",
      "responsible_name": "Vatsal Maheshkumar Vaghasiya",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
      "definition_of_done": "Fully documented and verified under NABH Chapter IMS standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CH-IMS-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (IMS)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CH-HRM",
    "organization_id": "org-stavya-001",
    "title": "HRM chapter evidence and tracer closure",
    "description": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e154",
    "owner_name": "Payal Manan Mehta",
    "department_name": "Human Resource",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-06T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter HRM",
    "raci": {
      "responsible_id": "e154",
      "responsible_name": "Payal Manan Mehta",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Champion to complete clause-level gap review, assign unresolved gaps, index controlled evidence, run one staff tracer and submit a signed closure summary. Do not mark verified without independent Quality review.",
      "definition_of_done": "Fully documented and verified under NABH Chapter HRM standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CH-HRM-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (HRM)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-01",
    "organization_id": "org-stavya-001",
    "title": "Admission department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e152",
    "owner_name": "Parimal Jayantilal Yagnik",
    "department_name": "Patient Experience",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e152",
      "responsible_name": "Parimal Jayantilal Yagnik",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-01-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-02",
    "organization_id": "org-stavya-001",
    "title": "Anesthesia department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e064",
    "owner_name": "Dr. Kashyap Rameshchandra Shah",
    "department_name": "Anesthesia",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e064",
      "responsible_name": "Dr. Kashyap Rameshchandra Shah",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-02-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-03",
    "organization_id": "org-stavya-001",
    "title": "Biomedical Engineering department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e141",
    "owner_name": "Meet Jatinkumar Pathak",
    "department_name": "Biomedical Engineering",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e141",
      "responsible_name": "Meet Jatinkumar Pathak",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-03-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-04",
    "organization_id": "org-stavya-001",
    "title": "Brand Office department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e167",
    "owner_name": "Rajiv Nair",
    "department_name": "Brand Office",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e167",
      "responsible_name": "Rajiv Nair",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-04-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-05",
    "organization_id": "org-stavya-001",
    "title": "CSSD department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e026",
    "owner_name": "Brijesh Hasmukhkumar Bhatt",
    "department_name": "Nursing Leadership",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e026",
      "responsible_name": "Brijesh Hasmukhkumar Bhatt",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-05-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-06",
    "organization_id": "org-stavya-001",
    "title": "Clinical Coordinators department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e079",
    "owner_name": "Dr. Ravi Baldevbhai Patel",
    "department_name": "Clinical Coordinators",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e079",
      "responsible_name": "Dr. Ravi Baldevbhai Patel",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-06-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-07",
    "organization_id": "org-stavya-001",
    "title": "Clinical Research department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e061",
    "owner_name": "Dr. Dhara Arvindkumar Panchal",
    "department_name": "Clinical Research",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e061",
      "responsible_name": "Dr. Dhara Arvindkumar Panchal",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-07-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-08",
    "organization_id": "org-stavya-001",
    "title": "Communication Centre department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e167",
    "owner_name": "Rajiv Nair",
    "department_name": "Brand Office",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e167",
      "responsible_name": "Rajiv Nair",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-08-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-09",
    "organization_id": "org-stavya-001",
    "title": "Consultant Spine Surgeons department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e057",
    "owner_name": "Dr. Bharat Rajendraprasad Dave",
    "department_name": "Consultant Spine Surgeons",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e057",
      "responsible_name": "Dr. Bharat Rajendraprasad Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-09-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-10",
    "organization_id": "org-stavya-001",
    "title": "Facility Operations department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e210",
    "owner_name": "Zankhana Chirag Joshi",
    "department_name": "Facility Operations",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter FMS",
    "raci": {
      "responsible_id": "e210",
      "responsible_name": "Zankhana Chirag Joshi",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter FMS standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-10-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (FMS)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-11",
    "organization_id": "org-stavya-001",
    "title": "Finance department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e137",
    "owner_name": "Manthan Ajaybhai Mehta",
    "department_name": "Finance",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e137",
      "responsible_name": "Manthan Ajaybhai Mehta",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-11-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-12",
    "organization_id": "org-stavya-001",
    "title": "Floor In-charges department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e133",
    "owner_name": "Manilal Mangilal Hadat",
    "department_name": "Nursing Leadership",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e133",
      "responsible_name": "Manilal Mangilal Hadat",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-12-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-13",
    "organization_id": "org-stavya-001",
    "title": "Food Services department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e055",
    "owner_name": "Dr. Akruti Mirant Dave",
    "department_name": "Governance",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e055",
      "responsible_name": "Dr. Akruti Mirant Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-13-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-14",
    "organization_id": "org-stavya-001",
    "title": "Front Desk department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e181",
    "owner_name": "Sharon Girishbhai Christian",
    "department_name": "Front Desk",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e181",
      "responsible_name": "Sharon Girishbhai Christian",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-14-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-15",
    "organization_id": "org-stavya-001",
    "title": "Human Resource department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e154",
    "owner_name": "Payal Manan Mehta",
    "department_name": "Human Resource",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter HRM",
    "raci": {
      "responsible_id": "e154",
      "responsible_name": "Payal Manan Mehta",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter HRM standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-15-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (HRM)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-16",
    "organization_id": "org-stavya-001",
    "title": "IPD & HDU Nursing department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e133",
    "owner_name": "Manilal Mangilal Hadat",
    "department_name": "Nursing Leadership",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e133",
      "responsible_name": "Manilal Mangilal Hadat",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-16-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-17",
    "organization_id": "org-stavya-001",
    "title": "Infrastructure & Engineering department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e197",
    "owner_name": "Vatsal Maheshkumar Vaghasiya",
    "department_name": "Infrastructure & Engineering",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e197",
      "responsible_name": "Vatsal Maheshkumar Vaghasiya",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-17-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-18",
    "organization_id": "org-stavya-001",
    "title": "Junior Consultants department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e057",
    "owner_name": "Dr. Bharat Rajendraprasad Dave",
    "department_name": "Consultant Spine Surgeons",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e057",
      "responsible_name": "Dr. Bharat Rajendraprasad Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-18-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-19",
    "organization_id": "org-stavya-001",
    "title": "Junior Registrars department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e057",
    "owner_name": "Dr. Bharat Rajendraprasad Dave",
    "department_name": "Consultant Spine Surgeons",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e057",
      "responsible_name": "Dr. Bharat Rajendraprasad Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-19-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-20",
    "organization_id": "org-stavya-001",
    "title": "MD Office department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e071",
    "owner_name": "Dr. Mirant Bharat Dave",
    "department_name": "Consultant Spine Surgeons",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e071",
      "responsible_name": "Dr. Mirant Bharat Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-20-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-21",
    "organization_id": "org-stavya-001",
    "title": "Medical Officers department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e071",
    "owner_name": "Dr. Mirant Bharat Dave",
    "department_name": "Consultant Spine Surgeons",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e071",
      "responsible_name": "Dr. Mirant Bharat Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-21-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-22",
    "organization_id": "org-stavya-001",
    "title": "Medicine department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e083",
    "owner_name": "Dr. Saunak Chaitanyaprasad Dudhiya",
    "department_name": "Medicine",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e083",
      "responsible_name": "Dr. Saunak Chaitanyaprasad Dudhiya",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-22-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-23",
    "organization_id": "org-stavya-001",
    "title": "Nursing Leadership department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e026",
    "owner_name": "Brijesh Hasmukhkumar Bhatt",
    "department_name": "Nursing Leadership",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e026",
      "responsible_name": "Brijesh Hasmukhkumar Bhatt",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-23-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-24",
    "organization_id": "org-stavya-001",
    "title": "Operating Theatres department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e026",
    "owner_name": "Brijesh Hasmukhkumar Bhatt",
    "department_name": "Nursing Leadership",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e026",
      "responsible_name": "Brijesh Hasmukhkumar Bhatt",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-24-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-25",
    "organization_id": "org-stavya-001",
    "title": "PROs department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e152",
    "owner_name": "Parimal Jayantilal Yagnik",
    "department_name": "Patient Experience",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e152",
      "responsible_name": "Parimal Jayantilal Yagnik",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-25-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-26",
    "organization_id": "org-stavya-001",
    "title": "Patient Escorts department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e152",
    "owner_name": "Parimal Jayantilal Yagnik",
    "department_name": "Patient Experience",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e152",
      "responsible_name": "Parimal Jayantilal Yagnik",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-26-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-27",
    "organization_id": "org-stavya-001",
    "title": "Patient Experience department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e152",
    "owner_name": "Parimal Jayantilal Yagnik",
    "department_name": "Patient Experience",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e152",
      "responsible_name": "Parimal Jayantilal Yagnik",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-27-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-28",
    "organization_id": "org-stavya-001",
    "title": "Pharmacy department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e112",
    "owner_name": "Jatin Jayantilal Pathak",
    "department_name": "Pharmacy",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e112",
      "responsible_name": "Jatin Jayantilal Pathak",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-28-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-29",
    "organization_id": "org-stavya-001",
    "title": "Physiotherapy and Rehabilitation department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e075",
    "owner_name": "Dr. Parth Janakbhai Joshi",
    "department_name": "Physiotherapy and Rehabilitation",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e075",
      "responsible_name": "Dr. Parth Janakbhai Joshi",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-29-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-30",
    "organization_id": "org-stavya-001",
    "title": "Quality department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e055",
    "owner_name": "Dr. Akruti Mirant Dave",
    "department_name": "Governance",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter PSQ",
    "raci": {
      "responsible_id": "e055",
      "responsible_name": "Dr. Akruti Mirant Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter PSQ standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-30-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (PSQ)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-31",
    "organization_id": "org-stavya-001",
    "title": "Radiology department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e048",
    "owner_name": "Dr. Preety Ajay Krishnan",
    "department_name": "Radiology",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e048",
      "responsible_name": "Dr. Preety Ajay Krishnan",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-31-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-32",
    "organization_id": "org-stavya-001",
    "title": "Senior Registrars department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e057",
    "owner_name": "Dr. Bharat Rajendraprasad Dave",
    "department_name": "Consultant Spine Surgeons",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e057",
      "responsible_name": "Dr. Bharat Rajendraprasad Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-32-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "DP-33",
    "organization_id": "org-stavya-001",
    "title": "Spine Associates department readiness pack",
    "description": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e059",
    "owner_name": "Dr. Birju Kishorbhai Vyas",
    "department_name": "Spine Associates",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter ALL",
    "raci": {
      "responsible_id": "e059",
      "responsible_name": "Dr. Birju Kishorbhai Vyas",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Department head to brief all staff, verify current JD/training/competency visibility, audit five applicable records or logs, complete physical-area safety and housekeeping round, close local gaps and upload one indexed evidence pack.",
      "definition_of_done": "Fully documented and verified under NABH Chapter ALL standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-DP-33-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (ALL)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-01",
    "organization_id": "org-stavya-001",
    "title": "Daily NABH command huddle and blocker escalation",
    "description": "Run a 20-minute daily huddle; review RED items, overdue tasks, ownerless gaps and evidence rejected by Quality. Record decisions and escalation owner.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e055",
    "owner_name": "Dr. Akruti Mirant Dave",
    "department_name": "Governance",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-08-31T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter PSQ",
    "raci": {
      "responsible_id": "e055",
      "responsible_name": "Dr. Akruti Mirant Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Run a 20-minute daily huddle; review RED items, overdue tasks, ownerless gaps and evidence rejected by Quality. Record decisions and escalation owner.",
      "definition_of_done": "Fully documented and verified under NABH Chapter PSQ standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-01-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (PSQ)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-02",
    "organization_id": "org-stavya-001",
    "title": "Controlled-document master list freeze",
    "description": "Reconcile current policies, SOPs, forms, version numbers, approvals and distribution points. Remove obsolete uncontrolled display copies only through the authorised document-control process.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e055",
    "owner_name": "Dr. Akruti Mirant Dave",
    "department_name": "Governance",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-03T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter PSQ",
    "raci": {
      "responsible_id": "e055",
      "responsible_name": "Dr. Akruti Mirant Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Reconcile current policies, SOPs, forms, version numbers, approvals and distribution points. Remove obsolete uncontrolled display copies only through the authorised document-control process.",
      "definition_of_done": "Fully documented and verified under NABH Chapter PSQ standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-02-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (PSQ)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-03",
    "organization_id": "org-stavya-001",
    "title": "Personnel-file and qualification closure",
    "description": "For every employee, reconcile appointment, ID, qualification, registration where applicable, JD acknowledgement, competency, training and probation records. Keep absent evidence visibly open.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e154",
    "owner_name": "Payal Manan Mehta",
    "department_name": "Human Resource",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-04T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter HRM",
    "raci": {
      "responsible_id": "e154",
      "responsible_name": "Payal Manan Mehta",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "For every employee, reconcile appointment, ID, qualification, registration where applicable, JD acknowledgement, competency, training and probation records. Keep absent evidence visibly open.",
      "definition_of_done": "Fully documented and verified under NABH Chapter HRM standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-03-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (HRM)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-04",
    "organization_id": "org-stavya-001",
    "title": "Credentialing and privilege evidence check",
    "description": "Reconcile current credential verification, scope of practice, privileges, approvals and expiry status for clinical professionals without fabricating signatures or approvals.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e154",
    "owner_name": "Payal Manan Mehta",
    "department_name": "Human Resource",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-04T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter HRM",
    "raci": {
      "responsible_id": "e154",
      "responsible_name": "Payal Manan Mehta",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Reconcile current credential verification, scope of practice, privileges, approvals and expiry status for clinical professionals without fabricating signatures or approvals.",
      "definition_of_done": "Fully documented and verified under NABH Chapter HRM standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-04-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (HRM)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-05",
    "organization_id": "org-stavya-001",
    "title": "Medication-management tracer",
    "description": "Trace procurement-to-administration, storage temperatures, high-alert/LASA controls, emergency medicines, expiry checks, ADR and medication-error reporting; index evidence and corrective actions.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e161",
    "owner_name": "Preena",
    "department_name": "MD Office",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter MOM",
    "raci": {
      "responsible_id": "e161",
      "responsible_name": "Preena",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Trace procurement-to-administration, storage temperatures, high-alert/LASA controls, emergency medicines, expiry checks, ADR and medication-error reporting; index evidence and corrective actions.",
      "definition_of_done": "Fully documented and verified under NABH Chapter MOM standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-05-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (MOM)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-06",
    "organization_id": "org-stavya-001",
    "title": "Nursing and patient-care tracer",
    "description": "Run admission-to-discharge tracer across IPD/HDU/OT including assessment, care plan, medication administration, handover, consent, infection control and discharge education.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e026",
    "owner_name": "Brijesh Hasmukhkumar Bhatt",
    "department_name": "Nursing Leadership",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter COP",
    "raci": {
      "responsible_id": "e026",
      "responsible_name": "Brijesh Hasmukhkumar Bhatt",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Run admission-to-discharge tracer across IPD/HDU/OT including assessment, care plan, medication administration, handover, consent, infection control and discharge education.",
      "definition_of_done": "Fully documented and verified under NABH Chapter COP standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-06-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (COP)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-07",
    "organization_id": "org-stavya-001",
    "title": "Facility, fire and emergency readiness round",
    "description": "Verify fire and life safety, emergency codes, utilities, security, hazardous materials, signage, preventive maintenance and drill evidence; escalate physical defects immediately.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e210",
    "owner_name": "Zankhana Chirag Joshi",
    "department_name": "Facility Operations",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter FMS",
    "raci": {
      "responsible_id": "e210",
      "responsible_name": "Zankhana Chirag Joshi",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Verify fire and life safety, emergency codes, utilities, security, hazardous materials, signage, preventive maintenance and drill evidence; escalate physical defects immediately.",
      "definition_of_done": "Fully documented and verified under NABH Chapter FMS standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-07-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (FMS)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-08",
    "organization_id": "org-stavya-001",
    "title": "Biomedical equipment readiness",
    "description": "Verify inventory, calibration, preventive maintenance, breakdown response, user training and critical-equipment backup evidence.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e141",
    "owner_name": "Meet Jatinkumar Pathak",
    "department_name": "Biomedical Engineering",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter FMS",
    "raci": {
      "responsible_id": "e141",
      "responsible_name": "Meet Jatinkumar Pathak",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Verify inventory, calibration, preventive maintenance, breakdown response, user training and critical-equipment backup evidence.",
      "definition_of_done": "Fully documented and verified under NABH Chapter FMS standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-08-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (FMS)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-09",
    "organization_id": "org-stavya-001",
    "title": "Information-system and downtime readiness",
    "description": "Verify role-based access, backup evidence, restoration test, downtime forms, confidentiality controls and availability of required records during system interruption.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e197",
    "owner_name": "Vatsal Maheshkumar Vaghasiya",
    "department_name": "Infrastructure & Engineering",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter IMS",
    "raci": {
      "responsible_id": "e197",
      "responsible_name": "Vatsal Maheshkumar Vaghasiya",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Verify role-based access, backup evidence, restoration test, downtime forms, confidentiality controls and availability of required records during system interruption.",
      "definition_of_done": "Fully documented and verified under NABH Chapter IMS standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-09-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (IMS)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-10",
    "organization_id": "org-stavya-001",
    "title": "Patient-rights and consent tracer",
    "description": "Verify rights display, privacy, consent completeness, education, feedback, grievance escalation and communication for vulnerable patients.",
    "parent_id": null,
    "status": "todo",
    "priority": "high",
    "owner_id": "e058",
    "owner_name": "Dr. Bhavana Amarpal Kashyap",
    "department_name": "Quality",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-05T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter PRE",
    "raci": {
      "responsible_id": "e058",
      "responsible_name": "Dr. Bhavana Amarpal Kashyap",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Verify rights display, privacy, consent completeness, education, feedback, grievance escalation and communication for vulnerable patients.",
      "definition_of_done": "Fully documented and verified under NABH Chapter PRE standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-10-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (PRE)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-11",
    "organization_id": "org-stavya-001",
    "title": "Hospital-wide mock survey",
    "description": "Conduct leadership interview, patient tracer, staff interviews, document sampling and physical round. Log every observation with owner and due date.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e055",
    "owner_name": "Dr. Akruti Mirant Dave",
    "department_name": "Governance",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-07T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter PSQ",
    "raci": {
      "responsible_id": "e055",
      "responsible_name": "Dr. Akruti Mirant Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Conduct leadership interview, patient tracer, staff interviews, document sampling and physical round. Log every observation with owner and due date.",
      "definition_of_done": "Fully documented and verified under NABH Chapter PSQ standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-11-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (PSQ)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  },
  {
    "id": "CC-12",
    "organization_id": "org-stavya-001",
    "title": "Final evidence verification and readiness freeze",
    "description": "Quality independently verifies claimed closures, rejects unsupported green items, freezes the evidence index and issues the 9 September open-risk brief to the MD.",
    "parent_id": null,
    "status": "todo",
    "priority": "urgent",
    "owner_id": "e055",
    "owner_name": "Dr. Akruti Mirant Dave",
    "department_name": "Governance",
    "created_by": "Dr. Mirant Bharat Dave (MD)",
    "due_at": "2026-09-09T17:00:00.000Z",
    "progressPercent": 0,
    "source_type": "NABH_INSPECTION_MATRIX",
    "source_title": "NABH Chapter PSQ",
    "raci": {
      "responsible_id": "e055",
      "responsible_name": "Dr. Akruti Mirant Dave",
      "accountable_id": "e069",
      "accountable_name": "Dr. Mirant Bharat Dave (MD)",
      "consulted_names": [
        "Dr. Akruti Mirant Dave",
        "Brijesh Hasmukhkumar Bhatt"
      ],
      "informed_names": [
        "Governing Board",
        "NABH Steering Committee"
      ]
    },
    "edc": {
      "expected_outcome": "Quality independently verifies claimed closures, rejects unsupported green items, freezes the evidence index and issues the 9 September open-risk brief to the MD.",
      "definition_of_done": "Fully documented and verified under NABH Chapter PSQ standards.",
      "evidence_required": "Signed audit sheet and approved SOP/Register record",
      "completion_criteria": [
        "Documented process in SOP/Policy",
        "Staff trained and attendance recorded",
        "Internal mock audit signed off by Quality Director"
      ]
    },
    "activity_history": [
      {
        "id": "act-CC-12-init",
        "timestamp": "2026-08-28T09:00:00.000Z",
        "authorId": "e069",
        "authorName": "Dr. Mirant Bharat Dave (MD)",
        "type": "CREATED",
        "note": "Seeded from NABH Quality Inspection Action Register (PSQ)."
      }
    ],
    "created_at": "2026-08-28T09:00:00.000Z",
    "updated_at": "2026-08-28T09:00:00.000Z",
    "version": 1
  }
];

type Listener = () => void;
const listeners: Set<Listener> = new Set();
const notify = () => listeners.forEach(fn => fn());

export let canonicalWorkItems: WorkItem[] = [...INITIAL_WORK_ITEMS];

export const workItemStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getWorkItems(filters?: { owner_id?: string; status?: string }): WorkItem[] {
    let result = [...canonicalWorkItems];
    if (filters?.owner_id) {
      result = result.filter(w => w.owner_id === filters.owner_id);
    }
    if (filters?.status) {
      result = result.filter(w => w.status === filters.status);
    }
    return result;
  },

  getWorkItemById(id: string): WorkItem | undefined {
    return canonicalWorkItems.find(w => w.id === id);
  },

  getWorkItem(id: string): WorkItem | undefined {
    return canonicalWorkItems.find(w => w.id === id);
  },

  createWorkItem(item: Partial<WorkItem>, authorName = 'Priyesh Shah'): WorkItem {
    const id = item.id || ('wi-' + Date.now());
    const nowIso = new Date().toISOString();
    const newItem: WorkItem = {
      id,
      organization_id: item.organization_id || 'org-stavya-001',
      title: item.title || 'Untitled Work Item',
      description: item.description || '',
      parent_id: item.parent_id || null,
      status: item.status || 'todo',
      priority: item.priority || 'medium',
      owner_id: item.owner_id || 'usr-stav-101',
      owner_name: item.owner_name || authorName,
      created_by: authorName,
      department_name: item.department_name || 'General Operations',
      due_at: item.due_at || new Date(Date.now() + 86400000).toISOString(),
      progressPercent: item.progressPercent || 0,
      source_type: item.source_type || 'MANUAL',
      source_title: item.source_title || 'Self-Created Task',
      tags: item.tags || [],
      raci: item.raci || null,
      edc: item.edc || null,
      activity_history: item.activity_history || [
        {
          id: 'act-' + Date.now(),
          timestamp: nowIso,
          authorId: item.owner_id || 'usr-stav-101',
          authorName,
          type: 'CREATED',
          note: item.description || 'Work item created.',
        },
      ],
      created_at: nowIso,
      updated_at: nowIso,
      version: 1,
    };

    canonicalWorkItems = [newItem, ...canonicalWorkItems];
    notify();
    return newItem;
  },

  patchWorkItem(id: string, patch: WorkItemPatchPayload, authorName = 'Lakshya User'): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();
    const activity: WorkItemActivity = {
      id: 'act-' + Date.now(),
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: patch.raci ? 'RACI_CHANGE' : 'PROGRESS_UPDATE',
      note: patch.update_note || 'Work item updated.',
    };
    const nextOwnerId = patch.raci?.responsible_id || patch.owner_id || item.owner_id;
    const nextOwnerName = patch.raci?.responsible_name || patch.owner_name || item.owner_name;

    canonicalWorkItems = canonicalWorkItems.map(w => w.id === id ? {
      ...w,
      ...patch,
      owner_id: nextOwnerId,
      owner_name: nextOwnerName,
      updated_at: nowIso,
      version: w.version + 1,
      activity_history: [activity, ...(w.activity_history || [])],
    } : w);
    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  updateStatus(id: string, newStatus: WorkItemStatus, authorName = 'Priyesh Shah', note?: string): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const previousStatus = item.status;
    const nowIso = new Date().toISOString();

    const activity: WorkItemActivity = {
      id: 'act-' + Date.now(),
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: newStatus === 'completed' ? 'COMPLETED' : 'STATUS_CHANGE',
      previousStatus,
      newStatus,
      note: note || ('Status changed from ' + previousStatus + ' to ' + newStatus),
    };

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        status: newStatus,
        completed_at: newStatus === 'completed' ? nowIso : w.completed_at,
        progressPercent: newStatus === 'completed' ? 100 : w.progressPercent,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  updateProgress(id: string, progressPercent: number, note?: string, authorName = 'Priyesh Shah'): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();
    const newStatus: WorkItemStatus = progressPercent >= 100 ? 'completed' : item.status === 'todo' ? 'in_progress' : item.status;

    const activity: WorkItemActivity = {
      id: 'act-' + Date.now(),
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: 'PROGRESS_UPDATE',
      progressPercent,
      newStatus,
      note: note || ('Progress updated to ' + progressPercent + '%'),
    };

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        progressPercent,
        status: newStatus,
        completed_at: progressPercent >= 100 ? nowIso : w.completed_at,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  updateRaci(id: string, raciUpdate: any, authorName = 'Priyesh Shah'): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();
    const activity: WorkItemActivity = {
      id: 'act-' + Date.now(),
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: 'RACI_CHANGE',
      note: 'RACI matrix updated by ' + authorName,
    };

    const nextOwnerId = raciUpdate.responsible_id || item.owner_id;
    const nextOwnerName = raciUpdate.responsible_name || item.owner_name;

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        raci: { ...w.raci, ...raciUpdate },
        owner_id: nextOwnerId,
        owner_name: nextOwnerName,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  reportBlocker(id: string, blocker: Partial<BlockerDetails>, authorName = 'Priyesh Shah'): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();
    const fullBlocker: BlockerDetails = {
      reason: blocker.reason || 'General Blocker',
      needDescription: blocker.needDescription || 'Assistance needed',
      helpedByPersonOrDept: blocker.helpedByPersonOrDept || 'Leader',
      urgency: blocker.urgency || 'HIGH',
      reportedAt: nowIso,
      requiredByDate: blocker.requiredByDate,
      businessImpact: blocker.businessImpact,
      category: blocker.category || 'OTHER',
    };

    const activity: WorkItemActivity = {
      id: 'act-' + Date.now(),
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: 'BLOCKER_REPORTED',
      newStatus: 'blocked',
      note: 'Blocker: ' + fullBlocker.reason + '. Need: ' + fullBlocker.needDescription,
    };

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        status: 'blocked',
        blocked_at: nowIso,
        blocked_reason: fullBlocker.reason,
        blocker_details: fullBlocker,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  resolveBlocker(id: string, resolutionNote?: string, authorName = 'Priyesh Shah'): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();

    const activity: WorkItemActivity = {
      id: 'act-' + Date.now(),
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: 'BLOCKER_RESOLVED',
      newStatus: 'in_progress',
      note: resolutionNote || 'Blocker resolved. Resuming active execution.',
    };

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        status: 'in_progress',
        blocked_at: null,
        blocked_reason: null,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  submitForVerification(id: string, submissionNotes: string, authorName = 'Staff Member'): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();
    const activity: WorkItemActivity = {
      id: 'act-' + Date.now(),
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: 'SUBMITTED_FOR_VERIFICATION',
      newStatus: 'submitted_for_verification',
      note: 'Deliverable submitted for incharge verification: ' + submissionNotes,
    };

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        status: 'submitted_for_verification',
        submission_notes: submissionNotes,
        submitted_for_verification_at: nowIso,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  auditVerify(
    id: string,
    params: {
      decision: 'APPROVED' | 'REVISION_REQUESTED';
      auditScore?: number;
      sopCompliance?: boolean;
      remarks?: string;
      verifierId?: string;
      verifierName?: string;
      verifierRole?: string;
    }
  ): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();
    const verifierName = params.verifierName || 'Incharge / Leader';
    const isApproved = params.decision === 'APPROVED';

    const verificationRecord = {
      verified_by_id: params.verifierId || 'usr-leader-1',
      verified_by_name: verifierName,
      verified_by_role: params.verifierRole || 'Incharge / Leader',
      verified_at: nowIso,
      decision: params.decision,
      audit_score: params.auditScore,
      sop_compliance: params.sopCompliance ?? true,
      remarks: params.remarks,
    };

    const nextStatus = isApproved ? 'verified' : 'revision_requested';
    const activityType = isApproved ? 'VERIFIED' : 'REVISION_REQUESTED';
    const note = isApproved
      ? `Task verified and approved by ${verifierName}. Audit Score: ${params.auditScore || 'N/A'}/5. Remarks: ${params.remarks || 'Approved'}`
      : `Revision requested by ${verifierName}: ${params.remarks || 'Please revise deliverable.'}`;

    const activity: WorkItemActivity = {
      id: 'act-' + Date.now(),
      timestamp: nowIso,
      authorId: params.verifierId || 'usr-leader-1',
      authorName: verifierName,
      type: activityType as any,
      newStatus: nextStatus as any,
      note,
      progressPercent: isApproved ? 100 : item.progressPercent,
    };

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        status: nextStatus as any,
        completed_at: isApproved ? nowIso : null,
        progressPercent: isApproved ? 100 : w.progressPercent,
        verification: verificationRecord,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  resetData() {
    canonicalWorkItems = [...INITIAL_WORK_ITEMS];
    notify();
  }
};
