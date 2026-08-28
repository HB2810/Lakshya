export type PolicyCategory =
  | 'CLINICAL_PROTOCOL'
  | 'SURGICAL_OT'
  | 'NURSING'
  | 'INFECTION_CONTROL'
  | 'BIOMEDICAL_SAFETY'
  | 'IT_DATA_SECURITY'
  | 'ADMINISTRATIVE';

export type PolicyStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'DRAFT' | 'ARCHIVED';

export interface PolicySOPItem {
  id: string;
  code: string; // e.g. "SOP-SPINE-001"
  title: string;
  category: PolicyCategory;
  department: string;
  version: string; // e.g. "v2.1"
  effectiveDate: string;
  reviewDate: string;
  author: string;
  approver: string;
  status: PolicyStatus;
  isNABHMandatory: boolean;
  contentSummary: string;
  keyGuidelines: string[];
  documentUrl?: string;
  downloadsCount: number;
}
