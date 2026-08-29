'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../lib/auth/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">System & Account Settings</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Manage user profile information, notification delivery rules, and session security preferences.
        </p>
      </div>

      <Card title="User Profile Information">
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input type="text" defaultValue={user.name} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" readOnly />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input type="text" defaultValue={user.email} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" readOnly />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">Role Persona</label>
              <input type="text" defaultValue={user.role} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-950 font-bold text-indigo-600 dark:text-indigo-400" readOnly />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <input type="text" defaultValue={user.departmentName} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" readOnly />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Notification Preferences">
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
            <span>Receive instant notifications when assigned to a new WorkItem or Commitment</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
            <span>Notify me when a reported Stuck / Blocker item is updated or resolved</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
            <span>Send daily MD Office Executive briefing summary</span>
          </label>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button size="sm" leftIcon={<Save className="w-4 h-4" />}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
