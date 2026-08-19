'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { DEMO_USERS } from '../../lib/mocks/organizationMock';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('md@stavyaspine.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password fields.');
      return;
    }

    setIsLoading(true);

    // Simulate secure server-side session authentication
    setTimeout(() => {
      setIsLoading(false);
      router.push('/overview');
    }, 600);
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('••••••••••••');
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/overview');
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl" />

      {/* Main Login Box */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative z-10">
        {/* Header Header Banner */}
        <div className="bg-slate-950 p-8 text-center border-b border-slate-800 flex flex-col items-center">
          <div className="mb-3 bg-white p-2.5 rounded-xl border border-slate-700 shadow-md">
            <img src="/brand/stavya-logo.png" alt="Stavya Spine Hospital Logo" className="h-14 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">LAKSHYA</h1>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mt-1">
            MD Office Management Operating System
          </p>
          <span className="text-[10px] text-brand-blue font-medium mt-2 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800">
            Stavya Spine Hospital — V0.1 Foundation
          </span>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-brand-red flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Hospital Work Email / Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@stavyaspine.com"
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <span className="text-[11px] text-brand-blue hover:underline cursor-pointer">Forgot?</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-sm rounded-md shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

          {/* CSRF & Session Security Indicator */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Protected by HTTP-Only Session Cookie & CSRF Validation</span>
          </div>
        </form>

        {/* Quick Demo Sign-Ins (DEVELOPMENT-ONLY DEMO GUARD) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-slate-50 p-5 border-t border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center mb-3">
              Quick Persona Sign-In Demo (Development Only)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin(DEMO_USERS.MD.email)}
                className="p-2 bg-white border border-slate-200 rounded hover:border-brand-blue hover:bg-blue-50 text-left font-medium text-slate-800 transition-colors"
              >
                👑 <span className="font-bold">MD</span> (Managing Director)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(DEMO_USERS.MD_OFFICE.email)}
                className="p-2 bg-white border border-slate-200 rounded hover:border-brand-blue hover:bg-blue-50 text-left font-medium text-slate-800 transition-colors"
              >
                🏛️ <span className="font-bold">MD Office</span> (Het Bhatt)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(DEMO_USERS.DEPARTMENT_HEAD.email)}
                className="p-2 bg-white border border-slate-200 rounded hover:border-brand-blue hover:bg-blue-50 text-left font-medium text-slate-800 transition-colors"
              >
                🏥 <span className="font-bold">Dept Head</span> (Dr. Sharma)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(DEMO_USERS.MANAGER.email)}
                className="p-2 bg-white border border-slate-200 rounded hover:border-brand-blue hover:bg-blue-50 text-left font-medium text-slate-800 transition-colors"
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
