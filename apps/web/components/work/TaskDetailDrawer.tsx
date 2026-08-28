'use client';

import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  ShieldAlert,
  ArrowRight,
  Send,
  MessageSquare,
  Sparkles,
  Link2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { WorkItem, WorkItemStatus, WorkItemPriority } from '../../types/workItem';
import { workItemStore } from '../../lib/mocks/workItemMock';
import { useAuth } from '../../lib/auth/AuthContext';

interface TaskDetailDrawerProps {
  workItem: WorkItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  workItem,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { user } = useAuth();

  // Active action mode inside drawer: 'view' | 'progress' | 'blocker' | 'complete'
  const [actionMode, setActionMode] = useState<'view' | 'progress' | 'blocker' | 'complete'>('view');

  // Progress Update Form State
  const [progressPercent, setProgressPercent] = useState<number>(workItem?.progressPercent || 0);
  const [progressNote, setProgressNote] = useState<string>('');

  // Blocker Form State
  const [blockerReason, setBlockerReason] = useState<string>('');
  const [blockerNeed, setBlockerNeed] = useState<string>('');
  const [blockerHelper, setBlockerHelper] = useState<string>('');
  const [blockerUrgency, setBlockerUrgency] = useState<'URGENT' | 'HIGH' | 'MEDIUM'>('HIGH');

  // Complete Form State
  const [completeNote, setCompleteNote] = useState<string>('');

  if (!isOpen || !workItem) return null;

  const handleStartWork = () => {
    workItemStore.updateStatus(workItem.id, 'in_progress', user.name, 'Started execution.');
    onUpdated?.();
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    workItemStore.updateProgress(workItem.id, progressPercent, progressNote.trim() || undefined, user.name);
    setActionMode('view');
    setProgressNote('');
    onUpdated?.();
  };

  const handleReportBlocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockerReason.trim() || !blockerNeed.trim()) return;

    workItemStore.reportBlocker(
      workItem.id,
      {
        reason: blockerReason.trim(),
        needDescription: blockerNeed.trim(),
        helpedByPersonOrDept: blockerHelper.trim() || undefined,
        urgency: blockerUrgency,
      },
      user.name
    );

    setActionMode('view');
    setBlockerReason('');
    setBlockerNeed('');
    setBlockerHelper('');
    onUpdated?.();
  };

  const handleCompleteWork = (e: React.FormEvent) => {
    e.preventDefault();
    workItemStore.updateStatus(workItem.id, 'completed', user.name, completeNote.trim() || 'Work completed successfully.');
    setActionMode('view');
    setCompleteNote('');
    onUpdated?.();
  };

  const handleResolveBlocker = () => {
    workItemStore.resolveBlocker(workItem.id, 'Blocker resolved. Resumed work.', user.name);
    onUpdated?.();
  };

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
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* 1. DRAWER TOP HEADER */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${getStatusBadge(
                    workItem.status
                  )}`}
                >
                  {workItem.status.replace('_', ' ')}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${getPriorityBadge(
                    workItem.priority
                  )}`}
                >
                  {workItem.priority} Priority
                </span>
                {workItem.source_title && (
                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    <Link2 className="w-3 h-3 text-slate-400" />
                    {workItem.source_title}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-black text-slate-900 leading-snug">
                {workItem.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. DRAWER BODY CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description Box */}
            {workItem.description && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Task Scope
                </p>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {workItem.description}
                </p>
              </div>
            )}

            {/* If Task is Blocked: Highlight Blocker Banner */}
            {workItem.status === 'blocked' && workItem.blocker_details && (
              <div className="p-4 bg-red-50/80 border border-red-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Active Blocker Reported</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResolveBlocker}
                    className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    Mark Blocker Resolved
                  </button>
                </div>
                <p className="text-xs text-slate-800 font-semibold">
                  Reason: {workItem.blocker_details.reason}
                </p>
                <p className="text-xs text-slate-600">
                  What is needed: {workItem.blocker_details.needDescription}
                </p>
                {workItem.blocker_details.helpedByPersonOrDept && (
                  <p className="text-[11px] text-slate-500">
                    Routing to: <strong className="text-slate-700">{workItem.blocker_details.helpedByPersonOrDept}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Quick Metadata Info */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/60 border border-slate-100 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned To</span>
                <p className="font-bold text-slate-800 mt-0.5">{workItem.owner_name || 'Priyesh Shah'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned By</span>
                <p className="font-bold text-slate-800 mt-0.5">{workItem.created_by}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Target Due Date</span>
                <p className="font-mono text-slate-800 mt-0.5">
                  {workItem.due_at ? workItem.due_at.substring(0, 10) : 'Today'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Current Progress</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all"
                      style={{ width: `${workItem.progressPercent || 0}%` }}
                    />
                  </div>
                  <span className="font-black text-slate-900 text-xs">
                    {workItem.progressPercent || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION FORMS (INTERACTIVE MODES) */}
            {actionMode === 'progress' && (
              <form
                onSubmit={handleSaveProgress}
                className="p-5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Update Progress & Execution Note
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActionMode('view')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <label>Completion Percentage</label>
                    <span className="text-blue-700 text-sm font-black">{progressPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(Number(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Progress Update Note (Logged to History)
                  </label>
                  <textarea
                    rows={2}
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    placeholder="e.g. Configuration verified. Running final unit sanity test..."
                    className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActionMode('view')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Save Progress
                  </button>
                </div>
              </form>
            )}

            {actionMode === 'blocker' && (
              <form
                onSubmit={handleReportBlocker}
                className="p-5 bg-red-50/70 border border-red-200 rounded-2xl space-y-3.5 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-red-200/80 pb-2">
                  <div className="flex items-center gap-1.5 text-red-900 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Report Blocker / Need Help</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActionMode('view')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    1. What is blocking you?
                  </label>
                  <input
                    type="text"
                    value={blockerReason}
                    onChange={(e) => setBlockerReason(e.target.value)}
                    placeholder="e.g. Missing vendor firmware download credentials..."
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-red-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    2. What is needed to proceed?
                  </label>
                  <textarea
                    rows={2}
                    value={blockerNeed}
                    onChange={(e) => setBlockerNeed(e.target.value)}
                    placeholder="e.g. Need OEM unlock key or approval from Biomedical Lead..."
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-red-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      3. Who can help? (Optional)
                    </label>
                    <input
                      type="text"
                      value={blockerHelper}
                      onChange={(e) => setBlockerHelper(e.target.value)}
                      placeholder="e.g. Amit Patel / IT Lead"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-red-200 rounded-xl text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      4. Urgency
                    </label>
                    <select
                      value={blockerUrgency}
                      onChange={(e) => setBlockerUrgency(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-red-200 rounded-xl text-slate-800 focus:outline-none"
                    >
                      <option value="HIGH">High (Immediate)</option>
                      <option value="URGENT">Urgent (OT Critical)</option>
                      <option value="MEDIUM">Medium (Within 24h)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActionMode('view')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Submit Blocker
                  </button>
                </div>
              </form>
            )}

            {actionMode === 'complete' && (
              <form
                onSubmit={handleCompleteWork}
                className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3.5 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Complete Work Item</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActionMode('view')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Completion Note / Outcome
                  </label>
                  <textarea
                    rows={2}
                    value={completeNote}
                    onChange={(e) => setCompleteNote(e.target.value)}
                    placeholder="Briefly note the deliverable outcome achieved..."
                    className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActionMode('view')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Confirm & Complete
                  </button>
                </div>
              </form>
            )}

            {/* Activity History Timeline */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Execution Activity History</span>
              </div>

              {(!workItem.activity_history || workItem.activity_history.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
              ) : (
                <div className="space-y-2 relative border-l border-slate-200 ml-2 pl-4">
                  {workItem.activity_history.map((act) => (
                    <div key={act.id} className="relative space-y-0.5">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-slate-700">{act.authorName}</span>
                        <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-snug font-medium">
                        {act.note || act.type}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. DRAWER FOOTER PRIMARY ACTIONS */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {workItem.status === 'todo' && (
                <button
                  type="button"
                  onClick={handleStartWork}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Working</span>
                </button>
              )}

              {workItem.status === 'in_progress' && (
                <button
                  type="button"
                  onClick={() => setActionMode(actionMode === 'progress' ? 'view' : 'progress')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Update Progress</span>
                </button>
              )}

              {workItem.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => setActionMode(actionMode === 'blocker' ? 'view' : 'blocker')}
                  className="px-3.5 py-2.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Need Help / Blocker</span>
                </button>
              )}
            </div>

            {workItem.status !== 'completed' ? (
              <button
                type="button"
                onClick={() => setActionMode(actionMode === 'complete' ? 'view' : 'complete')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Complete</span>
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Completed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
