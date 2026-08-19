'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { DEMO_USERS } from '../../lib/mocks/organizationMock';
import { useAuth } from '../../lib/auth/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('md@stavyaspine.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/overview');
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Authentication failed. Please check your credentials.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('••••••••••••');
    setError('');
    setIsSubmitting(true);

    try {
      await login(demoEmail, 'password');
      router.push('/overview');
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Authentication failed.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || authLoading;

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] bg-grid-pattern-light flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Graphic Orbs */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-red-100/40 rounded-full blur-3xl" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 hover-lift-light">
        {/* Header Banner */}
        <div className="bg-slate-900 p-8 text-center border-b border-slate-800 flex flex-col items-center">
          <div className="mb-3 w-12 h-12 rounded-xl bg-brand-blue text-white flex items-center justify-center font-black text-xl shadow-lg">
            L
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">LAKSHYA</h1>
          <p className="text-xs font-bold tracking-widest text-sky-400 uppercase mt-1">
            MD Office Management Operating System
          </p>
          <span className="text-[10px] text-slate-300 font-mono font-medium mt-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Stavya Spine Hospital — Executive OS V0.1
          </span>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-brand-red flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-brand-red" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Hospital Work Email / Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@stavyaspine.com"
                required
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <span className="text-[11px] text-brand-blue hover:underline cursor-pointer">Forgot?</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-sm rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Sign In to LAKSHYA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Security Guard Footer */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Protected by HTTP-Only Session & CSRF Engine</span>
          </div>
        </form>

        {/* Quick Demo Sign-Ins */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-slate-50 p-5 border-t border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center mb-3">
              Quick Persona Sign-In Demo (Development Only)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin(DEMO_USERS.MD.email)}
                className="p-2.5 bg-white border border-slate-200 rounded-lg hover:border-brand-blue hover:bg-blue-50/50 text-left font-medium text-slate-800 transition-all"
              >
                👑 <span className="font-bold">MD</span> (Managing Director)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(DEMO_USERS.MD_OFFICE.email)}
                className="p-2.5 bg-white border border-slate-200 rounded-lg hover:border-brand-blue hover:bg-blue-50/50 text-left font-medium text-slate-800 transition-all"
              >
                🏛️ <span className="font-bold">MD Office</span> (Het Bhatt)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(DEMO_USERS.DEPARTMENT_HEAD.email)}
                className="p-2.5 bg-white border border-slate-200 rounded-lg hover:border-brand-blue hover:bg-blue-50/50 text-left font-medium text-slate-800 transition-all"
              >
                🏥 <span className="font-bold">Dept Head</span> (Dr. Sharma)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(DEMO_USERS.MANAGER.email)}
                className="p-2.5 bg-white border border-slate-200 rounded-lg hover:border-brand-blue hover:bg-blue-50/50 text-left font-medium text-slate-800 transition-all"
              >
                📋 <span className="font-bold">Manager</span> (Ananya)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
