'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  CheckSquare,
  AlertTriangle,
  Calendar,
  Clock,
  Plus,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { Card, Stat } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/States';
import { apiClient } from '../../../lib/api/client';
import { Commitment } from '../../../types/execution';
import { useAuth } from '../../../lib/auth/AuthContext';
import { executionStore } from '../../../lib/mocks/executionMock';
import { CreateCommitmentModal } from '../../../components/modals/CreateCommitmentModal';

export default function OverviewPage() {
  const { user, can } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);

  const refreshData = () => {
    Promise.resolve(apiClient.dashboard.getMDOverview()).then(res => {
      setData(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    refreshData();
    const unsubscribeExecution = executionStore.subscribe(refreshData);
    return () => {
      unsubscribeExecution();
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-sm">
        Loading Executive Dashboard Intelligence...
      </div>
    );
  }

  const commitmentColumns: Column<Commitment>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: row => <span className="font-bold text-brand-blue font-mono">{row.code}</span>,
    },
    {
      key: 'title',
      header: 'Commitment Title',
      render: row => (
        <div>
          <p className="font-semibold text-slate-900 line-clamp-1">{row.title}</p>
          <p className="text-[11px] text-slate-500">{row.sourceTitle}</p>
        </div>
      ),
    },
    {
      key: 'responsibleName',
      header: 'Owner (R/A)',
      render: row => (
        <div className="text-xs">
          <p className="font-medium text-slate-900">{row.responsibleName} (R)</p>
          <p className="text-[10px] text-slate-500">{row.accountableName} (A)</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'progressPercent',
      header: 'Progress',
      render: row => <ProgressBar value={row.progressPercent} showLabel={false} size="sm" className="w-24" />,
    },
    {
      key: 'dueDate',
      header: 'Target Date',
      sortable: true,
      render: row => <span className="font-medium text-slate-600 font-mono text-xs">{row.dueDate}</span>,
    },
  ];

  const stats = data?.stats || {
    activePrioritiesCount: 0,
    milestonesCompletionPercent: 0,
    commitmentsCount: 0,
    blockedItemsCount: 0,
    escalationsCount: 0,
  };

  const direction = data?.direction || {
    title: 'No Active Strategic Direction Set',
    description: 'Create a new quarterly direction or monthly priority to begin operational tracking.',
    objective: 'Define initial executive targets.',
    progressPercent: 0,
  };

  return (
    <div className="space-y-6">
      {/* EXECUTIVE HERO BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-card hover-lift-light">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 bg-blue-50 text-brand-blue border border-blue-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {data?.roleLabel || 'MD Office View'}
            </span>
            <span className="text-xs text-slate-500 font-mono">• {data?.currentDate || 'Today'}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">{data?.greeting || 'Executive Dashboard'}</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Operational snapshot for Stavya Spine Hospital commitments, priorities, and exception tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {can('commitment.create') && (
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCommitmentModalOpen(true)}>
              New Commitment
            </Button>
          )}
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Export Report
          </Button>
        </div>
      </div>

      {/* TOP METRIC STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Active Monthly Priorities"
          value={stats.activePrioritiesCount}
          change="Target Baseline"
          changeType="positive"
          icon={<Target className="w-5 h-5" />}
        />
        <Stat
          label="Weekly Milestones Progress"
          value={`${stats.milestonesCompletionPercent}%`}
          change="Active Week"
          changeType="positive"
          icon={<CheckSquare className="w-5 h-5" />}
        />
        <Stat
          label="Active Commitments"
          value={stats.commitmentsCount}
          subtext="Under execution"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <Stat
          label="Attention / Blocked Items"
          value={stats.blockedItemsCount}
          change={`${stats.escalationsCount} Escalated`}
          changeType={stats.blockedItemsCount > 0 ? 'negative' : 'neutral'}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* CURRENT DIRECTION BANNER */}
      <Card
        title="Current Strategic Direction — Q3 2026"
        action={<Badge variant="primary">ACTIVE QUARTER</Badge>}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{direction.title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{direction.description}</p>
          </div>

          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-lg">
            <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Strategic Objective</p>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">{direction.objective}</p>
          </div>

          <ProgressBar value={direction.progressPercent} size="md" color="blue" />
        </div>
      </Card>

      {/* TWO COLUMN LAYOUT: MONTHLY PRIORITIES & ATTENTION REQUIRED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Priorities & Active Commitments */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Monthly Priorities">
            {!data?.priorities || data.priorities.length === 0 ? (
              <EmptyState title="No Priorities Defined" description="No monthly priorities defined for this active period." />
            ) : (
              <div className="space-y-4">
                {data.priorities.map((p: any) => (
                  <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                        <p className="text-xs text-slate-500">
                          Owner: <span className="font-semibold text-slate-800">{p.ownerName}</span> ({p.departmentName})
                        </p>
                      </div>
                      <StatusBadge status={p.status} size="sm" />
                    </div>
                    <ProgressBar value={p.progressPercent} size="sm" showLabel={true} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active Commitments Table */}
          <Card title="Active Commitments & Execution Work">
            {!data?.commitments || data.commitments.length === 0 ? (
              <div className="py-6">
                <EmptyState
                  title="No Commitments Recorded"
                  description="Start by creating an organizational commitment to automate sub-task generation and RACI assignments."
                  action={<Button size="sm" onClick={() => setIsCommitmentModalOpen(true)}>+ Create Commitment</Button>}
                />
              </div>
            ) : (
              <DataTable columns={commitmentColumns} data={data.commitments} pageSize={5} />
            )}
          </Card>
        </div>

        {/* Right 1 Col: Attention Required & Upcoming Meetings */}
        <div className="space-y-6">
          {/* Attention Required Card */}
          <Card title="Attention Required" subtitle="Exceptions, Blockers & Escalations">
            {(!data?.stuckNeeds || data.stuckNeeds.length === 0) && (!data?.escalations || data.escalations.length === 0) ? (
              <div className="p-4 text-center text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                ✓ All execution workflows operating cleanly. 0 Blocked or Escalated items.
              </div>
            ) : (
              <div className="space-y-3">
                {data?.stuckNeeds?.map((sn: any) => (
                  <div key={sn.id} className="p-3.5 bg-red-50 border border-red-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-brand-red text-white text-[10px] font-bold rounded uppercase">
                        Stuck / Need
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{sn.requiredByDate}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 leading-tight mt-1">{sn.taskTitle}</p>
                    <p className="text-[11px] text-red-900">{sn.needDescription}</p>
                  </div>
                ))}

                {data?.escalations?.map((esc: any) => (
                  <div key={esc.id} className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded uppercase">
                        {esc.levelName}
                      </span>
                      <span className="text-[10px] font-mono text-amber-900 font-bold">{esc.code}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">{esc.targetTitle}</p>
                    <p className="text-[11px] text-amber-900">{esc.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Meetings */}
          <Card title="Upcoming Meetings & Decisions">
            {!data?.upcomingMeetings || data.upcomingMeetings.length === 0 ? (
              <EmptyState title="No Meetings Scheduled" description="No operational meetings currently scheduled." />
            ) : (
              <div className="space-y-3">
                {data.upcomingMeetings.map((m: any) => (
                  <div key={m.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="primary">{m.type.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">{m.title}</p>
                    <p className="text-[11px] text-slate-500">{m.locationOrLink}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* CREATE COMMITMENT MODAL */}
      <CreateCommitmentModal
        isOpen={isCommitmentModalOpen}
        onClose={() => setIsCommitmentModalOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  );
}
