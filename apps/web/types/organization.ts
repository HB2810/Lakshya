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
