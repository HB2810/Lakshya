import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, Eye, Edit2 } from 'lucide-react';
import { WorkItem, WorkItemRACI } from '../../../types/workItem';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthContext';
import { OrgNode } from '../../../types/organization';

interface RaciSectionProps {
  workItem: WorkItem;
  onUpdate: () => void;
}

export const RaciSection: React.FC<RaciSectionProps> = ({ workItem, onUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [raci, setRaci] = useState<WorkItemRACI>({
    accountable_id: workItem.raci?.accountable_id || '',
    accountable_name: workItem.raci?.accountable_name || '',
    responsible_id: workItem.raci?.responsible_id || workItem.owner_id || '',
    responsible_name: workItem.raci?.responsible_name || workItem.owner_name || '',
    consulted_ids: workItem.raci?.consulted_ids || [],
    consulted_names: workItem.raci?.consulted_names || [],
    informed_ids: workItem.raci?.informed_ids || [],
    informed_names: workItem.raci?.informed_names || [],
  });

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Authorization check: Is user Leader/MD? (This is a frontend heuristic, backend validates real)
  const isAuthorized = ['MD', 'MD_OFFICE', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER'].includes(user.role);

  useEffect(() => {
    if (isEditing) {
      // Fetch scoped users from tree or generic users
      apiClient.organization.treeScoped().then((treeData: any) => {
        if (treeData && treeData.root_nodes) {
           // Flatten tree
           const usersMap = new Map<string, any>();
           const traverse = (nodes: any[]) => {
             for (const node of nodes) {
               if (node.current_occupant || node.userName) {
                 const id = node.current_occupant?.user_id || node.userId;
                 const name = node.current_occupant?.full_name || node.userName;
                 if (id) usersMap.set(id, { id, name });
               }
               if (node.subordinates && node.subordinates.length > 0) {
                 traverse(node.subordinates);
               }
             }
           };
           traverse(treeData.root_nodes);
           setAvailableUsers(Array.from(usersMap.values()));
        } else {
           // Fallback
           apiClient.organization.getUsers().then(u => setAvailableUsers(u || []));
        }
      }).catch(() => {
         apiClient.organization.getUsers().then(u => setAvailableUsers(u || []));
      });
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiClient.workItems.patch(workItem.id, {
        raci: raci,
        update_note: 'Updated RACI Matrix.',
      });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to update RACI:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
          Edit RACI Matrix
        </h3>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Responsible (R)
            </label>
            <select
              value={raci.responsible_id || ''}
              onChange={(e) => {
                const selected = availableUsers.find(u => u.id === e.target.value);
                setRaci({ ...raci, responsible_id: e.target.value, responsible_name: selected?.name || '' });
              }}
              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:outline-none"
            >
              <option value="">Select Responsible</option>
              {availableUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name || u.full_name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Accountable (A)
            </label>
            <select
              value={raci.accountable_id || ''}
              onChange={(e) => {
                const selected = availableUsers.find(u => u.id === e.target.value);
                setRaci({ ...raci, accountable_id: e.target.value, accountable_name: selected?.name || '' });
              }}
              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:outline-none"
            >
              <option value="">Select Accountable</option>
              {availableUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name || u.full_name}</option>)}
            </select>
          </div>
          
          <div className="flex gap-2 pt-2 border-t border-slate-100">
             <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
             <button onClick={handleSave} disabled={isLoading} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs">
               {isLoading ? 'Saving...' : 'Save RACI'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-slate-500" />
          RACI Matrix
        </h3>
        {isAuthorized && (
          <button onClick={() => setIsEditing(true)} className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline">
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-slate-400" /> Responsible
          </span>
          <p className="font-semibold text-slate-900 mt-0.5">{raci.responsible_name || workItem.owner_name || 'Unassigned'}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
            <Shield className="w-3 h-3 text-purple-500" /> Accountable
          </span>
          <p className="font-semibold text-slate-900 mt-0.5">{raci.accountable_name || 'Unassigned'}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" /> Consulted
          </span>
          <p className="font-medium text-slate-700 mt-0.5">
            {raci.consulted_names && raci.consulted_names.length > 0 ? raci.consulted_names.join(', ') : 'None'}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
            <Eye className="w-3 h-3 text-slate-400" /> Informed
          </span>
          <p className="font-medium text-slate-700 mt-0.5">
            {raci.informed_names && raci.informed_names.length > 0 ? raci.informed_names.join(', ') : 'None'}
          </p>
        </div>
      </div>
    </div>
  );
};
