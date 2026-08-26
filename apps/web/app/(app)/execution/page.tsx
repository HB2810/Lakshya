'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Tabs } from '../../../components/ui/Tabs';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Drawer } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/States';
import { Commitment } from '../../../types/execution';
import { WorkItem } from '../../../types/workItem';
import { useAuth } from '../../../lib/auth/AuthContext';
import { executionStore } from '../../../lib/mocks/executionMock';
import { apiClient } from '../../../lib/api/client';
import { CreateCommitmentModal } from '../../../components/modals/CreateCommitmentModal';
import { ReportStuckModal } from '../../../components/modals/ReportStuckModal';

export default function ExecutionPage() {
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState('commitments');
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Modals
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | null>(null);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [isStuckModalOpen, setIsStuckModalOpen] = useState(false);

  const fetchWorkItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await apiClient.workItems.list();
      setWorkItems(res.items || []);
    } catch {
      // ignore
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    setCommitments([...executionStore.getCommitments()]);
    fetchWorkItems();
  }, [fetchWorkItems]);

  useEffect(() => {
    refreshData();
    const unsubscribe = executionStore.subscribe(refreshData);
    return () => {
      unsubscribe();
    };
  }, [refreshData]);

  const stuckWorkItems = workItems.filter(w => w.status === 'stuck' || w.status === 'blocked');

  const tabs = [
    { id: 'commitments', label: 'Commitments', count: commitments.length },
    { id: 'tasks', label: 'Canonical Work Items', count: workItems.length },
    { id: 'stuck', label: 'Stuck / Blocked Items', count: stuckWorkItems.length },
  ];

  const commitmentColumns: Column<Commitment>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: row => <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{row.code}</span>,
    },
    {
      key: 'title',
      header: 'Title & Source',
      render: row => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.title}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.sourceTitle}</p>
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
      render: row => <span className="font-medium text-slate-900 dark:text-white">{row.responsibleName}</span>,
    },
    {
      key: 'accountableName',
      header: 'Accountable (A)',
      render: row => <span className="font-medium text-slate-600 dark:text-slate-400">{row.accountableName}</span>,
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
      render: row => <span className="font-medium text-slate-600 dark:text-slate-400 font-mono text-xs">{row.dueDate}</span>,
    },
  ];

  const workItemColumns: Column<WorkItem>[] = [
    {
      key: 'title',
      header: 'Title & Source',
      render: row => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.title}</p>
          {row.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{row.description}</p>
          )}
          {row.source_type && (
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Source: {row.source_type.toUpperCase()}</span>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: row => <Badge variant={row.priority === 'urgent' ? 'danger' : 'neutral'}>{row.priority.toUpperCase()}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'due_at',
      header: 'Due Date',
      render: row => <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{row.due_at ? row.due_at.substring(0, 10) : 'N/A'}</span>,
    },
    {
      key: 'completed_at',
      header: 'Completed At',
      render: row => <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{row.completed_at ? row.completed_at.substring(0, 10) : '—'}</span>,
    },
  ];

  const stuckColumns: Column<WorkItem>[] = [
    {
      key: 'title',
      header: 'Blocked Work Item',
      render: row => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-white">{row.title}</span>
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">
            Reason: {row.blocked_reason || 'Blocker reported'}
          </p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: row => <Badge variant="danger">{row.priority.toUpperCase()}</Badge>,
    },
    {
      key: 'blocked_at',
      header: 'Blocked Since',
      render: row => <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{row.blocked_at ? row.blocked_at.substring(0, 10) : 'N/A'}</span>,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Execution Engine & Canonical Work</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Track organizational commitments, RACI matrices, canonical WorkItems, and blocker resolution.
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

      {/* CANONICAL WORK ITEMS TAB */}
      {activeTab === 'tasks' && (
        <div>
          {loadingItems ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">Loading WorkItems...</div>
          ) : workItems.length === 0 ? (
            <EmptyState
              title="No Work Items Recorded"
              description="No canonical work items exist yet. Use Smart Work Intake or Meeting Extraction on Overview page."
            />
          ) : (
            <DataTable columns={workItemColumns} data={workItems} />
          )}
        </div>
      )}

      {/* STUCK ITEMS TAB */}
      {activeTab === 'stuck' && (
        <div>
          {stuckWorkItems.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-3">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 font-bold">
                ✓
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero Blocked Workflows</h3>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                No work items are currently flagged as stuck. Use &quot;Report Blocker / Stuck&quot; if an operational task encounters a vendor, resource, or decision blocker.
              </p>
              <Button variant="outline" size="sm" onClick={() => setIsStuckModalOpen(true)}>
                Report Blocker / Stuck
              </Button>
            </div>
          ) : (
            <DataTable columns={stuckColumns} data={stuckWorkItems} />
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
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase">{selectedCommitment.sourceTitle}</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedCommitment.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{selectedCommitment.description}</p>
            </div>

            {/* RACI Matrix Breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">RACI Accountability Matrix</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">R (Responsible): </span>
                  <span className="text-slate-900 dark:text-white">{selectedCommitment.responsibleName}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">A (Accountable): </span>
                  <span className="text-slate-900 dark:text-white">{selectedCommitment.accountableName}</span>
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
