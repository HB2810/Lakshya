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
    if (path.includes('/overview')) return 'MD Executive Dashboard';
    if (path.includes('/strategy')) return 'Strategic Direction & Priorities';
    if (path.includes('/execution')) return 'Execution Engine & Work Tracker';
    if (path.includes('/meetings')) return 'Meetings & Decision Register';
    if (path.includes('/organization')) return 'Organization & RACI Directory';
    if (path.includes('/reports')) return 'Management Intelligence & Reports';
    if (path.includes('/settings')) return 'System Settings';
    return 'LAKSHYA Platform';
  };

  const personas: { id: Persona; label: string; desc: string }[] = [
    { id: 'MD', label: 'MD (Managing Director)', desc: 'Managing Director Exception View' },
    { id: 'MD_OFFICE', label: 'MD Office (Het Bhatt)', desc: 'Full Organizational Coordination' },
    { id: 'DEPARTMENT_HEAD', label: 'Department Head (Dr. Rohan Sharma)', desc: 'Spine Surgery Scope' },
    { id: 'MANAGER', label: 'Manager (Ananya Patel)', desc: 'Operations Team Scope' },
    { id: 'EMPLOYEE', label: 'Employee (Priyesh Shah)', desc: 'Individual Contributor Scope' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Page Context Breadcrumb */}
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {getPageTitle(pathname)}
          <span className="px-2.5 py-0.5 bg-blue-50 text-brand-blue border border-blue-200 text-[10px] font-mono font-bold rounded-full uppercase">
            v0.1 ACTIVE
          </span>
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
          <span>Stavya Spine Hospital</span>
          <span>/</span>
          <span className="font-semibold text-brand-blue">{user.departmentName}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Live Clock Readout */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-blue-50/80 border border-blue-200/80 rounded-md text-xs font-mono text-brand-blue font-bold">
          <Clock className="w-3.5 h-3.5 text-brand-blue" />
          <span>{timeString || '14:40 IST'}</span>
        </div>

        {/* Search */}
        <div className="relative hidden md:block w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search commitments, decisions..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
          />
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full ring-2 ring-white animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Notifications</h4>
                <span className="text-[10px] bg-blue-50 text-brand-blue border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                  2 New
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 bg-blue-50/50 rounded-md border border-blue-100">
                  <p className="font-semibold text-slate-900">Escalation Engine Active</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">Automated stuck detection and escalation routing operational.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Just now</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Persona Quick-Switcher Dropdown */}
        {process.env.NODE_ENV === 'development' && (
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-brand-blue" />
              <span>Persona: {activePersona.replace('_', ' ')}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-200 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Switch Perspective (DEV DEMO)
                  </p>
                </div>
                {personas.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchPersona(p.id);
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between ${
                      activePersona === p.id ? 'bg-blue-50 text-brand-blue font-semibold border border-blue-200' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{p.label}</p>
                      <p className="text-[10px] text-slate-500">{p.desc}</p>
                    </div>
                    {activePersona === p.id && <Check className="w-4 h-4 text-brand-blue shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="p-2 text-slate-400 hover:text-brand-red hover:bg-red-50 rounded-md transition-colors"
          title="Sign out session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
