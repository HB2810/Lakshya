'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  PiggyBank,
  Wallet,
  IndianRupee,
  Lock,
  Sparkles,
  CheckCircle2,
  Info,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { loadPrivateState, savePrivateState } from '../../lib/services/privateVault';
import { PrivateState, WealthState } from '../../types/companion';

export const WealthBudgetView: React.FC = () => {
  const [state, setState] = useState<PrivateState>(() => loadPrivateState());
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    savePrivateState(state);
    setSavedFeedback(true);
    const t = setTimeout(() => setSavedFeedback(false), 2000);
    return () => clearTimeout(t);
  }, [state]);

  const wealth = state.wealth;

  const updateWealth = (key: keyof WealthState, value: number) => {
    setState((current) => ({
      ...current,
      wealth: {
        ...current.wealth,
        [key]: Math.max(0, isNaN(value) ? 0 : value),
      },
    }));
  };

  const budgetPct = Math.min(100, Math.round((wealth.spent / Math.max(1, wealth.monthlyBudget)) * 100));
  const goalPct = Math.min(100, Math.round((wealth.saved / Math.max(1, wealth.savingsGoal)) * 100));
  const remainingBudget = Math.max(0, wealth.monthlyBudget - wealth.spent);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-300" />
              PRIVATE TO YOU
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Personal device vault
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Money Clarity
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed mt-1">
                A simple personal snapshot of your monthly spending and savings targets. Completely isolated from hospital payroll, compensation, and HR.
              </p>
            </div>
            {savedFeedback && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full font-bold animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Updated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Monthly Budget Remaining */}
        <Card className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-sm border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-blue-400" />
              Monthly Budget Left
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {budgetPct}% Used
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-white font-mono">
              ₹{remainingBudget.toLocaleString('en-IN')}
            </h2>
            <p className="text-xs text-slate-400">
              ₹{wealth.spent.toLocaleString('en-IN')} spent of ₹{wealth.monthlyBudget.toLocaleString('en-IN')} plan
            </p>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </Card>

        {/* Savings Goal Progress */}
        <Card className="p-6 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-purple-600" />
              Annual Savings Target
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {goalPct}% Achieved
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 font-mono">
              ₹{wealth.saved.toLocaleString('en-IN')}
            </h2>
            <p className="text-xs text-slate-500">
              Target: ₹{wealth.savingsGoal.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Numerical Adjustments Form */}
      <Card className="p-6 bg-white border-slate-200 rounded-3xl space-y-5 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
            PERSONAL NUMBERS
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Update Your Personal Budget Plan
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Monthly Budget (₹)
            </label>
            <input
              type="number"
              min="0"
              value={wealth.monthlyBudget}
              onChange={(e) => updateWealth('monthlyBudget', parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Spent This Month (₹)
            </label>
            <input
              type="number"
              min="0"
              value={wealth.spent}
              onChange={(e) => updateWealth('spent', parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Savings Goal (₹)
            </label>
            <input
              type="number"
              min="0"
              value={wealth.savingsGoal}
              onChange={(e) => updateWealth('savingsGoal', parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Saved So Far (₹)
            </label>
            <input
              type="number"
              min="0"
              value={wealth.saved}
              onChange={(e) => updateWealth('saved', parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
            />
          </div>
        </div>
      </Card>

      {/* Financial Boundary Disclaimer */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-slate-900">Financial Boundary Notice</h4>
          <p className="text-slate-600 leading-relaxed">
            This module provides personal clarity for budgeting and savings goals. It does not provide financial or investment advice. Bank accounts, PAN credentials, and transactions are intentionally not linked.
          </p>
        </div>
      </div>
    </div>
  );
};
