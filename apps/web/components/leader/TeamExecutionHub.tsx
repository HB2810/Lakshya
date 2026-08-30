'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  Search,
  Filter,
  BarChart3,
  RotateCcw,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { apiClient } from '../../lib/api/client';
import { WorkItem, TeamMemberProgressSummary } from '../../types/workItem';
import { STAVYA_STAFF_DATABASE, HospitalStaffMember } from '../../lib/data/stavyaHospitalOrgData';
import { Card } from '../ui/Card';
import { LeaderTaskDelegationModal } from './LeaderTaskDelegationModal';
import { TaskVerificationAuditDrawer } from './TaskVerificationAuditDrawer';
import { RealTimeTeamProgressGrid } from './RealTimeTeamProgressGrid';

export const TeamExecutionHub: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'radar' | 'verification_queue' | 'all_tasks'>('radar');
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Drawer states
  const [isDelegationOpen, setIsDelegationOpen] = useState(false);
  const [delegationTargetId, setDelegationTargetId] = useState<string | undefined>(undefined);
  const [selectedTaskForAudit, setSelectedTaskForAudit] = useState<WorkItem | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [inspectedEmployee, setInspectedEmployee] = useState<TeamMemberProgressSummary | null>(null);

  // Load Work Items
  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.workItems.list();
      setWorkItems(res.items || []);
    } catch (err) {
      console.error('Failed to load team work items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Determine User's Operational Authority Tier
  const role = user?.role || 'EMPLOYEE';
  const isGovernance = role === 'MD' || role === 'MANAGING_DIRECTOR' || role === 'MD_OFFICE' || role === 'MASTER' || role === 'ADMIN';
  const isLeader = role === 'LEADER' || role === 'LEADERS' || role === 'DIRECTOR_QUALITY';
  const isHOD = role === 'DEPARTMENT_HEAD' || role === 'MANAGER' || (user?.roleTitle && (user.roleTitle.toLowerCase().includes('incharge') || user.roleTitle.toLowerCase().includes('head')));

  let tierLabel = 'Tier 3: Incharge / HOD (Department Scope)';
  let tierBadge = 'bg-blue-600';
  if (isGovernance) {
    tierLabel = 'Tier 1: Hospital Executive Governance (MD / Board)';
    tierBadge = 'bg-slate-900';
  } else if (isLeader) {
    tierLabel = 'Tier 2: Division Operational Leadership';
    tierBadge = 'bg-indigo-600';
  }

  // Derive Reporting Subordinates for Current User
  const allStaff = Object.values(STAVYA_STAFF_DATABASE);

  let subordinateStaff: HospitalStaffMember[] = [];
  if (isGovernance) {
    // Governance sees all staff
    subordinateStaff = allStaff;
  } else if (isLeader) {
    // Leader sees their division + staff reporting to their division
    subordinateStaff = allStaff.filter(s => {
      const matchUnit = user?.departmentName && s.unit && s.unit.toLowerCase().includes(user.departmentName.toLowerCase());
      const matchReports = s.reports && user?.name && s.reports.toLowerCase().includes(user.name.toLowerCase());
      const matchManager = s.managerId && s.managerId === user?.id;
      return matchUnit || matchReports || matchManager;
    });
    if (subordinateStaff.length === 0) {
      subordinateStaff = allStaff.slice(0, 15); // Fallback to relevant cluster for demo
    }
  } else {
    // HOD / Incharge sees direct department members
    subordinateStaff = allStaff.filter(s => {
      const matchDept = user?.departmentName && s.unit && s.unit.toLowerCase() === user.departmentName.toLowerCase();
      const matchReports = s.reports && user?.name && s.reports.toLowerCase().includes(user.name.toLowerCase());
      return matchDept || matchReports || s.managerId === user?.id;
    });
    if (subordinateStaff.length === 0) {
      subordinateStaff = allStaff.filter(s => s.unit === (allStaff.find(a => a.id === user?.id)?.unit || 'Nursing'));
    }
  }

  // Build Team Member Summaries
  const teamSummaries: TeamMemberProgressSummary[] = subordinateStaff.map(staff => {
    const staffTasks = workItems.filter(
      w => w.owner_id === staff.id || (w.owner_name && w.owner_name.toLowerCase() === staff.name.toLowerCase())
    );

    const activeTasks = staffTasks.filter(w => w.status === 'in_progress' || w.status === 'todo');
    const inReviewTasks = staffTasks.filter(w => w.status === 'submitted_for_verification');
    const completedTasks = staffTasks.filter(w => w.status === 'completed' || w.status === 'verified');
    const blockedTasks = staffTasks.filter(w => w.status === 'blocked' || w.status === 'stuck');

    const avgProgress = staffTasks.length > 0
      ? Math.round(staffTasks.reduce((acc, curr) => acc + (curr.progressPercent || 0), 0) / staffTasks.length)
      : 0;

    return {
      employeeId: staff.id,
      employeeCode: staff.code ? `STAVYA-${staff.code.padStart(3, '0')}` : `STAVYA-${staff.id.replace('e', '').padStart(3, '0')}`,
      name: staff.name,
      designation: staff.desig || 'Hospital Staff Member',
      departmentName: staff.unit || staff.dept_master || 'General',
      reportingManagerName: staff.reports || 'Incharge',
      activeTasksCount: activeTasks.length,
      inReviewCount: inReviewTasks.length,
      completedCount: completedTasks.length,
      blockedCount: blockedTasks.length,
      averageProgressPercent: avgProgress,
      latestTaskTitle: staffTasks[0]?.title,
      latestTaskStatus: staffTasks[0]?.status,
      items: staffTasks,
    };
  });

  // Calculate Overall Leadership Metrics
  const totalSubordinatesCount = subordinateStaff.length;
  const allSubordinateTasks = workItems.filter(w =>
    subordinateStaff.some(s => s.id === w.owner_id || (w.owner_name && w.owner_name.toLowerCase() === s.name.toLowerCase()))
  );

  const totalActiveTasks = allSubordinateTasks.filter(w => w.status === 'in_progress' || w.status === 'todo').length;
  const totalInReviewTasks = allSubordinateTasks.filter(w => w.status === 'submitted_for_verification');
  const totalBlockedTasks = allSubordinateTasks.filter(w => w.status === 'blocked' || w.status === 'stuck').length;
  const totalVerifiedTasks = allSubordinateTasks.filter(w => w.status === 'verified' || w.status === 'completed').length;

  const teamProgressIndex = allSubordinateTasks.length > 0
    ? Math.round(allSubordinateTasks.reduce((acc, curr) => acc + (curr.progressPercent || 0), 0) / allSubordinateTasks.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. MASTER HEADER & TIER BADGE */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-0.5 ${tierBadge} text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-2xs`}>
              {tierLabel}
            </span>
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              {isGovernance ? 'All 214 Hospital Workforce' : `${totalSubordinatesCount} Reporting Subordinates in Scope`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Team Task Creation, Verification &amp; Audit Platform
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live team progress radar, task delegation with RACI contracts, and formal verification sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDelegationTargetId(undefined);
              setIsDelegationOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer active-press"
          >
            <Plus className="w-4 h-4" />
            <span>Delegate Work Item</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY KPI CAPSULES */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-4 bg-white border-slate-200 rounded-2xl space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team Strength</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{totalSubordinatesCount}</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Reporting personnel</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 rounded-2xl space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active in Flight</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-blue-600">{totalActiveTasks}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Ongoing execution</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 rounded-2xl space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Needs Verification</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-indigo-600">{totalInReviewTasks.length}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-indigo-700 font-bold">Awaiting your sign-off</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 rounded-2xl space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blockers Reported</span>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-black ${totalBlockedTasks > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {totalBlockedTasks}
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Requires leader action</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 rounded-2xl space-y-1 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress Index</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600">{teamProgressIndex}%</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-700 font-bold">{totalVerifiedTasks} items verified</p>
        </Card>
      </div>

      {/* 3. MAIN NAVIGATION TABS */}
      <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active-press ${
            activeTab === 'radar'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          Real-Time Team Progress Radar ({teamSummaries.length} Staff)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verification_queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active-press flex items-center gap-1.5 ${
            activeTab === 'verification_queue'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span>Verification &amp; Audit Queue</span>
          {totalInReviewTasks.length > 0 && (
            <span className="px-1.5 py-0.2 bg-white text-indigo-700 rounded-full text-[10px] font-black">
              {totalInReviewTasks.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all_tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active-press ${
            activeTab === 'all_tasks'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          All Delegated Team Tasks ({allSubordinateTasks.length})
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* A. REAL-TIME TEAM RADAR */}
      {activeTab === 'radar' && (
        <RealTimeTeamProgressGrid
          teamSummaries={teamSummaries}
          onSelectEmployee={(emp) => setInspectedEmployee(emp)}
          onDelegateToEmployee={(id) => {
            setDelegationTargetId(id);
            setIsDelegationOpen(true);
          }}
          onAuditTask={(item) => {
            setSelectedTaskForAudit(item);
            setIsAuditDrawerOpen(true);
          }}
        />
      )}

      {/* B. VERIFICATION & AUDIT QUEUE */}
      {activeTab === 'verification_queue' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-xs font-bold text-indigo-950">
                  Verification Sign-Off &amp; Compliance Audit Stream
                </h3>
                <p className="text-[11px] text-indigo-700">
                  Work items submitted by team members requiring Incharge / Leader inspection of evidence before completion sign-off.
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-indigo-900 bg-white px-3 py-1 rounded-xl border border-indigo-200 shadow-2xs">
              {totalInReviewTasks.length} Pending
            </span>
          </div>

          {totalInReviewTasks.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Verification Queue is Clean!</h3>
              <p className="text-xs text-slate-500">
                All submitted deliverables have been audited and verified.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {totalInReviewTasks.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 bg-white border border-indigo-200 rounded-2xl shadow-xs hover:border-indigo-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                        AWAITING AUDIT
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-50 text-slate-700 border border-slate-200">
                        {item.priority} Priority
                      </span>
                      <span className="text-[11px] text-slate-600 font-bold">
                        Assignee: <strong>{item.owner_name || 'Staff Member'}</strong>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>

                    {item.submission_notes && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                        Deliverable Note: <em>&ldquo;{item.submission_notes}&rdquo;</em>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTaskForAudit(item);
                        setIsAuditDrawerOpen(true);
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active-press"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Audit &amp; Verify</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* C. ALL DELEGATED TEAM TASKS */}
      {activeTab === 'all_tasks' && (
        <div className="space-y-3">
          {allSubordinateTasks.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Delegated Tasks Yet</h3>
              <p className="text-xs text-slate-500">
                Click &ldquo;Delegate Work Item&rdquo; above to assign tasks to your team members.
              </p>
            </div>
          ) : (
            allSubordinateTasks.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-50 text-slate-700 border border-slate-200">
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {item.priority}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Owner: <strong className="text-slate-800">{item.owner_name || 'Staff'}</strong>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  {item.status === 'blocked' && (
                    <div className="p-2 bg-red-50 text-red-800 text-[11px] rounded-lg font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>Blocker: {item.blocked_reason || 'Blocked'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Progress</span>
                    <p className="text-xs font-black text-slate-900">{item.progressPercent || 0}%</p>
                  </div>

                  {item.status === 'submitted_for_verification' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTaskForAudit(item);
                        setIsAuditDrawerOpen(true);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      Audit Sign-Off
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTaskForAudit(item);
                        setIsAuditDrawerOpen(true);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                    >
                      Inspect
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. INSPECTED EMPLOYEE DETAIL MODAL */}
      {inspectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                  {inspectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {inspectedEmployee.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {inspectedEmployee.designation} • {inspectedEmployee.departmentName} ({inspectedEmployee.employeeCode})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Active</span>
                <p className="text-lg font-black text-slate-900">{inspectedEmployee.activeTasksCount}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200/70">
                <span className="text-[10px] text-indigo-600 uppercase font-bold">Review</span>
                <p className="text-lg font-black text-indigo-700">{inspectedEmployee.inReviewCount}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/70">
                <span className="text-[10px] text-emerald-600 uppercase font-bold">Done</span>
                <p className="text-lg font-black text-emerald-700">{inspectedEmployee.completedCount}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Avg Progress</span>
                <p className="text-lg font-black text-blue-600">{inspectedEmployee.averageProgressPercent}%</p>
              </div>
            </div>

            {/* Employee's Task Queue */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Assigned Work Items ({inspectedEmployee.items.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setDelegationTargetId(inspectedEmployee.employeeId);
                    setInspectedEmployee(null);
                    setIsDelegationOpen(true);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign New Task</span>
                </button>
              </div>

              {inspectedEmployee.items.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No tasks assigned to this employee yet.</p>
              ) : (
                inspectedEmployee.items.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white text-slate-700 border border-slate-200">
                          {t.status.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-slate-900 truncate">{t.title}</span>
                      </div>
                      {t.submission_notes && (
                        <p className="text-[11px] text-slate-600 truncate">Note: {t.submission_notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-700">{t.progressPercent || 0}%</span>
                      {t.status === 'submitted_for_verification' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTaskForAudit(t);
                            setIsAuditDrawerOpen(true);
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px]"
                        >
                          Audit
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DELEGATION MODAL */}
      <LeaderTaskDelegationModal
        isOpen={isDelegationOpen}
        onClose={() => setIsDelegationOpen(false)}
        onTaskCreated={() => loadData()}
        defaultAssigneeId={delegationTargetId}
        allowedStaffList={subordinateStaff}
      />

      {/* 7. TASK VERIFICATION AUDIT DRAWER */}
      <TaskVerificationAuditDrawer
        workItem={selectedTaskForAudit}
        isOpen={isAuditDrawerOpen}
        onClose={() => {
          setIsAuditDrawerOpen(false);
          setSelectedTaskForAudit(null);
        }}
        onVerified={() => loadData()}
      />
    </div>
  );
};
