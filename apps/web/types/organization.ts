import { Persona, StandardV1Role } from './auth';

export interface Department {
  id: string;
  name: string;
  code: string;
  parentDepartmentId?: string | null;
  headUserId: string;
  headUserName: string;
  membersCount: number;
  activeTasksCount: number;
  stuckItemsCount: number;
}

export interface Position {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  departmentName: string;
  reportsToPositionId?: string | null;
  reportsToPositionTitle?: string | null;
  currentOccupantUserId?: string | null;
  currentOccupantName?: string | null;
  role: StandardV1Role;
  isVacant: boolean;
}

export interface OrgNode {
  id: string;
  positionId: string;
  positionTitle: string;
  positionCode: string;
  departmentId: string;
  departmentName: string;
  role: StandardV1Role;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  reportsToPositionId?: string | null;
  directReportCount: number;
  activeTasksCount: number;
  blockedTasksCount: number;
  children?: OrgNode[];
}

export interface OrgNodeOccupant {
  user_id: string;
  full_name: string;
  assignment_id: string;
  started_on?: string;
}

export interface CanonicalOrgNode {
  position_id: string;
  title: string;
  code?: string | null;
  is_leadership: boolean;
  department_id: string;
  department_name: string;
  reports_to_position_id?: string | null;
  current_occupant?: OrgNodeOccupant | null;
  subordinates: CanonicalOrgNode[];
}

export interface OrgTreeResponse {
  organization_id: string;
  organization_name: string;
  root_nodes: CanonicalOrgNode[];
}

export interface RoleDefinition {
  name: Persona;
  title: string;
  description: string;
  allowedCapabilities: string[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorUserName: string;
  action: string;
  entityType: 'TASK' | 'COMMITMENT' | 'DECISION' | 'PRIORITY' | 'ESCALATION' | 'USER' | 'POSITION' | 'ORG_CHART';
  entityId: string;
  entityTitle: string;
  previousValue?: string;
  newValue?: string;
}
