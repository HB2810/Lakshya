import React, { useState, useMemo } from 'react';
import { Users, Shield, UserCheck, Eye, Edit2, Plus, X, Check, Search } from 'lucide-react';
import { WorkItem, WorkItemRACI } from '../../../types/workItem';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthContext';
import { STAVYA_STAFF_DATABASE } from '../../../lib/data/stavyaHospitalOrgData';

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

  const [isLoading, setIsLoading] = useState(false);
  const [searchConsulted, setSearchConsulted] = useState('');
  const [searchInformed, setSearchInformed] = useState('');

  const staffList = useMemo(() => Object.values(STAVYA_STAFF_DATABASE), []);

  const isAuthorized = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER', 'LEADERS', 'MASTER', 'ADMIN'].includes(user.role);

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

  const addConsulted = (staff: typeof staffList[0]) => {
    if (!raci.consulted_ids?.includes(staff.id)) {
      setRaci({
        ...raci,
        consulted_ids: [...(raci.consulted_ids || []), staff.id],
        consulted_names: [...(raci.consulted_names || []), staff.name],
      });
    }
    setSearchConsulted('');
  };

  const removeConsulted = (id: string) => {
    const idx = raci.consulted_ids?.indexOf(id) ?? -1;
    if (idx > -1) {
      const newIds = [...(raci.consulted_ids || [])];
      const newNames = [...(raci.consulted_names || [])];
      newIds.splice(idx, 1);
      newNames.splice(idx, 1);
      setRaci({ ...raci, consulted_ids: newIds, consulted_names: newNames });
    }
  };

  const addInformed = (staff: typeof staffList[0]) => {
    if (!raci.informed_ids?.includes(staff.id)) {
      setRaci({
        ...raci,
        informed_ids: [...(raci.informed_ids || []), staff.id],
        informed_names: [...(raci.informed_names || []), staff.name],
      });
    }
    setSearchInformed('');
  };

  const removeInformed = (id: string) => {
    const idx = raci.informed_ids?.indexOf(id) ?? -1;
    if (idx > -1) {
      const newIds = [...(raci.informed_ids || [])];
      const newNames = [...(raci.informed_names || [])];
      newIds.splice(idx, 1);
      newNames.splice(idx, 1);
      setRaci({ ...raci, informed_ids: newIds, informed_names: newNames });
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            Configure RACI Matrix
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Hospital Governance Standard</span>
        </div>

        <div className="space-y-4">
          {/* Responsible */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-700 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Responsible (R) — Executes Work
            </label>
            <select
              value={raci.responsible_id || ''}
              onChange={(e) => {
                const s = staffList.find((x) => x.id === e.target.value);
                setRaci({ ...raci, responsible_id: e.target.value, responsible_name: s?.name || '' });
              }}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Select Responsible Owner</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.desig} · {s.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Accountable */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-700 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-purple-600" /> Accountable (A) — Final Decision Maker
            </label>
            <select
              value={raci.accountable_id || ''}
              onChange={(e) => {
                const s = staffList.find((x) => x.id === e.target.value);
                setRaci({ ...raci, accountable_id: e.target.value, accountable_name: s?.name || '' });
              }}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="">Select Accountable Authority</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.desig} · {s.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Consulted */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-600" /> Consulted (C) — Two-way Advisory
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {raci.consulted_ids && raci.consulted_ids.length > 0 ? (
                raci.consulted_ids.map((id, i) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold"
                  >
                    {raci.consulted_names?.[i] || id}
                    <button
                      type="button"
                      onClick={() => removeConsulted(id)}
                      className="text-amber-700 hover:text-amber-950 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs italic">No consulted members assigned</span>
              )}
            </div>
            <select
              value=""
              onChange={(e) => {
                const s = staffList.find((x) => x.id === e.target.value);
                if (s) addConsulted(s);
              }}
              className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="">+ Add Consulted Member...</option>
              {staffList
                .filter((s) => !raci.consulted_ids?.includes(s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.unit})
                  </option>
                ))}
            </select>
          </div>

          {/* Informed */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-700 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-emerald-600" /> Informed (I) — Kept Up-to-Date
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {raci.informed_ids && raci.informed_ids.length > 0 ? (
                raci.informed_ids.map((id, i) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-semibold"
                  >
                    {raci.informed_names?.[i] || id}
                    <button
                      type="button"
                      onClick={() => removeInformed(id)}
                      className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs italic">No informed members assigned</span>
              )}
            </div>
            <select
              value=""
              onChange={(e) => {
                const s = staffList.find((x) => x.id === e.target.value);
                if (s) addInformed(s);
              }}
              className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="">+ Add Informed Member...</option>
              {staffList
                .filter((s) => !raci.informed_ids?.includes(s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.unit})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? 'Saving RACI...' : 'Save RACI Matrix'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
            R
          </span>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            RACI Governance Matrix
          </h3>
        </div>
        {isAuthorized && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Edit2 className="w-3 h-3" /> Edit RACI
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
          <span className="text-[10px] text-blue-700 font-black uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-blue-600" /> Responsible (R)
          </span>
          <p className="font-bold text-slate-900 truncate">
            {raci.responsible_name || workItem.owner_name || 'Unassigned'}
          </p>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
          <span className="text-[10px] text-purple-700 font-black uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-purple-600" /> Accountable (A)
          </span>
          <p className="font-bold text-slate-900 truncate">
            {raci.accountable_name || 'Unassigned'}
          </p>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
          <span className="text-[10px] text-amber-700 font-black uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3 text-amber-600" /> Consulted (C)
          </span>
          <p className="font-medium text-slate-700 truncate">
            {raci.consulted_names && raci.consulted_names.length > 0
              ? raci.consulted_names.join(', ')
              : 'None'}
          </p>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
          <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3 h-3 text-emerald-600" /> Informed (I)
          </span>
          <p className="font-medium text-slate-700 truncate">
            {raci.informed_names && raci.informed_names.length > 0
              ? raci.informed_names.join(', ')
              : 'None'}
          </p>
        </div>
      </div>
    </div>
  );
};
