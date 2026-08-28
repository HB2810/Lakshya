export type WorkItemStatus = 'todo' | 'in_progress' | 'completed' | 'stuck' | 'blocked' | 'cancelled';
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkItemActivity {
  id: string;
  timestamp: string;
  authorId: string;
  authorName: string;
  type: 'CREATED' | 'STATUS_CHANGE' | 'PROGRESS_UPDATE' | 'BLOCKER_REPORTED' | 'BLOCKER_RESOLVED' | 'COMPLETED';
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
}

export interface IntakeRequestPayload {
  text: string;
}

export interface ReviewablePlanItem {
  client_id: string;
  title: string;
  description?: string | null;
  suggested_owner_id?: string | null;
  due_at?: string | null;
  priority: WorkItemPriority;
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
  created_by: string;
  due_at?: string | null;
  completed_at?: string | null;
  progressPercent?: number; // 0 - 100
  blocked_at?: string | null;
  blocked_reason?: string | null;
  blocker_details?: BlockerDetails | null;
  origin_meeting_id?: string | null;
  source_type?: 'MANUAL' | 'MEETING' | 'STRATEGY' | 'SMART_INTAKE' | string;
  source_title?: string | null;
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
  due_at?: string | null;
  progressPercent?: number;
  blocked_reason?: string | null;
  blocker_details?: BlockerDetails | null;
  update_note?: string;
}

export interface WorkItemListResponse {
  items: WorkItem[];
  total: number;
}
