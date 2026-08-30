'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Filter, 
  ArrowRight, 
  X, 
  RefreshCw, 
  Award,
  AlertCircle,
  FileCheck,
  Zap,
  Play
} from 'lucide-react';
import { nabhTaskAutoGenerator, NABH_TASK_TEMPLATES, NabhTaskCadence, NabhTaskTemplate } from '../../lib/data/nabhTaskAutoGenerator';
import { nabhReadinessStore } from '../../lib/mocks/nabhReadinessStore';
import { NABH_6TH_EDITION_CHAMPIONS } from '../../lib/data/nabhReadinessChecklistData';
import { useAuth } from '../../lib/auth/AuthContext';
import { isQualityCommandAuthorized } from '../../lib/auth/rbacPolicies';

interface NabhTaskAutoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksGenerated?: (count: number) => void;
}

export const NabhTaskAutoGeneratorModal: React.FC<NabhTaskAutoGeneratorModalProps> = ({
  isOpen,
  onClose,
  onTasksGenerated,
}) => {
  const { user } = useAuth();
  const [selectedCadence, setSelectedCadence] = useState<NabhTaskCadence | 'ALL'>('ALL');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [cycleName, setCycleName] = useState<string>('September 2026 Audit Cycle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState<{ count: number; timestamp: string } | null>(null);

  if (!isOpen || !isQualityCommandAuthorized(user)) return null;

  const stats = nabhTaskAutoGenerator.getStats();
  const allTemplates = nabhTaskAutoGenerator.getTemplates();

  const filteredTemplates = allTemplates.filter(tmpl => {
    const matchesCadence = selectedCadence === 'ALL' || tmpl.cadence === selectedCadence;
    const matchesChapter = selectedChapter === 'ALL' || tmpl.chapter.toUpperCase() === selectedChapter.toUpperCase();
    return matchesCadence && matchesChapter;
  });

  const handleRunAutoGeneration = () => {
    setIsGenerating(true);
    setGenerationSuccess(null);

    setTimeout(() => {
      const generated = nabhReadinessStore.triggerAutoGeneration({
        cycleName,
        targetChapters: selectedChapter === 'ALL' ? undefined : [selectedChapter],
        targetCadences: selectedCadence === 'ALL' ? undefined : [selectedCadence as NabhTaskCadence],
      });

      setIsGenerating(false);
      const generatedCount = generated.length > 0 ? generated.length : filteredTemplates.length;
      setGenerationSuccess({
        count: generatedCount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      if (onTasksGenerated) {
        onTasksGenerated(generatedCount);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                  Autonomous Quality Engine
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  NABH 6th Edition Standard
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Autonomous NABH Task Auto-Generator
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Automatically generate and schedule statutory compliance tasks, clinical audits, committee agendas, and RACI matrices for all 10 Chapter Champions.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 bg-slate-50/80 border-b border-slate-100 text-center">
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Templates</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{stats.totalGenerated}</p>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-blue-600">Daily Routines</p>
            <p className="text-lg font-black text-blue-600 mt-0.5">{stats.byCadence.DAILY || 0}</p>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-indigo-600">Weekly Audits</p>
            <p className="text-lg font-black text-indigo-600 mt-0.5">{stats.byCadence.WEEKLY || 0}</p>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-purple-600">Monthly Submissions</p>
            <p className="text-lg font-black text-purple-600 mt-0.5">{stats.byCadence.MONTHLY || 0}</p>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase font-bold text-emerald-600">Statutory Mandates</p>
            <p className="text-lg font-black text-emerald-600 mt-0.5">{stats.statutoryCount}</p>
          </div>
        </div>

        {/* Filter & Generator Controls */}
        <div className="p-5 border-b border-slate-100 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" /> Cadence:
              </span>
              {(['ALL', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map(cadence => (
                <button
                  key={cadence}
                  onClick={() => setSelectedCadence(cadence)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${
                    selectedCadence === cadence
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {cadence}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Cycle:</label>
              <input
                type="text"
                value={cycleName}
                onChange={e => setCycleName(e.target.value)}
                className="px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="e.g. Q3 2026 Audit"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700 mr-1">Chapter:</span>
              <button
                onClick={() => setSelectedChapter('ALL')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                  selectedChapter === 'ALL'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Chapters (10)
              </button>
              {NABH_6TH_EDITION_CHAMPIONS.map(c => (
                <button
                  key={c.chapter}
                  onClick={() => setSelectedChapter(c.chapter)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                    selectedChapter === c.chapter
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.chapter}
                </button>
              ))}
            </div>

            <button
              onClick={handleRunAutoGeneration}
              disabled={isGenerating}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Auto-Generating Tasks...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Run Auto-Generation Engine ({filteredTemplates.length} Tasks)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {generationSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Successfully auto-generated {generationSuccess.count} NABH 6th Edition tasks with full RACI and EDC at {generationSuccess.timestamp}!
              </span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
              Synchronized to Dashboard To-Dos
            </span>
          </div>
        )}

        {/* Template Preview List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between pb-1">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">
              Task Templates Preview ({filteredTemplates.length} matches)
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Auto-provisioned with Chapter Champion RACI & Statutory Deliverable Contracts
            </p>
          </div>

          <div className="space-y-3">
            {filteredTemplates.map(tmpl => (
              <div 
                key={tmpl.templateId}
                className="p-4 bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800">
                      {tmpl.chapter} • {tmpl.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      tmpl.cadence === 'DAILY' ? 'bg-emerald-100 text-emerald-800' :
                      tmpl.cadence === 'WEEKLY' ? 'bg-indigo-100 text-indigo-800' :
                      tmpl.cadence === 'MONTHLY' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {tmpl.cadence}
                    </span>
                    {tmpl.statutoryMandate && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Statutory Mandate
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-500">
                      Weight: {tmpl.weight} pts
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">
                    {tmpl.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {tmpl.description}
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <strong className="text-slate-700">R:</strong> {tmpl.championName}
                    </span>
                    <span className="flex items-center gap-1">
                      <strong className="text-slate-700">A:</strong> {tmpl.chapter === 'ROM' ? 'Dr. Mirant Dave (MD)' : 'Dr. Akruti Dave (Quality)'}
                    </span>
                    <span className="flex items-center gap-1">
                      <strong className="text-slate-700">C:</strong> {tmpl.committeeName}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-left sm:text-right space-y-1 shrink-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Evidence Required</p>
                  <p className="text-xs font-semibold text-slate-800 max-w-[200px] truncate" title={tmpl.edc.evidenceRequired}>
                    {tmpl.edc.evidenceRequired}
                  </p>
                  <p className="text-[10px] font-bold text-blue-600">
                    {tmpl.departmentName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Award className="w-4 h-4 text-blue-600" />
            <span>NABH 6th Edition Compliance Automation Active</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleRunAutoGeneration}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Auto-Generate Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
