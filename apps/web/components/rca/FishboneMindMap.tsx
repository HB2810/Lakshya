'use client';

import React, { useState } from 'react';
import { Plus, Trash2, GitBranch, ArrowRight, Sparkles } from 'lucide-react';
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

export const FishboneMindMap: React.FC<FishboneMindMapProps> = ({ fishbone }) => {
  const [activeCategory, setActiveCategory] = useState<string>('people');
  const [newCauseInput, setNewCauseInput] = useState<string>('');

  // Top 3 categories and Bottom 3 categories
  const topCategories = fishbone.categories.slice(0, 3);
  const bottomCategories = fishbone.categories.slice(3, 6);

  const handleAddCause = (categoryKey: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newCauseInput.trim()) return;
    rcaStore.addFishboneCause(categoryKey, newCauseInput.trim());
    setNewCauseInput('');
  };

  return (
    <div className="space-y-6">
      {/* 1. VISUAL FISHBONE CANVAS (EXACT DIAGRAMMATIC ARCHITECTURE) */}
      <div className="bg-[#fafbfc] border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-x-auto">
        {/* Subtle engineering grid background as in reference screenshot */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none rounded-3xl"
          style={{
            backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 min-w-[980px] max-w-6xl mx-auto space-y-4">
          {/* TOP SECTION: CATEGORIES 1, 2, 3 (PLANNING, PROCESS, EQUIPMENT) */}
          <div className="grid grid-cols-4 gap-4">
            {topCategories.map((cat, idx) => (
              <div key={cat.key} className="space-y-2 pr-4">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {idx + 1}. {cat.label}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {CATEGORY_DESCRIPTIONS[cat.key] || 'Analyze contributory factors.'}
                </p>
              </div>
            ))}
            <div /> {/* Empty 4th column for right problem head alignment */}
          </div>

          {/* FISHBONE VECTOR & NODE CANVAS */}
          <div className="relative py-8">
            {/* SVG BONES SKELETON */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <marker
                  id="fish-arrow"
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
                markerEnd="url(#fish-arrow)"
              />

              {/* Top 3 Diagonal Rib Bones (Angle down-right towards spine) */}
              <line x1="12%" y1="12%" x2="20%" y2="50%" stroke="#3b49df" strokeWidth="3" />
              <line x1="37%" y1="12%" x2="45%" y2="50%" stroke="#3b49df" strokeWidth="3" />
              <line x1="62%" y1="12%" x2="70%" y2="50%" stroke="#3b49df" strokeWidth="3" />

              {/* Bottom 3 Diagonal Rib Bones (Angle up-right towards spine) */}
              <line x1="12%" y1="88%" x2="20%" y2="50%" stroke="#3b49df" strokeWidth="3" />
              <line x1="37%" y1="88%" x2="45%" y2="50%" stroke="#3b49df" strokeWidth="3" />
              <line x1="62%" y1="88%" x2="70%" y2="50%" stroke="#3b49df" strokeWidth="3" />
            </svg>

            {/* TOP 3 CATEGORY PILLS & HORIZONTAL CAUSE BRANCHES */}
            <div className="grid grid-cols-4 gap-4 mb-24 relative z-20">
              {topCategories.map((cat) => (
                <div key={cat.key} className="flex flex-col items-start space-y-3">
                  {/* Category Oval Pill (Matches screenshot cyan style) */}
                  <div className="px-5 py-2 rounded-full bg-[#00d2d3] text-[#0a3d62] font-black text-xs uppercase tracking-wider border-2 border-[#0a3d62] shadow-sm flex items-center gap-1.5 self-center">
                    <span>{cat.label.toUpperCase()}</span>
                  </div>

                  {/* Horizontal Cause Sub-branches */}
                  <div className="space-y-2 w-full pl-2">
                    {cat.causes.map((cause, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2 group">
                        <div className="w-6 h-[2px] bg-[#3b49df] shrink-0" />
                        <div className="px-3 py-1.5 rounded-xl bg-[#00d2d3]/90 hover:bg-[#00d2d3] text-[#0a3d62] font-extrabold text-[11px] border border-[#0a3d62]/60 shadow-xs flex items-center justify-between gap-2 max-w-[200px]">
                          <span className="truncate">{cause}</span>
                          <button
                            type="button"
                            onClick={() => rcaStore.removeFishboneCause(cat.key, cIdx)}
                            className="text-red-700 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                            title="Remove cause"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add cause trigger */}
                    <button
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className="ml-8 text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-blue-200"
                    >
                      <Plus className="w-3 h-3" /> Add Cause
                    </button>
                  </div>
                </div>
              ))}

              {/* RIGHT PROBLEM EFFECT HEAD & EXPLANATORY TEXT */}
              <div className="row-span-2 flex flex-col justify-center items-center text-center pl-4">
                {/* Cyan Circular Problem Head (Matches screenshot) */}
                <div className="w-48 h-48 rounded-full bg-[#00d2d3] border-4 border-[#0a3d62] flex flex-col items-center justify-center p-4 text-[#0a3d62] shadow-xl text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#0a3d62]/80">
                    INCIDENT / EFFECT
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-tight mt-1 leading-snug">
                    {fishbone.problemEffect}
                  </h3>
                </div>

                <div className="mt-4 text-left text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-200 shadow-xs">
                  <p className="font-bold text-slate-800 text-[11px] mb-1">
                    Systemic Root Cause Impact:
                  </p>
                  <p className="text-[11px]">
                    Structured Ishikawa evaluation isolating contributing failure points across the 6Ms to prevent recurrence.
                  </p>
                </div>
              </div>
            </div>

            {/* BOTTOM 3 CATEGORY PILLS & HORIZONTAL CAUSE BRANCHES */}
            <div className="grid grid-cols-4 gap-4 mt-8 relative z-20">
              {bottomCategories.map((cat) => (
                <div key={cat.key} className="flex flex-col items-start space-y-3">
                  {/* Horizontal Cause Sub-branches */}
                  <div className="space-y-2 w-full pl-2">
                    {cat.causes.map((cause, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2 group">
                        <div className="w-6 h-[2px] bg-[#3b49df] shrink-0" />
                        <div className="px-3 py-1.5 rounded-xl bg-[#00d2d3]/90 hover:bg-[#00d2d3] text-[#0a3d62] font-extrabold text-[11px] border border-[#0a3d62]/60 shadow-xs flex items-center justify-between gap-2 max-w-[200px]">
                          <span className="truncate">{cause}</span>
                          <button
                            type="button"
                            onClick={() => rcaStore.removeFishboneCause(cat.key, cIdx)}
                            className="text-red-700 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                            title="Remove cause"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className="ml-8 text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-blue-200"
                    >
                      <Plus className="w-3 h-3" /> Add Cause
                    </button>
                  </div>

                  {/* Category Oval Pill (Matches screenshot cyan style) */}
                  <div className="px-5 py-2 rounded-full bg-[#00d2d3] text-[#0a3d62] font-black text-xs uppercase tracking-wider border-2 border-[#0a3d62] shadow-sm flex items-center gap-1.5 self-center">
                    <span>{cat.label.toUpperCase()}</span>
                  </div>
                </div>
              ))}

              <div /> {/* Alignment placeholder */}
            </div>
          </div>

          {/* BOTTOM SECTION: CATEGORIES 4, 5, 6 (MATERIALS, MEASUREMENT, ENVIRONMENT) */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            {bottomCategories.map((cat, idx) => (
              <div key={cat.key} className="space-y-2 pr-4">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {idx + 4}. {cat.label}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {CATEGORY_DESCRIPTIONS[cat.key] || 'Analyze contributory factors.'}
                </p>
              </div>
            ))}
            <div />
          </div>
        </div>
      </div>

      {/* 2. INLINE CAUSE NODE CREATOR MODAL / CONTROLLER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Add Cause Node to Selected Bone
            </h4>
            <p className="text-xs text-slate-500">
              Selected Fishbone Category: <strong className="text-slate-800 uppercase">{activeCategory}</strong>
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => handleAddCause(activeCategory, e)}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none"
          >
            {fishbone.categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={newCauseInput}
            onChange={(e) => setNewCauseInput(e.target.value)}
            placeholder={`Enter cause for ${activeCategory}...`}
            required
            className="w-full sm:w-64 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
          />

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            + Add Cause
          </button>
        </form>
      </div>
    </div>
  );
};
