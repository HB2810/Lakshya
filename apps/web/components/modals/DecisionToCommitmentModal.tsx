'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Target, Calendar, User, ShieldCheck, Sparkles, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { MeetingDecision } from '../../types/meeting';
import { User as UserType } from '../../types/auth';

interface DecisionToCommitmentModalProps {
  isOpen: boolean;
  decision: MeetingDecision | null;
  meetingTitle?: string;
  users: UserType[];
  onClose: () => void;
  onCommitmentCreated: (commitmentData: {
    title: string;
    targetDate: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    responsibleId: string;
    accountableId: string;
    tasks: { title: string; ownerId: string }[];
  }) => Promise<void>;
}

export const DecisionToCommitmentModal: React.FC<DecisionToCommitmentModalProps> = ({
  isOpen,
  decision,
  meetingTitle,
  users,
  onClose,
  onCommitmentCreated,
}) => {
  const [title, setTitle] = useState(decision?.title || '');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [responsibleId, setResponsibleId] = useState(decision?.suggested_owner_id || users[0]?.id || '');
  const [accountableId, setAccountableId] = useState(users[0]?.id || '');
  const [tasks, setTasks] = useState<{ title: string; ownerId: string }[]>([
    { title: `Execute: ${decision?.title || 'Action item'}`, ownerId: decision?.suggested_owner_id || users[0]?.id || '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when decision prop changes
  React.useEffect(() => {
    if (decision) {
      setTitle(decision.title);
      setResponsibleId(decision.suggested_owner_id || users[0]?.id || '');
      setTasks([
        { title: `Execute: ${decision.title}`, ownerId: decision.suggested_owner_id || users[0]?.id || '' },
      ]);
    }
  }, [decision, users]);

  if (!isOpen || !decision) return null;

  const handleAddTask = () => {
    setTasks(prev => [...prev, { title: '', ownerId: responsibleId || users[0]?.id || '' }]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index: number, field: 'title' | 'ownerId', value: string) => {
    setTasks(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !responsibleId || !accountableId) return;

    setIsSubmitting(true);
    try {
      await onCommitmentCreated({
        title: title.trim(),
        targetDate,
        priority,
        responsibleId,
        accountableId,
        tasks: tasks.filter(t => t.title.trim().length > 0),
      });
      onClose();
    } catch (err) {
      console.error('Failed to convert decision to commitment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain p-4 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150" role="dialog" aria-modal="true" aria-label="Convert decision to commitment">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Convert Decision to Commitment
              </h3>
              {meetingTitle && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Origin: {meetingTitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Commitment Title */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Commitment Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Deploy Real-Time Waiting Display..."
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Priority & Target Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Target Delivery Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* RACI Ownership */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>RACI Governance Assignment</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Responsible (R) — Who executes?
                </label>
                <select
                  value={responsibleId}
                  onChange={e => setResponsibleId(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Responsible --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.roleTitle || u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Accountable (A) — Single Owner
                </label>
                <select
                  value={accountableId}
                  onChange={e => setAccountableId(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Accountable --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.roleTitle || u.role})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sub-tasks Generation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Actionable Execution Tasks ({tasks.length})
              </label>
              <button
                type="button"
                onClick={handleAddTask}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tasks.map((task, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={task.title}
                    onChange={e => handleTaskChange(idx, 'title', e.target.value)}
                    placeholder={`Task #${idx + 1} title...`}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <select
                    value={task.ownerId}
                    onChange={e => handleTaskChange(idx, 'ownerId', e.target.value)}
                    className="w-36 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting} disabled={isSubmitting || !title.trim()}>
              Approve & Dispatch Commitment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
