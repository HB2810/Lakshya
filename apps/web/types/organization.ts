import { Persona } from './auth';

export interface Department {
  id: string;
  name: string;
  code: string;
  headUserId: string;
  headUserName: string;
  membersCount: number;
  activeTasksCount: number;
  stuckItemsCount: number;
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
  entityType: 'TASK' | 'COMMITMENT' | 'DECISION' | 'PRIORITY' | 'ESCALATION' | 'USER';
  entityId: string;
  entityTitle: string;
  previousValue?: string;
  newValue?: string;
}
