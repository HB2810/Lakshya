import { Meeting, MeetingDecision } from '../../types/meeting';

export let MOCK_DECISIONS: MeetingDecision[] = [];
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

  addMeeting(newMeeting: Partial<Meeting>, _autoCreateCommitment = true): Meeting {
    const id = `mtg-${Date.now()}`;
    const meeting: Meeting = {
      id,
      organization_id: 'org-stavya-001',
      title: newMeeting.title || 'Untitled Operational Meeting',
      meeting_date: newMeeting.meeting_date || new Date().toISOString().substring(0, 10),
      start_time: newMeeting.start_time || '10:00 AM',
      duration_minutes: newMeeting.duration_minutes || 60,
      location: newMeeting.location || 'MD Office Boardroom',
      status: 'scheduled',
      executive_notes: newMeeting.executive_notes || null,
      created_by: 'usr-mdo-002',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };

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
