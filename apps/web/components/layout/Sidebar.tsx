'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Calendar,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  BookOpen,
  X,
  Sparkles,
  Heart,
  TrendingUp,
  Smile,
  Lock,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { isQualityCommandAuthorized } from '../../lib/auth/rbacPolicies';
import { StavyaOneLogo } from '../brand/StavyaOneLogo';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile = () => {} }) => {
  const pathname = usePathname();
  const { user, can } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isLeaderOrMD = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER', 'LEADERS', 'MASTER', 'ADMIN'].includes(user.role) || can('dashboard.md.read');

  const navSections = [
    {
      kicker: 'YOUR DAY',
      items: [
        { label: 'My Day', href: '/overview', icon: LayoutDashboard, show: true },
        { label: 'Ask One', href: '/ask-one', icon: Sparkles, show: true },
        { label: 'My Work', href: '/execution', icon: CheckSquare, show: true },
        { label: 'Calendar', href: '/calendar', icon: Calendar, show: true },
        { label: 'Meetings', href: '/meetings', icon: Calendar, show: true },
      ],
    },
    {
      kicker: 'PRIVATE SPACE',
      badge: 'DEVICE VAULT',
      items: [
        { label: 'Health', href: '/health', icon: Heart, show: true },
        { label: 'Wealth', href: '/wealth', icon: TrendingUp, show: true },
        { label: 'Life', href: '/life', icon: Smile, show: true },
        { label: 'Privacy', href: '/privacy', icon: Lock, show: true },
      ],
    },
    {
      kicker: 'HOSPITAL & GOVERNANCE',
      items: [
        { label: 'Policies & SOPs', href: '/policies', icon: BookOpen, show: true },
        { label: 'Quarterly Priorities', href: '/strategy', icon: Target, show: true },
        { label: 'Quality & RCA / FMEA', href: '/rca', icon: Shield, show: true },
        { label: 'Quality Command Centre', href: '/quality', icon: ShieldCheck, show: isQualityCommandAuthorized(user) },
        { label: 'Organization', href: '/organization', icon: Building2, show: isLeaderOrMD },
        { label: 'Training & Guide', href: '/training', icon: GraduationCap, show: true },
        { label: 'Settings', href: '/settings', icon: Settings, show: true },
      ],
    },
  ];

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}
      <aside
        aria-label="Primary navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-3rem))] flex-col justify-between border-r border-slate-200 bg-white shadow-2xl transition-transform duration-250 ease-out md:static md:z-30 md:translate-x-0 md:shadow-none md:transition-[width] md:duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Brand Header */}
        <div className="overflow-y-auto">
          <div className="min-h-16 px-4 pt-[env(safe-area-inset-top)] border-b border-slate-200/80 flex items-center justify-between">
            <Link href="/overview" onClick={onCloseMobile} className="flex min-h-16 items-center gap-3 overflow-hidden">
              {isCollapsed ? (
                <StavyaOneLogo variant="mark" size="sm" />
              ) : (
                <StavyaOneLogo variant="full" size="md" />
              )}
            </Link>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex min-h-9 min-w-9 items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer active-press"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden active-press cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="p-3 space-y-4">
            {navSections.map((section, sIdx) => {
              const visibleItems = section.items.filter((item) => item.show);
              if (visibleItems.length === 0) return null;

              return (
                <div key={sIdx} className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-3 pb-1 flex items-center justify-between">
                      <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        {section.kicker}
                      </span>
                      {section.badge && (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {section.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/overview' && pathname?.startsWith(`${item.href}`));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onCloseMobile}
                        className={`flex min-h-10 items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 active-press ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-bold border-l-3 border-blue-600 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        />
                        <span className={isCollapsed ? 'md:hidden' : 'truncate'}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Footer Summary */}
        <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-slate-200/80 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {user.name.charAt(0)}
            </div>
            <div className={`overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate">{user.role.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

