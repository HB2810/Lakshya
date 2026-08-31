import React, { useState, useMemo } from 'react';
import { Network, X, User, Briefcase, ArrowRightLeft, CheckCircle2, ShieldAlert, Lock } from 'lucide-react';
import { CanonicalOrgNode, OrgTreeResponse } from '../../types/organization';
import { apiClient } from '../../lib/api/client';
import { useAuth } from '../../lib/auth/AuthContext';

interface PositionDetailDrawerProps {
  node: CanonicalOrgNode | null;
  treeData: OrgTreeResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const PositionDetailDrawer: React.FC<PositionDetailDrawerProps> = ({
  node,
  treeData,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { user } = useAuth();
  const isMD = user?.role === 'MD' || user?.role === 'MANAGING_DIRECTOR' || user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [transferReason, setTransferReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flatten the tree to provide transfer destinations
  const allPositions = useMemo(() => {
    if (!treeData) return [];
    const flatten = (nodes: CanonicalOrgNode[]): CanonicalOrgNode[] => {
      let result: CanonicalOrgNode[] = [];
      nodes.forEach(n => {
        result.push(n);
        if (n.subordinates) {
          result = result.concat(flatten(n.subordinates));
        }
      });
      return result;
    };
    return flatten(treeData.root_nodes);
  }, [treeData]);

  if (!isOpen || !node) return null;

  const occupant = node.current_occupant;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occupant || !selectedDestination) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.organization.transfer({
        user_id: occupant.user_id,
        new_position_id: selectedDestination,
        transfer_reason: transferReason || 'Reassigned by leader',
      });
      
      setIsTransferring(false);
      setTransferReason('');
      setSelectedDestination('');
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-2 right-2 w-[400px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col border border-slate-200/60 overflow-hidden">
        
        <div className="shrink-0 p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">Position Details</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {node.department_name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Position Info */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Position</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{node.title}</p>
              {node.code && <p className="text-xs text-slate-500 mt-1">Code: {node.code}</p>}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">Current Occupant</span>
                </div>
                {!occupant && (
                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">VACANT</span>
                )}
              </div>
              {occupant ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">{occupant.full_name}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Assigned: {new Date(occupant.started_on || '').toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No person currently assigned to this position.</p>
              )}
            </div>
          </div>

          {/* Transfer Action - MD & Master Executive Authority Only */}
          {occupant && (
            <div className="border-t border-slate-100 pt-6">
              {isMD ? (
                !isTransferring ? (
                  <button
                    onClick={() => setIsTransferring(true)}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Transfer {occupant.full_name}
                  </button>
                ) : (
                  <form onSubmit={handleTransfer} className="space-y-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <ArrowRightLeft className="w-4 h-4" />
                      <h3 className="text-xs font-bold">Transfer Stavyan (MD Authority)</h3>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Destination Position
                      </label>
                      <select
                        value={selectedDestination}
                        onChange={e => setSelectedDestination(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="">-- Select Position --</option>
                        {allPositions
                          .filter(p => p.position_id !== node.position_id)
                          .map(p => (
                            <option key={p.position_id} value={p.position_id}>
                              {p.title} ({p.department_name}) {p.current_occupant ? '- Occupied' : '- Vacant'}
                            </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Reason for Transfer
                      </label>
                      <input
                        type="text"
                        value={transferReason}
                        onChange={e => setTransferReason(e.target.value)}
                        placeholder="e.g. Department Restructuring"
                        required
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsTransferring(false)}
                        className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !selectedDestination}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isSubmitting ? 'Transferring...' : 'Confirm'}
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Cross-department transfers require Managing Director (MD) authorization.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
