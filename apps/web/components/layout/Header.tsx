'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, UserCheck, LogOut, ChevronDown, Check, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Persona } from '../../types/auth';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activePersona, switchPersona, logout } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (path: string) => {
    if (path.includes('/overview')) return 'My Day';
    if (path.includes('/execution')) return 'My Work';
    if (path.includes('/calendar')) return 'Hospital Calendar';
    if (path.includes('/meetings')) return 'Meetings & Action Register';
    if (path.includes('/policies')) return 'Hospital Policies & Standard Operating Procedures (SOPs)';
    if (path.includes('/strategy')) return 'Quarterly Priorities & 10-Milestone Engine';
    if (path.includes('/rca')) return 'Root Cause Analysis (RCA) & FMEA Tools';
    if (path.includes('/organization')) return 'Organization Directory';
    if (path.includes('/settings')) return 'System Settings';
    return 'LAKSHYA';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Page Context Breadcrumb */}
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {getPageTitle(pathname)}
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
          <span>Stavya Spine Hospital</span>
          <span>/</span>
          <span className="font-semibold text-slate-700">{user.departmentName}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3.5">
        {/* Live Clock Readout */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 font-semibold">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{timeString || 'IST'}</span>
        </div>

        {/* Search */}
        <div className="relative hidden md:block w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, meetings..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
          />
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Notifications</h4>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                  1 New
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="font-semibold text-slate-900">Welcome to LAKSHYA</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">Your hospital workspace is active and up to date.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Just now</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Active User Persona Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{user.name}</span>
          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
            {user.role}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
