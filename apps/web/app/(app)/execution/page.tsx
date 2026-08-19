'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  Plus,
  Filter,
  UserCheck,
  Shield,
  HelpCircle,
  FileText,
  ChevronRight,
  Send,
} from 'lucide-react';
import { Tabs } from '../../../components/ui/Tabs';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Drawer } from '../../../components/ui/Modal';
import { Modal } from '../../../components/ui/Modal';
import { apiClient } from '../../../lib/api/client';
import { Commitment, Task, StuckNeedItem } from '../../../types/execution';
import { useAuth } from '../../../lib/auth/AuthContext';

export default function ExecutionPage() {
  const { user, can } = useAuth();
  const [activeTab, setActiveTab] = useState('commitments');
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stuckItems, setStuckItems] = useState<StuckNeedItem[]>([]);

  // Selected item drawer
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | null>(null);
  const [showStuckModal, setShowStuckModal] = useState(false);
  const [stuckReason, setStuckReason] = useState('');
  const [needDesc, setNeedDesc] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.execution.getCommitments(),
      apiClient.execution.getTasks(),
      apiClient.execution.getStuckNeeds(),
    ]).then(([cRes, tRes, sRes]) => {
      setCommitments(cRes);
      setTasks(tRes);
      setStuckItems(sRes);
    });
  }, []);

  const tabs = [
    { id: 'commitments', label: 'Commitments', count: commitments.length },
    { id: 'tasks', label: 'Tasks', count: tasks.length },
    { id: 'stuck', label: 'Stuck / Need Items', count: stuckItems.length },
  ];

  const commitmentColumns: Column<Commitment>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: row => <span className="font-bold text-brand-blue">{row.code}</span>,
    },
    {
      key: 'title',
      header: 'Title & Source',
      render: row => (
        <div>
          <p className="font-semibold text-text-primary">{row.title}</p>
          <p className="text-[11px] text-text-muted">{row.sourceTitle}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: row => (
        <Badge
          variant={
            row.priority === 'CRITICAL'
              ? 'danger'
              : row.priority === 'HIGH'
              ? 'warning'
              : 'neutral'
          }
        >
          {row.priority}
        </Badge>
      ),
    },
    {
      key: 'responsibleName',
      header: 'Responsible (R)',
      render: row => <span className="font-medium text-text-primary">{row.responsibleName}</span>,
    },
    {
      key: 'accountableName',
      header: 'Accountable (A)',
      render: row => <span className="font-medium text-brand-blue">{row.accountableName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'progressPercent',
      header: 'Progress',
      render: row => <ProgressBar value={row.progressPercent} showLabel={false} size="sm" className="w-20" />,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: row => <span className="font-medium text-text-secondary">{row.dueDate}</span>,
    },
  ];

  const taskColumns: Column<Task>[] = [
    {
      key: 'code',
      header: 'Task ID',
      sortable: true,
      render: row => <span className="font-bold text-brand-blue">{row.code}</span>,
    },
    {
      key: 'title',
      header: 'Task Description',
      render: row => (
        <div>
          <p className="font-semibold text-text-primary">{row.title}</p>
          <p className="text-[11px] text-text-muted">{row.departmentName}</p>
        </div>
      ),
    },
    {
      key: 'assigneeName',
      header: 'Assignee',
      render: row => <span className="font-medium text-text-primary">{row.assigneeName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'dueDate',
      header: 'Deadline',
      render: row => <span className="font-medium text-text-secondary">{row.dueDate}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-workspace-border rounded-lg p-6 shadow-card">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Execution & Work Tracker</h2>
          <p className="text-xs text-text-secondary mt-1">
            Track commitments, task assignments, RACI matrices, and operational blockers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStuckModal(true)}
            leftIcon={<AlertTriangle className="w-4 h-4 text-brand-red" />}
          >
            Report Stuck / Need
          </Button>
          {can('commitment.create') && (
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create Commitment
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Contents */}
      {activeTab === 'commitments' && (
        <DataTable
          columns={commitmentColumns}
          data={commitments}
          searchPlaceholder="Filter commitments by title, owner, status..."
          onRowClick={row => setSelectedCommitment(row)}
        />
      )}

      {activeTab === 'tasks' && (
        <DataTable
          columns={taskColumns}
          data={tasks}
          searchPlaceholder="Filter tasks by assignee, code, department..."
        />
      )}

      {activeTab === 'stuck' && (
        <div className="space-y-4">
          {stuckItems.map(item => (
            <div key={item.id} className="p-5 bg-white border border-red-200 rounded-lg shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-red-100 text-brand-red font-bold text-xs rounded uppercase">
                  Category: {item.stuckReasonCategory.replace('_', ' ')}
                </span>
                <span className="text-xs text-text-muted">Required By: <strong className="text-text-primary">{item.requiredByDate}</strong></span>
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary">{item.taskTitle}</h4>
                <p className="text-xs text-red-900 mt-1">{item.stuckReasonDetails}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-workspace-border rounded-md text-xs space-y-1">
                <p className="font-semibold text-brand-blue">Need: {item.needDescription}</p>
                <p className="text-text-muted">Provider: <strong className="text-text-primary">{item.providedByUserName}</strong> | Reported by: {item.reportedByUserName}</p>
                <p className="text-text-muted">Impact: {item.businessImpact}</p>
              </div>
              {can('stuck.resolve') && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline">
                    Resolve Blocker
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected Commitment Drawer */}
      {selectedCommitment && (
        <Drawer
          isOpen={!!selectedCommitment}
          onClose={() => setSelectedCommitment(null)}
          title={`Commitment: ${selectedCommitment.code}`}
          subtitle={selectedCommitment.title}
        >
          <div className="space-y-6 text-xs">
            <div className="space-y-1">
              <span className="text-text-muted">Status</span>
              <div><StatusBadge status={selectedCommitment.status} /></div>
            </div>

            <div className="space-y-1">
              <span className="text-text-muted font-bold uppercase tracking-wider">Description</span>
              <p className="text-text-primary leading-relaxed bg-slate-50 p-3 rounded border border-workspace-border">
                {selectedCommitment.description}
              </p>
            </div>

            {/* RACI Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-text-primary uppercase tracking-wider">RACI Assignment Set</h4>
              <div className="space-y-2">
                {selectedCommitment.raci.map(member => (
                  <div key={member.userId} className="p-2.5 bg-white border border-workspace-border rounded-md flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text-primary">{member.userName}</p>
                      <p className="text-[10px] text-text-muted">{member.userRoleTitle} ({member.departmentName})</p>
                    </div>
                    <Badge variant={member.role === 'A' ? 'primary' : member.role === 'R' ? 'warning' : 'neutral'}>
                      {member.role} — {member.role === 'R' ? 'Responsible' : member.role === 'A' ? 'Accountable' : member.role === 'C' ? 'Consulted' : 'Informed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-workspace-border flex justify-end gap-2">
              {can('commitment.approve') && selectedCommitment.status === 'PENDING_APPROVAL' && (
                <Button size="sm">Approve Commitment</Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedCommitment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Report Stuck Modal */}
      <Modal
        isOpen={showStuckModal}
        onClose={() => setShowStuckModal(false)}
        title="Report Execution Blocker (Stuck / Need)"
        subtitle="Log what is blocking work progress and who can resolve it"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase text-text-secondary mb-1">Stuck Category</label>
            <select className="w-full p-2 border border-workspace-border rounded-md text-xs bg-white">
              <option>VENDOR_DELAY — Vendor or External Delay</option>
              <option>WAITING_DECISION — Waiting for Management Decision</option>
              <option>TECHNICAL — Technical / IT Blocker</option>
              <option>WAITING_PERSON — Waiting for Person</option>
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase text-text-secondary mb-1">Reason Details</label>
            <textarea
              rows={3}
              value={stuckReason}
              onChange={e => setStuckReason(e.target.value)}
              placeholder="Describe why the task or commitment is currently stuck..."
              className="w-full p-2 border border-workspace-border rounded-md text-xs bg-white"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-text-secondary mb-1">What is Needed to Resume?</label>
            <input
              type="text"
              value={needDesc}
              onChange={e => setNeedDesc(e.target.value)}
              placeholder="Explicit requirement (e.g. API authentication keys)"
              className="w-full p-2 border border-workspace-border rounded-md text-xs bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowStuckModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setShowStuckModal(false)} leftIcon={<Send className="w-3.5 h-3.5" />}>
              Submit Blocker Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
