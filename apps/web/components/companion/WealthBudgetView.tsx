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
  Plus,
  Minus,
  Calculator,
  Calendar,
  Zap,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { loadPrivateState, savePrivateState } from '../../lib/services/privateVault';
import { PrivateState, WealthState } from '../../types/companion';

export const WealthBudgetView: React.FC = () => {
  const [state, setState] = useState<PrivateState>(() => loadPrivateState());
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'quick-add' | 'calculator'>('overview');

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

  // Quick 1-Click Spending Logger
  const handleAddExpense = (amount: number) => {
    updateWealth('spent', wealth.spent + amount);
  };

  // Quick 1-Click Savings Deposit
  const handleAddSavings = (amount: number) => {
    updateWealth('saved', wealth.saved + amount);
  };

  // Reset Month
  const handleResetMonth = () => {
    if (window.confirm('Reset this month’s spent amount to ₹0 for a new monthly cycle?')) {
      updateWealth('spent', 0);
    }
  };

  const budgetPct = Math.min(100, Math.round((wealth.spent / Math.max(1, wealth.monthlyBudget)) * 100));
  const goalPct = Math.min(100, Math.round((wealth.saved / Math.max(1, wealth.savingsGoal)) * 100));
  const remainingBudget = Math.max(0, wealth.monthlyBudget - wealth.spent);
  const remainingSavings = Math.max(0, wealth.savingsGoal - wealth.saved);
  const monthlySavingsPotential = Math.max(0, wealth.monthlyBudget - wealth.spent);
  const estimatedMonthsToGoal = monthlySavingsPotential > 0 ? Math.ceil(remainingSavings / monthlySavingsPotential) : 12;

  // Preset budget buttons for 1-tap setup
  const budgetPresets = [35000, 50000, 75000, 100000, 150000];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-300" />
              EASY MONEY CLARITY
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private to your device
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Simple Personal Budget
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed mt-1">
                Zero complicated spreadsheets. Track your monthly budget and savings goal with simple 1-click actions.
              </p>
            </div>
            {savedFeedback && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full font-bold animate-in fade-in self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Updated Vault
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 1-Tap Quick Action Pills Bar */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 border-indigo-100 rounded-3xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            1-Tap Quick Expense Logger
          </span>
          <span className="text-[11px] text-slate-500">Tap to add spent amount</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: '+₹100 (Snack/Tea)', amount: 100 },
            { label: '+₹250 (Commute/Cab)', amount: 250 },
            { label: '+₹500 (Groceries/Meal)', amount: 500 },
            { label: '+₹1,000 (Shopping/Bills)', amount: 1000 },
            { label: '+₹2,500 (Utilities)', amount: 2500 },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddExpense(item.amount)}
              className="px-3.5 py-2 bg-white hover:bg-indigo-600 hover:text-white text-slate-800 text-xs font-bold rounded-xl border border-indigo-200/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Monthly Budget Remaining */}
        <Card className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-sm border-slate-800 relative overflow-hidden">
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
              className={`h-full rounded-full transition-all duration-300 ${
                budgetPct > 90
                  ? 'bg-rose-500'
                  : budgetPct > 70
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Monthly Reset:</span>
            <button
              type="button"
              onClick={handleResetMonth}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
            >
              Reset for New Month
            </button>
          </div>
        </Card>

        {/* Savings Goal Progress */}
        <Card className="p-6 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-purple-600" />
              Annual Savings Goal
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
              Target: ₹{wealth.savingsGoal.toLocaleString('en-IN')} (₹{remainingSavings.toLocaleString('en-IN')} left)
            </p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${goalPct}%` }}
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
            <span className="text-[11px] text-slate-500">Add to savings:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleAddSavings(2000)}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold rounded-lg border border-purple-200 cursor-pointer"
              >
                +₹2k
              </button>
              <button
                type="button"
                onClick={() => handleAddSavings(5000)}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold rounded-lg border border-purple-200 cursor-pointer"
              >
                +₹5k
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* 50/30/20 Simplified Spending Rule Guide */}
      <Card className="p-5 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              50 / 30 / 20 Simplified Rhythm Guide
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">
            Based on ₹{wealth.monthlyBudget.toLocaleString('en-IN')} Budget
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-700">50% Needs / Essentials</span>
            <p className="text-base font-black text-slate-900 font-mono">
              ₹{(wealth.monthlyBudget * 0.5).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-500">Rent, groceries, utilities, commute</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-700">30% Rest / Wants</span>
            <p className="text-base font-black text-slate-900 font-mono">
              ₹{(wealth.monthlyBudget * 0.3).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-500">Dining, recreation, family hobbies</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-700">20% Savings &amp; Goals</span>
            <p className="text-base font-black text-slate-900 font-mono">
              ₹{(wealth.monthlyBudget * 0.2).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-500">Emergency fund, SIPs, future targets</p>
          </div>
        </div>
      </Card>

      {/* Numerical Adjustments Form */}
      <Card className="p-6 bg-white border-slate-200 rounded-3xl space-y-5 shadow-xs">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
              CUSTOM TARGETS
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Adjust Your Target Numbers
            </h3>
          </div>
        </div>

        {/* 1-Tap Budget Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 block">
            Quick Budget Presets:
          </label>
          <div className="flex flex-wrap gap-2">
            {budgetPresets.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => updateWealth('monthlyBudget', b)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  wealth.monthlyBudget === b
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                ₹{(b / 1000).toFixed(0)}k/mo
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
              Annual Savings Goal (₹)
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
          <h4 className="font-bold text-slate-900">Zero-Bank-Link Financial Privacy</h4>
          <p className="text-slate-600 leading-relaxed">
            This module provides simple personal clarity for budgeting and savings goals. It does not provide financial or investment advice. Bank accounts, PAN credentials, and transactions are intentionally not linked.
          </p>
        </div>
      </div>
    </div>
  );
};
