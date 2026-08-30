'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Info,
  Layers,
  Database,
  Smartphone,
  Server,
  FileText,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { loadPrivateState, exportPrivateState, clearPrivateState } from '../../lib/services/privateVault';
import { initialPrivateState } from '../../lib/data/companionDemo';
import { PrivateState } from '../../types/companion';

export const PrivacyCentreView: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [state, setState] = useState<PrivateState>(() => initialPrivateState);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setState(loadPrivateState());
    setIsMounted(true);
  }, []);

  const handleExport = () => {
    exportPrivateState(state);
    setToastMessage('Personal Vault data exported as JSON.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your local personal vault data from this browser?')) {
      clearPrivateState();
      setState(loadPrivateState());
      setToastMessage('Personal local vault data cleared.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const localRecordsCount = (state.lifeGoals?.length || 0) + (state.personalTasks?.length || 0) + 2; // health + wealth

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              PRIVACY CONTROL CENTRE
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Two-Lane Privacy Model
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Your Privacy &amp; Data Boundary
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            See exactly what belongs to you in your Personal Vault, what belongs to the hospital workspace, and how your data is strictly guarded.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Two-Lane Architecture Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lane 1: Personal Vault */}
        <Card className="p-6 bg-white border-2 border-emerald-200 rounded-3xl space-y-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Local Device Only
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
              LANE 1: PERSONAL VAULT
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Private to Employee
            </h3>
            <p className="text-xs text-slate-500">
              Stored exclusively in this browser. Never transmitted to hospital servers.
            </p>
          </div>

          <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Personal Wellbeing &amp; Sleep Journal</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Budget Clarity &amp; Savings Targets</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Life Habits &amp; Private Reminders</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Private Ask One Conversation History</span>
            </li>
          </ul>

          <div className="pt-2 text-[11px] font-semibold text-emerald-700">
            ✓ {localRecordsCount} local record groups active on this device
          </div>
        </Card>

        {/* Lane 2: Hospital Platform */}
        <Card className="p-6 bg-white border-2 border-blue-200 rounded-3xl space-y-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
              Hospital Governed
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
              LANE 2: STAVYA WORKSPACE
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Hospital Work Data
            </h3>
            <p className="text-xs text-slate-500">
              Role-controlled on secure hospital infrastructure with immutable audit logs.
            </p>
          </div>

          <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Employee Directory &amp; Role Hierarchy</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Assigned Tasks &amp; RACI Commitments</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Shift Rosters &amp; Approved Leave Requests</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>NABH Standards &amp; Quality Audit Logs</span>
            </li>
          </ul>

          <div className="pt-2 text-[11px] font-semibold text-blue-700">
            ✓ Strictly enforced by server-side RBAC policies
          </div>
        </Card>
      </div>

      {/* User Controls Panel */}
      <Card className="p-6 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            LOCAL DATA MANAGEMENT
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Manage Your Personal Vault Data
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="p-4 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all group flex items-start gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                Export My Private Data
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Download a readable JSON backup of your health, wealth, and personal goals.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="p-4 bg-slate-50 hover:bg-red-50/60 border border-slate-200 hover:border-red-300 rounded-2xl text-left transition-all group flex items-start gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-red-900">
                Clear Personal Vault
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Wipe all local personal records from this browser cache.
              </p>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
};
