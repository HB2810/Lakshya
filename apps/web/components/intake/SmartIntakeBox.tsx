'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { StructuredPlanRecommendation } from '../../types/workItem';

interface SmartIntakeBoxProps {
 onPlanGenerated: (plan: StructuredPlanRecommendation['plan']) => void;
 isLoading?: boolean;
}

export const SmartIntakeBox: React.FC<SmartIntakeBoxProps> = ({
 onPlanGenerated,
 isLoading = false,
}) => {
 const [text, setText] = useState('');
 const [error, setError] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (text.trim().length < 3 || isLoading) return;

  setError(null);
  try {
   const { apiClient } = await import('../../lib/api/client');
   const recommendation = await apiClient.workItems.intake(text.trim());
   onPlanGenerated(recommendation.plan);
  } catch (err: unknown) {
   const message = err instanceof Error ? err.message : 'Failed to structure work item. Please try again.';
   setError(message);
  }
 };

 const isSubmitDisabled = text.trim().length < 3 || isLoading;

 return (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
   <div className="flex items-center justify-between mb-3">
    <div>
     <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
      <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
      Smart Work Intake
     </h2>
     <p className="text-xs text-slate-500 mt-0.5">
      Type or paste an instruction, request, or meeting decision to turn it into structured work.
     </p>
    </div>
   </div>

   <form onSubmit={handleSubmit} className="space-y-3">
    <div className="relative">
     <textarea
      value={text}
      onChange={(e) => {
       setText(e.target.value);
       if (error) setError(null);
      }}
      placeholder={`Example:\nPrepare the monthly OT review for Friday.\n- Collect OPD data from operations\n- Collect revenue data from finance\n- Prepare final presentation`}
      rows={4}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 :text-slate-500 focus:border-indigo-500 focus:bg-white :bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
      disabled={isLoading}
     />
    </div>

    {error && (
     <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 ">
      {error}
     </div>
    )}

    <div className="flex items-center justify-between pt-1">
     <span className="text-xs text-slate-400 ">
      {text.length > 0 ? `${text.length} characters` : 'AI parses title, subtasks & deadlines automatically'}
     </span>
     <Button
      type="submit"
      disabled={isSubmitDisabled}
      isLoading={isLoading}
      variant="primary"
     >
      {isLoading ? 'Structuring Work...' : 'Structure Work'}
     </Button>
    </div>
   </form>
  </div>
 );
};
