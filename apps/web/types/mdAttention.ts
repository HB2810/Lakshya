export type MDAttentionCategory =
  | 'CRITICAL_OVERDUE'
  | 'HIGH_IMPACT_BLOCKER'
  | 'DECISION_AWAITING_AUTHORITY'
  | 'EVIDENCE_AWAITING_VERIFICATION'
  | 'AT_RISK_MILESTONE'
  | 'REPEATED_DEFERRAL';

export interface MDAttentionItem {
  id: string;
  category: MDAttentionCategory;
  title: string;
  source: string;
  owner_name: string;
  accountable_name: string;
  department_name?: string | null;
  due_at?: string | null;
  due_age_days?: number | null;
  impact: string;
  requested_action: string;
  evidence_state: string;
  audit_provenance: string;
  why_included: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  entity_id: string;
  entity_type: string;
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
}
