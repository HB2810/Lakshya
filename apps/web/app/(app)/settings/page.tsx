'use client';

import React from 'react';
import { Settings, Bell, Shield, User, Save } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../lib/auth/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-workspace-border rounded-lg p-6 shadow-card">
        <h2 className="text-xl font-bold text-text-primary tracking-tight">System & Account Settings</h2>
        <p className="text-xs text-text-secondary mt-1">
          Manage user profile information, notification delivery rules, and session security preferences.
        </p>
      </div>

      <Card title="User Profile Information">
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-text-secondary mb-1">Full Name</label>
              <input type="text" defaultValue={user.name} className="w-full p-2 border border-workspace-border rounded bg-slate-50" readOnly />
            </div>
            <div>
              <label className="block font-bold uppercase text-text-secondary mb-1">Email Address</label>
              <input type="text" defaultValue={user.email} className="w-full p-2 border border-workspace-border rounded bg-slate-50" readOnly />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-text-secondary mb-1">Role Persona</label>
              <input type="text" defaultValue={user.role} className="w-full p-2 border border-workspace-border rounded bg-slate-50 font-bold text-brand-blue" readOnly />
            </div>
            <div>
              <label className="block font-bold uppercase text-text-secondary mb-1">Department</label>
              <input type="text" defaultValue={user.departmentName} className="w-full p-2 border border-workspace-border rounded bg-slate-50" readOnly />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Notification Preferences">
        <div className="space-y-3 text-xs">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-blue" />
            <span>Receive instant notifications when assigned to a new Commitment or Task</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-blue" />
            <span>Notify me when a reported Stuck / Need item is updated or resolved</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-blue" />
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
