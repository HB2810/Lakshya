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
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { isQualityCommandAuthorized } from '../../lib/auth/rbacPolicies';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile = () => {} }) => {
  const pathname = usePathname();
  const { user, can } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isLeaderOrMD = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER', 'LEADERS', 'MASTER', 'ADMIN'].includes(user.role) || can('dashboard.md.read');

  const navItems = [
    {
      label: 'My Day',
      href: '/overview',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'My Work',
      href: '/execution',
      icon: CheckSquare,
      show: true,
    },
    {
      label: 'Calendar',
      href: '/calendar',
      icon: Calendar,
      show: true,
    },
    {
      label: 'Meetings',
      href: '/meetings',
      icon: Calendar,
      show: true,
    },
    {
      label: 'Policies & SOPs',
      href: '/policies',
      icon: BookOpen,
      show: true,
    },
    {
      label: 'Quarterly Priorities',
      href: '/strategy',
      icon: Target,
      show: true,
    },
    {
      label: 'Quality & RCA / FMEA',
      href: '/rca',
      icon: Shield,
      show: true,
    },
    {
      label: 'Quality Command Centre',
      href: '/quality',
      icon: ShieldCheck,
      show: isQualityCommandAuthorized(user),
    },
    {
      label: 'Organization',
      href: '/organization',
      icon: Building2,
      show: isLeaderOrMD,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      show: true,
    },
  ];

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] md:hidden"
        />
      )}
      <aside
        aria-label="Primary navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-3rem))] flex-col justify-between border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out md:static md:z-30 md:translate-x-0 md:shadow-none md:transition-[width] md:duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
      {/* Brand Header */}
      <div>
        <div className="min-h-16 px-4 pt-[env(safe-area-inset-top)] border-b border-slate-200 flex items-center justify-between">
          <Link href="/overview" onClick={onCloseMobile} className="flex min-h-16 items-center gap-3 overflow-hidden">
            {isCollapsed && (
              // eslint-disable-next-line @next/next/no-img-element -- local hospital brand asset
              <img
                src="/brand/stavya-logo.png"
                alt="Stavya Spine Hospital"
                height="32"
                style={{ maxHeight: '32px', height: '32px', width: 'auto' }}
                className="hidden h-8 w-auto shrink-0 object-contain md:block"
              />
            )}
              <div className={`flex items-center gap-2.5 ${isCollapsed ? 'md:hidden' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/stavya-logo.png"
                  alt="Stavya Spine Hospital"
                  height="36"
                  style={{ maxHeight: '36px', height: '36px', width: 'auto' }}
                  className="h-9 w-auto shrink-0 object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-base font-extrabold tracking-wider text-slate-900 leading-none">
                    LAKSHYA
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
                    Stavya Hospital
                  </span>
                </div>
              </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex min-h-10 min-w-10 items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {navItems
            .filter(item => item.show)
            .map(item => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-xl text-sm md:text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50/80 text-brand-blue font-bold border-l-4 border-brand-blue shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-blue' : 'text-slate-400'}`} />
                  <span className={isCollapsed ? 'md:hidden' : ''}>{item.label}</span>
                </Link>
              );
            })}
        </nav>
      </div>

      {/* User Footer Summary */}
      <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-blue text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
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
