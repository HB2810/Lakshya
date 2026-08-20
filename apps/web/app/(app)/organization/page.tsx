'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Tabs } from '../../../components/ui/Tabs';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { apiClient } from '../../../lib/api/client';
import { Department, RoleDefinition } from '../../../types/organization';
import { User } from '../../../types/auth';
import { useAuth } from '../../../lib/auth/AuthContext';

export default function OrganizationPage() {
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient.organization.getDepartments(),
      apiClient.organization.getUsers(),
      apiClient.organization.getRoles(),
    ]).then(([dRes, uRes, rRes]) => {
      setDepartments(dRes);
      setUsers(uRes);
      setRoles(rRes);
    });
  }, []);

  const tabs = [
    { id: 'departments', label: 'Departments', count: departments.length },
    { id: 'users', label: 'User Directory', count: users.length },
    { id: 'rbac', label: 'RBAC & Roles Matrix', count: roles.length },
  ];

  const deptColumns: Column<Department>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: row => <span className="font-bold text-indigo-600 dark:text-indigo-400">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Department Name',
      sortable: true,
      render: row => <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span>,
    },
    {
      key: 'headUserName',
      header: 'Department Head',
      render: row => <span className="font-medium text-slate-900 dark:text-white">{row.headUserName}</span>,
    },
    {
      key: 'membersCount',
      header: 'Personnel Count',
      render: row => <span className="font-medium text-slate-600 dark:text-slate-400">{row.membersCount} staff</span>,
    },
    {
      key: 'activeTasksCount',
      header: 'Active Tasks',
      render: row => <Badge variant="primary">{row.activeTasksCount} Active</Badge>,
    },
  ];

  const userColumns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name & Title',
      render: row => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{row.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.roleTitle}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: row => <span className="font-mono text-slate-600 dark:text-slate-400">{row.email}</span>,
    },
    {
      key: 'role',
      header: 'Persona Role',
      render: row => <Badge variant="purple">{row.role.replace('_', ' ')}</Badge>,
    },
    {
      key: 'departmentName',
      header: 'Department',
      render: row => <span className="font-medium text-slate-900 dark:text-white">{row.departmentName}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Organization & RBAC Directory</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Stavya Spine Hospital organizational structure, departments, users, and role permissions.
          </p>
        </div>
        {can('user.create') && (
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Add Personnel
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'departments' && (
        <DataTable columns={deptColumns} data={departments} searchPlaceholder="Filter departments..." />
      )}

      {activeTab === 'users' && (
        <DataTable columns={userColumns} data={users} searchPlaceholder="Filter users..." />
      )}

      {activeTab === 'rbac' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map(r => (
            <Card key={r.name} title={r.title} action={<Badge variant="purple">{r.name}</Badge>}>
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400">{r.description}</p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Granted Capabilities:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.allowedCapabilities.map(cap => (
                      <span key={cap} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono border border-indigo-100 dark:border-indigo-900/50 rounded text-[10px]">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
