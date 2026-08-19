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
import { EmptyState } from '../../../components/ui/States';
import { Commitment, Task, StuckNeedItem } from '../../../types/execution';
import { useAuth } from '../../../lib/auth/AuthContext';
import { executionStore } from '../../../lib/mocks/executionMock';
import { CreateCommitmentModal } from '../../../components/modals/CreateCommitmentModal';
import { ReportStuckModal } from '../../../components/modals/ReportStuckModal';

export default function ExecutionPage() {
  const { user, can } = useAuth();
  const [activeTab, setActiveTab] = useState('commitments');
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stuckItems, setStuckItems] = useState<StuckNeedItem[]>([]);

  // Modals
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | null>(null);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [isStuckModalOpen, setIsStuckModalOpen] = useState(false);

  const refreshData = () => {
    setCommitments([...executionStore.getCommitments()]);
    setTasks([...executionStore.getTasks()]);
    setStuckItems([...executionStore.getStuckNeeds()]);
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = executionStore.subscribe(refreshData);
    return () => {
      unsubscribe();
    };
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
      render: row => <span className="font-bold text-brand-blue font-mono">{row.code}</span>,
    },
    {
      key: 'title',
      header: 'Title & Source',
      render: row => (
        <div>
          <p className="font-semibold text-slate-900">{row.title}</p>
          <p className="text-[11px] text-slate-500">{row.sourceTitle}</p>
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
      render: row => <span className="font-medium text-slate-900">{row.responsibleName}</span>,
    },
    {
      key: 'accountableName',
      header: 'Accountable (A)',
      render: row => <span className="font-medium text-slate-600">{row.accountableName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'progressPercent',
      header: 'Progress',
      render: row => <ProgressBar value={row.progressPercent} showLabel={true} size="sm" className="w-24" />,
    },
    {
      key: 'dueDate',
      header: 'Target Date',
      sortable: true,
      render: row => <span className="font-medium text-slate-600 font-mono text-xs">{row.dueDate}</span>,
    },
  ];

  const taskColumns: Column<Task>[] = [
    {
      key: 'code',
      header: 'Task Code',
      sortable: true,
      render: row => <span className="font-mono text-xs font-bold text-brand-blue">{row.code}</span>,
    },
    {
      key: 'title',
      header: 'Task & Department',
      render: row => (
        <div>
          <p className="font-semibold text-slate-900">{row.title}</p>
          <p className="text-[11px] text-slate-500">{row.departmentName}</p>
        </div>
      ),
    },
    {
      key: 'assigneeName',
      header: 'Assignee',
      render: row => (
        <div>
          <p className="font-medium text-slate-900">{row.assigneeName}</p>
          <p className="text-[10px] text-slate-500">{row.assigneeRoleTitle}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: row => <Badge variant={row.priority === 'CRITICAL' ? 'danger' : 'neutral'}>{row.priority}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: row => <span className="text-xs font-mono text-slate-600">{row.dueDate}</span>,
    },
  ];

  const stuckColumns: Column<StuckNeedItem>[] = [
    {
      key: 'id',
      header: 'ID',
      render: row => <span className="font-mono text-xs font-bold text-brand-red">{row.id}</span>,
    },
    {
      key: 'taskTitle',
      header: 'Blocked Task',
      render: row => <span className="font-semibold text-slate-900">{row.taskTitle}</span>,
    },
    {
      key: 'stuckReasonCategory',
      header: 'Reason Category',
      render: row => <Badge variant="warning">{row.stuckReasonCategory.replace('_', ' ')}</Badge>,
    },
    {
      key: 'needDescription',
      header: 'What is Needed',
      render: row => <p className="text-xs text-slate-800">{row.needDescription}</p>,
    },
    {
      key: 'providedByUserName',
      header: 'Provider',
      render: row => <span className="font-medium text-slate-900">{row.providedByUserName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-card">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Execution Engine & Commitment Tracking</h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Track organizational commitments, RACI accountability matrices, tasks, and stuck/need escalations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {can('commitment.create') && (
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCommitmentModalOpen(true)}>
              New Commitment
            </Button>
          )}
          {can('stuck.create') && (
            <Button variant="danger" size="sm" leftIcon={<AlertTriangle className="w-4 h-4" />} onClick={() => setIsStuckModalOpen(true)}>
              Report Blocker / Stuck
            </Button>
          )}
        </div>
      </div>

      {/* TABS */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* COMMITMENTS TAB */}
      {activeTab === 'commitments' && (
        <div>
          {commitments.length === 0 ? (
            <EmptyState
              title="No Commitments Recorded"
              description="Start by creating an organizational commitment to automate sub-task generation and RACI assignments."
              action={<Button size="sm" onClick={() => setIsCommitmentModalOpen(true)}>+ Create Commitment</Button>}
            />
          ) : (
            <DataTable
              columns={commitmentColumns}
              data={commitments}
              onRowClick={row => setSelectedCommitment(row)}
            />
          )}
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <div>
          {tasks.length === 0 ? (
            <EmptyState
              title="No Execution Tasks"
              description="No sub-tasks currently assigned. Creating a commitment will automatically derive initial execution tasks."
              action={<Button size="sm" onClick={() => setIsCommitmentModalOpen(true)}>+ Create Commitment</Button>}
            />
          ) : (
            <DataTable columns={taskColumns} data={tasks} />
          )}
        </div>
      )}

      {/* STUCK ITEMS TAB */}
      {activeTab === 'stuck' && (
        <div>
          {stuckItems.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-card space-y-3">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 font-bold">
                ✓
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero Blocked Workflows</h3>
              <p className="text-xs font-medium text-slate-600 max-w-md mx-auto">
                No tasks are currently flagged as stuck. Use &quot;Report Blocker / Stuck&quot; if an operational task encounters a vendor, resource, or decision blocker.
              </p>
              <Button variant="outline" size="sm" onClick={() => setIsStuckModalOpen(true)}>
                Report Blocker / Stuck
              </Button>
            </div>
          ) : (
            <DataTable columns={stuckColumns} data={stuckItems} />
          )}
        </div>
      )}

      {/* COMMITMENT DETAIL DRAWER */}
      {selectedCommitment && (
        <Drawer
          isOpen={Boolean(selectedCommitment)}
          onClose={() => setSelectedCommitment(null)}
          title={`${selectedCommitment.code} — Commitment Details`}
        >
          <div className="space-y-6">
            <div>
              <span className="text-xs text-brand-blue font-bold uppercase">{selectedCommitment.sourceTitle}</span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedCommitment.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedCommitment.description}</p>
            </div>

            {/* RACI Matrix Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">RACI Accountability Matrix</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white border border-slate-200 rounded">
                  <span className="font-bold text-brand-blue">R (Responsible): </span>
                  <span className="text-slate-900">{selectedCommitment.responsibleName}</span>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded">
                  <span className="font-bold text-emerald-700">A (Accountable): </span>
                  <span className="text-slate-900">{selectedCommitment.accountableName}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedCommitment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* MODALS */}
      <CreateCommitmentModal
        isOpen={isCommitmentModalOpen}
        onClose={() => setIsCommitmentModalOpen(false)}
        onSuccess={refreshData}
      />

      <ReportStuckModal
        isOpen={isStuckModalOpen}
        onClose={() => setIsStuckModalOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  );
}
