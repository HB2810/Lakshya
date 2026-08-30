'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  CheckSquare,
  Heart,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMobileMenu }) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'My Day', href: '/overview', icon: LayoutDashboard },
    { label: 'Ask One', href: '/ask-one', icon: Sparkles },
    { label: 'My Work', href: '/execution', icon: CheckSquare },
    { label: 'Health', href: '/health', icon: Heart },
  ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-dock pb-[env(safe-area-inset-bottom)] px-2 pt-1.5"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/overview' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-150 active-press ${
                isActive
                  ? 'text-blue-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Menu / More Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open full menu"
          className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl text-slate-500 hover:text-slate-900 font-medium transition-all active-press cursor-pointer"
        >
          <div className="p-1 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
            <Menu className="w-5 h-5 shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
};
