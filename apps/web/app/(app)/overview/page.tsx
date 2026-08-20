'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { Card, Stat } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthContext';
import { SmartIntakeBox } from '../../../components/intake/SmartIntakeBox';
import { ReviewablePlanCard } from '../../../components/intake/ReviewablePlanCard';
import {
  ApprovePlanPayload,
  ReviewablePlan,
  WorkItem,
  WorkItemPriority,
  WorkItemStatus,
} from '../../../types/workItem';
import { User } from '../../../types/auth';

export default function OverviewPage() {
  const { user } = useAuth();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<ReviewablePlan | null>(null);
  const [isIntakeLoading, setIsIntakeLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const uList = await apiClient.organization.getUsers();
      setUsers(uList);
    } catch {
      // ignore
    }
  }, []);

  const fetchWorkItems = useCallback(async () => {
    try {
      const response = await apiClient.workItems.list();
      setWorkItems(response.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchWorkItems();
  }, [fetchUsers, fetchWorkItems]);

  const handlePlanGenerated = (plan: ReviewablePlan) => {
    setActivePlan(plan);
  };

  const handleApprovePlan = async (approvedPlan: ApprovePlanPayload) => {
    setIsApproving(true);
    try {
      const response = await apiClient.workItems.approve(approvedPlan);
      setActivePlan(null);
      setSuccessMessage(
        `Successfully created "${approvedPlan.title}" with ${response.items.length - 1} subtask(s).`
      );
      await fetchWorkItems();
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setIsApproving(false);
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: WorkItemStatus) => {
    try {
      await apiClient.workItems.patch(itemId, { status: newStatus });
      fetchWorkItems();
    } catch {
      // ignore
    }
  };

  // Filtered lists
  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);

  const attentionQueue = workItems.filter((item) => {
    const isOverdue = item.due_at && item.due_at < now.toISOString() && item.status !== 'completed';
    const isStuck = item.status === 'stuck';
    const isUrgent = item.priority === 'urgent' || item.priority === 'high';
    return (isOverdue || isStuck || isUrgent) && item.status !== 'completed';
  });

  const filteredWorkItems = workItems.filter((item) => {
    if (activeTab === 'completed') return item.status === 'completed';
    if (activeTab === 'today') {
      return (
        item.status !== 'completed' &&
        item.due_at &&
        item.due_at.substring(0, 10) === todayStr
      );
    }
    if (activeTab === 'upcoming') {
      return (
        item.status !== 'completed' &&
        (!item.due_at || item.due_at.substring(0, 10) > todayStr)
      );
    }
    return true;
  });

  const totalActive = workItems.filter((i) => i.status !== 'completed').length;
  const totalCompleted = workItems.filter((i) => i.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              MD Office Operating System
            </span>
            <span className="text-xs text-slate-500 font-mono">• {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Executive Work Command
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Natural work intake, AI-assisted structuring, and execution tracking for Stavya Spine Hospital.
          </p>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION BANNER */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-medium text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* TOP: SMART INTAKE BOX / REVIEW CARD */}
      {!activePlan ? (
        <SmartIntakeBox
          onPlanGenerated={handlePlanGenerated}
          isLoading={isIntakeLoading}
        />
      ) : (
        <ReviewablePlanCard
          initialPlan={activePlan}
          users={users}
          onApprove={handleApprovePlan}
          onCancel={() => setActivePlan(null)}
          isLoading={isApproving}
        />
      )}

      {/* SUMMARY STAT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat
          label="Total Active Work Items"
          value={totalActive}
          change="Under Execution"
          changeType="positive"
          icon={<Clock className="w-5 h-5" />}
        />
        <Stat
          label="Attention Required"
          value={attentionQueue.length}
          change={attentionQueue.length > 0 ? "Action Needed" : "All Clear"}
          changeType={attentionQueue.length > 0 ? "negative" : "neutral"}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <Stat
          label="Completed Work Items"
          value={totalCompleted}
          change="Delivered"
          changeType="positive"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
      </div>

      {/* MIDDLE: ATTENTION QUEUE */}
      {attentionQueue.length > 0 && (
        <Card title="Attention Queue" subtitle="Overdue, Stuck & High Priority Items">
          <div className="space-y-3">
            {attentionQueue.map((item) => {
              const isOverdue =
                item.due_at && item.due_at < now.toISOString() && item.status !== 'completed';
              return (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded uppercase">
                        {isOverdue ? 'Overdue' : item.status.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded uppercase">
                        {item.priority} priority
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as WorkItemStatus)}
                      className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="stuck">Stuck</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* BOTTOM: MY WORK / ACTIVE WORK ITEMS LIST */}
      <Card
        title="Active Work Items"
        action={
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(['all', 'today', 'upcoming', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading Work Items...
          </div>
        ) : filteredWorkItems.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No work items found in this view.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Use the Smart Work Intake box above to type or paste a new task.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredWorkItems.map((item) => {
              const ownerName = users.find((u) => u.id === item.owner_id)?.name || 'Unassigned';
              return (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/40 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} size="sm" />
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {item.priority} Priority
                      </span>
                      {item.parent_id && (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                          Subtask
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                      <span>Owner: <strong className="text-slate-700 dark:text-slate-300">{ownerName}</strong></span>
                      {item.due_at && (
                        <span>Due: <strong className="text-slate-700 dark:text-slate-300">{item.due_at.substring(0, 10)}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as WorkItemStatus)}
                      className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="stuck">Stuck</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
