'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building,
  User as UserIcon,
  ChevronRight,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import Link from 'next/link';

interface TaskItem {
  id: string;
  title: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  dueDate: string;
  department: string;
}

export default function OverviewPage() {
  const { user } = useAuth();
  const now = new Date();

  // Initial STAVYAN operational tasks
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      title: 'Verify OPD Network Stability & PACS Gateway sync',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: 'Today',
      department: 'IT & Digital Health',
    },
    {
      id: 'task-2',
      title: 'Review weekly spine surgery OT equipment logs',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: 'Tomorrow',
      department: 'Spine Surgery',
    },
    {
      id: 'task-3',
      title: 'Submit quarterly IT hardware inventory checklist',
      priority: 'LOW',
      status: 'TODO',
      dueDate: 'In 3 days',
      department: 'Hospital Administration',
    },
  ]);

  // Quick Task Creation Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('Today');
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  // Active filter tab
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('all');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      status: 'TODO',
      dueDate: newTaskDueDate,
      department: user.departmentName || 'IT & Digital Health',
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 3000);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskItem['status']) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');

  const displayedTasks = tasks.filter(t => {
    if (filterTab === 'pending') return t.status !== 'COMPLETED';
    if (filterTab === 'completed') return t.status === 'COMPLETED';
    return true;
  });

  const getPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOW':
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. STAVYAN HERO IDENTITY BANNER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              STAVYAN PORTAL
            </span>
            <span className="text-xs text-slate-500">
              • {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>{user.departmentName}</span>
            <span>&bull;</span>
            <span className="font-semibold text-slate-700">{user.roleTitle || 'Stavya Member'}</span>
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/execution"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Full Task Board</span>
          </Link>
          <Link
            href="/meetings"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Schedule</span>
          </Link>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">My Open Tasks</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{pendingTasks.length}</p>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">Assigned to you</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">In Progress</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{inProgressTasks.length}</p>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Active execution</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Completed</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{completedTasks.length}</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Delivered successfully</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Blockers / Stuck</p>
            <p className="text-2xl font-black text-red-600 mt-0.5">{blockedTasks.length}</p>
            <p className="text-[10px] text-red-600 font-medium mt-0.5">Needs resolution</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. QUICK TASK CREATOR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Quick Task Creation
            </h3>
          </div>
          {showAddSuccess && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Task added!
            </span>
          )}
        </div>

        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row items-center gap-2.5">
          <input
            type="text"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Type a new task description or commitment..."
            required
            className="flex-1 w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
          />

          <select
            value={newTaskPriority}
            onChange={e => setNewTaskPriority(e.target.value as any)}
            className="w-full sm:w-32 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:border-slate-800 focus:outline-none"
          >
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High Priority</option>
            <option value="URGENT">Urgent</option>
          </select>

          <select
            value={newTaskDueDate}
            onChange={e => setNewTaskDueDate(e.target.value)}
            className="w-full sm:w-32 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:border-slate-800 focus:outline-none"
          >
            <option value="Today">Due Today</option>
            <option value="Tomorrow">Tomorrow</option>
            <option value="In 3 days">In 3 days</option>
            <option value="Next Week">Next Week</option>
          </select>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            Add Task
          </button>
        </form>
      </div>

      {/* 4. MAIN CONTENT TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: MY WORK ITEMS */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">My Active Work</h2>
              <p className="text-xs text-slate-500">Track and update your commitments</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(['all', 'pending', 'completed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                    filterTab === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {displayedTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No tasks found in this view.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedTasks.map(task => (
                <div
                  key={task.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Due {task.dueDate}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        task.status === 'COMPLETED'
                          ? 'line-through text-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-[11px] text-slate-400">{task.department}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={task.status}
                      onChange={e =>
                        handleStatusChange(task.id, e.target.value as TaskItem['status'])
                      }
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-slate-800 focus:outline-none"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT 1 COL: TODAY'S SCHEDULE & TEAM CONTEXT */}
        <div className="space-y-6">
          {/* Hospital Schedule Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Today&apos;s Schedule
                </h3>
              </div>
              <Link
                href="/meetings"
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    10:30 AM IST
                  </span>
                  <span className="text-[10px] text-slate-400">Boardroom A</span>
                </div>
                <p className="font-bold text-slate-900">Daily Spine Surgery Operations Sync</p>
                <p className="text-[11px] text-slate-500">Cross-department patient flow and OT readiness.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
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

          {/* Quick Help & Blocker Reporting Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Facing a Blocker?</h4>
            </div>
            <p className="text-xs text-slate-300">
              If your task cannot proceed due to missing dependencies or approvals, flag it to notify your department lead.
            </p>
            <Link
              href="/execution"
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Manage Blockers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
