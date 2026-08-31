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
import { apiClient } from '../../lib/api/client';
import { useAuth } from '../../lib/auth/AuthContext';
import { RaciSection } from './sections/RaciSection';
import { EdcSection } from './sections/EdcSection';
import { DependenciesSection } from './sections/DependenciesSection';
import { EscalationSection } from './sections/EscalationSection';
import { ZomatoTaskStepper } from './ZomatoTaskStepper';

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

  // Active action mode inside drawer: 'view' | 'progress' | 'blocker' | 'complete' | 'submit_verification'
  const [actionMode, setActionMode] = useState<'view' | 'progress' | 'blocker' | 'complete' | 'submit_verification'>('view');
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'execution' | 'dependencies' | 'activity'>('overview');

  // Progress Update Form State
  const [progressPercent, setProgressPercent] = useState<number>(workItem?.progressPercent || 0);
  const [progressNote, setProgressNote] = useState<string>('');

  // Blocker Form State
  const [blockerReason, setBlockerReason] = useState<string>('');
  const [blockerNeed, setBlockerNeed] = useState<string>('');
  const [blockerHelper, setBlockerHelper] = useState<string>('');
  const [blockerUrgency, setBlockerUrgency] = useState<'URGENT' | 'HIGH' | 'MEDIUM'>('HIGH');

  // Complete & Verification Form State
  const [completeNote, setCompleteNote] = useState<string>('');
  const [submissionNotes, setSubmissionNotes] = useState<string>('');

  if (!isOpen || !workItem) return null;

  const handleStartWork = async () => {
    try {
      await apiClient.workItems.patch(workItem.id, {
        status: 'in_progress',
        update_note: 'Started execution.',
      });
      onUpdated?.();
    } catch (err) {
      console.error('Failed to start work:', err);
    }
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.workItems.patch(workItem.id, {
        progressPercent: progressPercent,
        update_note: progressNote.trim() || undefined,
      });
      setActionMode('view');
      setProgressNote('');
      onUpdated?.();
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  const handleReportBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockerReason.trim() || !blockerNeed.trim()) return;

    try {
      await apiClient.workItems.patch(workItem.id, {
        status: 'blocked',
        blocker_details: {
          reason: blockerReason.trim(),
          needDescription: blockerNeed.trim(),
          helpedByPersonOrDept: blockerHelper.trim() || 'Managing Director / Incharge',
          urgency: blockerUrgency,
          reportedAt: new Date().toISOString(),
        },
        update_note: `Blocker reported: ${blockerReason.trim()}`,
      });
      setActionMode('view');
      setBlockerReason('');
      setBlockerNeed('');
      setBlockerHelper('');
      onUpdated?.();
    } catch (err) {
      console.error('Failed to report blocker:', err);
    }
  };

  const handleSubmitForVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionNotes.trim()) return;

    try {
      await apiClient.workItems.submitForVerification(
        workItem.id,
        submissionNotes.trim(),
        user?.name || 'Staff Member'
      );
      setActionMode('view');
      setSubmissionNotes('');
      onUpdated?.();
    } catch (err) {
      console.error('Failed to submit for verification:', err);
    }
  };

  const handleCompleteWork = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.workItems.patch(workItem.id, {
        status: 'completed',
        update_note: completeNote.trim() || 'Work completed successfully.',
      });
      setActionMode('view');
      setCompleteNote('');
      onUpdated?.();
    } catch (err) {
      console.error('Failed to complete work:', err);
    }
  };

  const handleResolveBlocker = async () => {
    try {
      await apiClient.workItems.patch(workItem.id, {
        status: 'in_progress', // Switch back to in_progress or previous state
        update_note: 'Blocker resolved. Resumed work.',
      });
      onUpdated?.();
    } catch (err) {
      console.error('Failed to resolve blocker:', err);
    }
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
      case 'verified':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'submitted_for_verification':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'revision_requested':
        return 'bg-amber-50 text-amber-700 border-amber-200';
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
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen sm:w-[480px] lg:w-[540px] max-w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-250">
          {/* 1. DRAWER TOP HEADER */}
          <div className="px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
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
                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[220px]">
                    <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{workItem.source_title}</span>
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                {workItem.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex min-h-10 min-w-10 shrink-0 items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer active-press"
              aria-label="Close task details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 pb-4 sm:px-6">
            <ZomatoTaskStepper status={workItem.status} compact={false} />
          </div>

          {/* 2. TAB NAVIGATION */}
          <div className="flex shrink-0 overflow-x-auto overscroll-x-contain border-b border-slate-100 px-4 sm:px-6 gap-5 sm:gap-6 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'execution', label: 'RACI & EDC' },
              { id: 'dependencies', label: 'Dependencies' },
              { id: 'activity', label: 'Activity' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`shrink-0 whitespace-nowrap py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 3. DRAWER BODY CONTENT */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 space-y-5 sm:space-y-6">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Verification / Audit Outcome Banner if available */}
                {workItem.verification && (
                  <div
                    className={`p-4 rounded-2xl border ${
                      workItem.verification.decision === 'APPROVED'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                    } space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white shadow-2xs">
                        {workItem.verification.decision === 'APPROVED' ? 'AUDIT VERIFIED & APPROVED' : 'REVISION REQUESTED'}
                      </span>
                      {workItem.verification.audit_score && (
                        <span className="text-xs font-black text-amber-600 flex items-center gap-1">
                          {'★'.repeat(workItem.verification.audit_score)} {workItem.verification.audit_score}/5 Stars
                        </span>
                      )}
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold">
                        Audited by {workItem.verification.verified_by_name} ({workItem.verification.verified_by_role || 'Incharge / Leader'})
                      </p>
                      {workItem.verification.remarks && (
                        <p className="text-slate-700 italic bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                          &ldquo;{workItem.verification.remarks}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Submission Deliverable Note if awaiting review */}
                {workItem.status === 'submitted_for_verification' && workItem.submission_notes && (
                  <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
                      Deliverable Submitted for Verification
                    </span>
                    <p className="text-xs text-indigo-950 font-medium bg-white p-2.5 rounded-xl border border-indigo-100">
                      {workItem.submission_notes}
                    </p>
                  </div>
                )}

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
              </div>
            )}

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

            {actionMode === 'submit_verification' && (
              <form
                onSubmit={handleSubmitForVerification}
                className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                    Submit Deliverable for Incharge Verification
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActionMode('view')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                    Deliverable & Execution Proof Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="e.g. Completed autoclaving of OT-2 tray sets #4-8. Temperature chart verified at 134°C. Physical register signed."
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-indigo-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                    disabled={!submissionNotes.trim()}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Submit for Incharge Verification
                  </button>
                </div>
              </form>
            )}

            {actionMode === 'blocker' && (
              <form
                onSubmit={handleReportBlocker}
                className="p-5 bg-red-50/60 border border-red-200 rounded-2xl space-y-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-red-200/80 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
                    Report Stuck Issue / Blocker Need
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActionMode('view')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Why are you stuck? (Blocker Reason)
                  </label>
                  <input
                    type="text"
                    value={blockerReason}
                    onChange={(e) => setBlockerReason(e.target.value)}
                    placeholder="e.g. Sensor calibration software key expired on vendor server"
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-red-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    What specific assistance / decision is needed?
                  </label>
                  <input
                    type="text"
                    value={blockerNeed}
                    onChange={(e) => setBlockerNeed(e.target.value)}
                    placeholder="e.g. Need IT / MD Office approval for emergency license renewal"
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-red-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Who can help? (Person or Dept)
                    </label>
                    <input
                      type="text"
                      value={blockerHelper}
                      onChange={(e) => setBlockerHelper(e.target.value)}
                      placeholder="e.g. IT Department Head / MD Office"
                      className="w-full px-3 py-2 text-xs bg-white border border-red-200 rounded-xl text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Urgency
                    </label>
                    <select
                      value={blockerUrgency}
                      onChange={(e) => setBlockerUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-white border border-red-200 rounded-xl text-slate-900 focus:outline-none"
                    >
                      <option value="URGENT">Urgent (Immediate Blocker)</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                    </select>
                  </div>
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
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Log Blocker
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

            {/* EXECUTION & RACI TAB */}
            {activeTab === 'execution' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <RaciSection workItem={workItem} onUpdate={() => onUpdated?.()} />
                <EdcSection workItem={workItem} onUpdate={() => onUpdated?.()} />
              </div>
            )}

            {/* DEPENDENCIES & BLOCKERS TAB */}
            {activeTab === 'dependencies' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <EscalationSection workItem={workItem} onUpdate={() => onUpdated?.()} />
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
                <DependenciesSection workItem={workItem} onUpdate={() => onUpdated?.()} />
              </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <div className="space-y-3 animate-in fade-in duration-200">
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
            )}
          </div>

          {/* 4. DRAWER FOOTER PRIMARY ACTIONS */}
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {workItem.status === 'todo' && (
                <button
                  type="button"
                  onClick={handleStartWork}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active-press"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Working</span>
                </button>
              )}

              {(workItem.status === 'in_progress' || workItem.status === 'revision_requested') && (
                <button
                  type="button"
                  onClick={() => setActionMode(actionMode === 'progress' ? 'view' : 'progress')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active-press"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Update Progress</span>
                </button>
              )}

              {workItem.status !== 'completed' && workItem.status !== 'verified' && (
                <button
                  type="button"
                  onClick={() => setActionMode(actionMode === 'blocker' ? 'view' : 'blocker')}
                  className="px-3.5 py-2.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer active-press"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Need Help / Blocker</span>
                </button>
              )}
            </div>

            {workItem.status === 'submitted_for_verification' ? (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span>Submitted for Incharge Verification</span>
              </span>
            ) : workItem.status === 'verified' || workItem.status === 'completed' ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <Check className="w-3.5 h-3.5" />
                <span>Verified &amp; Completed</span>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActionMode(actionMode === 'submit_verification' ? 'view' : 'submit_verification')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active-press"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit for Verification</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
