'use client';

import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckSquare, Layers, Download } from 'lucide-react';
import { Card, Stat } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-workspace-border rounded-lg p-6 shadow-card">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Management Intelligence & Reports</h2>
          <p className="text-xs text-text-secondary mt-1">
            Executive performance telemetry, priority progress, commitment throughput, and risk analytics.
          </p>
        </div>
        <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />}>
          Export Audit Brief
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Overall Strategy Velocity" value="78%" change="+12% this month" changeType="positive" icon={<TrendingUp className="w-5 h-5" />} />
        <Stat label="On-Time Commitment Rate" value="92%" change="2 overdue" changeType="neutral" icon={<CheckSquare className="w-5 h-5" />} />
        <Stat label="Average Stuck Resolution Time" value="1.8 Days" change="-0.4 days improvement" changeType="positive" icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      {/* Reports Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Department Execution Performance">
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-text-primary">Spine Surgery</span>
                <span className="font-bold text-brand-blue">88%</span>
              </div>
              <ProgressBar value={88} showLabel={false} size="sm" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-text-primary">Hospital Operations</span>
                <span className="font-bold text-brand-blue">74%</span>
              </div>
              <ProgressBar value={74} showLabel={false} size="sm" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-text-primary">IT & Digital Health</span>
                <span className="font-bold text-amber-600">45% (At Risk)</span>
              </div>
              <ProgressBar value={45} color="amber" showLabel={false} size="sm" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-text-primary">Physiotherapy & Rehab</span>
                <span className="font-bold text-brand-blue">82%</span>
              </div>
              <ProgressBar value={82} showLabel={false} size="sm" />
            </div>
          </div>
        </Card>

        <Card title="Commitment Lifecycle Summary">
          <div className="p-4 bg-slate-50 border border-workspace-border rounded-lg space-y-3 text-xs">
            <div className="flex justify-between p-2.5 bg-white border border-workspace-border rounded">
              <span>Total Active Commitments</span>
              <span className="font-bold">14</span>
            </div>
            <div className="flex justify-between p-2.5 bg-white border border-workspace-border rounded text-emerald-700">
              <span>Completed This Month</span>
              <span className="font-bold">8</span>
            </div>
            <div className="flex justify-between p-2.5 bg-white border border-workspace-border rounded text-brand-red">
              <span>Escalated Blockers</span>
              <span className="font-bold">1</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
