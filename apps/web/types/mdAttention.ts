export type MDAttentionCategory =
  | 'CRITICAL_OVERDUE'
  | 'HIGH_IMPACT_BLOCKER'
  | 'DECISION_AWAITING_AUTHORITY'
  | 'EVIDENCE_AWAITING_VERIFICATION'
  | 'AT_RISK_MILESTONE'
  | 'REPEATED_DEFERRAL';

export interface DeferralHistoryItem {
  id?: string;
  author_name?: string;
  activity_type?: string;
  note?: string;
  previous_status?: string;
  new_status?: string;
  progress_percent?: number;
  created_at?: string;
}

export interface EvidenceItem {
  name: string;
  submitted_by?: string;
  submitted_at?: string;
  status?: string;
  notes?: string;
  url?: string;
}

export interface ActivityHistoryItem {
  id: string;
  author_name: string;
  activity_type: string;
  note?: string;
  previous_status?: string;
  new_status?: string;
  progress_percent?: number;
  created_at?: string;
}

export interface MDAttentionItem {
  id: string;
  category: MDAttentionCategory;
  title: string;
  source: string;
  owner_name: string;
  accountable_name: string;
  department_name?: string | null;
  due_at?: string | null;
  original_due_at?: string | null;
  due_age_days?: number | null;
  deferral_count?: number;
  deferral_history?: DeferralHistoryItem[];
  impact: string;
  requested_action: string;
  requested_decision?: string | null;
  evidence_state: string;
  evidence_list?: EvidenceItem[];
  activity_history?: ActivityHistoryItem[];
  audit_provenance: string;
  why_included: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  description?: string | null;
  version?: number;
  entity_id: string;
  entity_type: string;
  escalation_id?: string | null;
  blocker_details?: Record<string, any> | null;
  raci?: Record<string, any> | null;
  edc?: Record<string, any> | null;
  is_synthetic?: boolean;
  allowed_actions?: string[];
  disabled_actions?: Record<string, string>;
}

export interface MDAttentionSummary {
  total_items: number;
  critical_overdue_count: number;
  high_impact_blocker_count: number;
  decision_awaiting_count: number;
  evidence_verification_count: number;
  at_risk_milestone_count: number;
  repeated_deferrals_count: number;
  items: MDAttentionItem[];
  is_synthetic_fallback?: boolean;
}

export interface ResolveEscalationPayload {
  escalation_id: string;
  decision: 'APPROVED' | 'REJECTED' | 'DIRECTIVE_ISSUED';
  directive_notes: string;
  unblock_work_item?: boolean;
  expected_version?: number;
}

export interface VerifyEvidencePayload {
  work_item_id: string;
  verification_result: 'VERIFIED_CLOSED' | 'REJECTED_REOPEN';
  verification_notes: string;
  expected_version?: number;
}

export interface RequestEvidencePayload {
  work_item_id: string;
  request_notes: string;
  deadline_extension_days?: number;
  expected_version?: number;
}

export interface RecordDecisionPayload {
  work_item_id: string;
  decision_text: string;
  directive: string;
  unblock?: boolean;
  expected_version?: number;
}

export interface ExecutiveOverridePayload {
  work_item_id: string;
  override_reason: string;
  clear_blocker?: boolean;
  new_due_at?: string;
  expected_version?: number;
}

export interface GrantExtensionPayload {
  work_item_id: string;
  new_due_at: string;
  justification: string;
  expected_version?: number;
}

export interface ReassignRaciPayload {
  work_item_id: string;
  responsible_id?: string;
  responsible_name: string;
  accountable_id?: string;
  accountable_name: string;
  rationale: string;
  expected_version?: number;
}

export interface CockpitActionResponse {
  success: boolean;
  message: string;
  action_type: string;
  entity_id: string;
  entity_type: string;
  audit_event_id?: string | null;
  updated_at: string;
}
