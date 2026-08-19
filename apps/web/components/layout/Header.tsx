'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, UserCheck, LogOut, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Persona } from '../../types/auth';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activePersona, switchPersona, logout } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = (path: string) => {
    if (path.includes('/overview')) return 'MD Office Overview';
    if (path.includes('/strategy')) return 'Strategic Direction & Priorities';
    if (path.includes('/execution')) return 'Execution & Work Tracker';
    if (path.includes('/meetings')) return 'Meetings & Decision Register';
    if (path.includes('/organization')) return 'Organization & RBAC Directory';
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
    <header className="h-16 bg-white border-b border-workspace-border px-6 flex items-center justify-between sticky top-0 z-20 shadow-subtle">
      {/* Page Context Breadcrumb */}
      <div>
        <h1 className="text-base font-bold text-text-primary tracking-tight">{getPageTitle(pathname)}</h1>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>Stavya Spine Hospital</span>
          <span>/</span>
          <span className="font-medium text-brand-blue">{user.departmentName}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search commitments, decisions..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-workspace-subtle border border-workspace-border rounded-md focus:bg-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
          />
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-workspace-subtle rounded-md relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-workspace-border rounded-lg shadow-modal p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-workspace-border pb-2 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">Notifications</h4>
                <span className="text-[10px] bg-blue-50 text-brand-blue font-semibold px-2 py-0.5 rounded-full">
                  2 New
                </span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-2.5 bg-blue-50/50 rounded-md border border-blue-100">
                  <p className="font-semibold text-text-primary">Escalation Assigned</p>
                  <p className="text-text-secondary mt-0.5">PACS Vendor API keys overdue for MRI requisition integration.</p>
                  <span className="text-[10px] text-text-muted mt-1 block">15 mins ago</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md border border-workspace-border">
                  <p className="font-semibold text-text-primary">Decision Approved</p>
                  <p className="text-text-secondary mt-0.5">MD Office approved emergency MRI allocation protocol.</p>
                  <span className="text-[10px] text-text-muted mt-1 block">2 hours ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-workspace-border" />

        {/* Persona Quick-Switcher Dropdown (DEVELOPMENT-ONLY DEMO GUARD) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-workspace-subtle hover:bg-slate-200 border border-workspace-border rounded-md text-xs font-semibold text-text-primary transition-colors"
            >
              <UserCheck className="w-4 h-4 text-brand-blue" />
              <span>Persona: {activePersona.replace('_', ' ')}</span>
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-workspace-border rounded-lg shadow-modal p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-workspace-border mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Switch Persona Perspective (DEMO ONLY)
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
                      activePersona === p.id ? 'bg-blue-50 text-brand-blue font-semibold' : 'hover:bg-workspace-subtle text-text-primary'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{p.label}</p>
                      <p className="text-[10px] text-text-muted">{p.desc}</p>
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
          className="p-2 text-text-muted hover:text-brand-red hover:bg-red-50 rounded-md transition-colors"
          title="Sign out session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
