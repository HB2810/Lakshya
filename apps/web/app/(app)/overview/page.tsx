'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Flame,
  Link2,
} from 'lucide-react';
import Link from 'next/link';
import { WorkItem, WorkItemPriority } from '../../../types/workItem';
import { QuarterlyPriority } from '../../../types/strategy';
import { apiClient } from '../../../lib/api/client';
import { strategyStore } from '../../../lib/mocks/strategyMock';
import { TaskDetailDrawer } from '../../../components/work/TaskDetailDrawer';
import { ZomatoDeliveryStepper } from '../../../components/strategy/ZomatoDeliveryStepper';
import { SmartIntakeBox } from '../../../components/intake/SmartIntakeBox';
import { AttentionRequiredCard } from '../../../components/leader/AttentionRequiredCard';
import { TeamWorkloadGrid } from '../../../components/leader/TeamWorkloadGrid';
import { DepartmentWorkloadGrid } from '../../../components/leader/DepartmentWorkloadGrid';
import { ScopedOrgTree } from '../../../components/leader/ScopedOrgTree';
import { EscalationDetailDrawer } from '../../../components/leader/EscalationDetailDrawer';
import { PositionDetailDrawer } from '../../../components/leader/PositionDetailDrawer';
import { CanonicalOrgNode, OrgTreeResponse } from '../../../types/organization';
import { WorkItemEscalationRecord } from '../../../types/workItem';
import { DynamicHospitalOrgChart } from '../../../components/organization/DynamicHospitalOrgChart';
import { ExecutiveStaffTracker } from '../../../components/leader/ExecutiveStaffTracker';

export default function OverviewPage() {
  const { user } = useAuth();
  const now = new Date();

  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activePriority, setActivePriority] = useState<QuarterlyPriority | null>(null);

  const [escalations, setEscalations] = useState<WorkItemEscalationRecord[]>([]);
  const [selectedEscalation, setSelectedEscalation] = useState<WorkItemEscalationRecord | null>(null);
  const [isEscalationDrawerOpen, setIsEscalationDrawerOpen] = useState(false);
  const [orgTree, setOrgTree] = useState<OrgTreeResponse | null>(null);
  const [selectedOrgNode, setSelectedOrgNode] = useState<CanonicalOrgNode | null>(null);
  const [isOrgNodeDrawerOpen, setIsOrgNodeDrawerOpen] = useState(false);

  // Data Fetching State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Self-Task Intake Form
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<WorkItemPriority>('medium');
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  // Leader & MD Specific State
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const isLeader = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER', 'LEADERS', 'MASTER', 'ADMIN'].includes(user.role);
  const isMD = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'MASTER', 'ADMIN'].includes(user.role);

  const refreshTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters = isMD ? {} : { owner_id: user.id || 'usr-stav-101' };
      const response = await apiClient.workItems.list(filters);
      setWorkItems(response.items || []);
      const priorities = strategyStore.getQuarterlyPriorities();
      if (priorities.length > 0) {
        setActivePriority(priorities[0]);
      } else {
        setActivePriority(null);
      }
      if (selectedTask) {
        const updated = (response.items || []).find((item) => item.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
      }
      
      if (isLeader) {
        // Fetch Escalations inbox
        try {
          const escInbox = await apiClient.workItems.escalations.inbox();
          setEscalations(escInbox || []);
        } catch (e) {
          console.warn('Could not load escalations inbox:', e);
        }

        // Fetch Org Tree Scope
        try {
          const treeData = isMD 
            ? await apiClient.organization.tree() 
            : await apiClient.organization.treeScoped();
            
          if (treeData) {
            setOrgTree(treeData);
            
            // Flatten tree into teamMembers for workload grid
            const members: any[] = [];
            if (treeData.root_nodes) {
              treeData.root_nodes.forEach((node: any) => {
                if (node.subordinates && node.subordinates.length > 0) {
                  members.push(...node.subordinates);
                } else {
                  members.push(node);
                }
              });
            }
            setTeamMembers(members);
          }
        } catch (e) {
          console.warn('Could not load org tree:', e);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user.id, selectedTask, isLeader, isMD]);

  useEffect(() => {
    refreshTasks();
    const unsubStrat = strategyStore.subscribe(refreshTasks);
    return () => {
      unsubStrat();
    };
  }, [refreshTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await apiClient.workItems.approve({
        items: [{
          client_id: `plan-${Date.now()}`,
          title: newTitle.trim(),
          priority: newPriority,
        }],
        title: 'Self-Scheduled Work Item',
        priority: newPriority,
        owner_id: user.id || 'usr-stav-101',
      });
      setNewTitle('');
      setShowAddSuccess(true);
      setTimeout(() => setShowAddSuccess(false), 2500);
      refreshTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const openTaskDetail = (item: WorkItem) => {
    setSelectedTask(item);
    setIsDrawerOpen(true);
  };

  const openEscalationDetail = (esc: WorkItemEscalationRecord) => {
    setSelectedEscalation(esc);
    setIsEscalationDrawerOpen(true);
  };

  const openOrgNodeDetail = (node: CanonicalOrgNode) => {
    setSelectedOrgNode(node);
    setIsOrgNodeDrawerOpen(true);
  };

  // Categorize work items for "My Day"
  const pendingTasks = workItems.filter(w => w.status !== 'completed');
  const highOrUrgentTasks = pendingTasks.filter(w => w.priority === 'urgent' || w.priority === 'high');
  const blockedTasks = pendingTasks.filter(w => w.status === 'blocked' || w.status === 'stuck');
  const dueTodayTasks = pendingTasks.filter(w => {
    if (!w.due_at) return true;
    const dateStr = w.due_at.substring(0, 10);
    const todayStr = '2026-08-28';
    return dateStr === todayStr;
  });
  const overdueTasks = pendingTasks.filter(w => {
    if (!w.due_at) return false;
    const dateStr = w.due_at.substring(0, 10);
    return dateStr < '2026-08-28';
  });
  const upcomingTasks = pendingTasks.filter(w => {
    if (!w.due_at) return false;
    const dateStr = w.due_at.substring(0, 10);
    return dateStr > '2026-08-28';
  });

  // Primary Next Action
  const primaryNextAction =
    workItems.find(w => w.status === 'in_progress') ||
    workItems.find(w => w.status === 'todo' && (w.priority === 'urgent' || w.priority === 'high')) ||
    workItems.find(w => w.status === 'todo') ||
    null;

  const getPriorityBadge = (priority: WorkItemPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'low':
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
        <p className="text-sm font-semibold">Loading your workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center">
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-2xl p-6 inline-block">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="text-base font-bold">Failed to load data</h3>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => refreshTasks()}
            className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-2xs">
              MY DAY
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              • {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Good morning, {user.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {highOrUrgentTasks.length > 0 && (
              <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                {highOrUrgentTasks.length} high priority
              </span>
            )}
            {dueTodayTasks.length > 0 && (
              <span className="text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {dueTodayTasks.length} due today
              </span>
            )}
            {blockedTasks.length > 0 && (
              <span className="text-xs font-semibold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                {blockedTasks.length} blocked
              </span>
            )}
            {pendingTasks.length === 0 && (
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                ✓ All caught up!
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/execution"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <CheckSquare className="w-4 h-4" />
            <span>My Work Board</span>
          </Link>
          <Link
            href="/rca"
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4 text-brand-blue" />
            <span>Quality &amp; RCA</span>
          </Link>
          <Link
            href="/strategy"
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Quarterly Priorities</span>
          </Link>
        </div>
      </div>

      {/* STRATEGIC 10-MILESTONE DELIVERY TRACKER (FOR MD & LEADERSHIP) */}
      {isLeader && activePriority && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Institutional Priority Delivery Track (10-Milestone Stepper)
              </h2>
            </div>
            <Link
              href="/strategy"
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
            >
              <span>View All Priorities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ZomatoDeliveryStepper priority={activePriority} onRefresh={refreshTasks} />
        </div>
      )}

      {primaryNextAction ? (
        <div className="bg-white border-2 border-blue-500/30 rounded-3xl p-6 shadow-xs relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-2xs">
                  PRIMARY NEXT ACTION
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Focus on this to move your day forward
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider border ${getPriorityBadge(
                  primaryNextAction.priority
                )}`}
              >
                {primaryNextAction.priority} Priority
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                {primaryNextAction.title}
              </h2>
              {primaryNextAction.description && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                  {primaryNextAction.description}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-blue-100/80">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>
                  Target Due: <strong className="text-slate-800 font-bold font-mono">{primaryNextAction.due_at ? primaryNextAction.due_at.substring(0, 10) : 'Today'}</strong>
                </span>
                {primaryNextAction.source_title && (
                  <span className="flex items-center gap-1 text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                    <Link2 className="w-3 h-3 text-slate-400" />
                    {primaryNextAction.source_title}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span>Progress:</span>
                  <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${primaryNextAction.progressPercent || 0}%` }}
                    />
                  </div>
                  <strong className="text-slate-900 font-bold">{primaryNextAction.progressPercent || 0}%</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openTaskDetail(primaryNextAction)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{primaryNextAction.status === 'in_progress' ? 'Continue Working' : 'Start Working'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Pending Work Items</h3>
          <p className="text-xs text-slate-500">You have completed all assigned tasks for today.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AttentionRequiredCard 
            blockedTasks={blockedTasks}
            overdueTasks={overdueTasks}
            escalations={escalations}
            allTasks={workItems}
            onOpenTask={openTaskDetail}
            onOpenEscalation={openEscalationDetail}
          />

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today&apos;s Work Queue</h3>
                <p className="text-[11px] text-slate-500">Tasks scheduled for execution today</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                {dueTodayTasks.length} tasks
              </span>
            </div>

            {dueTodayTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No additional tasks due today.</p>
            ) : (
              <div className="space-y-2.5">
                {dueTodayTasks.map(item => (
                  <div
                    key={item.id}
                    onClick={() => openTaskDetail(item)}
                    className="p-3.5 bg-slate-50/60 hover:bg-slate-100/60 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${getPriorityBadge(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                        {item.source_title && (
                          <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                            {item.source_title}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Progress</span>
                        <span className="text-xs font-black text-slate-900">{item.progressPercent || 0}%</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTaskDetail(item);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {upcomingTasks.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Upcoming This Week ({upcomingTasks.length})
              </h3>
              <div className="space-y-2">
                {upcomingTasks.map(item => (
                  <div
                    key={item.id}
                    onClick={() => openTaskDetail(item)}
                    className="p-3 bg-slate-50/50 hover:bg-slate-100/50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        Due {item.due_at?.substring(0, 10)}
                      </span>
                      <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isLeader && (
            <div className="flex-1 mt-6 xl:mt-0 space-y-6">
              {isMD ? (
                <>
                  <ExecutiveStaffTracker
                    workItems={workItems}
                    onSelectStaff={(staff) => {
                      setNewTitle(`Directive for ${staff.name}: `);
                    }}
                    onAssignWork={(staffId, staffName) => {
                      setNewTitle(`Directive for ${staffName}: `);
                    }}
                  />
                  <DepartmentWorkloadGrid treeData={orgTree} workItems={workItems} isLoading={isLoading} />
                </>
              ) : (
                <TeamWorkloadGrid teamMembers={teamMembers} workItems={workItems} isLoading={isLoading} />
              )}
              
              <DynamicHospitalOrgChart 
                workItems={workItems}
                onOpenTaskModal={(assigneeId, assigneeName) => {
                  setNewTitle(`Task for ${assigneeName}: `);
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {isLeader ? (
            <SmartIntakeBox 
              onPlanGenerated={(plan) => {
                // Submit the plan directly for now
                apiClient.workItems.approve({
                  items: plan.items,
                  title: plan.title,
                  priority: plan.priority,
                  owner_id: user.id || 'usr-stav-101',
                  due_at: plan.due_at,
                }).then(() => refreshTasks());
              }} 
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-slate-900" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Quick Task Capture
                  </h3>
                </div>
                {showAddSuccess && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Saved!
                  </span>
                )}
              </div>

              <form onSubmit={handleCreateTask} className="space-y-2.5">
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="What work do you need to do?"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as WorkItemPriority)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Personal Day Schedule */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Today&apos;s Schedule
                </h3>
              </div>
              <Link
                href="/calendar"
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
              >
                <span>Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    10:30 AM IST
                  </span>
                  <span className="text-[10px] text-slate-400">Boardroom A</span>
                </div>
                <p className="font-bold text-slate-900">Daily Spine Surgery Operations Sync</p>
                <p className="text-[11px] text-slate-500">Cross-department patient flow and OT readiness.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    03:00 PM IST
                  </span>
                  <span className="text-[10px] text-slate-400">IT Lab</span>
                </div>
                <p className="font-bold text-slate-900">Digital Health Infrastructure Review</p>
                <p className="text-[11px] text-slate-500">EMR database optimization and server status.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TASK DETAIL DRAWER */}
      <TaskDetailDrawer
        workItem={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTask(null);
        }}
        onUpdated={refreshTasks}
      />

      {/* 6. ESCALATION DETAIL DRAWER */}
      <EscalationDetailDrawer
        escalation={selectedEscalation}
        isOpen={isEscalationDrawerOpen}
        onClose={() => {
          setIsEscalationDrawerOpen(false);
          setSelectedEscalation(null);
        }}
        onResolved={() => {
          setIsEscalationDrawerOpen(false);
          setSelectedEscalation(null);
          refreshTasks();
        }}
      />

      {/* 7. POSITION DETAIL DRAWER */}
      <PositionDetailDrawer
        node={selectedOrgNode}
        treeData={orgTree}
        isOpen={isOrgNodeDrawerOpen}
        onClose={() => {
          setIsOrgNodeDrawerOpen(false);
          setSelectedOrgNode(null);
        }}
        onUpdated={() => {
          // Refresh tree to show transfer result
          refreshTasks();
        }}
      />
    </div>
  );
}
