'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Zap, GitBranch, ArrowRight } from 'lucide-react';
import { FishboneDiagram } from '../../types/rca';
import { rcaStore } from '../../lib/mocks/rcaMock';

interface FishboneMindMapProps {
  fishbone: FishboneDiagram;
}

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string; accent: string; nodeBg: string }
> = {
  people: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-900',
    border: 'border-indigo-200',
    accent: '#6366f1',
    nodeBg: 'bg-indigo-500',
  },
  process: {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    border: 'border-blue-200',
    accent: '#3b82f6',
    nodeBg: 'bg-blue-500',
  },
  equipment: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200',
    accent: '#f59e0b',
    nodeBg: 'bg-amber-500',
  },
  materials: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    border: 'border-emerald-200',
    accent: '#10b981',
    nodeBg: 'bg-emerald-500',
  },
  measurement: {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-200',
    accent: '#a855f7',
    nodeBg: 'bg-purple-500',
  },
  environment: {
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    border: 'border-rose-200',
    accent: '#f43f5e',
    nodeBg: 'bg-rose-500',
  },
};

export const FishboneMindMap: React.FC<FishboneMindMapProps> = ({ fishbone }) => {
  const [activeCategory, setActiveCategory] = useState<string>('people');
  const [newCauseInput, setNewCauseInput] = useState<string>('');

  const handleAddCause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCauseInput.trim()) return;
    rcaStore.addFishboneCause(activeCategory, newCauseInput.trim());
    setNewCauseInput('');
  };

  return (
    <div className="space-y-6">
      {/* Mind Map Canvas Container */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        {/* Ambient background grid pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #94a3b8 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Mind Map Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                Ishikawa Visual Mind Map
              </span>
              <span className="text-xs text-slate-400 font-mono">
                • {fishbone.department}
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              {fishbone.problemEffect}
            </h3>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Root Causes</span>
            <p className="text-2xl font-black text-emerald-400">
              {fishbone.categories.reduce((acc, c) => acc + c.causes.length, 0)} Nodes
            </p>
          </div>
        </div>

        {/* 1. CENTRAL PROBLEM HEAD & RADIATING MIND MAP NODES */}
        <div className="relative z-10 space-y-8">
          {/* Central Problem Node */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-6 py-3.5 rounded-2xl shadow-lg border border-red-400/40 text-center max-w-xl animate-in zoom-in-95 duration-200">
              <span className="text-[9px] font-bold uppercase tracking-widest bg-red-950/60 px-2 py-0.5 rounded-full text-red-200">
                Core Incident / Effect (Problem Head)
              </span>
              <h4 className="text-sm sm:text-base font-extrabold mt-1">
                {fishbone.problemEffect}
              </h4>
            </div>
          </div>

          {/* 6 Category Radial Limbs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {fishbone.categories.map((category) => {
              const theme = CATEGORY_COLORS[category.key] || CATEGORY_COLORS.people;
              const isSelected = activeCategory === category.key;

              return (
                <div
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`bg-slate-900/90 border rounded-2xl p-4 transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-400 shadow-md ring-1 ring-blue-500/50 bg-slate-900'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Category Limb Header */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <h5 className="text-xs font-black uppercase tracking-wider text-white">
                          {category.label}
                        </h5>
                      </div>
                      <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                        {category.causes.length} causes
                      </span>
                    </div>

                    {/* Sub-Branch Cause Nodes */}
                    <div className="space-y-2">
                      {category.causes.map((cause, index) => (
                        <div
                          key={index}
                          className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 flex items-start justify-between gap-2 transition-colors group"
                        >
                          <div className="flex items-start gap-1.5 leading-relaxed">
                            <span
                              className="font-bold text-[10px] mt-0.5 opacity-60"
                              style={{ color: theme.accent }}
                            >
                              #{index + 1}
                            </span>
                            <span>{cause}</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              rcaStore.removeFishboneCause(category.key, index);
                            }}
                            className="text-slate-500 hover:text-red-400 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
                            title="Delete cause node"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Selection Indicator */}
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Click to add cause to this branch</span>
                    {isSelected && (
                      <span className="text-blue-400 font-bold flex items-center gap-1">
                        Active Branch &bull;
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. INLINE CAUSE NODE CREATOR FOR SELECTED BRANCH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-900" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Attach Cause Node to &quot;{fishbone.categories.find(c => c.key === activeCategory)?.label}&quot;
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Selected Mind Map Branch: <strong className="text-slate-800 capitalize">{activeCategory}</strong>
          </span>
        </div>

        <form onSubmit={handleAddCause} className="flex flex-col sm:flex-row items-center gap-2.5">
          <input
            type="text"
            value={newCauseInput}
            onChange={(e) => setNewCauseInput(e.target.value)}
            placeholder={`Enter contributory cause for ${activeCategory}...`}
            required
            className="flex-1 w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none"
          />

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Mind Map Node</span>
          </button>
        </form>
      </div>
    </div>
  );
};
