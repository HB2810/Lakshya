export type WorkItemStatus = 'todo' | 'in_progress' | 'completed' | 'stuck' | 'blocked' | 'cancelled';
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkItemActivity {
  id: string;
  timestamp: string;
  authorId: string;
  authorName: string;
  type:
    | 'CREATED'
    | 'STATUS_CHANGE'
    | 'PROGRESS_UPDATE'
    | 'BLOCKER_REPORTED'
    | 'BLOCKER_RESOLVED'
    | 'ESCALATION_TRIGGERED'
    | 'ESCALATION_RESOLVED'
    | 'REASSIGNED'
    | 'RACI_CHANGE'
    | 'COMPLETED';
  note?: string;
  previousStatus?: WorkItemStatus;
  newStatus?: WorkItemStatus;
  progressPercent?: number;
}

export interface BlockerDetails {
  reason: string;
  needDescription: string;
  helpedByPersonOrDept?: string;
  urgency: 'URGENT' | 'HIGH' | 'MEDIUM';
  reportedAt: string;
  requiredByDate?: string;
  businessImpact?: string;
  category?: 'VENDOR_DELAY' | 'DEPENDENCY' | 'APPROVAL_REQUIRED' | 'TECHNICAL' | 'RESOURCE_SHORTAGE' | 'OTHER';
}

export interface WorkItemRACI {
  responsible_id?: string | null;
  responsible_name?: string | null;
  accountable_id: string; // Primary Accountable owner
  accountable_name: string;
  consulted_ids?: string[];
  consulted_names?: string[];
  informed_ids?: string[];
  informed_names?: string[];
  consultation_expectation?: string | null;
  information_cadence?: string | null;
  updated_at?: string | null;
  updated_by_name?: string | null;
}

export interface WorkItemEDC {
  expected_outcome: string;
  definition_of_done: string;
  evidence_required?: string;
  completion_criteria?: string[];
}

export type DependencyStatus = 'BLOCKED' | 'READY' | 'COMPLETED';

export interface WorkItemDependencyItem {
  id: string;
  target_work_item_id: string;
  target_title: string;
  status: DependencyStatus;
  notes?: string;
}

export type EscalationLevel = 'DIRECT_LEADER' | 'DEPARTMENT_HEAD' | 'MANAGING_DIRECTOR';

export interface WorkItemEscalationRecord {
  id: string;
  organization_id?: string;
  work_item_id: string;
  level: EscalationLevel;
  reason: string;
  escalated_by_id: string;
  escalated_by_name: string;
  escalated_to_id: string;
  escalated_to_name: string;
  escalated_at?: string;
  created_at: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  resolution_note?: string;
  resolved_at?: string;
}

export interface IntakeRequestPayload {
  text: string;
}

export interface ReviewablePlanItem {
  client_id: string;
  title: string;
  description?: string | null;
  suggested_owner_id?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  due_at?: string | null;
  priority: WorkItemPriority;
  raci?: WorkItemRACI | null;
}

export interface ReviewablePlan {
  title: string;
  description?: string | null;
  due_at?: string | null;
  priority: WorkItemPriority;
  suggested_owner_id?: string | null;
  items: ReviewablePlanItem[];
}

export interface StructuredPlanRecommendation {
  plan: ReviewablePlan;
}

export interface ApprovePlanPayload {
  title: string;
  description?: string | null;
  due_at?: string | null;
  priority: WorkItemPriority;
  owner_id?: string | null;
  origin_meeting_id?: string | null;
  source_type?: string;
  items: ReviewablePlanItem[];
}

export interface WorkItem {
  id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  parent_id?: string | null;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  owner_id?: string | null;
  owner_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  created_by: string;
  due_at?: string | null;
  completed_at?: string | null;
  progressPercent?: number; // 0 - 100
  blocked_at?: string | null;
  blocked_reason?: string | null;
  blocker_details?: BlockerDetails | null;
  
  // Execution Engineering (RACI, EDC, Dependencies, Escalations)
  raci?: WorkItemRACI | null;
  edc?: WorkItemEDC | null;
  dependencies?: WorkItemDependencyItem[];
  escalation?: WorkItemEscalationRecord | null;
  
  origin_meeting_id?: string | null;
  source_type?: 'MANUAL' | 'MEETING' | 'STRATEGY' | 'SMART_INTAKE' | string;
  source_title?: string | null;
  tags?: string[];
  activity_history?: WorkItemActivity[];
  created_at: string;
  updated_at: string;
  version: number;
}

export interface WorkItemPatchPayload {
  title?: string;
  description?: string | null;
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  owner_id?: string | null;
  owner_name?: string | null;
  department_id?: string | null;
  due_at?: string | null;
  progressPercent?: number;
  blocked_reason?: string | null;
  blocker_details?: BlockerDetails | null;
  raci?: WorkItemRACI | null;
  edc?: WorkItemEDC | null;
  dependencies?: WorkItemDependencyItem[];
  escalation?: WorkItemEscalationRecord | null;
  update_note?: string;
}

export interface WorkItemListResponse {
  items: WorkItem[];
  total: number;
}
