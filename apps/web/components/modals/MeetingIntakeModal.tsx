'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ReviewablePlanCard } from '../intake/ReviewablePlanCard';
import { apiClient } from '../../lib/api/client';
import { Meeting } from '../../types/meeting';
import { ApprovePlanPayload, ReviewablePlan } from '../../types/workItem';
import { User } from '../../types/auth';

interface MeetingIntakeModalProps {
 isOpen: boolean;
 onClose: () => void;
 users?: User[];
 onWorkCreated?: () => void;
}

export const MeetingIntakeModal: React.FC<MeetingIntakeModalProps> = ({
 isOpen,
 onClose,
 users = [],
 onWorkCreated,
}) => {
 const [meetings, setMeetings] = useState<Meeting[]>([]);
 const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
 const [candidatePlan, setCandidatePlan] = useState<ReviewablePlan | null>(null);
 const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
 const [isExtracting, setIsExtracting] = useState(false);
 const [isApproving, setIsApproving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  if (isOpen) {
   loadMeetings();
  } else {
   setCandidatePlan(null);
   setSelectedMeetingId('');
   setError(null);
  }
 }, [isOpen]);

 const loadMeetings = async () => {
  setIsLoadingMeetings(true);
  setError(null);
  try {
   const res = await apiClient.meetings.list();
   setMeetings(res.items);
   if (res.items.length > 0) {
    setSelectedMeetingId(res.items[0].id);
   }
  } catch (err: unknown) {
   const msg = err instanceof Error ? err.message : 'Failed to load meetings.';
   setError(msg);
  } finally {
   setIsLoadingMeetings(false);
  }
 };

 const handleExtractWork = async () => {
  if (!selectedMeetingId) return;
  setIsExtracting(true);
  setError(null);
  try {
   const rec = await apiClient.meetings.extractWork(selectedMeetingId);
   setCandidatePlan(rec.plan);
  } catch (err: unknown) {
   const msg = err instanceof Error ? err.message : 'Failed to extract work from meeting.';
   setError(msg);
  } finally {
   setIsExtracting(false);
  }
 };

 const handleApprovePlan = async (payload: ApprovePlanPayload) => {
  setIsApproving(true);
  setError(null);
  try {
   await apiClient.workItems.approve({
    ...payload,
    origin_meeting_id: selectedMeetingId,
    source_type: 'meeting',
   });
   setCandidatePlan(null);
   onClose();
   if (onWorkCreated) onWorkCreated();
  } catch (err: unknown) {
   const msg = err instanceof Error ? err.message : 'Failed to approve meeting work plan.';
   setError(msg);
  } finally {
   setIsApproving(false);
  }
 };

 return (
  <Modal isOpen={isOpen} onClose={onClose} title="+ Add Work from Meeting">
   <div className="space-y-4">
    {!candidatePlan ? (
     <div className="space-y-4">
      <p className="text-xs text-slate-600 ">
       Select a meeting to extract decisions, action items, and executive notes into a reviewable work plan.
      </p>

      {isLoadingMeetings ? (
       <div className="p-4 text-center text-xs text-slate-500">Loading meetings...</div>
      ) : meetings.length === 0 ? (
       <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
        No meetings found. Schedule a meeting first using &quot;Schedule Meeting&quot;.
       </div>
      ) : (
       <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 ">
         Select Meeting
        </label>
        <select
         value={selectedMeetingId}
         onChange={(e) => setSelectedMeetingId(e.target.value)}
         className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-indigo-500"
        >
         {meetings.map((m) => (
          <option key={m.id} value={m.id}>
           {m.title} — {m.meeting_date} ({m.status.toUpperCase()})
          </option>
         ))}
        </select>
       </div>
      )}

      {error && (
       <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 ">
        {error}
       </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 ">
       <Button type="button" variant="outline" onClick={onClose}>
        Cancel
       </Button>
       <Button
        type="button"
        onClick={handleExtractWork}
        disabled={!selectedMeetingId || isExtracting}
        isLoading={isExtracting}
       >
        Extract Candidate Work Plan
       </Button>
      </div>
     </div>
    ) : (
     <ReviewablePlanCard
      initialPlan={candidatePlan}
      users={users}
      originMeetingId={selectedMeetingId}
      sourceType="meeting"
      onApprove={handleApprovePlan}
      onCancel={() => setCandidatePlan(null)}
      isLoading={isApproving}
     />
    )}
   </div>
  </Modal>
 );
};
