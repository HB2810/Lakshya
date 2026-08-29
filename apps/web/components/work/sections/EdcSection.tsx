import React, { useState } from 'react';
import { FileCheck, CheckCircle2 } from 'lucide-react';
import { WorkItem } from '../../../types/workItem';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthContext';

interface EdcSectionProps {
  workItem: WorkItem;
  onUpdate: () => void;
}

export const EdcSection: React.FC<EdcSectionProps> = ({ workItem, onUpdate }) => {
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNote, setVerifyNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const edc = workItem.edc;
  if (!edc && workItem.status !== 'completed') {
    // If no EDC info and not completed, we might just not show this or show a minimal state
    return null;
  }

  // Is Authorized to verify (simplified check for LEADER / MD)
  const isAuthorized = ['MD', 'MD_OFFICE', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER'].includes(user.role);
  const canVerify = isAuthorized && workItem.status === 'completed'; // Assuming 'completed' means ready for sign-off or we can use a dedicated 'ready_for_review' state

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      await apiClient.workItems.verify(workItem.id, verifyNote || 'Verified successfully.');
      setIsVerifying(false);
      setVerifyNote('');
      onUpdate();
    } catch (err) {
      console.error('Failed to verify:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <FileCheck className="w-4 h-4 text-slate-500" />
          Execution / Definition of Done
        </h3>
      </div>

      {edc && (
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Expected Outcome</span>
            <p className="font-semibold text-slate-900 mt-0.5">{edc.expected_outcome || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Definition of Done</span>
            <p className="text-slate-700 mt-0.5">{edc.definition_of_done || 'Not specified'}</p>
          </div>
          {edc.evidence_required && (
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Evidence Required</span>
              <p className="text-slate-700 mt-0.5 font-mono bg-white border border-slate-100 p-1.5 rounded">{edc.evidence_required}</p>
            </div>
          )}
        </div>
      )}

      {canVerify && !isVerifying && (
        <div className="pt-3 border-t border-slate-200">
          <button 
            onClick={() => setIsVerifying(true)}
            className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verify & Sign-off
          </button>
        </div>
      )}

      {isVerifying && (
        <div className="pt-3 border-t border-slate-200 space-y-3 animate-in fade-in">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-600">Verification Note</label>
            <textarea
              rows={2}
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
              placeholder="e.g. Verified data matches Finance DB..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
             <button onClick={() => setIsVerifying(false)} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
             <button onClick={handleVerify} disabled={isLoading} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1">
               <CheckCircle2 className="w-3.5 h-3.5" />
               {isLoading ? 'Signing off...' : 'Confirm Sign-off'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
