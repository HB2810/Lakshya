export type MeetingType = 'MAJOR' | 'CROSS_FUNCTIONAL' | 'ONE_ON_ONE' | 'SCHEDULED' | 'NON_SCHEDULED';

export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MeetingParticipant {
  userId: string;
  userName: string;
  userRoleTitle: string;
  departmentName: string;
  attended: boolean;
}

export interface Decision {
  id: string;
  meetingId?: string;
  meetingTitle?: string;
  code: string; // e.g. "DEC-2026-031"
  title: string;
  context: string;
  decisionMakerUserId: string;
  decisionMakerUserName: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SUPERSEDED';
  approvedAt?: string;
  approvedByUserName?: string;
  impactSummary: string;
  linkedCommitmentId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  scheduledAt: string;
  locationOrLink: string;
  organizerUserId: string;
  organizerUserName: string;
  status: MeetingStatus;
  agendaItems: string[];
  participants: MeetingParticipant[];
  decisions: Decision[];
  actionItemsCount: number;
}
