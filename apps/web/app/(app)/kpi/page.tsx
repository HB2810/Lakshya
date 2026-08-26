'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap,
  User,
  Building2,
  Calendar,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';

interface KPIItem {
  id: string;
  name: string;
  description: string;
  department: string;
  owner: string;
  accountableLeader: string;
  unit: 'PERCENTAGE' | 'COUNT' | 'TIME' | 'CURRENCY';
  frequency: 'WEEKLY' | 'MONTHLY';
  targetValue: number;
  actualValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  isAutomated: boolean;
  lastRecordedDate: string;
}

const MOCK_KPIS: KPIItem[] = [
  {
    id: 'kpi-101',
    name: 'OPD Patient Reception Intake Time',
    description: 'Average time taken from reception arrival to registration completion.',
    department: 'Outpatient Department',
    owner: 'Priyesh Shah',
    accountableLeader: 'Dr. Priyesh Shah (HOD OPD)',
    unit: 'TIME',
    frequency: 'WEEKLY',
    targetValue: 8.0, // minutes
    actualValue: 6.5,
    warningThreshold: 9.0,
    criticalThreshold: 12.0,
    trend: 'DOWN',
    isAutomated: true,
    lastRecordedDate: '2026-08-25',
  },
  {
    id: 'kpi-102',
    name: 'Post-Op Spine Surgery Patient Satisfaction',
    description: 'Percentage of post-op patients rating care 9/10 or higher.',
    department: 'Quality & Clinical',
    owner: 'Ananya Patel',
    accountableLeader: 'Het Bhatt (MD)',
    unit: 'PERCENTAGE',
    frequency: 'MONTHLY',
    targetValue: 92.0, // %
    actualValue: 94.5,
    warningThreshold: 88.0,
    criticalThreshold: 85.0,
    trend: 'UP',
    isAutomated: false,
    lastRecordedDate: '2026-08-20',
  },
  {
    id: 'kpi-103',
    name: 'ICU Medication Dispensing Compliance',
    description: 'On-time ICU medication fulfillment rate from pharmacy.',
    department: 'Pharmacy',
    owner: 'Rajesh Verma',
    accountableLeader: 'Dr. Rajesh Verma (HOD Pharmacy)',
    unit: 'PERCENTAGE',
    frequency: 'WEEKLY',
    targetValue: 98.0,
    actualValue: 91.2,
    warningThreshold: 95.0,
    criticalThreshold: 90.0,
    trend: 'DOWN',
    isAutomated: true,
    lastRecordedDate: '2026-08-26',
  },
];

export default function KPIPage() {
  const [filterDepartment, setFilterDepartment] = useState('ALL');

  const getHealthBadge = (actual: number, target: number, warning: number, critical: number, unit: string) => {
    // For TIME unit, lower is better. For others, higher is better.
    const isBetterLower = unit === 'TIME';

    let isCritical = isBetterLower ? actual >= critical : actual <= critical;
    let isWarning = isBetterLower ? actual >= warning : actual <= warning;

    if (isCritical) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5" /> Critical Deviation
        </span>
      );
    }
    if (isWarning) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" /> Warning Threshold
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> On Target
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Performance & KPI Engine</h1>
            <p className="text-sm text-slate-500">
              Departmental key performance indicators, actual vs target compliance & trend analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-xs font-semibold border-slate-200">
            <Plus className="w-4 h-4 mr-1.5" /> Add KPI Definition
          </Button>
          <Button className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white shadow-md shadow-brand-blue/20">
            <Plus className="w-4 h-4" /> Record KPI Value
          </Button>
        </div>
      </div>

      {/* KPI Metric Halos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Active KPIs</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">14</div>
          <span className="text-xs text-slate-500 mt-1 block">Across 6 departments</span>
        </Card>

        <Card className="p-5 border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Target Compliance Rate</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">85.7%</div>
          <span className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> +3.2% vs last month
          </span>
        </Card>

        <Card className="p-5 border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Critical Exceptions</span>
          <div className="text-3xl font-extrabold text-rose-600 mt-1">1</div>
          <span className="text-xs text-rose-700 mt-1 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Action recommended
          </span>
        </Card>

        <Card className="p-5 border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Automated Sources</span>
          <div className="text-3xl font-extrabold text-brand-blue mt-1">64%</div>
          <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-brand-blue" /> LAKSHYA integration
          </span>
        </Card>
      </div>

      {/* KPI Cards Register */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            KPI Indicator Register
          </h2>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700"
            >
              <option value="ALL">All Departments</option>
              <option value="OPD">Outpatient Department</option>
              <option value="Quality">Quality & Clinical</option>
              <option value="Pharmacy">Pharmacy</option>
            </select>
          </div>
        </div>

        {MOCK_KPIS.map((kpi) => {
          const progress =
            kpi.unit === 'TIME'
              ? Math.min(100, Math.round((kpi.targetValue / kpi.actualValue) * 100))
              : Math.min(100, Math.round((kpi.actualValue / kpi.targetValue) * 100));

          return (
            <Card key={kpi.id} className="p-6 border-slate-200 space-y-4 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      {kpi.department}
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    {kpi.isAutomated ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        <Zap className="w-3 h-3" /> Auto Calculated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        Manual Record
                      </span>
                    )}
                    {getHealthBadge(
                      kpi.actualValue,
                      kpi.targetValue,
                      kpi.warningThreshold,
                      kpi.criticalThreshold,
                      kpi.unit
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{kpi.name}</h3>
                  <p className="text-xs text-slate-500">{kpi.description}</p>
                </div>

                <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Target
                    </span>
                    <span className="text-xl font-extrabold text-slate-700">
                      {kpi.targetValue} {kpi.unit === 'PERCENTAGE' ? '%' : kpi.unit === 'TIME' ? 'min' : ''}
                    </span>
                  </div>

                  <div className="h-8 w-px bg-slate-200" />

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Actual
                    </span>
                    <span
                      className={`text-xl font-extrabold ${
                        kpi.actualValue >= kpi.targetValue && kpi.unit !== 'TIME'
                          ? 'text-emerald-600'
                          : kpi.unit === 'TIME' && kpi.actualValue <= kpi.targetValue
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {kpi.actualValue} {kpi.unit === 'PERCENTAGE' ? '%' : kpi.unit === 'TIME' ? 'min' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Target Compliance Progress</span>
                  <span className="font-bold text-slate-700">{progress}%</span>
                </div>
                <ProgressBar value={progress} size="md" />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Owner: <strong>{kpi.owner}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Last Recorded: {kpi.lastRecordedDate}
                  </span>
                </div>

                <Button variant="outline" className="text-xs font-semibold border-slate-200">
                  Record New Value
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
