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
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, can } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isManagement = can('dashboard.md.read') || can('quarterly_direction.create') || user.role === 'ADMIN';

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
      label: 'Organization',
      href: '/organization',
      icon: Building2,
      show: true,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      show: true,
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 relative z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
          <Link href="/overview" className="flex items-center gap-3 overflow-hidden">
            {isCollapsed ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/brand/stavya-logo.png"
                alt="Stavya Spine Hospital"
                height="32"
                style={{ maxHeight: '32px', height: '32px', width: 'auto' }}
                className="h-8 w-auto shrink-0 object-contain"
              />
            ) : (
              <div className="flex items-center gap-2.5">
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
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50/80 text-brand-blue font-bold border-l-4 border-brand-blue shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-blue' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* User Footer Summary */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-blue text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
            {user.name.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate">{user.role.replace('_', ' ')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
