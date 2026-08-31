'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MeetingDetail, DecisionPriority } from '../../types/meeting';
import { User } from '../../types/auth';
import { Button } from '../ui/Button';
import { apiClient } from '../../lib/api/client';

interface MeetingExecutionBoardProps {
 meetingId: string;
 users?: User[];
 onExtractWork: (meetingId: string) => void;
 onBack?: () => void;
}

export const MeetingExecutionBoard: React.FC<MeetingExecutionBoardProps> = ({
 meetingId,
 users = [],
 onExtractWork,
 onBack,
}) => {
 const [detail, setDetail] = useState<MeetingDetail | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 // New agenda form state
 const [newAgendaTitle, setNewAgendaTitle] = useState('');
 const [isAddingAgenda, setIsAddingAgenda] = useState(false);

 // New decision form state
 const [newDecisionTitle, setNewDecisionTitle] = useState('');
 const [newDecisionPriority, setNewDecisionPriority] = useState<DecisionPriority>('medium');
 const [newDecisionOwnerId, setNewDecisionOwnerId] = useState('');
 const [isLoggingDecision, setIsLoggingDecision] = useState(false);

 const loadDetail = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
   const res = await apiClient.meetings.getDetail(meetingId);
   setDetail(res);
  } catch (err: unknown) {
   const msg = err instanceof Error ? err.message : 'Failed to load meeting details.';
   setError(msg);
  } finally {
   setIsLoading(false);
  }
 }, [meetingId]);

 useEffect(() => {
  loadDetail();
 }, [loadDetail]);

 const handleAddAgenda = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newAgendaTitle.trim()) return;
  setIsAddingAgenda(true);
  try {
   await apiClient.meetings.addAgenda(meetingId, {
    title: newAgendaTitle.trim(),
    sort_order: (detail?.agenda.length || 0) + 1,
   });
   setNewAgendaTitle('');
   await loadDetail();
  } catch (err: unknown) {
   const msg = err instanceof Error ? err.message : 'Failed to add agenda item.';
   setError(msg);
  } finally {
   setIsAddingAgenda(false);
  }
 };

 const handleLogDecision = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newDecisionTitle.trim()) return;
  setIsLoggingDecision(true);
  try {
   await apiClient.meetings.logDecision(meetingId, {
    title: newDecisionTitle.trim(),
    priority: newDecisionPriority,
    suggested_owner_id: newDecisionOwnerId || null,
   });
   setNewDecisionTitle('');
   setNewDecisionOwnerId('');
   await loadDetail();
  } catch (err: unknown) {
   const msg = err instanceof Error ? err.message : 'Failed to log decision.';
   setError(msg);
  } finally {
   setIsLoggingDecision(false);
  }
 };

 if (isLoading) {
  return <div className="p-6 text-center text-xs text-slate-500 animate-pulse">Loading meeting board...</div>;
 }

 if (error || !detail) {
  return (
   <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 ">
    {error || 'Meeting not found.'}
    {onBack && (
     <div className="mt-3">
      <Button variant="outline" size="sm" onClick={onBack}>Back to Meetings</Button>
     </div>
    )}
   </div>
  );
 }

 const { meeting, agenda, decisions } = detail;

 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
     <div className="flex items-center gap-2 mb-1">
      {onBack && (
       <button onClick={onBack} className="text-xs text-indigo-600 hover:underline">
        ← Back
       </button>
      )}
      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 ">
       Live Meeting Execution Board
      </span>
     </div>
     <h2 className="text-xl font-extrabold text-slate-900 ">
      {meeting.title}
     </h2>
     <p className="text-xs text-slate-500 mt-0.5">
      Date: {meeting.meeting_date} ({meeting.start_time}) • Location: {meeting.location || 'N/A'} • Status: {meeting.status.toUpperCase()}
     </p>
    </div>

    <Button
     variant="primary"
     onClick={() => onExtractWork(meeting.id)}
    >
     + Extract Candidate Work Plan
    </Button>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Agenda Section */}
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
     <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 ">
      Agenda Items ({agenda.length})
     </h3>

     <form onSubmit={handleAddAgenda} className="flex gap-2">
      <input
       type="text"
       value={newAgendaTitle}
       onChange={(e) => setNewAgendaTitle(e.target.value)}
       placeholder="New agenda topic..."
       className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
      />
      <Button type="submit" size="sm" isLoading={isAddingAgenda} disabled={isAddingAgenda || !newAgendaTitle.trim()}>
       + Add
      </Button>
     </form>

     {agenda.length === 0 ? (
      <p className="text-xs italic text-slate-400 py-2">No agenda items added yet.</p>
     ) : (
      <div className="space-y-2">
       {agenda.map((item, idx) => (
        <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center justify-between">
         <span className="text-xs font-medium text-slate-900 ">
          {idx + 1}. {item.title}
         </span>
         <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-600 ">
          {item.status}
         </span>
        </div>
       ))}
      </div>
     )}
    </div>

    {/* Decisions Section */}
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
     <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 ">
      Logged Decisions ({decisions.length})
     </h3>

     <form onSubmit={handleLogDecision} className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 ">
      <input
       type="text"
       value={newDecisionTitle}
       onChange={(e) => setNewDecisionTitle(e.target.value)}
       placeholder="Decision title..."
       className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
       required
      />
      <div className="grid grid-cols-2 gap-2">
       <select
        value={newDecisionPriority}
        onChange={(e) => setNewDecisionPriority(e.target.value as DecisionPriority)}
        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 "
       >
        <option value="low">Low Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="high">High Priority</option>
        <option value="urgent">Urgent Priority</option>
       </select>
       <select
        value={newDecisionOwnerId}
        onChange={(e) => setNewDecisionOwnerId(e.target.value)}
        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 "
       >
        <option value="">-- Owner --</option>
        {users.map((u) => (
         <option key={u.id} value={u.id}>{u.name}</option>
        ))}
       </select>
      </div>
      <div className="flex justify-end">
       <Button type="submit" size="sm" isLoading={isLoggingDecision} disabled={isLoggingDecision || !newDecisionTitle.trim()}>
        Log Decision
       </Button>
      </div>
     </form>

     {decisions.length === 0 ? (
      <p className="text-xs italic text-slate-400 py-2">No decisions logged yet during this meeting.</p>
     ) : (
      <div className="space-y-2">
       {decisions.map((dec) => (
        <div key={dec.id} className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center justify-between">
         <div>
          <h5 className="text-xs font-bold text-slate-900 ">{dec.title}</h5>
          <p className="text-[10px] text-slate-500 ">
           Priority: {dec.priority.toUpperCase()} • Status: {dec.status.toUpperCase()}
          </p>
         </div>
        </div>
       ))}
      </div>
     )}
    </div>
   </div>
  </div>
 );
};
