'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Link2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { WorkItem, WorkItemPriority, WorkItemStatus } from '../../../types/workItem';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthContext';
import { TaskDetailDrawer } from '../../../components/work/TaskDetailDrawer';
import { STAVYA_STAFF_DATABASE } from '../../../lib/data/stavyaHospitalOrgData';

export default function ExecutionPage() {
  const { user, can } = useAuth();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter & Search State
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'blocked' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Task Modal/Drawer or Inline State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<WorkItemPriority>('medium');
  const [quickDue, setQuickDue] = useState('Today');
  const [quickResponsibleId, setQuickResponsibleId] = useState<string>('');
  const [quickAccountableId, setQuickAccountableId] = useState<string>('');

  const staffList = Object.values(STAVYA_STAFF_DATABASE);

  // Data Fetching State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWork = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.workItems.list({ owner_id: user.id || 'usr-stav-101' });
      setWorkItems(response.items);
      if (selectedTask) {
        const updated = response.items.find((item) => item.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user.id, selectedTask]);

  useEffect(() => {
    refreshWork();
  }, [refreshWork]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    let dueIso = new Date(Date.now() + 86400000).toISOString();
    if (quickDue === 'Today') dueIso = '2026-08-28T18:00:00Z';
    if (quickDue === 'Tomorrow') dueIso = '2026-08-29T18:00:00Z';
    if (quickDue === 'Next Week') dueIso = '2026-09-04T18:00:00Z';

    const respStaff = staffList.find(s => s.id === quickResponsibleId);
    const acctStaff = staffList.find(s => s.id === quickAccountableId);

    try {
      await apiClient.workItems.approve({
        items: [{
          client_id: `plan-${Date.now()}`,
          title: quickTitle.trim(),
          priority: quickPriority,
          owner_id: quickResponsibleId || user.id || 'usr-stav-101',
          owner_name: respStaff?.name || user.name,
          raci: {
            responsible_id: quickResponsibleId || user.id || 'usr-stav-101',
            responsible_name: respStaff?.name || user.name,
            accountable_id: quickAccountableId || '',
            accountable_name: acctStaff?.name || '',
            consulted_ids: [],
            consulted_names: [],
            informed_ids: [],
            informed_names: [],
          },
        }],
        title: 'Institutional Work Item',
        priority: quickPriority,
        owner_id: quickResponsibleId || user.id || 'usr-stav-101',
        due_at: dueIso,
      });

      setQuickTitle('');
      setQuickResponsibleId('');
      setQuickAccountableId('');
      setIsQuickAddOpen(false);
      refreshWork();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const openTask = (item: WorkItem) => {
    setSelectedTask(item);
    setIsDrawerOpen(true);
  };

  // Filter definitions
  const todayStr = '2026-08-28';

  const filterCounts = {
    all: workItems.length,
    today: workItems.filter(w => w.status !== 'completed' && (!w.due_at || w.due_at.substring(0, 10) === todayStr)).length,
    upcoming: workItems.filter(w => w.status !== 'completed' && w.due_at && w.due_at.substring(0, 10) > todayStr).length,
    overdue: workItems.filter(w => w.status !== 'completed' && w.due_at && w.due_at.substring(0, 10) < todayStr).length,
    blocked: workItems.filter(w => w.status === 'blocked' || w.status === 'stuck').length,
    completed: workItems.filter(w => w.status === 'completed').length,
  };

  const displayedItems = workItems.filter(item => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q) || false;
      const matchSource = item.source_title?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchDesc && !matchSource) return false;
    }

    // Filter tab
    if (activeFilter === 'today') {
      return item.status !== 'completed' && (!item.due_at || item.due_at.substring(0, 10) === todayStr);
    }
    if (activeFilter === 'upcoming') {
      return item.status !== 'completed' && item.due_at && item.due_at.substring(0, 10) > todayStr;
    }
    if (activeFilter === 'overdue') {
      return item.status !== 'completed' && item.due_at && item.due_at.substring(0, 10) < todayStr;
    }
    if (activeFilter === 'blocked') {
      return item.status === 'blocked' || item.status === 'stuck';
    }
    if (activeFilter === 'completed') {
      return item.status === 'completed';
    }
    return true;
  });

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

  const getStatusBadge = (status: WorkItemStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'blocked':
      case 'stuck':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
        <p className="text-sm font-semibold">Loading your work items...</p>
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
            onClick={() => refreshWork()}
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
      {/* 1. HEADER & ACTIONS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-2xs">
              MY WORK
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Unified Canonical Work Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            My Work &amp; Execution Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single view for all your assigned tasks, meeting action items, and self-scheduled work.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Work Item</span>
          </button>
        </div>
      </div>

      {/* 2. QUICK ADD EXPANDABLE FORM */}
      {isQuickAddOpen && (
        <form
          onSubmit={handleQuickAdd}
          className="p-5 bg-white border border-blue-200/80 rounded-3xl shadow-xs space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Create New Work Item
            </h3>
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              placeholder="What work or clinical action needs to be executed?"
              required
              className="flex-1 w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none"
            />

            <select
              value={quickPriority}
              onChange={e => setQuickPriority(e.target.value as WorkItemPriority)}
              className="w-full sm:w-32 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={quickDue}
              onChange={e => setQuickDue(e.target.value)}
              className="w-full sm:w-32 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="Today">Due Today</option>
              <option value="Tomorrow">Tomorrow</option>
              <option value="Next Week">Next Week</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
            <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-2">
              <select
                value={quickResponsibleId}
                onChange={e => setQuickResponsibleId(e.target.value)}
                className="flex-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="">Responsible (R): Default (You)</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>
                    R: {s.name} ({s.unit})
                  </option>
                ))}
              </select>

              <select
                value={quickAccountableId}
                onChange={e => setQuickAccountableId(e.target.value)}
                className="flex-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="">Accountable (A): Select Authority</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>
                    A: {s.name} ({s.unit})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Create Item
            </button>
          </div>
        </form>
      )}

      {/* 3. FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-2xs">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: 'all', label: 'All', count: filterCounts.all },
              { id: 'today', label: 'Today', count: filterCounts.today },
              { id: 'upcoming', label: 'Upcoming', count: filterCounts.upcoming },
              { id: 'overdue', label: 'Overdue', count: filterCounts.overdue },
              { id: 'blocked', label: 'Blocked', count: filterCounts.blocked },
              { id: 'completed', label: 'Completed', count: filterCounts.completed },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeFilter === tab.id
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks or source..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* 4. WORK ITEMS LIST */}
      {displayedItems.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
          <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Work Items Found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery ? 'No tasks match your search filter.' : 'You have no items in this filter view.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedItems.map(item => (
            <div
              key={item.id}
              onClick={() => openTask(item)}
              className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:shadow-sm"
            >
              {/* Task Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${getPriorityBadge(
                      item.priority
                    )}`}
                  >
                    {item.priority}
                  </span>
                  {item.source_title && (
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 truncate max-w-xs">
                      <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                      {item.source_title}
                    </span>
                  )}
                </div>

                <h3
                  className={`text-sm font-bold leading-snug ${
                    item.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                    {item.description}
                  </p>
                )}

                {/* If Blocked: Display blocker highlight */}
                {item.status === 'blocked' && (
                  <div className="p-2 bg-red-50 text-red-800 text-[11px] rounded-lg font-semibold flex items-center gap-1.5 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Blocker: {item.blocked_reason || 'Blocked'}</span>
                  </div>
                )}
              </div>

              {/* Progress & Quick Action */}
              <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-right space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">
                    Due: <span className="text-slate-700 font-mono">{item.due_at ? item.due_at.substring(0, 10) : 'Today'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-900 h-full rounded-full transition-all"
                        style={{ width: `${item.progressPercent || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-900">{item.progressPercent || 0}%</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    openTask(item);
                  }}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                >
                  <span>Open</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
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
        onUpdated={refreshWork}
      />
    </div>
  );
}
