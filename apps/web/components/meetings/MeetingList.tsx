'use client';

import React from 'react';
import { Meeting } from '../../types/meeting';
import { Button } from '../ui/Button';

interface MeetingListProps {
 meetings: Meeting[];
 isLoading?: boolean;
 onExtractWork: (meeting: Meeting) => void;
 onSelectMeeting?: (meeting: Meeting) => void;
 onScheduleClick?: () => void;
}

export const MeetingList: React.FC<MeetingListProps> = ({
 meetings,
 isLoading = false,
 onExtractWork,
 onSelectMeeting,
 onScheduleClick,
}) => {
 if (isLoading) {
  return (
   <div className="p-6 text-center text-xs text-slate-500 animate-pulse">
    Loading meetings data...
   </div>
  );
 }

 if (meetings.length === 0) {
  return (
   <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
    <p className="text-xs text-slate-500 ">
     No operational meetings recorded. Schedule a meeting to begin tracking executive decisions and work.
    </p>
    {onScheduleClick && (
     <Button variant="outline" size="sm" onClick={onScheduleClick}>
      + Schedule Meeting
     </Button>
    )}
   </div>
  );
 }

 return (
  <div className="space-y-3">
   {meetings.map((meeting) => (
    <div
     key={meeting.id}
     className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200"
    >
     <div className="space-y-1">
      <div className="flex items-center gap-2">
       <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
         meeting.status === 'scheduled'
          ? 'bg-blue-50 text-blue-700 '
          : meeting.status === 'in_progress'
          ? 'bg-amber-50 text-amber-700 '
          : meeting.status === 'completed'
          ? 'bg-emerald-50 text-emerald-700 '
          : 'bg-slate-100 text-slate-600 '
        }`}
       >
        {meeting.status.replace('_', ' ')}
       </span>
       <span className="text-xs font-semibold text-slate-500 ">
        {meeting.meeting_date} ({meeting.start_time})
       </span>
      </div>
      <h4 className="text-sm font-bold text-slate-900 ">
       {meeting.title}
      </h4>
      {meeting.location && (
       <p className="text-xs text-slate-500 ">
        Location: {meeting.location} • Duration: {meeting.duration_minutes}m
       </p>
      )}
     </div>

     <div className="flex items-center gap-2 pt-2 md:pt-0">
      {onSelectMeeting && (
       <Button
        variant="outline"
        size="sm"
        onClick={() => onSelectMeeting(meeting)}
       >
        Board / Details
       </Button>
      )}
      <Button
       variant="primary"
       size="sm"
       onClick={() => onExtractWork(meeting)}
      >
       + Extract Work Items
      </Button>
     </div>
    </div>
   ))}
  </div>
 );
};
