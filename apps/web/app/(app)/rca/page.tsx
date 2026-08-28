'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Plus,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  User,
  Calendar,
  AlertCircle,
  Clock,
  Trash2,
  Check,
  Zap,
} from 'lucide-react';
import { FiveWhyAnalysis, FishboneDiagram, FMEADocument, FMEARow } from '../../../types/rca';
import { rcaStore } from '../../../lib/mocks/rcaMock';
import { FishboneMindMap } from '../../../components/rca/FishboneMindMap';

export default function RCAPage() {
  const [activeTab, setActiveTab] = useState<'5why' | 'fishbone' | 'fmea'>('5why');

  // Stores state
  const [fiveWhyList, setFiveWhyList] = useState<FiveWhyAnalysis[]>([]);
  const [activeFiveWhyId, setActiveFiveWhyId] = useState<string>('');
  const [fishbone, setFishbone] = useState<FishboneDiagram | null>(null);
  const [fmea, setFmea] = useState<FMEADocument | null>(null);

  // New 5-Why Modal State
  const [showNew5WhyModal, setShowNew5WhyModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newDepartment, setNewDepartment] = useState('Spine Surgery & OT');
  const [newWhys, setNewWhys] = useState<[string, string, string, string, string]>([
    'Why #1: ',
    'Why #2: ',
    'Why #3: ',
    'Why #4: ',
    'Why #5 (Root Cause): ',
  ]);
  const [newRootCause, setNewRootCause] = useState('');
  const [newCountermeasures, setNewCountermeasures] = useState('');

  // Fishbone New Cause State
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('people');
  const [newCauseText, setNewCauseText] = useState('');

  // FMEA New Row State
  const [showNewFmeaModal, setShowNewFmeaModal] = useState(false);
  const [fmeaStep, setFmeaStep] = useState('');
  const [fmeaFailure, setFmeaFailure] = useState('');
  const [fmeaEffects, setFmeaEffects] = useState('');
  const [fmeaSeverity, setFmeaSeverity] = useState<number>(8);
  const [fmeaCauses, setFmeaCauses] = useState('');
  const [fmeaOccurrence, setFmeaOccurrence] = useState<number>(3);
  const [fmeaControls, setFmeaControls] = useState('');
  const [fmeaDetection, setFmeaDetection] = useState<number>(4);
  const [fmeaAction, setFmeaAction] = useState('');
  const [fmeaPerson, setFmeaPerson] = useState('Dr. Rohan Sharma');

  const refreshData = () => {
    const fwList = rcaStore.getFiveWhyList();
    setFiveWhyList([...fwList]);
    if (fwList.length > 0 && !activeFiveWhyId) {
      setActiveFiveWhyId(fwList[0].id);
    }
    setFishbone({ ...rcaStore.getFishbone() });
    setFmea({ ...rcaStore.getFMEA() });
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = rcaStore.subscribe(refreshData);
    return () => unsubscribe();
  }, []);

  const activeAnalysis = fiveWhyList.find(f => f.id === activeFiveWhyId) || fiveWhyList[0];

  const handleCreate5Why = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProblem.trim()) return;

    const created = rcaStore.addFiveWhy({
      title: newTitle.trim(),
      problemStatement: newProblem.trim(),
      department: newDepartment,
      whys: newWhys,
      rootCause: newRootCause || newWhys[4],
      countermeasures: newCountermeasures,
    });

    setActiveFiveWhyId(created.id);
    setShowNew5WhyModal(false);
    setNewTitle('');
    setNewProblem('');
    setNewRootCause('');
    setNewCountermeasures('');
  };

  const handleAddFishboneCause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCauseText.trim()) return;
    rcaStore.addFishboneCause(selectedCategoryKey, newCauseText.trim());
    setNewCauseText('');
  };

  const handleCreateFmeaRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fmeaStep.trim() || !fmeaFailure.trim()) return;

    rcaStore.addFMEARow({
      processStep: fmeaStep.trim(),
      potentialFailureMode: fmeaFailure.trim(),
      potentialEffects: fmeaEffects.trim(),
      severity: fmeaSeverity,
      potentialCauses: fmeaCauses.trim(),
      occurrence: fmeaOccurrence,
      currentControls: fmeaControls.trim(),
      detection: fmeaDetection,
      recommendedAction: fmeaAction.trim(),
      responsiblePerson: fmeaPerson.trim(),
    });

    setShowNewFmeaModal(false);
    setFmeaStep('');
    setFmeaFailure('');
    setFmeaEffects('');
    setFmeaCauses('');
    setFmeaControls('');
    setFmeaAction('');
  };

  const getRpnBadge = (rpn: number) => {
    if (rpn >= 100) {
      return 'bg-red-100 text-red-800 border-red-200 font-black';
    }
    if (rpn >= 50) {
      return 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. QUALITY & RCA EXECUTIVE HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Clinical Quality & Risk Assurance
            </span>
            <span className="text-xs text-slate-500 font-mono">
              • Stavya Spine Hospital
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Root Cause Analysis (RCA) & FMEA Risk Tools
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Systematic 5-Why investigation, Ishikawa Fishbone diagrams, and FMEA Risk Priority Number (RPN) matrix.
          </p>
        </div>

        {/* Tab Navigation Pill */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('5why')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === '5why'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            5-Why Analysis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fishbone')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'fishbone'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Fishbone Diagram
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fmea')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'fmea'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            FMEA Risk Engine
          </button>
        </div>
      </div>

      {/* 2. TAB 1: 5-WHY ROOT CAUSE ANALYSIS */}
      {activeTab === '5why' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-2xl">
              {fiveWhyList.map(fw => (
                <button
                  key={fw.id}
                  type="button"
                  onClick={() => setActiveFiveWhyId(fw.id)}
                  className={`px-3.5 py-2 rounded-xl text-left border text-xs transition-all shrink-0 cursor-pointer ${
                    activeFiveWhyId === fw.id
                      ? 'bg-white border-slate-900 font-bold text-slate-900 shadow-xs'
                      : 'bg-white/70 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="truncate max-w-[200px]">{fw.title}</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowNew5WhyModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New 5-Why RCA</span>
            </button>
          </div>

          {activeAnalysis && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Problem Statement Card */}
              <div className="p-5 bg-red-50/70 border border-red-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Problem / Incident Statement
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Incident Date: {activeAnalysis.incidentDate} &bull; {activeAnalysis.department}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeAnalysis.title}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {activeAnalysis.problemStatement}
                </p>
              </div>

              {/* 5-Why Cascade Chain */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>5-Why Sequential Root Cause Cascade</span>
                </h4>

                <div className="space-y-2.5">
                  {activeAnalysis.whys.map((whyText, index) => {
                    const isRoot = index === 4;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                            isRoot
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          W{index + 1}
                        </div>
                        <div
                          className={`flex-1 p-3.5 rounded-xl border text-xs transition-colors ${
                            isRoot
                              ? 'bg-red-50/50 border-red-200 font-bold text-red-900'
                              : 'bg-slate-50/60 border-slate-200/80 text-slate-800 font-medium'
                          }`}
                        >
                          <span className="font-bold text-slate-500 mr-1.5">
                            Level {index + 1}:
                          </span>
                          {whyText || `[Pending Why #${index + 1} entry]`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Root Cause & Countermeasure Synthesis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Identified Root Cause
                  </p>
                  <p className="text-xs font-bold text-slate-900 leading-relaxed">
                    {activeAnalysis.rootCause}
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Systemic Countermeasure
                  </p>
                  <p className="text-xs font-bold text-slate-900 leading-relaxed">
                    {activeAnalysis.countermeasures || 'Stat alert protocol configuration.'}
                  </p>
                </div>
              </div>

              {/* CAPA Action Plan Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Corrective & Preventive Action Plan (CAPA)
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Action Title</th>
                        <th className="px-4 py-2.5">Assigned Owner</th>
                        <th className="px-4 py-2.5">Target Date</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeAnalysis.capaList.map(capa => (
                        <tr key={capa.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                capa.actionType === 'CORRECTIVE'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {capa.actionType}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {capa.actionTitle}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{capa.assignedTo}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{capa.targetDate}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              {capa.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 2: ISHIKAWA FISHBONE DIAGRAM (MIND MAP FORMAT) */}
      {activeTab === 'fishbone' && fishbone && (
        <FishboneMindMap fishbone={fishbone} />
      )}

      {/* 4. TAB 3: FMEA RISK ANALYSIS ENGINE */}
      {activeTab === 'fmea' && fmea && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                Failure Mode & Effects Analysis (FMEA)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {fmea.processName}
              </h3>
              <p className="text-xs text-slate-500">
                Department: {fmea.department} &bull; Leads: {fmea.leaderName}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNewFmeaModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Failure Mode Row</span>
            </button>
          </div>

          {/* FMEA Table Matrix */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-slate-900 text-white uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3.5 py-3">Process Step</th>
                  <th className="px-3.5 py-3">Potential Failure Mode</th>
                  <th className="px-3.5 py-3">Potential Effect</th>
                  <th className="px-2 py-3 text-center">Sev (S)</th>
                  <th className="px-3.5 py-3">Potential Cause</th>
                  <th className="px-2 py-3 text-center">Occ (O)</th>
                  <th className="px-3.5 py-3">Current Controls</th>
                  <th className="px-2 py-3 text-center">Det (D)</th>
                  <th className="px-3 py-3 text-center font-black">RPN (S×O×D)</th>
                  <th className="px-3.5 py-3">Recommended Mitigation</th>
                  <th className="px-3 py-3 text-center">Post RPN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fmea.rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3 font-bold text-slate-900">{row.processStep}</td>
                    <td className="px-3.5 py-3 font-semibold text-red-700">{row.potentialFailureMode}</td>
                    <td className="px-3.5 py-3 text-slate-600 max-w-[180px]">{row.potentialEffects}</td>
                    <td className="px-2 py-3 text-center font-bold text-slate-800">{row.severity}</td>
                    <td className="px-3.5 py-3 text-slate-600 max-w-[180px]">{row.potentialCauses}</td>
                    <td className="px-2 py-3 text-center font-bold text-slate-800">{row.occurrence}</td>
                    <td className="px-3.5 py-3 text-slate-600">{row.currentControls}</td>
                    <td className="px-2 py-3 text-center font-bold text-slate-800">{row.detection}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs border ${getRpnBadge(row.rpn)}`}>
                        {row.rpn}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 max-w-[200px]">
                      <p className="font-semibold text-slate-900">{row.recommendedAction}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Owner: {row.responsiblePerson} ({row.targetDate})
                      </p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {row.revisedRpn ? (
                        <span className="px-2 py-0.5 rounded font-black text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs">
                          {row.revisedRpn}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">In Review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NEW 5-WHY RCA */}
      {showNew5WhyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">New 5-Why Investigation</h3>
                <p className="text-xs text-slate-500">Capture the incident and drill down to root cause.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNew5WhyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate5Why} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Investigation Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Spine OT-3 Sterility Indicator Discrepancy"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Incident / Problem Statement
                </label>
                <textarea
                  rows={2}
                  value={newProblem}
                  onChange={e => setNewProblem(e.target.value)}
                  placeholder="Describe precisely what failed or happened..."
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* The 5 Whys input fields */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  5-Why Sequential Cascade
                </p>
                {newWhys.map((why, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={why}
                    onChange={e => {
                      const updated = [...newWhys] as [string, string, string, string, string];
                      updated[idx] = e.target.value;
                      setNewWhys(updated);
                    }}
                    placeholder={`Why #${idx + 1}`}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  />
                ))}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Countermeasure & Systemic Fix
                </label>
                <input
                  type="text"
                  value={newCountermeasures}
                  onChange={e => setNewCountermeasures(e.target.value)}
                  placeholder="e.g. Implement dual barcode scan validation."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNew5WhyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save 5-Why Investigation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW FMEA ROW */}
      {showNewFmeaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add FMEA Process Step</h3>
                <p className="text-xs text-slate-500">Calculate Risk Priority Number (RPN = S × O × D).</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewFmeaModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFmeaRow} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Process Step / Operation
                </label>
                <input
                  type="text"
                  value={fmeaStep}
                  onChange={e => setFmeaStep(e.target.value)}
                  placeholder="e.g. 4. Post-Op Patient Transport"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Potential Failure Mode
                </label>
                <input
                  type="text"
                  value={fmeaFailure}
                  onChange={e => setFmeaFailure(e.target.value)}
                  placeholder="What could go wrong?"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600">
                    Severity (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={fmeaSeverity}
                    onChange={e => setFmeaSeverity(Number(e.target.value))}
                    className="w-full mt-1 text-center font-black text-sm bg-white border border-slate-300 rounded-lg py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600">
                    Occurrence (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={fmeaOccurrence}
                    onChange={e => setFmeaOccurrence(Number(e.target.value))}
                    className="w-full mt-1 text-center font-black text-sm bg-white border border-slate-300 rounded-lg py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600">
                    Detection (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={fmeaDetection}
                    onChange={e => setFmeaDetection(Number(e.target.value))}
                    className="w-full mt-1 text-center font-black text-sm bg-white border border-slate-300 rounded-lg py-1"
                  />
                </div>
                <div className="col-span-3 pt-2 text-xs font-bold text-slate-700 flex items-center justify-center gap-2">
                  <span>Calculated RPN:</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs border ${getRpnBadge(fmeaSeverity * fmeaOccurrence * fmeaDetection)}`}>
                    {fmeaSeverity * fmeaOccurrence * fmeaDetection}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recommended Mitigation Action
                </label>
                <input
                  type="text"
                  value={fmeaAction}
                  onChange={e => setFmeaAction(e.target.value)}
                  placeholder="Preventive control action to deploy..."
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewFmeaModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Add to FMEA Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
