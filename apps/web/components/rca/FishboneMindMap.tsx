'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Zap,
  FileCheck2,
  HelpCircle,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { FishboneDiagram } from '../../types/rca';
import { rcaStore } from '../../lib/mocks/rcaMock';

interface FishboneMindMapProps {
  fishbone: FishboneDiagram;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  people: 'Examine staffing ratios, surgeon schedules, and nursing handover transitions across shift changes.',
  process: 'Analyze standard operating workflows, patient intake sequences, and documentation handoffs.',
  equipment: 'Assess biomedical hardware uptime, autoclaves, 2D barcode scanners, and IT network reliability.',
  materials: 'Review sterile drape packaging integrity, implant consignment stock, and physical clinical forms.',
  measurement: 'Evaluate KPI tracking accuracy, real-time queue monitors, and audit telemetry milestones.',
  environment: 'Investigate facility temperature, corridor bottlenecks, OT sterile fields, and lighting conditions.',
};

const PRESET_TEMPLATES = [
  {
    id: 'tpl-1',
    title: 'Peak Hour OPD Patient Waiting Time Exceeding 45 Minutes',
    department: 'Hospital Operations & OPD',
  },
  {
    id: 'tpl-2',
    title: 'Post-Op Antibiotic Administration Delay in Spine OT-2',
    department: 'Spine Surgery & OT',
  },
  {
    id: 'tpl-3',
    title: 'CSSD Surgical Implant Barcode Traceability Discrepancy',
    department: 'CSSD & Biomedical',
  },
];

export const FishboneMindMap: React.FC<FishboneMindMapProps> = ({ fishbone }) => {
  // Inline Cause Adder state per category key
  const [inlineAddingKey, setInlineAddingKey] = useState<string | null>(null);
  const [inlineInputText, setInlineInputText] = useState<string>('');

  // Editing existing cause state
  const [editingCause, setEditingCause] = useState<{ catKey: string; index: number; text: string } | null>(null);

  // Editing main problem effect head state
  const [isEditingProblemHead, setIsEditingProblemHead] = useState<boolean>(false);
  const [problemHeadInput, setProblemHeadInput] = useState<string>(fishbone.problemEffect);

  // Copied feedback state
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  const topCategories = fishbone.categories.slice(0, 3);
  const bottomCategories = fishbone.categories.slice(3, 6);

  const handleSaveInlineCause = (catKey: string) => {
    if (!inlineInputText.trim()) {
      setInlineAddingKey(null);
      return;
    }
    rcaStore.addFishboneCause(catKey, inlineInputText.trim());
    setInlineInputText('');
    setInlineAddingKey(null);
  };

  const handleSaveEditedCause = () => {
    if (!editingCause || !editingCause.text.trim()) {
      setEditingCause(null);
      return;
    }
    rcaStore.updateFishboneCause(editingCause.catKey, editingCause.index, editingCause.text.trim());
    setEditingCause(null);
  };

  const handleSaveProblemHead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemHeadInput.trim()) return;
    rcaStore.updateFishboneProblemEffect(problemHeadInput.trim());
    setIsEditingProblemHead(false);
  };

  const handleCopySummary = () => {
    const totalCauses = fishbone.categories.reduce((acc, c) => acc + c.causes.length, 0);
    const summary = `ISHIKAWA FISHBONE RCA REPORT\nEffect: ${fishbone.problemEffect}\nDepartment: ${fishbone.department}\nTotal Identified Causes: ${totalCauses}\n\n` +
      fishbone.categories.map(c => `${c.label.toUpperCase()}:\n` + c.causes.map(cause => ` - ${cause}`).join('\n')).join('\n\n');
    
    navigator.clipboard.writeText(summary);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP INTERACTION CONTROL TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Investigation Preset:
          </span>
          <select
            value={fishbone.problemEffect}
            onChange={(e) => {
              rcaStore.updateFishboneProblemEffect(e.target.value);
              setProblemHeadInput(e.target.value);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:bg-white focus:outline-none"
          >
            {PRESET_TEMPLATES.map((t) => (
              <option key={t.id} value={t.title}>
                {t.title} ({t.department})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {hasCopied ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied Report</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => rcaStore.resetFishbone()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset to default template"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. FISHBONE DIAGRAMMATIC CANVAS */}
      <div className="bg-[#fafbfc] border border-slate-200 rounded-3xl p-4 sm:p-10 shadow-sm relative overflow-x-auto overscroll-x-contain">
        {/* Subtle graph blueprint background */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none rounded-3xl"
          style={{
            backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 min-w-[1020px] max-w-6xl mx-auto space-y-4">
          {/* TOP SECTION: CATEGORIES 1, 2, 3 */}
          <div className="grid grid-cols-4 gap-4">
            {topCategories.map((cat, idx) => (
              <div key={cat.key} className="space-y-1.5 pr-4">
                <h4 className="text-sm font-black text-slate-900">
                  {idx + 1}. {cat.label}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {CATEGORY_DESCRIPTIONS[cat.key] || 'Analyze contributing root causes.'}
                </p>
              </div>
            ))}
            <div />
          </div>

          {/* FISHBONE VECTOR & NODE CANVAS */}
          <div className="relative py-8">
            {/* SVG SKELETON */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <marker
                  id="fish-arrow-workable"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#3b49df" />
                </marker>
              </defs>

              {/* Main Central Horizontal Spine Line with Arrowhead */}
              <line
                x1="40"
                y1="50%"
                x2="72%"
                y2="50%"
                stroke="#3b49df"
                strokeWidth="7"
                strokeLinecap="round"
                markerEnd="url(#fish-arrow-workable)"
              />

              {/* Top 3 Diagonal Rib Bones */}
              <line x1="12%" y1="12%" x2="20%" y2="50%" stroke="#3b49df" strokeWidth="3" />
              <line x1="37%" y1="12%" x2="45%" y2="50%" stroke="#3b49df" strokeWidth="3" />
              <line x1="62%" y1="12%" x2="70%" y2="50%" stroke="#3b49df" strokeWidth="3" />

              {/* Bottom 3 Diagonal Rib Bones */}
              <line x1="12%" y1="88%" x2="20%" y2="50%" stroke="#3b49df" strokeWidth="3" />
              <line x1="37%" y1="88%" x2="45%" y2="50%" stroke="#3b49df" strokeWidth="3" />
              <line x1="62%" y1="88%" x2="70%" y2="50%" stroke="#3b49df" strokeWidth="3" />
            </svg>

            {/* TOP 3 CATEGORY PILLS & CAUSES */}
            <div className="grid grid-cols-4 gap-4 mb-24 relative z-20">
              {topCategories.map((cat) => (
                <div key={cat.key} className="flex flex-col items-start space-y-3">
                  {/* Category Oval Pill */}
                  <div className="px-5 py-2 rounded-full bg-[#00d2d3] text-[#0a3d62] font-black text-xs uppercase tracking-wider border-2 border-[#0a3d62] shadow-sm flex items-center gap-1.5 self-center">
                    <span>{cat.label.toUpperCase()}</span>
                  </div>

                  {/* Horizontal Cause Sub-branches */}
                  <div className="space-y-2 w-full pl-2">
                    {cat.causes.map((cause, cIdx) => {
                      const isEditing =
                        editingCause?.catKey === cat.key && editingCause?.index === cIdx;

                      if (isEditing) {
                        return (
                          <div key={cIdx} className="flex items-center gap-2">
                            <div className="w-6 h-[2px] bg-[#3b49df] shrink-0" />
                            <input
                              type="text"
                              autoFocus
                              value={editingCause.text}
                              onChange={(e) =>
                                setEditingCause({ ...editingCause, text: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditedCause();
                                if (e.key === 'Escape') setEditingCause(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white text-xs border border-blue-600 text-slate-900 font-bold focus:outline-none w-full max-w-[200px]"
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditedCause}
                              className="p-1 bg-emerald-600 text-white rounded cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key={cIdx} className="flex items-center gap-2 group">
                          <div className="w-6 h-[2px] bg-[#3b49df] shrink-0" />
                          <div className="px-3 py-1.5 rounded-xl bg-[#00d2d3]/95 hover:bg-[#00d2d3] text-[#0a3d62] font-extrabold text-[11px] border border-[#0a3d62]/60 shadow-xs flex items-center justify-between gap-2 max-w-[210px] transition-all">
                            <span className="truncate">{cause}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingCause({ catKey: cat.key, index: cIdx, text: cause })
                                }
                                className="text-[#0a3d62] hover:text-blue-900 p-0.5 cursor-pointer"
                                title="Edit cause"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => rcaStore.removeFishboneCause(cat.key, cIdx)}
                                className="text-red-700 hover:text-red-900 p-0.5 cursor-pointer"
                                title="Delete cause"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Inline Quick Add Input on Bone */}
                    {inlineAddingKey === cat.key ? (
                      <div className="flex items-center gap-2 pl-2 animate-in fade-in duration-150">
                        <div className="w-6 h-[2px] bg-[#3b49df] shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          value={inlineInputText}
                          onChange={(e) => setInlineInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInlineCause(cat.key);
                            if (e.key === 'Escape') setInlineAddingKey(null);
                          }}
                          placeholder="Type cause & press Enter..."
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-blue-600 text-slate-900 font-bold focus:outline-none w-full max-w-[190px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveInlineCause(cat.key)}
                          className="p-1 bg-blue-600 text-white shadow-sm rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setInlineAddingKey(cat.key);
                          setInlineInputText('');
                        }}
                        className="ml-8 text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" /> Add Cause Node
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* RIGHT CIRCULAR PROBLEM EFFECT HEAD */}
              <div className="row-span-2 flex flex-col justify-center items-center text-center pl-4">
                <div
                  onClick={() => setIsEditingProblemHead(true)}
                  className="w-52 h-52 rounded-full bg-[#00d2d3] border-4 border-[#0a3d62] flex flex-col items-center justify-center p-4 text-[#0a3d62] shadow-xl text-center cursor-pointer hover:ring-4 hover:ring-blue-300 transition-all group relative"
                  title="Click to edit problem statement"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#0a3d62]/80 flex items-center gap-1">
                    INCIDENT / EFFECT
                    <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-tight mt-1 leading-snug">
                    {fishbone.problemEffect}
                  </h3>
                  <span className="text-[9px] text-[#0a3d62]/70 font-semibold mt-1">
                    (Click to Edit)
                  </span>
                </div>

                <div className="mt-4 text-left text-xs text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs max-w-[240px]">
                  <p className="font-bold text-slate-800 text-[11px] mb-1">
                    Department Scope:
                  </p>
                  <p className="text-[11px] font-semibold text-slate-700">
                    {fishbone.department}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Active RCA Investigation Cycle
                  </p>
                </div>
              </div>
            </div>

            {/* BOTTOM 3 CATEGORY PILLS & CAUSES */}
            <div className="grid grid-cols-4 gap-4 mt-8 relative z-20">
              {bottomCategories.map((cat) => (
                <div key={cat.key} className="flex flex-col items-start space-y-3">
                  {/* Horizontal Cause Sub-branches */}
                  <div className="space-y-2 w-full pl-2">
                    {cat.causes.map((cause, cIdx) => {
                      const isEditing =
                        editingCause?.catKey === cat.key && editingCause?.index === cIdx;

                      if (isEditing) {
                        return (
                          <div key={cIdx} className="flex items-center gap-2">
                            <div className="w-6 h-[2px] bg-[#3b49df] shrink-0" />
                            <input
                              type="text"
                              autoFocus
                              value={editingCause.text}
                              onChange={(e) =>
                                setEditingCause({ ...editingCause, text: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditedCause();
                                if (e.key === 'Escape') setEditingCause(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white text-xs border border-blue-600 text-slate-900 font-bold focus:outline-none w-full max-w-[200px]"
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditedCause}
                              className="p-1 bg-emerald-600 text-white rounded cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key={cIdx} className="flex items-center gap-2 group">
                          <div className="w-6 h-[2px] bg-[#3b49df] shrink-0" />
                          <div className="px-3 py-1.5 rounded-xl bg-[#00d2d3]/95 hover:bg-[#00d2d3] text-[#0a3d62] font-extrabold text-[11px] border border-[#0a3d62]/60 shadow-xs flex items-center justify-between gap-2 max-w-[210px] transition-all">
                            <span className="truncate">{cause}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingCause({ catKey: cat.key, index: cIdx, text: cause })
                                }
                                className="text-[#0a3d62] hover:text-blue-900 p-0.5 cursor-pointer"
                                title="Edit cause"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => rcaStore.removeFishboneCause(cat.key, cIdx)}
                                className="text-red-700 hover:text-red-900 p-0.5 cursor-pointer"
                                title="Delete cause"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {inlineAddingKey === cat.key ? (
                      <div className="flex items-center gap-2 pl-2 animate-in fade-in duration-150">
                        <div className="w-6 h-[2px] bg-[#3b49df] shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          value={inlineInputText}
                          onChange={(e) => setInlineInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInlineCause(cat.key);
                            if (e.key === 'Escape') setInlineAddingKey(null);
                          }}
                          placeholder="Type cause & press Enter..."
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-blue-600 text-slate-900 font-bold focus:outline-none w-full max-w-[190px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveInlineCause(cat.key)}
                          className="p-1 bg-blue-600 text-white shadow-sm rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setInlineAddingKey(cat.key);
                          setInlineInputText('');
                        }}
                        className="ml-8 text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" /> Add Cause Node
                      </button>
                    )}
                  </div>

                  {/* Category Oval Pill */}
                  <div className="px-5 py-2 rounded-full bg-[#00d2d3] text-[#0a3d62] font-black text-xs uppercase tracking-wider border-2 border-[#0a3d62] shadow-sm flex items-center gap-1.5 self-center">
                    <span>{cat.label.toUpperCase()}</span>
                  </div>
                </div>
              ))}

              <div />
            </div>
          </div>

          {/* BOTTOM SECTION: CATEGORIES 4, 5, 6 */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            {bottomCategories.map((cat, idx) => (
              <div key={cat.key} className="space-y-1.5 pr-4">
                <h4 className="text-sm font-black text-slate-900">
                  {idx + 4}. {cat.label}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {CATEGORY_DESCRIPTIONS[cat.key] || 'Analyze contributing root causes.'}
                </p>
              </div>
            ))}
            <div />
          </div>
        </div>
      </div>

      {/* 3. MODAL: EDIT PROBLEM STATEMENT HEAD */}
      {isEditingProblemHead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Incident / Effect</h3>
              <button
                type="button"
                onClick={() => setIsEditingProblemHead(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProblemHead} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Core Problem Statement (Effect Head)
                </label>
                <textarea
                  rows={3}
                  value={problemHeadInput}
                  onChange={(e) => setProblemHeadInput(e.target.value)}
                  placeholder="Define the primary operational or clinical failure..."
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProblemHead(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white shadow-sm text-xs font-bold rounded-xl"
                >
                  Update Problem Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
