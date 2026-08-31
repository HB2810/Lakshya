'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Shield,
  Briefcase,
  ArrowUpRight,
  Plus,
  Crown,
  Activity,
  Flame,
} from 'lucide-react';
import { STAVYA_STAFF_DATABASE, STAVYA_ORG_STRUCTURE, HospitalStaffMember } from '../../lib/data/stavyaHospitalOrgData';
import { WorkItem } from '../../types/workItem';

interface ExecutiveStaffTrackerProps {
  workItems: WorkItem[];
  onSelectStaff: (staff: HospitalStaffMember) => void;
  onAssignWork: (staffId: string, staffName: string) => void;
}

export const ExecutiveStaffTracker: React.FC<ExecutiveStaffTrackerProps> = ({
  workItems = [],
  onSelectStaff,
  onAssignWork,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE_WORK' | 'BLOCKED' | 'LEADERS' | 'PROBATION'>('ALL');

  const staffList = useMemo(() => Object.values(STAVYA_STAFF_DATABASE), []);

  // Compute tasks per staff
  const staffTasksMap = useMemo(() => {
    const map: Record<string, WorkItem[]> = {};
    workItems.forEach((w) => {
      const ownerId = w.owner_id || '';
      const ownerName = (w.owner_name || '').toLowerCase();
      staffList.forEach((s) => {
        if (s.id === ownerId || s.name.toLowerCase() === ownerName || s.email.toLowerCase() === w.owner_id?.toLowerCase()) {
          if (!map[s.id]) map[s.id] = [];
          map[s.id].push(w);
        }
      });
    });
    return map;
  }, [workItems, staffList]);

  // Unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    staffList.forEach((s) => {
      if (s.unit) depts.add(s.unit);
    });
    return Array.from(depts).sort();
  }, [staffList]);

  // Leaders list
  const leaderNames = useMemo(() => {
    return new Set(Object.values(STAVYA_ORG_STRUCTURE.heads).map((n) => n.toLowerCase()));
  }, []);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          s.name.toLowerCase().includes(q) ||
          s.desig.toLowerCase().includes(q) ||
          s.unit.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.reports && s.reports.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Department
      if (selectedDept !== 'ALL' && s.unit.toLowerCase() !== selectedDept.toLowerCase()) {
        return false;
      }

      // Status
      const tasks = staffTasksMap[s.id] || [];
      if (statusFilter === 'ACTIVE_WORK') {
        return tasks.some((t) => t.status !== 'completed');
      }
      if (statusFilter === 'BLOCKED') {
        return tasks.some((t) => t.status === 'blocked' || t.status === 'stuck');
      }
      if (statusFilter === 'LEADERS') {
        return leaderNames.has(s.name.toLowerCase());
      }
      if (statusFilter === 'PROBATION') {
        return s.emp === 'Probation';
      }

      return true;
    });
  }, [staffList, search, selectedDept, statusFilter, staffTasksMap, leaderNames]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase rounded-full tracking-wider">
              EXECUTIVE COMMAND
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Hospital-Wide Staff &amp; Leadership Tracking</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
            Personnel Execution &amp; Workload Command
          </h3>
          <p className="text-xs text-slate-500">
            Real-time tracking of all 211 hospital stavyans, department heads, active commitments, and blockers.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-xs font-black text-slate-900">{filteredStaff.length}</span>
            <span className="text-[10px] text-slate-500 font-bold block">Personnel Filtered</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Staff' },
            { id: 'LEADERS', label: 'Department Heads' },
            { id: 'ACTIVE_WORK', label: 'With Active Tasks' },
            { id: 'BLOCKED', label: 'Blocked / At Risk' },
            { id: 'PROBATION', label: 'Probation' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Department Select */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search personnel..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredStaff.map((staff) => {
          const tasks = staffTasksMap[staff.id] || [];
          const activeTasks = tasks.filter((t) => t.status !== 'completed');
          const blockedTasks = tasks.filter((t) => t.status === 'blocked' || t.status === 'stuck');
          const isLeader = leaderNames.has(staff.name.toLowerCase());

          return (
            <div
              key={staff.id}
              onClick={() => onSelectStaff(staff)}
              className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-slate-900 truncate">{staff.name}</h4>
                      {isLeader && (
                        <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black rounded uppercase">
                          Head
                        </span>
                      )}
                      {staff.code && (
                        <span className="text-[9px] font-mono text-slate-500">#{staff.code}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{staff.desig}</p>
                  </div>

                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded-md shrink-0">
                    {staff.unit}
                  </span>
                </div>

                {staff.reports && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    Reports to: <strong className="text-slate-600 font-semibold">{staff.reports}</strong>
                  </p>
                )}
              </div>

              {/* Workload Status */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {blockedTasks.length > 0 ? (
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      {blockedTasks.length} Blocked
                    </span>
                  ) : activeTasks.length > 0 ? (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      {activeTasks.length} Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Available
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignWork(staff.id, staff.name);
                  }}
                  className="px-2 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-0.5 border border-slate-200/60 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Assign
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
