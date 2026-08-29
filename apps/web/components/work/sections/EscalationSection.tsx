import React, { useState } from 'react';
import { ShieldAlert, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { WorkItem, WorkItemEscalationRecord } from '../../../types/workItem';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthContext';

interface EscalationSectionProps {
  workItem: WorkItem;
  onUpdate: () => void;
}

export const EscalationSection: React.FC<EscalationSectionProps> = ({ workItem, onUpdate }) => {
  const { user } = useAuth();
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const escalation = workItem.escalation;
  
  if (!escalation) {
    return null; // Will show nothing if not escalated. The drawer handles creating an escalation via the "Blocker" flow.
  }

  // Is current user the one it was escalated to?
  const canResolve = user.id === escalation.escalated_to_id || ['MD', 'MD_OFFICE', 'LEADER'].includes(user.role);
  const isPending = escalation.status !== 'RESOLVED';

  const handleResolve = async () => {
    setIsLoading(true);
    try {
      // Backend expects a post to resolve the escalation
      await apiClient.workItems.escalations.resolve(escalation.id, {
        resolution_note: resolutionNote || 'Resolved by leader.',
      });
      setIsResolving(false);
      setResolutionNote('');
      onUpdate();
    } catch (err) {
      console.error('Failed to resolve escalation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`border rounded-xl p-4 space-y-3 shadow-xs ${isPending ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isPending ? 'text-red-800' : 'text-slate-700'}`}>
          <ShieldAlert className={`w-4 h-4 ${isPending ? 'text-red-600' : 'text-slate-500'}`} />
          Escalation Status: {escalation.status}
        </h3>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${isPending ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
          {escalation.level.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Escalation Reason</span>
          <p className="font-semibold text-slate-900 mt-0.5">{escalation.reason}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 border border-slate-100 rounded-lg">
           <div className="flex-1">
             <span className="text-[9px] text-slate-400 font-bold uppercase block">Escalated By</span>
             <span className="font-bold text-slate-800">{escalation.escalated_by_name}</span>
           </div>
           <ArrowUpRight className="w-4 h-4 text-slate-300" />
           <div className="flex-1 text-right">
             <span className="text-[9px] text-slate-400 font-bold uppercase block">Escalated To</span>
             <span className="font-bold text-slate-800">{escalation.escalated_to_name}</span>
           </div>
        </div>

        {escalation.status === 'RESOLVED' && escalation.resolution_note && (
          <div className="pt-2">
            <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Resolution Note
            </span>
            <p className="text-slate-700 mt-0.5">{escalation.resolution_note}</p>
          </div>
        )}
      </div>

      {isPending && canResolve && !isResolving && (
        <div className="pt-3 border-t border-red-200/50">
          <button 
            onClick={() => setIsResolving(true)}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Resolve Escalation
          </button>
        </div>
      )}

      {isResolving && (
        <div className="pt-3 border-t border-red-200/50 space-y-3 animate-in fade-in">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-600">Resolution Note</label>
            <textarea
              rows={2}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Budget approved, proceed with procurement."
              className="w-full px-3 py-2 text-xs bg-white border border-red-200 rounded-lg text-slate-900 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
             <button onClick={() => setIsResolving(false)} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
             <button onClick={handleResolve} disabled={isLoading} className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs">
               {isLoading ? 'Resolving...' : 'Confirm Resolution'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
