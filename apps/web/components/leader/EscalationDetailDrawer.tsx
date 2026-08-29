import React, { useState } from 'react';
import { ShieldAlert, X, MessageSquare, User, Calendar, CheckCircle2 } from 'lucide-react';
import { WorkItemEscalationRecord } from '../../types/workItem';
import { apiClient } from '../../lib/api/client';

interface EscalationDetailDrawerProps {
  escalation: WorkItemEscalationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

export const EscalationDetailDrawer: React.FC<EscalationDetailDrawerProps> = ({
  escalation,
  isOpen,
  onClose,
  onResolved,
}) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !escalation) return null;

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResolving(true);
    setError(null);
    try {
      await apiClient.workItems.escalations.resolve(escalation.id, {
        resolution_note: resolutionNote || 'Resolved by leader.',
      });
      setResolutionNote('');
      onResolved();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve escalation.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-0 w-full bg-white rounded-none shadow-2xl z-50 flex flex-col border border-slate-200/60 overflow-hidden transform transition-transform duration-300 sm:inset-y-2 sm:left-auto sm:right-2 sm:w-[400px] sm:rounded-3xl">
        
        {/* Header */}
        <div className="shrink-0 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">Review Escalation</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Level: {escalation.level}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Close escalation details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3 h-3" /> Escalated By
              </span>
              <p className="text-sm font-semibold text-slate-800">{escalation.escalated_by_name}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Date
              </span>
              <p className="text-sm font-mono text-slate-800">
                {new Date(escalation.created_at || new Date()).toLocaleString()}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Reason for Escalation
              </span>
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <p className="text-sm font-medium text-slate-800">{escalation.reason}</p>
              </div>
            </div>
          </div>

          {/* Resolution Form */}
          <div className="pt-4 border-t border-slate-100">
            <form onSubmit={handleResolve} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  Resolution Note (Required)
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
                  placeholder="Note the action taken or decision made..."
                  rows={3}
                  required
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isResolving || !resolutionNote.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isResolving ? 'Resolving...' : 'Resolve & Unblock Task'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
