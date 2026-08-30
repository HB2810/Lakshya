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
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { hospitalStaffAuthStore, EmployeeAccount } from '../../lib/auth/hospitalStaffAuth';
import { StavyaOneLogo } from '../../components/brand/StavyaOneLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();

  const [staffId, setStaffId] = useState('STAVYANS-101');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 214 Staff Directory Selector Modal
  const [isStaffDirectoryOpen, setIsStaffDirectoryOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryTier, setDirectoryTier] = useState<string>('ALL');

  const allStaffAccounts = useMemo(() => hospitalStaffAuthStore.getAllAccounts(), []);

  const filteredStaffDirectory = useMemo(() => {
    return allStaffAccounts.filter((acc) => {
      if (directoryTier === 'GOVERNANCE') {
        const isGov = acc.role === 'MANAGING_DIRECTOR' || acc.role === 'MASTER' || acc.role === 'MD_OFFICE' || acc.name.includes('Dave');
        if (!isGov) return false;
      } else if (directoryTier === 'CHAMPIONS') {
        if (!acc.isChapterChampion) return false;
      } else if (directoryTier === 'LEADERS') {
        if (acc.role !== 'LEADER' && acc.role !== 'DIRECTOR_QUALITY') return false;
      } else if (directoryTier === 'STAFF') {
        if (acc.role !== 'EMPLOYEE') return false;
      }

      if (directorySearch.trim()) {
        const q = directorySearch.toLowerCase();
        return (
          acc.name.toLowerCase().includes(q) ||
          acc.employeeCode.toLowerCase().includes(q) ||
          acc.id.toLowerCase().includes(q) ||
          acc.designation.toLowerCase().includes(q) ||
          acc.departmentName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allStaffAccounts, directoryTier, directorySearch]);

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
    setStaffId(staff.employeeCode);
    setPassword('1234');
    setIsStaffDirectoryOpen(false);
    setIsSubmitting(true);
    setError('');

    try {
      const loggedInUser = await login(staff.employeeCode, '1234');
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
    <div className="h-[100dvh] w-full overflow-y-auto bg-[#f8fafc] flex items-start sm:items-center justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:p-6 relative selection:bg-slate-200">
      {/* Ambient Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-slate-100 rounded-full blur-3xl" />
      </div>

      {/* Main Login Card */}
      <main className="w-full max-w-[460px] relative z-10 my-4 sm:my-0">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
          {/* Card Brand Header */}
          <div className="px-5 pb-5 pt-6 text-center border-b border-slate-100 bg-gradient-to-b from-blue-50/50 to-white sm:px-8 sm:pb-6 sm:pt-8 flex flex-col items-center">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs mb-3">
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

            {/* Staff ID Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Staff ID / Employee Code / Name
                </label>
                <button
                  type="button"
                  onClick={() => setIsStaffDirectoryOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
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
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Default: 1234 or Stavya@2026</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
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
              className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Browse All 214 Hospital Staff Accounts (1-Click Login)</span>
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 text-center">
                Fast Role Presets
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
                  className="p-2 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="block text-[9px] text-blue-600 uppercase font-black">MD Office (STAVYANS-001)</span>
                  <span className="truncate block text-xs">Dr. Mirant Dave</span>
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
                  className="p-2 bg-purple-50/70 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="block text-[9px] text-purple-600 uppercase font-black">IT / Ops Lead (STAVYANS-002)</span>
                  <span className="truncate block text-xs">Priyesh Shah</span>
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
                  className="p-2 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="block text-[9px] text-emerald-600 uppercase font-black">Clinical Staff (STAVYANS-101)</span>
                  <span className="truncate block text-xs">Hospital Staff</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setStaffId('STAVYANS-000');
                    setPassword('1234');
                    setIsSubmitting(true);
                    try {
                      await login('STAVYANS-000', '1234');
                      router.push('/settings');
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="block text-[9px] text-slate-600 uppercase font-black">System Admin (STAVYANS-000)</span>
                  <span className="truncate block text-xs">Master Admin</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* 214 Hospital Staff Directory Login Drawer / Modal */}
      {isStaffDirectoryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                  Hospital Workforce Directory
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  1-Click Login for All 214 Hospital Staff
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Select any employee from the Stavya Spine Org Chart to immediately log in.
                </p>
              </div>
              <button
                onClick={() => setIsStaffDirectoryOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Search & Tier Filters */}
            <div className="py-3 space-y-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Search by staff code, name, designation, department..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 font-medium text-slate-800"
                  autoFocus
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { id: 'ALL', label: `All Staff (${allStaffAccounts.length})` },
                  { id: 'GOVERNANCE', label: 'Executive Governance' },
                  { id: 'CHAMPIONS', label: 'NABH 6th Champions' },
                  { id: 'LEADERS', label: 'Department Heads' },
                  { id: 'STAFF', label: 'Clinical Staff & Ops' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setDirectoryTier(tier.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                      directoryTier === tier.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff List */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 my-2 max-h-[380px]">
              {filteredStaffDirectory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No staff members match your search criteria.
                </div>
              ) : (
                filteredStaffDirectory.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleSelectStaffAndLogin(staff)}
                    className="w-full p-3 hover:bg-blue-50/70 text-left transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-black flex items-center justify-center text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {staff.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-extrabold text-xs text-slate-900 truncate">{staff.name}</p>
                          {staff.isChapterChampion && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                              {staff.chapterAssigned || 'Champion'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {staff.designation} • {staff.departmentName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {staff.employeeCode}
                      </span>
                      <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Sign In →
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredStaffDirectory.length} of {allStaffAccounts.length} staff</span>
              <button
                onClick={() => setIsStaffDirectoryOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
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
