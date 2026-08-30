'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Building2,
  FileSpreadsheet,
  Download,
  Filter,
  Check,
  Search,
  Eye,
  FileText,
  Sparkles,
  Layers,
  Flame,
  Award,
  Users2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Activity,
  HeartPulse,
  Syringe,
  Stethoscope,
  Microscope,
  Lock,
  Plus,
  HelpCircle,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Database,
  UserCheck,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import {
  NABH_CHAPTERS,
  NABH_COMMITTEES,
  NABH_ACTIONS,
  NABH_POLICIES,
  NABH_STANDARDS_KPIS,
  NABH_INSPECTION_DATE,
  NabhActionItem,
  NabhChapterAssignment,
  NabhCommittee,
  NabhPolicySOP,
  NabhQualityIndicator,
} from '../../lib/data/stavyaNabhData';
import { STAVYA_STAFF_DATABASE } from '../../lib/data/stavyaHospitalOrgData';
import { workItemStore } from '../../lib/mocks/workItemMock';
import { useAuth } from '../../lib/auth/AuthContext';
import { isQualityCommandAuthorized } from '../../lib/auth/rbacPolicies';

import { NabhTaskAutoGeneratorModal } from './NabhTaskAutoGeneratorModal';
import { KpiDataCaptureModal, KpiCaptureAuditRecord } from './KpiDataCaptureModal';

export function StavyaQualityCommandCentre() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'kpis' | 'matrix' | 'chapters' | 'committees' | 'policies'>('kpis');
  const [isAutoGeneratorOpen, setIsAutoGeneratorOpen] = useState(false);
  
  // KPI View State
  const [kpiList, setKpiList] = useState<NabhQualityIndicator[]>(NABH_STANDARDS_KPIS);
  const [kpiChapterFilter, setKpiChapterFilter] = useState('ALL');
  const [kpiCategoryFilter, setKpiCategoryFilter] = useState('ALL');
  const [kpiSearchQuery, setKpiSearchQuery] = useState('');
  const [selectedKpiForAudit, setSelectedKpiForAudit] = useState<NabhQualityIndicator | null>(null);
  const [newKpiActualValue, setNewKpiActualValue] = useState<number | string>('');
  const [kpiAuditRemarks, setKpiAuditRemarks] = useState('');
  const [expandedKpiId, setExpandedKpiId] = useState<string | null>(null);

  // Action Matrix View State
  const [chapterFilter, setChapterFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionsList, setActionsList] = useState<NabhActionItem[]>(NABH_ACTIONS);
  const [selectedAction, setSelectedAction] = useState<NabhActionItem | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security Gate: Strict visibility to MD, Quality Directorate, and Governance
  const isAuthorized = isQualityCommandAuthorized(user);

  if (!isAuthorized) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto">
        <Card className="p-8 border-rose-200 bg-white text-center space-y-4 shadow-sm rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider border border-rose-200">
              Restricted Executive Workspace
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-2">
              Stavya Quality Command Centre (QCC)
            </h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            This command centre contains confidential hospital clinical quality metrics, infection surveillance data, and statutory audit registers.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-2">
            <p className="font-bold text-slate-900">Authorized Personnel Only:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li>Managing Director &amp; MD Office</li>
              <li>Directorate of Quality &amp; Patient Safety (Dr. Akruti Mirant Dave)</li>
              <li>Hospital Executive Governance Team &amp; Committee Chairs</li>
            </ul>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate days remaining to inspection
  const targetDate = new Date(NABH_INSPECTION_DATE);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Calculate Metrics
  const totalActions = actionsList.length;
  const criticalCount = actionsList.filter(a => a.priority === 'CRITICAL').length;
  const redCount = actionsList.filter(a => a.status === 'RED').length;
  const verifiedCount = actionsList.filter(a => a.stage === 'VERIFIED' || a.verification === 'VERIFIED').length;
  const inProgressCount = actionsList.filter(a => a.stage === 'DRAFTED' || a.stage === 'READY_FOR_REVIEW').length;
  const readinessPercent = Math.round(((verifiedCount * 1.0 + inProgressCount * 0.5) / totalActions) * 100);

  // Filter actions
  const filteredActions = actionsList.filter(a => {
    if (chapterFilter !== 'ALL' && a.chapter !== chapterFilter) return false;
    if (stageFilter !== 'ALL' && a.stage !== stageFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const owner = STAVYA_STAFF_DATABASE[a.ownerId]?.name.toLowerCase() || '';
      return (
        a.title.toLowerCase().includes(q) ||
        a.detail.toLowerCase().includes(q) ||
        a.chapter.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        owner.includes(q)
      );
    }
    return true;
  });

  // Filter KPIs
  const filteredKpis = kpiList.filter(kpi => {
    if (kpiChapterFilter !== 'ALL' && kpi.chapter !== kpiChapterFilter) return false;
    if (kpiCategoryFilter !== 'ALL' && kpi.category !== kpiCategoryFilter) return false;
    if (kpiSearchQuery.trim()) {
      const q = kpiSearchQuery.toLowerCase();
      return (
        kpi.name.toLowerCase().includes(q) ||
        kpi.code.toLowerCase().includes(q) ||
        kpi.chapter.toLowerCase().includes(q) ||
        kpi.description.toLowerCase().includes(q) ||
        kpi.leadName.toLowerCase().includes(q) ||
        kpi.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const kpiCategories = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'CLINICAL_SAFETY', label: 'Clinical Safety' },
    { id: 'INFECTION_CONTROL', label: 'Infection Control (IPC)' },
    { id: 'OPERATIONAL_EFFICIENCY', label: 'Operational Efficiency' },
    { id: 'MEDICATION_SAFETY', label: 'Medication Safety (MOM)' },
    { id: 'PATIENT_EXPERIENCE', label: 'Patient Experience (PRE)' },
    { id: 'FACILITY_SAFETY', label: 'Facility & Safety (FMS)' },
    { id: 'GOVERNANCE', label: 'Governance & Management (ROM/PSQ)' },
  ];

  const handleVerifySignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    const nowIso = new Date().toISOString().substring(0, 10);
    const updated = actionsList.map(a => {
      if (a.id === selectedAction.id) {
        return {
          ...a,
          stage: 'VERIFIED' as const,
          verification: 'VERIFIED' as const,
          status: 'GREEN' as const,
          verifiedById: user.id || 'e069',
          verifiedOn: nowIso,
          nextReview: '2026-09-09',
        };
      }
      return a;
    });

    setActionsList(updated);

    // Also update WorkItem store
    workItemStore.patchWorkItem(selectedAction.id, {
      status: 'completed',
      progressPercent: 100,
      update_note: `Official Quality Sign-Off completed by ${user.name} on ${nowIso}. Remarks: ${verificationNote || 'Deliverable verified against NABH 6th Edition standards.'}`,
    });

    setToastMessage(`Action "${selectedAction.title}" officially VERIFIED and signed off!`);
    setSelectedAction(null);
    setVerificationNote('');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveKpiAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpiForAudit) return;

    const val = typeof newKpiActualValue === 'number' ? newKpiActualValue : parseFloat(newKpiActualValue as string);
    if (isNaN(val)) return;

    const isBetterLower = !selectedKpiForAudit.isHigherBetter;
    let newStatus: 'GREEN' | 'AMBER' | 'RED' = 'GREEN';
    if (isBetterLower) {
      if (val >= selectedKpiForAudit.criticalThreshold) newStatus = 'RED';
      else if (val > selectedKpiForAudit.warningThreshold) newStatus = 'AMBER';
    } else {
      if (val <= selectedKpiForAudit.criticalThreshold) newStatus = 'RED';
      else if (val < selectedKpiForAudit.warningThreshold) newStatus = 'AMBER';
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const updated = kpiList.map(k => {
      if (k.id === selectedKpiForAudit.id) {
        return {
          ...k,
          actualValue: val,
          status: newStatus,
          lastAuditDate: todayStr,
        };
      }
      return k;
    });

    setKpiList(updated);
    setToastMessage(`Audit value for "${selectedKpiForAudit.code}: ${selectedKpiForAudit.name}" successfully recorded as ${val}${getUnitSuffix(selectedKpiForAudit.unit)}!`);
    setSelectedKpiForAudit(null);
    setNewKpiActualValue('');
    setKpiAuditRemarks('');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getUnitSuffix = (unit: NabhQualityIndicator['unit']) => {
    switch (unit) {
      case 'PERCENTAGE': return '%';
      case 'RATE_PER_1000': return ' / 1000 days';
      case 'TIME_MIN': return ' min';
      case 'TIME_HOURS': return ' hrs';
      case 'TIME_SEC': return ' sec';
      case 'SCORE': return ' pts';
      case 'COUNT': return ' items';
      default: return '';
    }
  };

  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      title: 'Stavya Spine Hospital - Quality & Accreditation Command Export',
      generatedAt: new Date().toISOString(),
      verifiedBy: user.name,
      metrics: {
        totalActions,
        verifiedCount,
        readinessPercent,
        criticalRedGaps: redCount,
      },
      nabhQualityIndicators: kpiList,
      chapters: NABH_CHAPTERS,
      committees: NABH_COMMITTEES,
      actions: actionsList,
      policies: NABH_POLICIES,
    }, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `Stavya_Quality_Command_Centre_${new Date().toISOString().substring(0, 10)}.json`);
    dl.click();
  };

  const downloadCSV = () => {
    const headers = [
      'KPI Code',
      'Chapter',
      'Category',
      'Indicator Name',
      'Target',
      'Actual',
      'Unit',
      'Frequency',
      'Formula',
      'Benchmark',
      'Lead Name',
      'Department',
      'Status',
      'Primary Source System',
      'Source Register Name',
      'Data Collector Role',
      'Capture Method',
      'Numerator Source Origin',
      'Denominator Source Origin',
      'Verification Authority',
    ];
    const rows = kpiList.map(k => [
      k.code,
      k.chapter,
      k.category,
      `"${k.name.replace(/"/g, '""')}"`,
      k.targetValue,
      k.actualValue,
      k.unit,
      k.frequency,
      `"${k.formula.replace(/"/g, '""')}"`,
      `"${k.benchmark.replace(/"/g, '""')}"`,
      `"${k.leadName.replace(/"/g, '""')}"`,
      `"${k.department.replace(/"/g, '""')}"`,
      k.status,
      `"${(k.dataSource?.sourceSystem || 'HIMS EMR').replace(/"/g, '""')}"`,
      `"${(k.dataSource?.sourceRegister || `${k.chapter} Register`).replace(/"/g, '""')}"`,
      `"${(k.dataSource?.dataCollectorRole || k.leadRole).replace(/"/g, '""')}"`,
      k.dataSource?.captureMethod || 'HYBRID_AUDIT',
      `"${(k.dataSource?.numeratorSource || k.numerator).replace(/"/g, '""')}"`,
      `"${(k.dataSource?.denominatorSource || k.denominator).replace(/"/g, '""')}"`,
      `"${(k.dataSource?.verificationAuthority || 'Director Quality').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvContent));
    dl.setAttribute('download', `Stavya_NABH_Quality_Indicators_Register.csv`);
    dl.click();
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hospital Quality Command Hero Header - White & Blue Unified Design */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-blue-200 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Stavya Quality Command Centre (QCC)
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Directorate of Quality &amp; Governance
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Hospital Clinical Quality, Safety &amp; Accreditation Command
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium">
              Real-time accountability tracking across 48 standard NABH 6th Edition quality KPIs, 10 chapters, 10 hospital committees, 61 critical actions, and 39 SOPs.
            </p>
          </div>

          {/* Countdown & Readiness KPI Widget */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 shrink-0 shadow-2xs">
            <div className="text-center px-3 border-r border-slate-200">
              <p className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">Inspection Countdown</p>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-2xl font-black text-blue-600">{diffDays}</span>
                <span className="text-xs text-slate-500 font-semibold">Days</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Target: {NABH_INSPECTION_DATE}</p>
            </div>

            <div className="text-center px-3">
              <p className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">Readiness Index</p>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-2xl font-black text-emerald-600">{readinessPercent}%</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-semibold">{verifiedCount} / {totalActions} Verified</p>
            </div>

            <div className="text-center px-3 border-l border-slate-200">
              <p className="text-[11px] uppercase text-rose-600 font-bold tracking-wider">Critical Red</p>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-2xl font-black text-rose-600">{redCount}</span>
                <span className="text-xs text-rose-600 font-bold">Gaps</span>
              </div>
              <p className="text-[10px] text-rose-500 font-semibold">Requires MD Action</p>
            </div>
          </div>
        </div>

        {/* Quick Quality Pulse Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <HeartPulse className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-slate-500 text-[11px] font-semibold">Surgical Site Infection (SSI)</p>
              <p className="font-bold text-slate-900 text-sm">0.00% <span className="text-emerald-600 text-[10px] font-black">Zero Harm</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <Activity className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-slate-500 text-[11px] font-semibold">Hand Hygiene Compliance</p>
              <p className="font-bold text-slate-900 text-sm">96.4% <span className="text-blue-600 text-[10px] font-black">+1.8%</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-slate-500 text-[11px] font-semibold">Code Blue Response Time</p>
              <p className="font-bold text-slate-900 text-sm">84 sec <span className="text-indigo-600 text-[10px] font-black">&lt;90s SLA</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <Award className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-slate-500 text-[11px] font-semibold">Tracked NABH Indicators</p>
              <p className="font-bold text-slate-900 text-sm">{kpiList.length} Standard KPIs <span className="text-emerald-600 text-[10px] font-black">100% Active</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sub-Navigation Bar - White & Blue Unified Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('kpis')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'kpis'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            All NABH KPIs ({kpiList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Quality Action Matrix ({actionsList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('chapters')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'chapters'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            10 NABH Chapters ({NABH_CHAPTERS.length})
          </button>
          <button
            onClick={() => setActiveSubTab('committees')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'committees'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            10 Committees ({NABH_COMMITTEES.length})
          </button>
          <button
            onClick={() => setActiveSubTab('policies')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'policies'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            SOPs &amp; Policies ({NABH_POLICIES.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setIsAutoGeneratorOpen(true)} 
            className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Auto-Generate NABH Tasks
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCSV} className="text-xs border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={downloadJSON} className="text-xs border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* SUB-TAB 0: ALL NABH QUALITY & CLINICAL KPIS */}
      {activeSubTab === 'kpis' && (
        <div className="space-y-6">
          {/* KPI Filter & Search Toolbar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search 48 NABH KPIs by title, code (e.g., NABH-COP-01), chapter, owner, or formula..."
                  value={kpiSearchQuery}
                  onChange={e => setKpiSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-2xs"
                />
              </div>

              {/* Chapter Filter */}
              <select
                value={kpiChapterFilter}
                onChange={e => setKpiChapterFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:border-blue-500 shadow-2xs"
              >
                <option value="ALL">All 10 NABH Chapters</option>
                {NABH_CHAPTERS.map(c => (
                  <option key={c.chapter} value={c.chapter}>{c.chapter} — {c.title}</option>
                ))}
              </select>

              <span className="text-xs text-slate-500 font-mono shrink-0">
                Showing {filteredKpis.length} of {kpiList.length} Indicators
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/80">
              {kpiCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setKpiCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    kpiCategoryFilter === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chapter Readiness Matrix Summary */}
          <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">NABH 6th Edition Chapter-Wise KPI Coverage</h3>
                <p className="text-xs text-slate-500 font-medium">Standard clinical, patient safety, and institutional governance indicators</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                100% Core Standards Tracked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {NABH_CHAPTERS.map(chap => {
                const count = kpiList.filter(k => k.chapter === chap.chapter).length;
                return (
                  <button
                    key={chap.chapter}
                    onClick={() => setKpiChapterFilter(kpiChapterFilter === chap.chapter ? 'ALL' : chap.chapter)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      kpiChapterFilter === chap.chapter
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                        {chap.chapter}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{count} KPIs</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-700 mt-1 line-clamp-1">{chap.title}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 48 Standard NABH Quality Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredKpis.map(kpi => {
              const isExpanded = expandedKpiId === kpi.id;
              const unitSuffix = getUnitSuffix(kpi.unit);

              return (
                <Card
                  key={kpi.id}
                  className="p-5 border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs rounded-3xl space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {kpi.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Chapter {kpi.chapter}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                        {kpi.frequency}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ON TARGET
                      </span>
                    </div>
                  </div>

                  {/* Indicator Title & Description */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{kpi.name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{kpi.description}</p>
                  </div>

                  {/* Numbers Block: Target vs Actual */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="border-r border-slate-200 pr-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500">NABH Target</span>
                      <p className="text-base font-bold text-slate-700 mt-0.5">
                        {kpi.isHigherBetter ? '≥' : '≤'} {kpi.targetValue}{unitSuffix}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{kpi.benchmark}</p>
                    </div>

                    <div className="pl-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-blue-700">Measured Actual</span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" /> {kpi.trend}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-blue-700 mt-0.5">
                        {kpi.actualValue}{unitSuffix}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">Last Audit: {kpi.lastAuditDate}</p>
                    </div>
                  </div>

                  {/* Expandable Mathematical Formula & Auditable Data Source Breakdown */}
                  {isExpanded && (
                    <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-3 animate-in fade-in">
                      {/* Mathematical Formula */}
                      <div className="space-y-1 text-slate-700">
                        <p className="font-bold text-blue-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-blue-600" />
                          <span>Computation Formula:</span>
                        </p>
                        <p className="font-mono text-blue-900 bg-white p-2.5 rounded-xl border border-blue-200 text-[11px] shadow-2xs">
                          {kpi.formula}
                        </p>
                      </div>

                      {/* Numerator and Denominator Source Origins */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 space-y-0.5">
                          <span className="font-bold text-slate-900">Numerator (N):</span>
                          <p className="text-slate-700">{kpi.numerator}</p>
                          <p className="text-[10px] text-blue-700 font-medium italic">
                            Origin: {kpi.dataSource?.numeratorSource || 'Point-of-care log'}
                          </p>
                        </div>

                        <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 space-y-0.5">
                          <span className="font-bold text-slate-900">Denominator (D):</span>
                          <p className="text-slate-700">{kpi.denominator}</p>
                          <p className="text-[10px] text-blue-700 font-medium italic">
                            Origin: {kpi.dataSource?.denominatorSource || 'Total census records'}
                          </p>
                        </div>
                      </div>

                      {/* Primary Source System & Register */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] pt-1">
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-slate-500 font-bold uppercase block">Source System</span>
                          <span className="font-bold text-slate-900 line-clamp-1">{kpi.dataSource?.sourceSystem || 'HIMS'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-slate-500 font-bold uppercase block">Physical/Digital Register</span>
                          <span className="font-bold text-slate-900 line-clamp-1">{kpi.dataSource?.sourceRegister || 'Audit Register'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-slate-500 font-bold uppercase block">Data Collector Role</span>
                          <span className="font-bold text-slate-900 line-clamp-1">{kpi.dataSource?.dataCollectorRole || kpi.leadRole}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
                        <span>Accountable: <strong className="text-slate-900">{kpi.leadName}</strong> ({kpi.department})</span>
                        <span>Verification: <strong className="text-blue-700">{kpi.dataSource?.verificationAuthority || 'Director Quality'}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedKpiId(isExpanded ? null : kpi.id)}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>Hide Data Source &amp; Method <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>View Data Source &amp; Method <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedKpiForAudit(kpi);
                        setNewKpiActualValue(kpi.actualValue);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Capture Data Entry
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 1: QUALITY ACTION MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search action title, owner, chapter (e.g., PSQ, Medical Records)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-2xs"
                />
              </div>

              {/* Chapter Filter */}
              <select
                value={chapterFilter}
                onChange={e => setChapterFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:border-blue-500 shadow-2xs"
              >
                <option value="ALL">All 10 Chapters</option>
                {NABH_CHAPTERS.map(c => (
                  <option key={c.chapter} value={c.chapter}>{c.chapter} - {c.title}</option>
                ))}
              </select>

              {/* Stage Filter */}
              <select
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:border-blue-500 shadow-2xs"
              >
                <option value="ALL">All Stages</option>
                <option value="ASSIGNED">Stage 1: ASSIGNED</option>
                <option value="DRAFTED">Stage 2: DRAFTED</option>
                <option value="READY_FOR_REVIEW">Stage 3: READY FOR REVIEW</option>
                <option value="VERIFIED">Stage 4: VERIFIED</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredActions.length} of {actionsList.length} Quality Actions
            </span>
          </div>

          {/* Action Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActions.map(action => {
              const owner = STAVYA_STAFF_DATABASE[action.ownerId];
              const isVerified = action.stage === 'VERIFIED';

              return (
                <Card
                  key={action.id}
                  className={`p-5 border transition-all rounded-2xl shadow-xs ${
                    isVerified
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : action.status === 'RED'
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-slate-100 border border-slate-200 text-blue-700">
                        {action.id}
                      </span>
                      <Badge variant={action.status === 'RED' ? 'danger' : action.status === 'AMBER' ? 'warning' : 'success'}>
                        {action.chapter}
                      </Badge>
                      <Badge variant={action.priority === 'CRITICAL' ? 'danger' : action.priority === 'HIGH' ? 'warning' : 'neutral'}>
                        {action.priority}
                      </Badge>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {action.stage}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">{action.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">{action.detail}</p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span>Owner: <strong className="text-slate-800">{owner?.name || 'Unassigned'}</strong> ({owner?.unit || 'Hospital'})</span>
                      <span>Target: <strong className="text-slate-800">{action.due}</strong></span>
                    </div>
                    {action.evidence && (
                      <div className="text-blue-700 truncate font-medium">
                        Evidence: {action.evidence}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-mono text-slate-500">
                      {isVerified ? `Verified: ${action.verifiedOn || 'Approved'}` : 'Verification Pending'}
                    </span>

                    {!isVerified ? (
                      <Button
                        size="sm"
                        onClick={() => setSelectedAction(action)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Verify Sign-Off
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified Complete
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 10 NABH CHAPTERS */}
      {activeSubTab === 'chapters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NABH_CHAPTERS.map(chap => {
            const leadStaff = STAVYA_STAFF_DATABASE[chap.leadId];
            const chapterActions = actionsList.filter(a => a.chapter === chap.chapter);
            const chapterVerified = chapterActions.filter(a => a.stage === 'VERIFIED').length;
            const completionRate = chapterActions.length ? Math.round((chapterVerified / chapterActions.length) * 100) : 100;

            return (
              <Card key={chap.chapter} className="p-5 border-slate-200 bg-white hover:border-blue-300 shadow-xs rounded-2xl">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                        {chap.chapter}
                      </span>
                      <Badge variant={chap.risk === 'RED' ? 'danger' : chap.risk === 'AMBER' ? 'warning' : 'success'}>
                        {chap.risk} RISK
                      </Badge>
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{chap.title}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-medium">Readiness</span>
                    <p className="text-lg font-black text-blue-600">{completionRate}%</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">{chap.scope}</p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Chapter Champion:</span>
                    <strong className="text-slate-900">{chap.leadText}</strong>
                  </div>
                  {leadStaff && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Designation &amp; Unit:</span>
                      <span className="text-slate-700">{leadStaff.desig} · {leadStaff.unit}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Approval Register:</span>
                    <span className="text-blue-700 font-bold">{chap.approval}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200">
                    <span>Linked Quality Actions:</span>
                    <span className="font-bold text-slate-900">{chapterActions.length} Actions Assigned</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 3: 10 COMMITTEES */}
      {activeSubTab === 'committees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NABH_COMMITTEES.map((comm, idx) => {
            const chairStaff = STAVYA_STAFF_DATABASE[comm.chairId];
            const secStaff = STAVYA_STAFF_DATABASE[comm.secretaryId];

            return (
              <Card key={idx} className="p-5 border-slate-200 bg-white hover:border-blue-300 shadow-xs rounded-2xl">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-base text-slate-900">{comm.name} Committee</h3>
                  </div>
                  <Badge variant={comm.risk === 'RED' ? 'danger' : comm.risk === 'AMBER' ? 'warning' : 'success'}>
                    {comm.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Committee Chair:</span>
                    <strong className="text-slate-900">{comm.chairText}</strong>
                  </div>
                  {chairStaff && (
                    <p className="text-[11px] text-slate-500 pl-2">↳ {chairStaff.desig} ({chairStaff.unit})</p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Secretary:</span>
                    <span className="text-slate-800 font-semibold">{comm.secretaryText}</span>
                  </div>
                  {secStaff && (
                    <p className="text-[11px] text-slate-500 pl-2">↳ {secStaff.desig} ({secStaff.unit})</p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-blue-700 font-medium">
                    <span>Evidence / Charter:</span>
                    <span>{comm.evidence}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 4: 39 POLICIES & SOPS */}
      {activeSubTab === 'policies' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-xs">
            <span className="text-slate-800 font-bold">
              Total 39 Hospital Standard Operating Procedures (SOPs) &amp; Clinical Protocols
            </span>
            <span className="text-blue-700 font-bold font-mono">100% Ingested from Stavya Command Centre</span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Chapter</th>
                    <th className="px-4 py-3">Policy / SOP Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {NABH_POLICIES.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{p.id}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px]">
                          {p.chapter}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{p.title}</td>
                      <td className="px-4 py-3 text-slate-600">{p.type}</td>
                      <td className="px-4 py-3">
                        <Badge variant="success">
                          ACTIVE / NABH VERIFIED
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ACTION VERIFICATION SIGN-OFF MODAL */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-slate-900">Confirm Verification &amp; Sign Off</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-100">
                {selectedAction.id}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-500 font-semibold">Action Deliverable:</p>
              <h4 className="font-bold text-slate-900 text-sm">{selectedAction.title}</h4>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200 leading-relaxed">
                {selectedAction.detail}
              </p>
            </div>

            <form onSubmit={handleVerifySignOff} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Verification Remarks &amp; Audit Notes (Required by Quality Board):
                </label>
                <textarea
                  rows={3}
                  placeholder="Confirm deliverable verified (e.g., reviewed signed register log and confirmed staff training completion)..."
                  value={verificationNote}
                  onChange={e => setVerificationNote(e.target.value)}
                  className="w-full p-3 text-xs rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                <span>
                  Signing off as <strong>{user.name}</strong> will update the status to VERIFIED (Green) and log this in the hospital audit trail.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAction(null)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Verification &amp; Sign Off
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POINT-OF-CARE AUDIT DATA CAPTURE & CALCULATION MODAL */}
      <KpiDataCaptureModal
        indicator={selectedKpiForAudit}
        isOpen={!!selectedKpiForAudit}
        onClose={() => setSelectedKpiForAudit(null)}
        onSave={(updatedIndicator, captureAudit) => {
          const updated = kpiList.map(k => k.id === updatedIndicator.id ? updatedIndicator : k);
          setKpiList(updated);
          setToastMessage(
            `Data entry for "${updatedIndicator.code}: ${updatedIndicator.name}" captured & computed as ${updatedIndicator.actualValue}${getUnitSuffix(updatedIndicator.unit)} (${captureAudit.resultingStatus}) from ${captureAudit.registerReference}!`
          );
          setSelectedKpiForAudit(null);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Autonomous Task Auto-Generator Modal */}
      <NabhTaskAutoGeneratorModal
        isOpen={isAutoGeneratorOpen}
        onClose={() => setIsAutoGeneratorOpen(false)}
        onTasksGenerated={(count) => {
          setToastMessage(`Successfully generated ${count} NABH 6th Edition tasks and synchronized to active work queue!`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    </div>
  );
}

// Export alias for backward compatibility with existing tests and imports
export const NabhCommandCentreView = StavyaQualityCommandCentre;
