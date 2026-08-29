'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();

  const [staffId, setStaffId] = useState('STAVYANS-101');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!staffId.trim() || !password) {
      setError('Please enter your Staff ID and Password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const loggedInUser = await login(staffId.trim(), password);
      
      if (loggedInUser?.role === 'MASTER') {
        router.push('/settings'); // System Admin Workspace
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

  const isLoading = isSubmitting || authLoading;

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-[#f8fafc] flex items-start sm:items-center justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:p-6 relative selection:bg-slate-200">
      {/* Subtle Ambient Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-slate-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-slate-100 rounded-full blur-3xl" />
      </div>

      {/* Main Login Card */}
      <main className="w-full max-w-[440px] relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/90 overflow-hidden">

          {/* Card Brand Header */}
          <div className="px-5 pb-5 pt-6 text-center border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white sm:px-8 sm:pb-6 sm:pt-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 shadow-xs mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/stavya-logo.png"
                alt="Stavya"
                height="44"
                style={{ maxHeight: '44px', height: '44px', width: 'auto' }}
                className="h-11 w-auto object-contain"
              />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              LAKSHYA
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">

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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Staff ID / Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={staffId}
                  onChange={e => setStaffId(e.target.value)}
                  placeholder="e.g. STAVYANS-101"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
                  Need Help?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-mono"
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

            {/* Development Active Credential Pill */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Info className="w-4 h-4 shrink-0 text-slate-500" />
                <span>Development Credentials (Password: 1234)</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 pl-6 font-mono text-[11px] text-slate-600 min-[380px]:grid-cols-2">
                <div>MD: <span className="font-bold text-slate-900">STAVYANS-001</span></div>
                <div>Leader: <span className="font-bold text-slate-900">STAVYANS-002</span></div>
                <div>Staff: <span className="font-bold text-slate-900">STAVYANS-101</span></div>
                <div>Admin: <span className="font-bold text-slate-900">STAVYANS-000</span></div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* 1-Click Role Switcher Quick Logins */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 text-center">
                One-Click Persona Login
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs min-[380px]:grid-cols-2">
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
                  className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="block text-[10px] text-blue-600 uppercase font-black">MD Office (STAVYANS-001)</span>
                  <span className="truncate block">Dr. Mirant Dave (MD)</span>
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
                  className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="block text-[10px] text-purple-600 uppercase font-black">IT / Ops Lead (STAVYANS-002)</span>
                  <span className="truncate block">Priyesh Shah</span>
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
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="block text-[10px] text-emerald-600 uppercase font-black">Clinical Staff (STAVYANS-101)</span>
                  <span className="truncate block">Hospital Staff</span>
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
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="block text-[10px] text-slate-600 uppercase font-black">System Admin (STAVYANS-000)</span>
                  <span className="truncate block">Master Admin</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
