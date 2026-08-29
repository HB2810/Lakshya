'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Info } from 'lucide-react';
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
        router.push('/overview'); // MD, LEADER, EMPLOYEE workspaces
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
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 relative selection:bg-slate-200">
      {/* Subtle Ambient Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-slate-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-slate-100 rounded-full blur-3xl" />
      </div>

      {/* Main Login Card */}
      <main className="w-full max-w-[440px] relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/90 overflow-hidden">

          {/* Card Brand Header */}
          <div className="pt-8 pb-6 px-8 text-center border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
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
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
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
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Development Active Credential Pill */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Development Credentials</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  ID: <span className="font-bold text-slate-900">STAVYANS-101</span> &bull; Pass: <span className="font-bold text-slate-900">1234</span>
                </p>
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
          </form>
        </div>
      </main>
    </div>
  );
}
