'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertTriangle } from 'lucide-react';
import { apiClient } from '../../lib/api/client';
import { WorkItem } from '../../types/workItem';

interface ReportStuckModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
  onSuccess?: () => void;
}

export const ReportStuckModal: React.FC<ReportStuckModalProps> = ({
  isOpen,
  onClose,
  taskId,
  onSuccess,
}) => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(taskId || '');
  const [reasonCategory, setReasonCategory] = useState('VENDOR_DELAY');
  const [reasonDetails, setReasonDetails] = useState('');
  const [needDescription, setNeedDescription] = useState('');
  const [businessImpact, setBusinessImpact] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActiveWorkItems = useCallback(async () => {
    try {
      const res = await apiClient.workItems.list();
      const active = res.items.filter((item) => item.status !== 'completed');
      setWorkItems(active);
      if (!taskId && active.length > 0) {
        setSelectedTaskId(active[0].id);
      }
    } catch {
      // ignore
    }
  }, [taskId]);

  useEffect(() => {
    if (isOpen) {
      loadActiveWorkItems();
      if (taskId) setSelectedTaskId(taskId);
    }
  }, [isOpen, taskId, loadActiveWorkItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = taskId || selectedTaskId;
    if (!targetId || !reasonDetails.trim()) {
      setError('Please select a task and provide specific blocker details.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const categoryLabel = reasonCategory.replace(/_/g, ' ');
      const fullReason = `[${categoryLabel}] ${reasonDetails.trim()}` +
        (needDescription.trim() ? ` — Needed: ${needDescription.trim()}` : '') +
        (businessImpact.trim() ? ` — Impact: ${businessImpact.trim()}` : '');

      await apiClient.workItems.patch(targetId, {
        status: 'stuck',
        blocked_reason: fullReason,
      });

      setReasonDetails('');
      setNeedDescription('');
      setBusinessImpact('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to flag task as stuck.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Blocker / Flag Task as Stuck">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>SSIE Execution Engine requires a mandatory blocker reason to flag task as stuck and record timestamp.</span>
        </div>

        {!taskId && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Select Blocked Work Item *
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
              required
            >
              {workItems.length === 0 ? (
                <option value="">No active work items available</option>
              ) : (
                workItems.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title} ({w.priority.toUpperCase()})
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Reason Category
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          >
            <option value="VENDOR_DELAY">Vendor / External Delay</option>
            <option value="RESOURCE_UNAVAILABLE">Resource / Staff Unavailable</option>
            <option value="DECISION_REQUIRED">Pending Executive Decision</option>
            <option value="DEPENDENCY_BLOCKED">Prerequisite Dependency Blocked</option>
            <option value="TECHNICAL_ISSUE">Technical Infrastructure Failure</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Stuck Reason Details *
          </label>
          <textarea
            value={reasonDetails}
            onChange={(e) => setReasonDetails(e.target.value)}
            rows={2}
            placeholder="Explain specifically why execution is blocked..."
            required
            className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            What is Needed? (Action / Input Required)
          </label>
          <textarea
            value={needDescription}
            onChange={(e) => setNeedDescription(e.target.value)}
            rows={2}
            placeholder="Describe what specific action or input is needed to unblock..."
            className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>

        <Input
          label="Business Impact"
          value={businessImpact}
          onChange={(e) => setBusinessImpact(e.target.value)}
          placeholder="e.g. Delays OPD launch by 3 days"
        />

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={isLoading} disabled={isLoading}>
            Flag Stuck & Record Blocker
          </Button>
        </div>
      </form>
    </Modal>
  );
};
