'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Users,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Search,
  Filter,
  BarChart3,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { STAVYA_STAFF_DATABASE, HospitalStaffMember } from '../../../lib/data/stavyaHospitalOrgData';

interface CoreKPI {
  id: string;
  name: string;
  department: string;
  targetValue: number;
  actualValue: number;
  unit: 'PERCENTAGE' | 'COUNT' | 'TIME' | 'SCORE';
  warningThreshold: number;
  criticalThreshold: number;
  frequency: string;
  accountableLeader: string;
  lastRecordedDate: string;
  description: string;
  sourceSystem: string;
  sourceRegister: string;
  collectorRole: string;
}

const HOSPITAL_CORE_KPIS: CoreKPI[] = [
  {
    id: 'KPI-SPINE-01',
    name: 'Hospital Commitment Execution Rate (CER)',
    department: 'Hospital-Wide Operations',
    targetValue: 92,
    actualValue: 94.8,
    unit: 'PERCENTAGE',
    warningThreshold: 85,
    criticalThreshold: 75,
    frequency: 'WEEKLY',
    accountableLeader: 'Dr. Mirant Bharat Dave (MD)',
    lastRecordedDate: '2026-08-28',
    description: 'Percentage of strategic priorities and meeting action deliverables completed on or before target EDC deadline.',
    sourceSystem: 'LAKSHYA Management Operating System Engine',
    sourceRegister: 'Executive Commitment & EDC Master Register',
    collectorRole: 'MD Office Lead & Operations Incharge',
  },
  {
    id: 'KPI-SPINE-02',
    name: 'NABH 6th Edition Full Accreditation Readiness',
    department: 'Quality & Patient Safety Directorate',
    targetValue: 95,
    actualValue: 88.5,
    unit: 'PERCENTAGE',
    warningThreshold: 80,
    criticalThreshold: 70,
    frequency: 'DAILY',
    accountableLeader: 'Dr. Akruti Mirant Dave (Director Quality)',
    lastRecordedDate: '2026-08-28',
    description: 'Aggregate verified compliance across all 10 NABH chapters, 10 statutory committees, and 61 action matrix deliverables.',
    sourceSystem: 'Stavya Quality Command Centre (QCC)',
    sourceRegister: 'NABH 6th Edition Chapter Champion Registers',
    collectorRole: 'Director of Quality & Patient Safety',
  },
  {
    id: 'KPI-SPINE-03',
    name: 'Blocker & Stuck-Need Triage Velocity',
    department: 'Executive Governance & MD Office',
    targetValue: 24,
    actualValue: 14.2,
    unit: 'TIME',
    warningThreshold: 36,
    criticalThreshold: 48,
    frequency: 'DAILY',
    accountableLeader: 'Dr. Mirant Bharat Dave (MD)',
    lastRecordedDate: '2026-08-28',
    description: 'Average hours from employee reporting a blocker to MD/Leader unblocking and resolution.',
    sourceSystem: 'LAKSHYA Stuck/Need Triage Engine',
    sourceRegister: 'Operational Escalation & Blocker Log',
    collectorRole: 'Executive Assistant to MD',
  },
  {
    id: 'KPI-SPINE-04',
    name: 'Surgical Site Infection (SSI) Rate',
    department: 'Spine Surgery & OT Complex',
    targetValue: 0.5,
    actualValue: 0.0,
    unit: 'PERCENTAGE',
    warningThreshold: 1.0,
    criticalThreshold: 2.0,
    frequency: 'MONTHLY',
    accountableLeader: 'Dr. Bharat Rajendraprasad Dave',
    lastRecordedDate: '2026-08-27',
    description: 'Post-operative spine surgical site infection rate across OT 1, 2, 3, and 4 complexes.',
    sourceSystem: 'HICC Active HAI Surveillance & LIS',
    sourceRegister: 'Spine Surgery SSI Surveillance Register',
    collectorRole: 'Infection Control Nurse (ICN)',
  },
  {
    id: 'KPI-SPINE-05',
    name: 'Hand Hygiene WHO 5-Moments Compliance',
    department: 'Hospital Infection Control Committee (HICC)',
    targetValue: 90,
    actualValue: 96.4,
    unit: 'PERCENTAGE',
    warningThreshold: 85,
    criticalThreshold: 75,
    frequency: 'WEEKLY',
    accountableLeader: 'Dr. Akruti Mirant Dave',
    lastRecordedDate: '2026-08-28',
    description: 'Observed staff adherence to WHO 5 moments of hand hygiene across all clinical touchpoints.',
    sourceSystem: 'WHO 5-Moments Observation Tool',
    sourceRegister: 'HICC Hand Hygiene Observation Register',
    collectorRole: 'Infection Control Nurse (ICN)',
  },
  {
    id: 'KPI-SPINE-06',
    name: 'Emergency Code Blue Mock Drill Response Time',
    department: 'Code Blue & Resuscitation Committee',
    targetValue: 90,
    actualValue: 84,
    unit: 'TIME',
    warningThreshold: 105,
    criticalThreshold: 120,
    frequency: 'MONTHLY',
    accountableLeader: 'Dr. Priyank Vitthalbhai Kapadiya',
    lastRecordedDate: '2026-08-25',
    description: 'Mean elapsed seconds from emergency alarm initiation to full resuscitation team arrival with crash cart.',
    sourceSystem: 'Emergency Code Blue Audio & Stopwatch Log',
    sourceRegister: 'Code Blue Resuscitation Drill Register',
    collectorRole: 'ICU & Resuscitation Team Leader',
  },
  {
    id: 'KPI-SPINE-07',
    name: 'Biomedical Preventive Maintenance Adherence',
    department: 'Biomedical & Engineering',
    targetValue: 98,
    actualValue: 99.1,
    unit: 'PERCENTAGE',
    warningThreshold: 90,
    criticalThreshold: 80,
    frequency: 'MONTHLY',
    accountableLeader: 'Vatsal Maheshkumar Vaghasiya',
    lastRecordedDate: '2026-08-26',
    description: 'On-time scheduled calibration and maintenance for all high-risk life support and diagnostic equipment.',
    sourceSystem: 'Biomedical Equipment Management Software (BEMS)',
    sourceRegister: 'Equipment PPM & Calibration Logbook',
    collectorRole: 'Lead Biomedical Engineer',
  },
  {
    id: 'KPI-SPINE-08',
    name: 'Nursing Handover SBAR Protocol Audit',
    department: 'Nursing Services & IPD Wards',
    targetValue: 95,
    actualValue: 92.4,
    unit: 'PERCENTAGE',
    warningThreshold: 85,
    criticalThreshold: 75,
    frequency: 'DAILY',
    accountableLeader: 'Brijesh Hasmukhkumar Bhatt',
    lastRecordedDate: '2026-08-28',
    description: 'Adherence to standardized Situation-Background-Assessment-Recommendation protocol during shift change.',
    sourceSystem: 'Nursing Shift Handover EMR Module',
    sourceRegister: 'Ward SBAR Clinical Handover Register',
    collectorRole: 'Ward Nursing Supervisor',
  },
];

export default function KPIPage() {
  const [activeTab, setActiveTab] = useState<'hospital' | 'departments' | 'individual'>('hospital');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [selectedStaffMember, setSelectedStaffMember] = useState<HospitalStaffMember | null>(null);

  const staffList = Object.values(STAVYA_STAFF_DATABASE);
  const departments = [
    'ALL',
    'Spine Surgery',
    'Anesthesia',
    'Medicine',
    'Radiology',
    'Physiotherapy and Rehabilitation',
    'Nursing Leadership',
    'IPD & HDU Nursing',
    'Operating Theatres',
    'Pharmacy',
    'Quality & Patient Safety',
    'Facility Operations',
    'Infrastructure & Engineering',
    'Finance',
    'MD Office',
  ];

  const filteredStaff = staffList.filter(s => {
    if (staffSearchQuery.trim()) {
      const q = staffSearchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.desig.toLowerCase().includes(q) || s.unit.toLowerCase().includes(q);
    }
    return true;
  });

  const getHealthBadge = (actual: number, target: number, warning: number, critical: number, unit: string) => {
    const isBetterLower = unit === 'TIME';
    const isHealthy = isBetterLower ? actual <= target : actual >= target;
    const isCritical = isBetterLower ? actual >= critical : actual <= critical;

    if (isCritical) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> Critical
        </span>
      );
    }
    if (!isHealthy) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> On Target
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner - White & Blue Unified Design */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-blue-200 shadow-2xs">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              Universal KPI &amp; Execution Scorecard Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Institutional Performance Radar
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Automated performance intelligence across Hospital Leadership, Department Units, and all 213 Personnel.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('hospital')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hospital'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Hospital Executive (MD)
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Department Scorecards
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'individual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Individual Staff ({staffList.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: HOSPITAL EXECUTIVE RADAR */}
      {activeTab === 'hospital' && (
        <div className="space-y-6">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-slate-200 bg-white shadow-xs rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-blue-700">Hospital Execution Index</span>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">94.8%</span>
                <span className="text-xs text-emerald-600 font-bold">+2.4% vs last week</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Target: 92.0% (Derived from 240+ completed commitments)</p>
              <div className="mt-3">
                <ProgressBar value={94.8} className="bg-slate-100" />
              </div>
            </Card>

            <Card className="p-5 border-slate-200 bg-white shadow-xs rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-emerald-700">NABH Accreditation Readiness</span>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">88.5%</span>
                <span className="text-xs text-blue-600 font-bold">Inspection: Sept 10</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">61 Core Actions · 39 SOPs · 10 Chapters verified</p>
              <div className="mt-3">
                <ProgressBar value={88.5} color="emerald" className="bg-slate-100" />
              </div>
            </Card>

            <Card className="p-5 border-slate-200 bg-white shadow-xs rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-indigo-700">Blocker Triage Velocity</span>
                <Zap className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">14.2 hrs</span>
                <span className="text-xs text-emerald-600 font-bold">-3.8 hrs faster</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Average time to unblock Tier-1/Tier-2 Stuck items</p>
              <div className="mt-3">
                <ProgressBar value={85} color="blue" className="bg-slate-100" />
              </div>
            </Card>
          </div>

          {/* Core Hospital KPIs List */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Active Executive KPIs &amp; Strategic Goals
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {HOSPITAL_CORE_KPIS.map(kpi => (
                <Card key={kpi.id} className="p-5 border-slate-200 bg-white hover:border-blue-300 shadow-xs rounded-2xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {kpi.id}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{kpi.department}</span>
                        {getHealthBadge(kpi.actualValue, kpi.targetValue, kpi.warningThreshold, kpi.criticalThreshold, kpi.unit)}
                      </div>
                      <h4 className="font-bold text-base text-slate-900">{kpi.name}</h4>
                      <p className="text-xs text-slate-600">{kpi.description}</p>
                      
                      {/* Auditable Data Capture Origin */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] block">Capture System &amp; Register</span>
                          <span className="font-bold text-slate-800">{kpi.sourceSystem}</span> · <span className="text-slate-600 italic">{kpi.sourceRegister}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] block">Data Collector &amp; Cadence</span>
                          <span className="font-bold text-slate-800">{kpi.collectorRole}</span> (<span className="text-blue-700 font-semibold">{kpi.frequency}</span>)
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-0.5">
                        <span>Accountable: <strong className="text-slate-800">{kpi.accountableLeader}</strong></span>
                        <span>Last Audit: <strong className="text-slate-800">{kpi.lastRecordedDate}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="text-center">
                        <span className="text-[11px] uppercase text-slate-500 font-semibold">Target</span>
                        <p className="text-lg font-bold text-slate-700">
                          {kpi.targetValue}{kpi.unit === 'PERCENTAGE' ? '%' : kpi.unit === 'TIME' ? 'h' : ''}
                        </p>
                      </div>
                      <div className="text-center border-l border-slate-200 pl-6">
                        <span className="text-[11px] uppercase text-blue-600 font-bold">Actual</span>
                        <p className="text-2xl font-black text-blue-700">
                          {kpi.actualValue}{kpi.unit === 'PERCENTAGE' ? '%' : kpi.unit === 'TIME' ? 'h' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DEPARTMENT SCORECARDS */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {departments.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDept(d)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedDept === d
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Spine Surgery Leadership', lead: 'Dr. Bharat Dave', count: 12, sla: 96, otd: 94, blockers: 0 },
              { name: 'Nursing Leadership & OT', lead: 'Brijesh Bhatt', count: 28, sla: 94, otd: 92, blockers: 1 },
              { name: 'Anesthesia', lead: 'Dr. Kashyap Shah', count: 8, sla: 98, otd: 95, blockers: 0 },
              { name: 'Quality & Patient Safety', lead: 'Dr. Akruti Dave', count: 18, sla: 95, otd: 91, blockers: 0 },
              { name: 'Radiology', lead: 'Dr. Preety Krishnan', count: 14, sla: 92, otd: 90, blockers: 1 },
              { name: 'Physiotherapy & Rehab', lead: 'Dr. Parth Joshi', count: 16, sla: 97, otd: 95, blockers: 0 },
              { name: 'Pharmacy', lead: 'Jatin Pathak', count: 10, sla: 93, otd: 89, blockers: 0 },
              { name: 'Infrastructure & Engineering', lead: 'Vatsal Vaghasiya', count: 15, sla: 91, otd: 88, blockers: 2 },
              { name: 'Facility Operations', lead: 'Zankhana Joshi', count: 22, sla: 94, otd: 92, blockers: 1 },
              { name: 'Finance & Accounts', lead: 'Nipa Shah', count: 11, sla: 98, otd: 97, blockers: 0 },
              { name: 'Human Resource', lead: 'Payal Mehta', count: 9, sla: 95, otd: 94, blockers: 0 },
              { name: 'MD Office & Automation', lead: 'Het Bhatt', count: 14, sla: 99, otd: 98, blockers: 0 },
            ]
              .filter(item => selectedDept === 'ALL' || item.name.toLowerCase().includes(selectedDept.toLowerCase()))
              .map((dept, idx) => (
                <Card key={idx} className="p-5 border-slate-200 bg-white hover:border-blue-300 shadow-xs rounded-2xl">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-bold text-slate-900 text-base">{dept.name}</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                      {dept.count} Staff
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">HOD / Lead: <strong className="text-slate-800">{dept.lead}</strong></p>

                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">SLA Rate</span>
                      <p className="text-sm font-black text-emerald-600 mt-0.5">{dept.sla}%</p>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">On-Time</span>
                      <p className="text-sm font-black text-blue-600 mt-0.5">{dept.otd}%</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Blockers</span>
                      <p className={`text-sm font-black mt-0.5 ${dept.blockers > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {dept.blockers} Active
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* VIEW 3: INDIVIDUAL STAFF SCORECARDS */}
      {activeTab === 'individual' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search all 213 hospital staff members by name, designation, or unit..."
              value={staffSearchQuery}
              onChange={e => setStaffSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-slate-900 focus:outline-hidden placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.slice(0, 48).map(staff => (
              <Card
                key={staff.id}
                onClick={() => setSelectedStaffMember(staff)}
                className="p-4 border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer shadow-xs rounded-2xl"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
                    <p className="text-xs text-slate-500">{staff.desig}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                    {staff.code}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 mb-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Unit / Department:</span>
                    <span className="text-slate-800 font-bold">{staff.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Reporting Manager:</span>
                    <span className="text-slate-800 font-medium">{staff.reports || 'Governing Body'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-700 font-bold">Reliability: 94.2%</span>
                  <span className="text-blue-600 font-bold flex items-center gap-1">
                    View Scorecard <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Individual Member Modal / Drawer */}
          {selectedStaffMember && (
            <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <Card className="w-full max-w-lg p-6 bg-white border border-slate-200 shadow-2xl rounded-3xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      Staff ID: {selectedStaffMember.id} · Code #{selectedStaffMember.code}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1.5">{selectedStaffMember.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{selectedStaffMember.desig} · {selectedStaffMember.unit}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStaffMember(null)}
                    className="text-slate-400 hover:text-slate-700 p-1 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Commitment Rate</span>
                    <p className="text-base font-black text-emerald-600 mt-0.5">95.4%</p>
                  </div>
                  <div className="border-x border-slate-200">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Proactive Blocker</span>
                    <p className="text-base font-black text-blue-600 mt-0.5">88.0%</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Kaizen Points</span>
                    <p className="text-base font-black text-amber-600 mt-0.5">4 Actions</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reports To:</span>
                    <strong className="text-slate-900">{selectedStaffMember.reports || 'Governing Body'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Official Email:</span>
                    <span className="text-slate-800 font-mono">{selectedStaffMember.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Branch &amp; Shift:</span>
                    <span className="text-slate-800 font-medium">{selectedStaffMember.branch} ({selectedStaffMember.shift})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RACI Role Capacity:</span>
                    <span className="text-blue-700 font-bold">4 Responsible · 1 Accountable · 2 Informed</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setSelectedStaffMember(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 rounded-xl shadow-xs"
                  >
                    Close Scorecard
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
