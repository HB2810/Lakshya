'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Plus,
  ArrowRight,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { WorkItem, TeamMemberProgressSummary } from '../../types/workItem';
import { Card } from '../ui/Card';

interface RealTimeTeamProgressGridProps {
  teamSummaries: TeamMemberProgressSummary[];
  onSelectEmployee: (employee: TeamMemberProgressSummary) => void;
  onDelegateToEmployee: (employeeId: string) => void;
  onAuditTask: (workItem: WorkItem) => void;
}

export const RealTimeTeamProgressGrid: React.FC<RealTimeTeamProgressGridProps> = ({
  teamSummaries,
  onSelectEmployee,
  onDelegateToEmployee,
  onAuditTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN_REVIEW' | 'BLOCKED' | 'ACTIVE'>('ALL');

  const filteredTeam = teamSummaries.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.departmentName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'IN_REVIEW') return member.inReviewCount > 0;
    if (filterType === 'BLOCKED') return member.blockedCount > 0;
    if (filterType === 'ACTIVE') return member.activeTasksCount > 0;

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reporting team members by name, code, designation, or unit..."
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `All Team (${teamSummaries.length})` },
            {
              id: 'IN_REVIEW',
              label: `Needs Verification (${teamSummaries.filter((t) => t.inReviewCount > 0).length})`,
            },
            {
              id: 'BLOCKED',
              label: `Blocked (${teamSummaries.filter((t) => t.blockedCount > 0).length})`,
            },
            {
              id: 'ACTIVE',
              label: `In Flight (${teamSummaries.filter((t) => t.activeTasksCount > 0).length})`,
            },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Team Members */}
      {filteredTeam.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Reporting Team Members Found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? 'No team members match your search criteria.'
              : 'No reporting subordinates currently assigned under this scope.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeam.map((member) => {
            const hasReviewPending = member.inReviewCount > 0;
            const hasBlockers = member.blockedCount > 0;

            return (
              <Card
                key={member.employeeId}
                className="p-5 bg-white border-slate-200/90 rounded-3xl shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 hover-lift-light group"
              >
                {/* Employee Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {member.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {member.designation}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                      {member.employeeCode}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="truncate max-w-[180px]">
                      Unit: <strong className="text-slate-700">{member.departmentName}</strong>
                    </span>
                    {hasReviewPending && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                        {member.inReviewCount} To Verify
                      </span>
                    )}
                    {hasBlockers && !hasReviewPending && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
                        {member.blockedCount} Blocked
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar & KPI metrics */}
                <div className="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Execution Progress
                    </span>
                    <span className="font-black text-slate-900">
                      {member.averageProgressPercent}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        hasBlockers
                          ? 'bg-red-500'
                          : hasReviewPending
                          ? 'bg-indigo-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${member.averageProgressPercent}%` }}
                    />
                  </div>

                  {/* Micro KPI Row */}
                  <div className="grid grid-cols-3 gap-1 pt-1 text-center text-[10px]">
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 block font-bold">Active</span>
                      <span className="font-black text-slate-800 text-xs">
                        {member.activeTasksCount}
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 block font-bold">Review</span>
                      <span className="font-black text-indigo-700 text-xs">
                        {member.inReviewCount}
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 block font-bold">Done</span>
                      <span className="font-black text-emerald-700 text-xs">
                        {member.completedCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onDelegateToEmployee(member.employeeId)}
                    className="flex-1 py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer active-press"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Delegate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectEmployee(member)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer active-press"
                  >
                    <span>View Work</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
