'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  TrendingUp,
  Plus,
  Filter,
  Columns,
  List,
  CheckCircle2,
  Clock,
  User,
  Building2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

type OOType = 'OBSTACLE' | 'OPPORTUNITY';
type ViewMode = 'kanban' | 'list';

interface OOItem {
  id: string;
  type: OOType;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'UNDER_REVIEW' | 'APPROVED_FOR_ACTION' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'VERIFIED';
  raisedBy: string;
  assignedOwner: string;
  department: string;
  businessImpact: string;
  sourceMeeting?: string;
  createdAt: string;
}

const MOCK_OO_ITEMS: OOItem[] = [
  {
    id: 'oo-101',
    type: 'OBSTACLE',
    title: 'OPD Waiting Time API Latency',
    description: 'Real-time display API experiences 4-second delay during peak reception hours (10 AM - 12 PM).',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    raisedBy: 'Dr. Priyesh Shah (HOD OPD)',
    assignedOwner: 'Priyesh Shah',
    department: 'Outpatient Department',
    businessImpact: 'Causes reception display lag & patient confusion.',
    sourceMeeting: 'Executive Leadership Sync (W34)',
    createdAt: '2026-08-24',
  },
  {
    id: 'oo-102',
    type: 'OPPORTUNITY',
    title: 'Automated Spine Patient Post-Op Feedback Pipeline',
    description: 'Implement automated SMS feedback collection 3 days post-surgery.',
    priority: 'MEDIUM',
    status: 'APPROVED_FOR_ACTION',
    raisedBy: 'Het Bhatt (MD)',
    assignedOwner: 'Ananya Patel',
    department: 'MD Office / Quality',
    businessImpact: 'Expected 35% increase in post-op patient satisfaction data.',
    sourceMeeting: 'Monthly Strategy Review (August)',
    createdAt: '2026-08-20',
  },
  {
    id: 'oo-103',
    type: 'OBSTACLE',
    title: 'Pharmacy Inventory Reconciliation Bottleneck',
    description: 'Discrepancy between HIS inventory count and physical shelf count in ICU pharmacy.',
    priority: 'CRITICAL',
    status: 'OPEN',
    raisedBy: 'Rajesh Verma (HOD Pharmacy)',
    assignedOwner: 'Rajesh Verma',
    department: 'Pharmacy',
    businessImpact: 'Delayed medication dispensing for critical cases.',
    createdAt: '2026-08-25',
  },
  {
    id: 'oo-104',
    type: 'OPPORTUNITY',
    title: 'Digital Consent Signatures on Reception Kiosks',
    description: 'Deploy iPad consent forms at reception to remove paper filing.',
    priority: 'HIGH',
    status: 'RESOLVED',
    raisedBy: 'Ananya Patel',
    assignedOwner: 'Priyesh Shah',
    department: 'IT / Reception',
    businessImpact: 'Saves 12 minutes per patient intake.',
    createdAt: '2026-08-15',
  },
];

const KANBAN_COLUMNS = [
  { id: 'OPEN', label: 'Open', color: 'border-t-slate-400' },
  { id: 'UNDER_REVIEW', label: 'Under Review', color: 'border-t-amber-400' },
  { id: 'APPROVED_FOR_ACTION', label: 'Approved for Action', color: 'border-t-blue-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-purple-500' },
  { id: 'RESOLVED', label: 'Resolved / Verified', color: 'border-t-emerald-500' },
];

export default function OOPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  const filteredItems = MOCK_OO_ITEMS.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (filterPriority !== 'ALL' && item.priority !== filterPriority) return false;
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge variant="danger">Critical Impact</Badge>;
      case 'HIGH':
        return <Badge variant="warning">High Impact</Badge>;
      case 'MEDIUM':
        return <Badge variant="info">Medium Impact</Badge>;
      default:
        return <Badge variant="neutral">Low Impact</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">O&O Hub — Obstacle & Opportunity</h1>
            <p className="text-sm text-slate-500">
              Track operational bottlenecks and strategic growth opportunities with full provenance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white shadow-md shadow-brand-blue/20">
            <Plus className="w-4 h-4" /> Raise O&O
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List View
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All O&O
            </button>
            <button
              onClick={() => setFilterType('OBSTACLE')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterType === 'OBSTACLE' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'
              }`}
            >
              Obstacles
            </button>
            <button
              onClick={() => setFilterType('OPPORTUNITY')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterType === 'OPPORTUNITY' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              Opportunities
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
          </select>
        </div>
      </Card>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const itemsInCol = filteredItems.filter((i) =>
              col.id === 'RESOLVED' ? i.status === 'RESOLVED' || i.status === 'VERIFIED' : i.status === col.id
            );

            return (
              <div key={col.id} className="space-y-3 min-w-[260px]">
                <div className={`p-3 bg-slate-100/70 rounded-xl border-t-4 ${col.color} flex items-center justify-between`}>
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                    {col.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-xs font-bold text-slate-600 shadow-2xs">
                    {itemsInCol.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[400px]">
                  {itemsInCol.map((item) => (
                    <Card key={item.id} className="p-4 space-y-3 hover:shadow-md transition-all border-slate-200">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            item.type === 'OBSTACLE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.type}
                        </span>
                        {getPriorityBadge(item.priority)}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[100px]">{item.assignedOwner}</span>
                        </div>
                        <span className="text-slate-400">{item.department}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-5 border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      item.type === 'OBSTACLE'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {item.type}
                  </span>
                  {getPriorityBadge(item.priority)}
                  <span className="text-xs text-slate-400">• Raised by {item.raisedBy}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600">{item.description}</p>

                <div className="text-xs text-slate-500 pt-1 font-medium">
                  <strong>Impact:</strong> {item.businessImpact}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="neutral">{item.status.replace('_', ' ')}</Badge>
                <Button variant="outline" className="text-xs font-semibold border-slate-200">
                  Update Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
