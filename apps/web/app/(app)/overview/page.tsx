'use client';

import React from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Sparkles, Layers, ArrowRight } from 'lucide-react';

export default function OverviewPage() {
  const { user } = useAuth();
  const now = new Date();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-brand-blue border border-blue-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
              MD Office Operating System
            </span>
            <span className="text-xs text-slate-500 font-mono">
              • {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            LAKSHYA Management Workspace • Ready to build feature-by-feature.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Role: {user.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* CLEAN SLATE FEATURE CANVAS */}
      <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200 text-brand-blue flex items-center justify-center mb-4 shadow-sm">
          <Layers className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Clean Dashboard Canvas
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          The dashboard has been cleared. Tell me which feature you would like to build first (e.g., Task Tracker, Meeting Intakes, Stuck Escalation, or Calendar), and we will design its workflow and logic step-by-step.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-brand-blue">
          <Sparkles className="w-4 h-4" />
          <span>Ready for feature #1</span>
        </div>
      </div>
    </div>
  );
}
