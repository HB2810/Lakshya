import { Meeting, Decision } from '../../types/meeting';
import { executionStore } from './executionMock';

export let MOCK_DECISIONS: Decision[] = [];
export let MOCK_MEETINGS: Meeting[] = [];

type Listener = () => void;
const listeners: Set<Listener> = new Set();

const notify = () => {
  listeners.forEach(fn => fn());
};

export const meetingStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getMeetings() {
    return MOCK_MEETINGS;
  },

  getDecisions() {
    return MOCK_DECISIONS;
  },

  /**
   * Add a meeting and optionally auto-generate decision commitments
   */
  addMeeting(newMeeting: Partial<Meeting>, autoCreateCommitment = true): Meeting {
    const id = `mtg-${Date.now()}`;
    const meeting: Meeting = {
      id,
      title: newMeeting.title || 'Untitled Operational Meeting',
      type: newMeeting.type || 'MAJOR',
      scheduledAt: newMeeting.scheduledAt || new Date().toISOString(),
      locationOrLink: newMeeting.locationOrLink || 'MD Office Boardroom',
      organizerUserId: newMeeting.organizerUserId || 'usr-mdo-002',
      organizerUserName: newMeeting.organizerUserName || 'Het Bhatt',
      status: 'SCHEDULED',
      agendaItems: newMeeting.agendaItems || ['Executive review and milestone alignment'],
      participants: newMeeting.participants || [],
      decisions: [],
      actionItemsCount: autoCreateCommitment ? 1 : 0,
    };

    if (autoCreateCommitment) {
      const decId = `dec-${Date.now()}`;
      const decision: Decision = {
        id: decId,
        code: `DEC-2026-${String(MOCK_DECISIONS.length + 1).padStart(3, '0')}`,
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        title: `Approved Action: ${meeting.title}`,
        context: 'Decision recorded during executive operational meeting.',
        decisionMakerUserId: meeting.organizerUserId,
        decisionMakerUserName: meeting.organizerUserName,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        approvedByUserName: meeting.organizerUserName,
        impactSummary: 'Executive decision committed for execution tracking.',
      };
      MOCK_DECISIONS.unshift(decision);
      meeting.decisions.push(decision);

      // Automated Meeting -> Decision Commitment generation
      executionStore.addCommitment({
        title: decision.title,
        description: decision.context,
        sourceType: 'MEETING_DECISION',
        sourceTitle: `${meeting.type} Meeting — ${meeting.title}`,
        responsibleId: 'usr-mgr-004',
        responsibleName: 'Ananya Patel',
        accountableId: 'usr-mdo-002',
        accountableName: 'Het Bhatt',
        priority: 'HIGH',
      });
    }

    MOCK_MEETINGS.unshift(meeting);
    notify();
    return meeting;
  },

  resetToZero() {
    MOCK_DECISIONS = [];
    MOCK_MEETINGS = [];
    notify();
  },
};
