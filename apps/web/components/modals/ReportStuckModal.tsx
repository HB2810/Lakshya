'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { executionStore } from '../../lib/mocks/executionMock';
import { AlertTriangle } from 'lucide-react';

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
  const tasks = executionStore.getTasks();
  const [selectedTaskId, setSelectedTaskId] = useState(taskId || (tasks[0]?.id ?? ''));
  const [reasonCategory, setReasonCategory] = useState('VENDOR_DELAY');
  const [reasonDetails, setReasonDetails] = useState('');
  const [needDescription, setNeedDescription] = useState('');
  const [businessImpact, setBusinessImpact] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = taskId || selectedTaskId;
    if (!targetId || !reasonDetails || !needDescription) return;

    executionStore.reportStuck(
      targetId,
      reasonCategory,
      reasonDetails,
      needDescription,
      businessImpact || 'Operational progress impacted.'
    );

    setReasonDetails('');
    setNeedDescription('');
    setBusinessImpact('');
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Blocker / Flag Task as Stuck">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs font-medium text-brand-red">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>LAKSHYA Automated Escalation Engine will calculate escalation tier & notify provider.</span>
        </div>

        {!taskId && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Select Blocked Task
            </label>
            <select
              value={selectedTaskId}
              onChange={e => setSelectedTaskId(e.target.value)}
              className="w-full p-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white"
              required
            >
              {tasks.length === 0 ? (
                <option value="">No tasks currently available</option>
              ) : (
                tasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.title}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Reason Category
          </label>
          <select
            value={reasonCategory}
            onChange={e => setReasonCategory(e.target.value)}
            className="w-full p-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white"
          >
            <option value="VENDOR_DELAY">Vendor / External Delay</option>
            <option value="RESOURCE_UNAVAILABLE">Resource / Staff Unavailable</option>
            <option value="DECISION_REQUIRED">Pending Executive Decision</option>
            <option value="DEPENDENCY_BLOCKED">Prerequisite Dependency Blocked</option>
            <option value="TECHNICAL_ISSUE">Technical Infrastructure Failure</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Stuck Reason Details
          </label>
          <textarea
            value={reasonDetails}
            onChange={e => setReasonDetails(e.target.value)}
            rows={2}
            placeholder="Explain specifically why execution is blocked..."
            required
            className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            What is Needed? (Action / Input Required)
          </label>
          <textarea
            value={needDescription}
            onChange={e => setNeedDescription(e.target.value)}
            rows={2}
            placeholder="Describe what specific action or input is needed to unblock..."
            required
            className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white"
          />
        </div>

        <Input
          label="Business Impact"
          value={businessImpact}
          onChange={e => setBusinessImpact(e.target.value)}
          placeholder="e.g. Delays OPD launch by 3 days"
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger">
            Flag Stuck & Trigger Escalation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
