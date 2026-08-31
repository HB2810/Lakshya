'use client';

import React, { useState, useEffect } from 'react';
import {
 TrendingUp,
 AlertTriangle,
 CheckSquare,
 Download,
 Building2,
 Users,
 Target,
 ShieldAlert,
 BarChart3,
 RefreshCw,
 ShieldCheck,
} from 'lucide-react';
import { Card, Stat } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import { apiClient } from '../../../lib/api/client';
import { AuditLogViewer } from '../../../components/audit/AuditLogViewer';

export default function ReportsPage() {
 const [analytics, setAnalytics] = useState<any>(null);
 const [isLoading, setIsLoading] = useState<boolean>(true);
 const [activeTab, setActiveTab] = useState<'analytics' | 'audit'>('analytics');

 const fetchAnalytics = async () => {
  setIsLoading(true);
  try {
   const data = await apiClient.analytics.getOperationalAnalytics();
   setAnalytics(data);
  } finally {
   setIsLoading(false);
  }
 };

 useEffect(() => {
  fetchAnalytics();
 }, []);

 const summary = analytics?.summary || {
  total_work_items: 0,
  active_count: 0,
  completed_count: 0,
  blocked_count: 0,
  overdue_count: 0,
  escalated_count: 0,
  on_time_rate_percent: 100,
  avg_resolution_days: 1.6,
 };

 const deptMetrics = analytics?.department_metrics || [];
 const workloadMetrics = analytics?.workload_metrics || [];
 const priorityProgress = analytics?.priority_progress || [];

 return (
  <div className="space-y-6 max-w-7xl mx-auto">
   {/* Header */}
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
    <div>
     <div className="flex flex-wrap items-center gap-2">
      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
       <BarChart3 className="w-3.5 h-3.5" />
       Operational Intelligence
      </span>
      <span className="text-xs text-slate-500 font-mono">
       • Scope: {analytics?.scope || 'ORGANIZATION'}
      </span>
     </div>
     <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
      Management Intelligence & Governance
     </h2>
     <p className="text-xs text-slate-500 mt-0.5">
      Real-time execution telemetry, department velocity, throughput metrics, and append-only audit ledger.
     </p>
    </div>

    <div className="flex w-full items-center gap-2 overflow-x-auto overscroll-x-contain sm:w-auto">
     {/* Active Tab Toggle */}
     <div className="flex shrink-0 items-center bg-slate-100 p-1 rounded-xl">
      <button
       type="button"
       onClick={() => setActiveTab('analytics')}
       className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
        activeTab === 'analytics'
         ? 'bg-white text-slate-900 shadow-xs'
         : 'text-slate-500 hover:text-slate-900'
       }`}
      >
       <BarChart3 className="w-3.5 h-3.5" />
       <span>Operational Analytics</span>
      </button>
      <button
       type="button"
       onClick={() => setActiveTab('audit')}
       className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
        activeTab === 'audit'
         ? 'bg-white text-slate-900 shadow-xs'
         : 'text-slate-500 hover:text-slate-900'
       }`}
      >
       <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
       <span>Audit Ledger</span>
      </button>
     </div>

     <button
      type="button"
      onClick={fetchAnalytics}
      disabled={isLoading}
      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
      title="Refresh analytics"
     >
      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
     </button>
    </div>
   </div>

   {activeTab === 'audit' ? (
    <AuditLogViewer />
   ) : (
    <>
     {/* Overview Stats Bar */}
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat
       label="Active Commitments"
       value={summary.active_count.toString()}
       change={`${summary.total_work_items} Total Items`}
       changeType="neutral"
       icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
      />
      <Stat
       label="On-Time Delivery Rate"
       value={`${summary.on_time_rate_percent}%`}
       change={`${summary.overdue_count} Overdue`}
       changeType={summary.overdue_count === 0 ? 'positive' : 'negative'}
       icon={<CheckSquare className="w-5 h-5 text-emerald-600" />}
      />
      <Stat
       label="Blocked / Escalated"
       value={(summary.blocked_count + summary.escalated_count).toString()}
       change={`${summary.blocked_count} Blocked, ${summary.escalated_count} Escalated`}
       changeType={summary.blocked_count === 0 ? 'positive' : 'negative'}
       icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
      />
      <Stat
       label="Completed Throughput"
       value={summary.completed_count.toString()}
       change={`Avg ${summary.avg_resolution_days}d cycle`}
       changeType="positive"
       icon={<Target className="w-5 h-5 text-indigo-600" />}
      />
     </div>

     {/* Reports Breakdown Grid */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Department Execution Performance */}
      <Card title="Department Execution Performance">
       {deptMetrics.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
         No department execution data available.
        </div>
       ) : (
        <div className="space-y-4 text-xs">
         {deptMetrics.map((dept: any) => (
          <div key={dept.department_id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
           <div className="flex justify-between items-center mb-1.5">
            <span className="font-bold text-slate-900">{dept.department_name}</span>
            <div className="flex items-center gap-2">
             <span className="text-[11px] text-slate-500">
              {dept.active_count} Active • {dept.completed_count} Done
             </span>
             {dept.blocked_count > 0 && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 font-bold text-[10px] rounded">
               {dept.blocked_count} Blocked
              </span>
             )}
             <span className="font-black text-indigo-600">
              {dept.completion_rate_percent}%
             </span>
            </div>
           </div>
           <ProgressBar value={dept.completion_rate_percent} showLabel={false} size="sm" />
          </div>
         ))}
        </div>
       )}
      </Card>

      {/* Strategic Priorities Stepper Progress */}
      <Card title="Strategic Priorities 10-Milestone Velocity">
       {priorityProgress.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
         No active strategic priorities found.
        </div>
       ) : (
        <div className="space-y-3 text-xs">
         {priorityProgress.map((qp: any) => (
          <div key={qp.priority_id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
           <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {qp.quarter} {qp.year}
             </span>
             <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Step {qp.current_step} of 10
             </span>
            </div>
            <p className="font-bold text-slate-900 truncate">{qp.title}</p>
           </div>
           <div className="text-right shrink-0">
            <span className="text-lg font-black text-emerald-600">{qp.progress_percent}%</span>
            <p className="text-[10px] font-semibold text-slate-500 uppercase">Delivered</p>
           </div>
          </div>
         ))}
        </div>
       )}
      </Card>
     </div>

     {/* Staff & Leader Workload Breakdown */}
     {workloadMetrics.length > 0 && (
      <Card title="Operational Workload & Task Distribution by Owner">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {workloadMetrics.map((user: any) => (
         <div key={user.user_id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center gap-2">
           <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
            {user.user_name.charAt(0)}
           </div>
           <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 truncate">{user.user_name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.department_name || 'Staff'}</p>
           </div>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-200/60 text-center">
           <div className="bg-white p-1 rounded">
            <span className="block font-black text-slate-800">{user.active_count}</span>
            <span className="block text-[9px] text-slate-400 uppercase font-bold">Active</span>
           </div>
           <div className="bg-white p-1 rounded">
            <span className="block font-black text-emerald-600">{user.completed_count}</span>
            <span className="block text-[9px] text-emerald-600 uppercase font-bold">Done</span>
           </div>
           <div className="bg-white p-1 rounded">
            <span className="block font-black text-red-600">{user.blocked_count}</span>
            <span className="block text-[9px] text-red-500 uppercase font-bold">Stuck</span>
           </div>
          </div>
         </div>
        ))}
       </div>
      </Card>
     )}
    </>
   )}
  </div>
 );
}
