'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  CheckSquare,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowUpRight,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { Card, Stat } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { apiClient } from '../../../lib/api/client';
import { Commitment } from '../../../types/execution';
import { useAuth } from '../../../lib/auth/AuthContext';

export default function OverviewPage() {
  const { user, can } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.dashboard.getMDOverview().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-text-muted">
        Loading MD Office Executive Dashboard...
      </div>
    );
  }

  const commitmentColumns: Column<Commitment>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: row => <span className="font-bold text-brand-blue">{row.code}</span>,
    },
    {
      key: 'title',
      header: 'Commitment Title',
      render: row => (
        <div>
          <p className="font-semibold text-text-primary line-clamp-1">{row.title}</p>
          <p className="text-[11px] text-text-muted">{row.sourceTitle}</p>
        </div>
      ),
    },
    {
      key: 'responsibleName',
      header: 'Owner (R/A)',
      render: row => (
        <div className="text-xs">
          <p className="font-medium text-text-primary">{row.responsibleName} (R)</p>
          <p className="text-[10px] text-text-muted">{row.accountableName} (A)</p>
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
      render: row => <span className="font-medium text-text-secondary">{row.dueDate}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-workspace-border rounded-lg p-6 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-brand-blue border border-blue-200 text-xs font-bold rounded-full uppercase tracking-wider">
              {data.roleLabel}
            </span>
            <span className="text-xs text-text-muted">• {data.currentDate}</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight mt-1">{data.greeting}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Operational snapshot for Stavya Spine Hospital commitments, priorities, and exception tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {can('commitment.create') && (
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
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
          value={data.stats.activePrioritiesCount}
          change="Q3 Direction"
          changeType="positive"
          icon={<Target className="w-5 h-5" />}
        />
        <Stat
          label="Weekly Milestones Progress"
          value={`${data.stats.milestonesCompletionPercent}%`}
          change="Week 34"
          changeType="positive"
          icon={<CheckSquare className="w-5 h-5" />}
        />
        <Stat
          label="Active Commitments"
          value={data.stats.commitmentsCount}
          subtext="Under execution"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <Stat
          label="Attention / Blocked Items"
          value={data.stats.blockedItemsCount}
          change={`${data.stats.escalationsCount} Escalated`}
          changeType="negative"
          icon={<AlertTriangle className="w-5 h-5 text-brand-red" />}
        />
      </div>

      {/* CURRENT DIRECTION BANNER */}
      <Card
        title="Current Strategic Direction — Q3 2026"
        action={<Badge variant="primary">ACTIVE QUARTER</Badge>}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-text-primary">{data.direction.title}</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{data.direction.description}</p>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-md">
            <p className="text-xs font-semibold text-brand-blue uppercase tracking-wider">Strategic Objective</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{data.direction.objective}</p>
          </div>

          <ProgressBar value={data.direction.progressPercent} size="md" />
        </div>
      </Card>

      {/* TWO COLUMN LAYOUT: MONTHLY PRIORITIES & ATTENTION REQUIRED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Priorities & Weekly Milestones */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Monthly Priorities (August 2026)">
            <div className="space-y-4">
              {data.priorities.map((p: any) => (
                <div key={p.id} className="p-4 bg-workspace-subtle/50 border border-workspace-border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{p.title}</h4>
                      <p className="text-xs text-text-muted">
                        Owner: <span className="font-semibold text-text-primary">{p.ownerName}</span> ({p.departmentName})
                      </p>
                    </div>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                  <ProgressBar value={p.progressPercent} size="sm" showLabel={true} />
                </div>
              ))}
            </div>
          </Card>

          {/* Active Commitments Table */}
          <Card title="Active Commitments & Execution Work">
            <DataTable columns={commitmentColumns} data={data.commitments} pageSize={5} />
          </Card>
        </div>

        {/* Right 1 Col: Attention Required & Upcoming Meetings */}
        <div className="space-y-6">
          {/* Attention Required Card */}
          <Card title="Attention Required" subtitle="Exceptions, Blockers & Escalations">
            <div className="space-y-3">
              {data.stuckNeeds.map((sn: any) => (
                <div key={sn.id} className="p-3 bg-red-50/70 border border-red-200 rounded-md space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-brand-red text-white text-[10px] font-bold rounded uppercase">
                      Stuck / Need
                    </span>
                    <span className="text-[10px] text-text-muted">{sn.requiredByDate}</span>
                  </div>
                  <p className="text-xs font-bold text-text-primary leading-tight mt-1">{sn.taskTitle}</p>
                  <p className="text-[11px] text-red-900">{sn.needDescription}</p>
                  <p className="text-[10px] text-text-muted">
                    Provider: <span className="font-semibold">{sn.providedByUserName}</span>
                  </p>
                </div>
              ))}

              {data.escalations.map((esc: any) => (
                <div key={esc.id} className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded uppercase">
                      {esc.levelName}
                    </span>
                    <span className="text-[10px] font-mono text-amber-900 font-bold">{esc.code}</span>
                  </div>
                  <p className="text-xs font-bold text-text-primary mt-1">{esc.targetTitle}</p>
                  <p className="text-[11px] text-amber-900">{esc.reason}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Meetings */}
          <Card title="Upcoming Meetings & Decisions">
            <div className="space-y-3">
              {data.upcomingMeetings.map((m: any) => (
                <div key={m.id} className="p-3 bg-slate-50 border border-workspace-border rounded-md space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="primary">{m.type.replace('_', ' ')}</Badge>
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      19 Aug, 14:00
                    </span>
                  </div>
                  <p className="text-xs font-bold text-text-primary mt-1">{m.title}</p>
                  <p className="text-[11px] text-text-muted">{m.locationOrLink}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity Timeline */}
          <Card title="Recent Management Activity">
            <div className="space-y-3 border-l-2 border-slate-200 pl-3">
              {data.recentActivities.map((act: any) => (
                <div key={act.id} className="space-y-0.5 text-xs">
                  <p className="font-semibold text-text-primary">{act.action.replace('_', ' ')}</p>
                  <p className="text-[11px] text-text-secondary">{act.entityTitle}</p>
                  <span className="text-[10px] text-text-muted">
                    By {act.actorUserName} • {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
