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
import { workItemStore } from '../../../lib/mocks/workItemMock';
import { strategyStore } from '../../../lib/mocks/strategyMock';
import { TaskDetailDrawer } from '../../../components/work/TaskDetailDrawer';
import { ZomatoDeliveryStepper } from '../../../components/strategy/ZomatoDeliveryStepper';

export default function OverviewPage() {
  const { user } = useAuth();
  const now = new Date();

  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activePriority, setActivePriority] = useState<QuarterlyPriority | null>(null);

  // Quick Self-Task Intake Form
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<WorkItemPriority>('medium');
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  const refreshTasks = useCallback(() => {
    const items = workItemStore.getWorkItems({ owner_id: user.id || 'usr-stav-101' });
    setWorkItems(items);
    const priorities = strategyStore.getQuarterlyPriorities();
    if (priorities.length > 0) {
      setActivePriority(priorities[0]);
    }
    if (selectedTask) {
      const updated = workItemStore.getWorkItemById(selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [user.id, selectedTask]);

  useEffect(() => {
    refreshTasks();
    const unsubWork = workItemStore.subscribe(refreshTasks);
    const unsubStrat = strategyStore.subscribe(refreshTasks);
    return () => {
      unsubWork();
      unsubStrat();
    };
  }, [refreshTasks]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    workItemStore.createWorkItem(
      {
        title: newTitle.trim(),
        priority: newPriority,
        owner_id: user.id || 'usr-stav-101',
        owner_name: user.name,
        due_at: new Date(Date.now() + 86400000).toISOString(),
        source_type: 'MANUAL',
        source_title: 'Self-Scheduled Work Item',
      },
      user.name
    );

    setNewTitle('');
    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 2500);
  };

  const openTaskDetail = (item: WorkItem) => {
    setSelectedTask(item);
    setIsDrawerOpen(true);
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

  // Primary Next Action: Top active in-progress item or highest priority pending item
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. MY DAY GREETING & FOCUS BANNER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              MY DAY
            </span>
            <span className="text-xs text-slate-500">
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
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
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

      {/* 2. PRIMARY NEXT ACTION SPOTLIGHT CARD */}
      {primaryNextAction ? (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider rounded-md">
                  PRIMARY NEXT ACTION
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Focus on this to move your day forward
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  primaryNextAction.priority === 'urgent'
                    ? 'bg-red-500/30 text-red-200 border border-red-400/40'
                    : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                }`}
              >
                {primaryNextAction.priority} Priority
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {primaryNextAction.title}
              </h2>
              {primaryNextAction.description && (
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {primaryNextAction.description}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-700/60">
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span>
                  Due: <strong className="text-white">{primaryNextAction.due_at ? primaryNextAction.due_at.substring(0, 10) : 'Today'}</strong>
                </span>
                {primaryNextAction.source_title && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Link2 className="w-3 h-3" />
                    {primaryNextAction.source_title}
                  </span>
                )}
                <span>
                  Progress: <strong className="text-white">{primaryNextAction.progressPercent || 0}%</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openTaskDetail(primaryNextAction)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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

      {/* 3. TWO-COLUMN WORKFLOW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: NEEDS ATTENTION & DUE TODAY QUEUES */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Needs Attention (Overdue & Blocked) */}
          {(overdueTasks.length > 0 || blockedTasks.length > 0) && (
            <div className="bg-red-50/40 border border-red-200/80 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Needs Immediate Attention ({overdueTasks.length + blockedTasks.length})
                </h3>
              </div>

              <div className="space-y-2">
                {blockedTasks.map(item => (
                  <div
                    key={item.id}
                    onClick={() => openTaskDetail(item)}
                    className="p-3.5 bg-white border border-red-200 rounded-2xl flex items-center justify-between gap-3 hover:border-red-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded uppercase">
                          BLOCKED
                        </span>
                        <span className="text-[11px] font-semibold text-red-600">
                          {item.blocked_reason || 'Blocker reported'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}

                {overdueTasks.filter(item => item.status !== 'blocked').map(item => (
                  <div
                    key={item.id}
                    onClick={() => openTaskDetail(item)}
                    className="p-3.5 bg-white border border-amber-200 rounded-2xl flex items-center justify-between gap-3 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded uppercase">
                          OVERDUE
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Target was: {item.due_at?.substring(0, 10)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Due Today & In Progress */}
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

          {/* Section: Upcoming (Tomorrow & This Week) */}
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
        </div>

        {/* RIGHT 1 COLUMN: QUICK TASK CAPTURE & TODAY'S SCHEDULE */}
        <div className="space-y-6">
          {/* Quick Intake Form */}
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
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

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

      {/* 4. STRATEGIC 10-MILESTONE ZOMATO-STYLE DELIVERY TRACKER */}
      {activePriority && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Quarterly Priority Milestone Delivery Tracker
              </h2>
            </div>
            <Link
              href="/strategy"
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
            >
              <span>View All Priorities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ZomatoDeliveryStepper priority={activePriority} />
        </div>
      )}

      {/* 5. TASK DETAIL DRAWER */}
      <TaskDetailDrawer
        workItem={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTask(null);
        }}
        onUpdated={refreshTasks}
      />
    </div>
  );
}
