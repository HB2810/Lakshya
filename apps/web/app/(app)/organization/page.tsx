'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Network, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Tabs } from '../../../components/ui/Tabs';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { ScopedOrgTree } from '../../../components/leader/ScopedOrgTree';
import { PositionDetailDrawer } from '../../../components/leader/PositionDetailDrawer';
import { DynamicHospitalOrgChart } from '../../../components/organization/DynamicHospitalOrgChart';
import { UserCredentialModal } from '../../../components/organization/UserCredentialModal';
import { HospitalStaffPrivilegeManager } from '../../../components/organization/HospitalStaffPrivilegeManager';
import { apiClient } from '../../../lib/api/client';
import { Department, RoleDefinition, OrgTreeResponse, CanonicalOrgNode } from '../../../types/organization';
import { User, Persona } from '../../../types/auth';
import { WorkItem } from '../../../types/workItem';
import { useAuth } from '../../../lib/auth/AuthContext';

export default function OrganizationPage() {
 const { user, can } = useAuth();
 
 const isLeaderOrMD = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER', 'LEADERS', 'MASTER', 'ADMIN'].includes(user.role) || can('dashboard.md.read');
 const isMD = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'MASTER', 'ADMIN'].includes(user.role);
 const isAdminOrMaster = user.role === 'ADMIN' || user.role === 'MASTER';

 const [activeTab, setActiveTab] = useState(isLeaderOrMD ? 'org_chart' : 'departments');
 const [departments, setDepartments] = useState<Department[]>([]);
 const [users, setUsers] = useState<User[]>([]);
 const [roles, setRoles] = useState<RoleDefinition[]>([]);
 const [workItems, setWorkItems] = useState<WorkItem[]>([]);
 const [orgTree, setOrgTree] = useState<OrgTreeResponse | null>(null);
 const [isLoadingTree, setIsLoadingTree] = useState(true);
 const [selectedNode, setSelectedNode] = useState<CanonicalOrgNode | null>(null);
 const [isDrawerOpen, setIsDrawerOpen] = useState(false);
 const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
 const [editingUser, setEditingUser] = useState<User | null>(null);

 const loadData = useCallback(async () => {
  if (!isLeaderOrMD) {
   setIsLoadingTree(false);
   return;
  }
  setIsLoadingTree(true);
  try {
   const [dRes, uRes, rRes, wRes, treeRes] = await Promise.all([
    apiClient.organization.getDepartments(),
    apiClient.organization.getUsers(),
    apiClient.organization.getRoles(),
    apiClient.workItems.list(),
    isMD ? apiClient.organization.tree() : apiClient.organization.treeScoped(),
   ]);
   setDepartments(dRes || []);
   setUsers(uRes || []);
   setRoles(rRes || []);
   setWorkItems(wRes?.items || []);
   setOrgTree(treeRes || null);
  } catch (err) {
   console.error('Failed to load organization data:', err);
  } finally {
   setIsLoadingTree(false);
  }
 }, [isMD, isLeaderOrMD]);

 useEffect(() => {
  loadData();
 }, [loadData]);

 if (!isLeaderOrMD) {
  return (
   <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-sm my-12">
    <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
     <ShieldAlert className="w-6 h-6" />
    </div>
    <div className="space-y-1">
     <h3 className="text-lg font-black text-slate-900 ">Organization Access Restricted</h3>
     <p className="text-xs text-slate-500 max-w-md mx-auto">
      Hospital organizational hierarchy, staffing directory, and RBAC matrix are accessible only to MD and Leadership roles.
     </p>
    </div>
    <div className="pt-2">
     <Link
      href="/overview"
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
     >
      Return to My Day
     </Link>
    </div>
   </div>
  );
 }

 // Tab definitions - Org Chart ONLY visible to MD & Leader
 const tabs = [
  ...(isLeaderOrMD ? [{ id: 'org_chart', label: 'Hospital Org Chart (214 Staff)' }] : []),
  ...(isLeaderOrMD ? [{ id: 'privileges', label: 'Staff Privileges & Access (Master Admin)' }] : []),
  { id: 'departments', label: 'Departments', count: departments.length },
  { id: 'users', label: 'User Directory', count: users.length },
  ...(isLeaderOrMD ? [{ id: 'rbac', label: 'RBAC & Roles Matrix', count: roles.length }] : []),
 ];

 const deptColumns: Column<Department>[] = [
  {
   key: 'code',
   header: 'Code',
   sortable: true,
   render: row => <span className="font-bold text-indigo-600 ">{row.code}</span>,
  },
  {
   key: 'name',
   header: 'Department Name',
   sortable: true,
   render: row => <span className="font-semibold text-slate-900 ">{row.name}</span>,
  },
  {
   key: 'headUserName',
   header: 'Department Head',
   render: row => <span className="font-medium text-slate-900 ">{row.headUserName}</span>,
  },
  {
   key: 'membersCount',
   header: 'Personnel Count',
   render: row => <span className="font-medium text-slate-600 ">{row.membersCount} staff</span>,
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
     <p className="font-bold text-slate-900 ">{row.name}</p>
     <p className="text-[11px] text-slate-500 ">{row.roleTitle}</p>
    </div>
   ),
  },
  {
   key: 'email',
   header: 'Email',
   render: row => <span className="font-mono text-slate-600 ">{row.email}</span>,
  },
  {
   key: 'role',
   header: 'Persona Role',
   render: row => <Badge variant="purple">{row.role.replace('_', ' ')}</Badge>,
  },
  {
   key: 'departmentName',
   header: 'Department',
   render: row => <span className="font-medium text-slate-900 ">{row.departmentName}</span>,
  },
  ...(isAdminOrMaster ? [{
   key: 'actions',
   header: 'Credentials & Access',
   render: (row: User) => (
    <button
     type="button"
     onClick={() => {
      setEditingUser(row);
      setIsCredentialModalOpen(true);
     }}
     className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-bold rounded-lg transition-colors border border-slate-200 cursor-pointer"
    >
     Edit Credentials
    </button>
   ),
  }] : []),
 ];

 const handleSelectNode = (node: CanonicalOrgNode) => {
  setSelectedNode(node);
  setIsDrawerOpen(true);
 };

 const handleSaveCredential = (userData: any) => {
  if (editingUser) {
   setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userData, roleTitle: userData.role } : u));
  } else {
   const newUser: User = {
    id: `usr-${Date.now()}`,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    roleTitle: userData.role,
    departmentId: userData.departmentId,
    departmentName: userData.departmentName,
    roles: [userData.role],
    permissions: ['*'],
    organizationId: 'org-stavya-01',
   };
   setUsers(prev => [newUser, ...prev]);
  }
  setEditingUser(null);
 };

 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
    <div>
     <h2 className="text-xl font-black text-slate-900 tracking-tight">Organization & RBAC Directory</h2>
     <p className="text-xs text-slate-600 mt-1">
      Stavya Spine Hospital organizational structure, leadership hierarchy, departments, users, and role permissions.
     </p>
    </div>
    {isAdminOrMaster && (
     <Button
      size="sm"
      leftIcon={<Plus className="w-4 h-4" />}
      onClick={() => {
       setEditingUser(null);
       setIsCredentialModalOpen(true);
      }}
     >
      Add Personnel &amp; Credentials
     </Button>
    )}
   </div>

   {/* Tabs */}
   <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

   {activeTab === 'org_chart' && isLeaderOrMD && (
    <DynamicHospitalOrgChart
     workItems={workItems}
    />
   )}

   {activeTab === 'privileges' && isLeaderOrMD && (
    <HospitalStaffPrivilegeManager />
   )}

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
        <p className="text-slate-600 ">{r.description}</p>
        <div className="pt-2 border-t border-slate-200 space-y-1">
         <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
          Granted Capabilities:
         </p>
         <div className="flex flex-wrap gap-1.5 pt-1">
          {r.allowedCapabilities.map(cap => (
           <span key={cap} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-mono border border-indigo-100 rounded text-[10px]">
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

   {/* Position Detail Drawer */}
   <PositionDetailDrawer
    node={selectedNode}
    treeData={orgTree}
    isOpen={isDrawerOpen}
    onClose={() => {
     setIsDrawerOpen(false);
     setSelectedNode(null);
    }}
    onUpdated={() => {
     loadData();
    }}
   />

   {/* User Credential Management Modal */}
   <UserCredentialModal
    isOpen={isCredentialModalOpen}
    onClose={() => {
     setIsCredentialModalOpen(false);
     setEditingUser(null);
    }}
    departments={departments}
    editUser={editingUser}
    onSaveUser={handleSaveCredential}
   />
  </div>
 );
}
