export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type AgendaStatus = 'pending' | 'in_progress' | 'completed';
export type DecisionStatus = 'draft' | 'approved' | 'assigned' | 'completed';
export type DecisionPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MeetingCreatePayload {
  title: string;
  meeting_date: string;
  start_time?: string;
  duration_minutes?: number;
  location?: string | null;
}

export interface AgendaItemCreatePayload {
  title: string;
  description?: string | null;
  sort_order?: number;
}

export interface DecisionCreatePayload {
  title: string;
  description?: string | null;
  suggested_owner_id?: string | null;
  department_id?: string | null;
  priority?: DecisionPriority;
}

export interface MeetingAgendaItem {
  id: string;
  organization_id: string;
  meeting_id: string;
  title: string;
  description?: string | null;
  sort_order: number;
  status: AgendaStatus;
  created_at: string;
  updated_at: string;
}

export interface MeetingDecision {
  id: string;
  organization_id: string;
  meeting_id: string;
  title: string;
  description?: string | null;
  suggested_owner_id?: string | null;
  department_id?: string | null;
  priority: DecisionPriority;
  status: DecisionStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingSummary {
  id: string;
  organization_id: string;
  meeting_id: string;
  summary?: string | null;
  decisions_snapshot: Record<string, unknown>[];
  work_snapshot: Record<string, unknown>[];
  blockers_snapshot: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  organization_id: string;
  title: string;
  meeting_date: string;
  start_time: string;
  duration_minutes: number;
  location?: string | null;
  status: MeetingStatus;
  executive_notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface MeetingDetail {
  meeting: Meeting;
  agenda: MeetingAgendaItem[];
  decisions: MeetingDecision[];
  summary?: MeetingSummary | null;
}

export interface MeetingListResponse {
  items: Meeting[];
  total: number;
}
