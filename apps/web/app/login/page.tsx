'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Info,
  Users,
  Search,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building,
  KeyRound,
  Copy,
  Check,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  hospitalStaffAuthStore,
  EmployeeAccount,
  DEFAULT_HOSPITAL_PASSWORD,
} from '../../lib/auth/hospitalStaffAuth';
import { StavyaOneLogo } from '../../components/brand/StavyaOneLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();

  const [staffId, setStaffId] = useState('STAVYA-001');
  const [password, setPassword] = useState(DEFAULT_HOSPITAL_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 214 Staff Directory Selector Modal
  const [isStaffDirectoryOpen, setIsStaffDirectoryOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryTier, setDirectoryTier] = useState<string>('ALL');

  const allStaffAccounts = useMemo(() => hospitalStaffAuthStore.getAllAccounts(), []);

  const filteredStaffDirectory = useMemo(() => {
    return hospitalStaffAuthStore.searchAccounts(directorySearch, directoryTier);
  }, [directorySearch, directoryTier]);

  const copyToClipboard = (text: string, fieldId: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId.trim() || !password) {
      setError('Please enter your Staff ID / Employee Code and Password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const loggedInUser = await login(staffId.trim(), password);

      if (loggedInUser?.role === 'MASTER') {
        router.push('/settings');
      } else {
        router.push('/overview'); // MD, LEADER, STAVYAN workspaces
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Authentication failed. Please verify your credentials.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectStaffAndLogin = async (staff: EmployeeAccount) => {
    setStaffId(staff.loginId || staff.employeeCode);
    setPassword(DEFAULT_HOSPITAL_PASSWORD);
    setIsStaffDirectoryOpen(false);
    setIsSubmitting(true);
    setError('');

    try {
      const loggedInUser = await login(staff.loginId || staff.employeeCode, DEFAULT_HOSPITAL_PASSWORD);
      if (loggedInUser?.role === 'MASTER') {
        router.push('/settings');
      } else {
        router.push('/overview');
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || authLoading;

  return (
    <div className="min-h-[100dvh] w-full overflow-y-auto bg-slate-50 flex items-start sm:items-center justify-center px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:p-6 relative selection:bg-blue-100">
      {/* Ambient Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-50/50 rounded-full blur-3xl" />
      </div>

      {/* Main Login Card */}
      <main className="w-full max-w-[480px] relative z-10 my-auto space-y-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/90 overflow-hidden">
          {/* Card Brand Header */}
          <div className="px-5 pb-5 pt-6 text-center border-b border-slate-100 bg-gradient-to-b from-blue-50/60 to-white sm:px-8 sm:pb-6 sm:pt-8 flex flex-col items-center">
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-3 hover-lift-light">
              <StavyaOneLogo size="xl" variant="full" />
            </div>
            <h1 className="text-sm font-bold text-slate-500 tracking-tight mt-1">
              Stavya Spine Hospital
            </h1>
            <p className="text-xs font-semibold text-blue-600 mt-0.5">
              Management Operating System &amp; Employee Companion
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 sm:p-8">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Credential Hint Banner */}
            <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Default Password: <strong>{DEFAULT_HOSPITAL_PASSWORD}</strong> (or <strong>1234</strong>)
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(DEFAULT_HOSPITAL_PASSWORD, 'default-pass')}
                className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                title="Copy password"
              >
                {copiedField === 'default-pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Staff ID Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Staff ID / Employee Code / Email
                </label>
                <button
                  type="button"
                  onClick={() => setIsStaffDirectoryOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors active-press cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>214 Staff Directory</span>
                </button>
              </div>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. STAVYANS-101 or STAVYA-001"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3 py-2.5 text-base sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Stavya@2026 or 1234</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-base sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick 214 Staff Directory Button */}
            <button
              type="button"
              onClick={() => setIsStaffDirectoryOpen(true)}
              className="w-full py-2.5 px-3 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/80 text-blue-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs active-press cursor-pointer"
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Browse All 214 Hospital Staff Accounts (1-Click Login)</span>
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active-press"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to StavyaOne</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Fast Presets */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider">
                Fast Login as Key Real Hospital Roles
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={async () => {
                    setStaffId('STAVYANS-001');
                    setPassword('1234');
                    setIsSubmitting(true);
                    try {
                      await login('STAVYANS-001', '1234');
                      router.push('/overview');
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="p-2.5 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/80 text-blue-950 font-bold rounded-xl text-left transition-all cursor-pointer active-press"
                >
                  <span className="block text-[9px] text-blue-600 uppercase font-black">MD Office (STAVYANS-001)</span>
                  <span className="truncate block text-xs font-extrabold text-slate-900">Dr. Mirant Dave</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setStaffId('STAVYA-048');
                    setPassword(DEFAULT_HOSPITAL_PASSWORD);
                    setIsSubmitting(true);
                    try {
                      await login('STAVYA-048', DEFAULT_HOSPITAL_PASSWORD);
                      router.push('/overview');
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="p-2.5 bg-purple-50/70 hover:bg-purple-100 border border-purple-200/80 text-purple-950 font-bold rounded-xl text-left transition-all cursor-pointer active-press"
                >
                  <span className="block text-[9px] text-purple-600 uppercase font-black">Director Quality (STAVYA-048)</span>
                  <span className="truncate block text-xs font-extrabold text-slate-900">Dr. Akruti Mirant Dave</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setStaffId('STAVYANS-002');
                    setPassword('1234');
                    setIsSubmitting(true);
                    try {
                      await login('STAVYANS-002', '1234');
                      router.push('/overview');
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="p-2.5 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-950 font-bold rounded-xl text-left transition-all cursor-pointer active-press"
                >
                  <span className="block text-[9px] text-indigo-600 uppercase font-black">IT / Ops Lead (STAVYANS-002)</span>
                  <span className="truncate block text-xs font-extrabold text-slate-900">Priyesh Shah</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setStaffId('STAVYANS-101');
                    setPassword('1234');
                    setIsSubmitting(true);
                    try {
                      await login('STAVYANS-101', '1234');
                      router.push('/overview');
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="p-2.5 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-950 font-bold rounded-xl text-left transition-all cursor-pointer active-press"
                >
                  <span className="block text-[9px] text-emerald-600 uppercase font-black">Clinical Staff (STAVYANS-101)</span>
                  <span className="truncate block text-xs font-extrabold text-slate-900">Hospital Staff</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* 214 REAL HOSPITAL STAFF DIRECTORY MODAL */}
      {isStaffDirectoryOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4 max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                    STAVYA ORG DIRECTORY
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    214 Real Hospital Employee Accounts
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  1-Click Login for All 214 Hospital Staff Accounts
                </h2>
                <p className="text-xs text-slate-500">
                  Every staff member in the hospital has an active account with login ID and password.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsStaffDirectoryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Tier Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Search 214 staff by Name, Login ID (e.g. STAVYA-113), Designation, or Unit..."
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'ALL', label: `All Staff (${allStaffAccounts.length})` },
                  { id: 'GOVERNANCE', label: `Governance (${allStaffAccounts.filter(a => a.tier === 'GOVERNANCE').length})` },
                  { id: 'LEADERS', label: `Leaders (${allStaffAccounts.filter(a => a.tier === 'LEADERS').length})` },
                  { id: 'INCHARGES', label: `Incharges & HODs (${allStaffAccounts.filter(a => a.tier === 'INCHARGES').length})` },
                  { id: 'CHAMPIONS', label: `NABH Champions (${allStaffAccounts.filter(a => a.isChapterChampion).length})` },
                  { id: 'EMPLOYEES', label: `Frontline Staff (${allStaffAccounts.filter(a => a.tier === 'EMPLOYEES').length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDirectoryTier(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      directoryTier === t.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff List Grid */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh]">
              {filteredStaffDirectory.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl space-y-1">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No staff members found matching search.</p>
                </div>
              ) : (
                filteredStaffDirectory.map((staff) => (
                  <div
                    key={staff.id}
                    className="p-3.5 bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/90 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-black text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                          {staff.loginId}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {staff.tier}
                        </span>
                        {staff.isChapterChampion && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                            Champion: {staff.chapterAssigned}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900 truncate">
                        {staff.name}
                      </h4>

                      <p className="text-xs text-slate-600 font-medium truncate">
                        {staff.designation} • <strong className="text-slate-800">{staff.departmentName}</strong>
                      </p>

                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        Email: {staff.email} • Password: <strong className="text-slate-700">{DEFAULT_HOSPITAL_PASSWORD}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(staff.loginId, `id-${staff.id}`)}
                        className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                        title="Copy Login ID"
                      >
                        {copiedField === `id-${staff.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectStaffAndLogin(staff)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active-press"
                      >
                        <span>Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredStaffDirectory.length} of {allStaffAccounts.length} Hospital Staff Accounts</span>
              <button
                type="button"
                onClick={() => setIsStaffDirectoryOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
