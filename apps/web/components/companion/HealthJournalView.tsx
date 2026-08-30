'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Moon,
  Footprints,
  Droplets,
  Smile,
  ShieldCheck,
  Lock,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { loadPrivateState, savePrivateState } from '../../lib/services/privateVault';
import { PrivateState, HealthState } from '../../types/companion';

export const HealthJournalView: React.FC = () => {
  const [state, setState] = useState<PrivateState>(() => loadPrivateState());
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    savePrivateState(state);
    setSavedFeedback(true);
    const t = setTimeout(() => setSavedFeedback(false), 2000);
    return () => clearTimeout(t);
  }, [state]);

  const health = state.health;

  const updateHealth = (key: keyof HealthState, value: any) => {
    setState((current) => ({
      ...current,
      health: {
        ...current.health,
        [key]: value,
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Heart className="w-3.5 h-3.5 text-emerald-300" />
              PRIVATE TO YOU
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Stored on device only
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Everyday Wellbeing
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl leading-relaxed mt-1">
                A simple personal journal for daily rhythm, rest, and hydration. Nothing recorded here is shared with Stavya management or HR.
              </p>
            </div>
            {savedFeedback && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full font-bold animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Saved to Vault
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Control Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sleep Hours */}
        <Card className="p-5 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Sleep Duration</h3>
                <p className="text-[11px] text-slate-400">Nightly restorative sleep</p>
              </div>
            </div>
            <span className="text-lg font-black text-indigo-600 font-mono">
              {health.sleepHours.toFixed(1)} <small className="text-xs text-slate-500 font-sans font-bold">hrs</small>
            </span>
          </div>

          <input
            type="range"
            min="3"
            max="12"
            step="0.5"
            value={health.sleepHours}
            onChange={(e) => updateHealth('sleepHours', parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>3 hrs</span>
            <span>7.5 hrs (Target)</span>
            <span>12 hrs</span>
          </div>
        </Card>

        {/* Daily Steps */}
        <Card className="p-5 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Daily Steps</h3>
                <p className="text-[11px] text-slate-400">Active movement</p>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-600 font-mono">
              {health.steps.toLocaleString('en-IN')} <small className="text-xs text-slate-500 font-sans font-bold">steps</small>
            </span>
          </div>

          <input
            type="range"
            min="1000"
            max="20000"
            step="250"
            value={health.steps}
            onChange={(e) => updateHealth('steps', parseInt(e.target.value, 10))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>1,000</span>
            <span>8,000 (Goal)</span>
            <span>20,000</span>
          </div>
        </Card>

        {/* Hydration */}
        <Card className="p-5 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Water Intake</h3>
                <p className="text-[11px] text-slate-400">Hydration tracker</p>
              </div>
            </div>
            <span className="text-lg font-black text-blue-600 font-mono">
              {health.waterGlasses} <small className="text-xs text-slate-500 font-sans font-bold">glasses</small>
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="16"
            step="1"
            value={health.waterGlasses}
            onChange={(e) => updateHealth('waterGlasses', parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>0</span>
            <span>8 glasses (Target)</span>
            <span>16</span>
          </div>
        </Card>

        {/* Mood */}
        <Card className="p-5 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Smile className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Daily State of Mind</h3>
                <p className="text-[11px] text-slate-400">Personal emotional check-in</p>
              </div>
            </div>
            <span className="text-sm font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              {health.mood}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {(['Low', 'Steady', 'Good', 'Excellent'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => updateHealth('mood', m)}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  health.mood === m
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Health Safety Boundary Alert */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-slate-900">Health Boundary Contract</h4>
          <p className="text-slate-600 leading-relaxed">
            No medical diagnoses, clinical prescriptions, patient records, or medical advice belong in this journal. This is purely a private personal rhythm companion. For clinical advice, consult a qualified medical professional.
          </p>
        </div>
      </div>
    </div>
  );
};
