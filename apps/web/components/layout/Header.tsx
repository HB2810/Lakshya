'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  LogOut,
  Clock,
  Menu,
  Sparkles,
  User,
  Users,
  ChevronDown,
  ShieldCheck,
  Heart,
  BookOpen,
  CheckCircle2,
  Briefcase,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  hospitalStaffAuthStore,
  DEFAULT_HOSPITAL_PASSWORD,
} from '../../lib/auth/hospitalStaffAuth';

interface HeaderProps {
  onOpenNavigation?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNavigation = () => {} }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [currentShift, setCurrentShift] = useState('Morning Duty (08:00 – 16:00)');
  const [timeString, setTimeString] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
        setShowShiftPicker(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (path: string) => {
    if (path.includes('/overview')) return 'My Day';
    if (path.includes('/ask-one')) return 'Ask One — AI Companion';
    if (path.includes('/health')) return 'Everyday Wellbeing — Health Journal';
    if (path.includes('/wealth')) return 'Money Clarity — Budget & Savings Plan';
    if (path.includes('/life')) return 'Life Beyond Work — Goals & Habits';
    if (path.includes('/privacy')) return 'Privacy Control Centre';
    if (path.includes('/execution')) return 'My Work';
    if (path.includes('/calendar')) return 'Hospital Calendar';
    if (path.includes('/meetings')) return 'Meetings & Action Register';
    if (path.includes('/policies')) return 'Hospital Policies & SOPs';
    if (path.includes('/strategy')) return 'Quarterly Priorities & Milestones';
    if (path.includes('/quality')) return 'Quality Command Centre (QCC)';
    if (path.includes('/rca')) return 'Root Cause Analysis & FMEA';
    if (path.includes('/organization')) return 'Organization Directory';
    if (path.includes('/training')) return 'Training & Guide Hub';
    if (path.includes('/settings')) return 'System Settings';
    return 'StavyaOne';
  };

  const handleQuickSwitchPersona = async (loginId: string, pass = DEFAULT_HOSPITAL_PASSWORD) => {
    setShowUserMenu(false);
    try {
      await login(loginId, pass);
      router.refresh();
    } catch (e) {
      console.warn('Switch persona error:', e);
    }
  };

  return (
    <header className="min-h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3.5 pt-[env(safe-area-inset-top)] sm:px-5 md:h-16 md:px-6 md:pt-0 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Page Context Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-100 active-press md:hidden shadow-2xs cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-extrabold text-slate-900 tracking-tight sm:text-base">
            {getPageTitle(pathname)}
          </h1>
          <div className="hidden items-center gap-1.5 text-xs text-slate-500 mt-0.5 sm:flex">
            <span>Stavya Spine Hospital</span>
            <span className="text-slate-300">/</span>
            <span className="max-w-44 truncate font-semibold text-slate-700">{user.departmentName || 'Spine Surgery & OT'}</span>
          </div>
        </div>
      </div>

      {/* Top Center: Wisdom of the Day / Shift Status */}
      <div className="hidden xl:flex items-center gap-3">
        {/* Active Shift Pill */}
        <button
          type="button"
          onClick={() => setShowShiftPicker(!showShiftPicker)}
          className="flex items-center gap-2 px-3 py-1 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-full text-xs text-blue-900 shadow-2xs cursor-pointer transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-[11px]">{currentShift}</span>
          <ChevronDown className="w-3 h-3 text-blue-600" />
        </button>

        {/* Kaizen Tip */}
        <div className="flex items-center gap-2 px-3.5 py-1 bg-gradient-to-r from-amber-50/90 to-orange-50/60 border border-amber-200/80 rounded-full text-xs text-amber-900 shadow-2xs">
          <span className="px-1.5 py-0.5 bg-amber-600 text-white text-[9px] font-black rounded uppercase tracking-wider">KAIZEN</span>
          <span className="font-semibold text-[11px]">Continuous Refinement:</span>
          <span className="text-amber-800 text-[11px] truncate max-w-xs">Small daily improvements create compound clinical excellence.</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        {/* Live Clock Readout */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-mono text-slate-700 font-semibold shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{timeString || 'IST'}</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex min-h-10 min-w-10 items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl relative transition-colors cursor-pointer active-press"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="fixed left-3 right-3 top-[calc(4rem+env(safe-area-inset-top))] mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-80">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Hospital Notifications</h4>
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                  2 New
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                  <p className="font-bold text-slate-900">NABH 6th Edition Ready</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">Chapter Champion checklists and SOPs are active for your unit.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Just now</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900">Shift Handover Active</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">OT-2 sterilization protocol completed and verified.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">15m ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden h-5 w-px bg-slate-200 sm:block" />

        {/* Interactive Employee Profile & Fast Switcher Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-50 hover:bg-blue-50/80 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs active-press"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-extrabold text-slate-900 text-xs truncate max-w-[130px] leading-tight">
                {user.name || 'Hospital Staff'}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {user.role ? user.role.replace('_', ' ') : 'EMPLOYEE'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* User Profile Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3.5">
              {/* Profile Card Header */}
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{user.name}</h4>
                  <p className="text-[11px] text-slate-600 font-medium truncate">{user.roleTitle || user.departmentName}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.2 bg-blue-600 text-white text-[9px] font-black rounded-full uppercase">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Fast Persona Switcher (For Testing & Multi-Role Ease) */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  1-Click Role / Persona Switcher
                </p>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickSwitchPersona('STAVYANS-101', '1234')}
                    className="p-2 rounded-xl text-left hover:bg-blue-50 border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-[9px] font-black text-blue-600 uppercase block">Clinical Staff</span>
                      <span className="font-bold text-slate-900">Hospital Staff (STAVYANS-101)</span>
                    </div>
                    {user.role === 'EMPLOYEE' || user.role === 'STAVYANS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSwitchPersona('STAVYA-048')}
                    className="p-2 rounded-xl text-left hover:bg-purple-50 border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-[9px] font-black text-purple-600 uppercase block">Director Quality & NABH</span>
                      <span className="font-bold text-slate-900">Dr. Akruti Mirant Dave (STAVYA-048)</span>
                    </div>
                    {user.email?.includes('akruti') ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSwitchPersona('STAVYANS-001', '1234')}
                    className="p-2 rounded-xl text-left hover:bg-blue-50 border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-[9px] font-black text-blue-700 uppercase block">Managing Director & Surgeon</span>
                      <span className="font-bold text-slate-900">Dr. Mirant Dave (STAVYANS-001)</span>
                    </div>
                    {user.role === 'MD' || user.role === 'MANAGING_DIRECTOR' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/overview');
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-left flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>My Day</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/health');
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-left flex items-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Health Journal</span>
                </button>
              </div>

              {/* Logout Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of StavyaOne</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

