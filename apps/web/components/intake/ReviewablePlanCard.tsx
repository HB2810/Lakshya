'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import {
 ApprovePlanPayload,
 ReviewablePlan,
 ReviewablePlanItem,
 WorkItemPriority,
} from '../../types/workItem';
import { User } from '../../types/auth';

interface ReviewablePlanCardProps {
 initialPlan: ReviewablePlan;
 users?: User[];
 originMeetingId?: string;
 sourceType?: string;
 onApprove: (approvedPlan: ApprovePlanPayload) => Promise<void>;
 onCancel: () => void;
 isLoading?: boolean;
}

export const ReviewablePlanCard: React.FC<ReviewablePlanCardProps> = ({
 initialPlan,
 users = [],
 originMeetingId,
 sourceType,
 onApprove,
 onCancel,
 isLoading = false,
}) => {
 const [mainTitle, setMainTitle] = useState(initialPlan.title);
 const [mainDescription, setMainDescription] = useState(initialPlan.description || '');
 const [mainPriority, setMainPriority] = useState<WorkItemPriority>(initialPlan.priority);
 const [mainOwnerId, setMainOwnerId] = useState<string>(initialPlan.suggested_owner_id || '');
 const [mainDueDate, setMainDueDate] = useState<string>(
  initialPlan.due_at ? initialPlan.due_at.substring(0, 10) : ''
 );

 const [items, setItems] = useState<ReviewablePlanItem[]>(initialPlan.items || []);
 const [error, setError] = useState<string | null>(null);

 const handleSubtaskChange = (
  clientId: string,
  field: keyof ReviewablePlanItem,
  value: string
 ) => {
  setItems((prev) =>
   prev.map((item) =>
    item.client_id === clientId ? { ...item, [field]: value } : item
   )
  );
 };

 const handleRemoveSubtask = (clientId: string) => {
  setItems((prev) => prev.filter((item) => item.client_id !== clientId));
 };

 const handleAddSubtask = () => {
  const newItem: ReviewablePlanItem = {
   client_id: `item-new-${Date.now()}`,
   title: '',
   priority: 'medium',
   suggested_owner_id: mainOwnerId || null,
   due_at: mainDueDate || null,
  };
  setItems((prev) => [...prev, newItem]);
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!mainTitle.trim()) {
   setError('Main task title cannot be empty.');
   return;
  }

  const validItems = items
   .filter((item) => item.title.trim().length > 0)
   .map((item) => ({
    ...item,
    title: item.title.trim(),
    suggested_owner_id: item.suggested_owner_id || null,
    due_at: item.due_at ? new Date(item.due_at).toISOString() : null,
   }));

  const payload: ApprovePlanPayload = {
   title: mainTitle.trim(),
   description: mainDescription.trim() || null,
   priority: mainPriority,
   owner_id: mainOwnerId || null,
   due_at: mainDueDate ? new Date(mainDueDate).toISOString() : null,
   origin_meeting_id: originMeetingId || null,
   source_type: sourceType || (originMeetingId ? 'meeting' : 'intake'),
   items: validItems,
  };

  setError(null);
  try {
   await onApprove(payload);
  } catch (err: unknown) {
   const message = err instanceof Error ? err.message : 'Failed to approve plan.';
   setError(message);
  }
 };

 return (
  <div className="bg-white border-2 border-indigo-500/30 rounded-xl p-5 shadow-lg space-y-4">
   {/* Header Banner */}
   <div className="flex items-center justify-between border-b border-slate-100 pb-3">
    <div className="flex items-center gap-2">
     <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
     <h3 className="text-sm font-bold tracking-wide uppercase text-indigo-600 ">
      Review Before Creating
     </h3>
    </div>
    <span className="text-xs text-slate-500 ">
     Verify or adjust title, owners, and due dates below.
    </span>
   </div>

   <form onSubmit={handleSubmit} className="space-y-4">
    {/* Main Task Card */}
    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 ">
     <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
       Main Task Title *
      </label>
      <input
       type="text"
       value={mainTitle}
       onChange={(e) => setMainTitle(e.target.value)}
       className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
       placeholder="Main task title..."
       required
      />
     </div>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
       <label className="block text-xs font-medium text-slate-600 mb-1">
        Priority
       </label>
       <select
        value={mainPriority}
        onChange={(e) => setMainPriority(e.target.value as WorkItemPriority)}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
       >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
       </select>
      </div>

      <div>
       <label className="block text-xs font-medium text-slate-600 mb-1">
        Owner
       </label>
       <select
        value={mainOwnerId}
        onChange={(e) => setMainOwnerId(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
       >
        <option value="">-- Select Owner --</option>
        {users.map((u) => (
         <option key={u.id} value={u.id}>
          {u.name} ({u.roleTitle})
         </option>
        ))}
       </select>
      </div>

      <div>
       <label className="block text-xs font-medium text-slate-600 mb-1">
        Due Date
       </label>
       <input
        type="date"
        value={mainDueDate}
        onChange={(e) => setMainDueDate(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
       />
      </div>
     </div>
    </div>

    {/* Subtasks Section */}
    <div className="space-y-3">
     <div className="flex items-center justify-between">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 ">
       Subtasks ({items.length})
      </h4>
      <Button
       type="button"
       variant="outline"
       size="sm"
       onClick={handleAddSubtask}
      >
       + Add Subtask
      </Button>
     </div>

     {items.length === 0 ? (
      <p className="text-xs italic text-slate-400 py-2">
       No subtasks generated. Click &quot;+ Add Subtask&quot; to add subtasks manually.
      </p>
     ) : (
      <div className="space-y-2">
       {items.map((item, index) => (
        <div
         key={item.client_id}
         className="flex flex-col md:flex-row md:items-center gap-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 "
        >
         <span className="text-xs font-semibold text-slate-400 w-5">
          {index + 1}.
         </span>
         <input
          type="text"
          value={item.title}
          onChange={(e) =>
           handleSubtaskChange(item.client_id, 'title', e.target.value)
          }
          placeholder="Subtask title..."
          className="flex-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
         />
         <select
          value={item.priority}
          onChange={(e) =>
           handleSubtaskChange(
            item.client_id,
            'priority',
            e.target.value as WorkItemPriority
           )
          }
          className="w-28 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
         >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
         </select>
         <select
          value={item.suggested_owner_id || ''}
          onChange={(e) =>
           handleSubtaskChange(
            item.client_id,
            'suggested_owner_id',
            e.target.value
           )
          }
          className="w-36 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
         >
          <option value="">Owner</option>
          {users.map((u) => (
           <option key={u.id} value={u.id}>
            {u.name}
           </option>
          ))}
         </select>
         <button
          type="button"
          onClick={() => handleRemoveSubtask(item.client_id)}
          className="text-xs text-red-500 hover:text-red-700 :text-red-400 p-1"
          title="Remove subtask"
         >
          ✕
         </button>
        </div>
       ))}
      </div>
     )}
    </div>

    {error && (
     <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 ">
      {error}
     </div>
    )}

    {/* Action Buttons */}
    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 ">
     <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={isLoading}
     >
      Cancel / Start Over
     </Button>
     <Button
      type="submit"
      variant="primary"
      isLoading={isLoading}
      disabled={isLoading}
     >
      Approve & Create
     </Button>
    </div>
   </form>
  </div>
 );
};
