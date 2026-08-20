export type WorkItemStatus = 'todo' | 'in_progress' | 'completed' | 'stuck' | 'cancelled';
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent';

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
  created_by: string;
  due_at?: string | null;
  origin_meeting_id?: string | null;
  source_type?: string;
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
}

export interface WorkItemListResponse {
  items: WorkItem[];
  total: number;
}
