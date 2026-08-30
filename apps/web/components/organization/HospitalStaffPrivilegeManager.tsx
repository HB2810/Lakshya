'use client';

import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Users,
  Search,
  Filter,
  Check,
  X,
  Edit2,
  Lock,
  Unlock,
  Key,
  LogIn,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Building,
  Award,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { hospitalStaffAuthStore, EmployeeAccount } from '../../lib/auth/hospitalStaffAuth';
import { useAuth } from '../../lib/auth/AuthContext';
import { Persona } from '../../types/auth';

const CAPABILITIES_LIST = [
  { id: 'QUALITY_COMMAND_VIEW', label: 'Quality Command (QCC)', description: 'View and audit 48 NABH indicators & chapter matrix' },
  { id: 'QUALITY_MANAGE', label: 'Quality Sign-Off', description: 'Authorize and sign off chapter actions and CAPA' },
  { id: 'TASK_MANAGE', label: 'Task Engine Manage', description: 'Create, assign, edit, and close tasks across team' },
  { id: 'RACI_MANAGE', label: 'RACI Governance', description: 'Assign Responsible, Accountable, Consulted, Informed' },
  { id: 'POLICIES_AUTHOR', label: 'Policy Authoring', description: 'Create, draft, and submit hospital SOPs and policies' },
  { id: 'GOVERNANCE_VIEW', label: 'Executive Governance', description: 'Access executive board metrics and statutory quorum' },
  { id: 'AUDIT_VIEW', label: 'Audit Trail Logs', description: 'View system immutable audit logs and export reports' },
  { id: 'INTAKE_DISPATCH', label: 'Omnichannel Intake', description: 'Approve and deploy WhatsApp & email tasks' },
];

export const HospitalStaffPrivilegeManager: React.FC = () => {
  const { user, login } = useAuth();
  const [accounts, setAccounts] = useState<EmployeeAccount[]>(() => hospitalStaffAuthStore.getAllAccounts());

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Edit Modal State
  const [editingStaff, setEditingStaff] = useState<EmployeeAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Tier filter
      if (selectedTier === 'GOVERNANCE') {
        const isGov = acc.role === 'MANAGING_DIRECTOR' || acc.role === 'MASTER' || acc.role === 'MD_OFFICE' || acc.name.includes('Dave');
        if (!isGov) return false;
      } else if (selectedTier === 'CHAMPIONS') {
        if (!acc.isChapterChampion) return false;
      } else if (selectedTier === 'LEADERS') {
        if (acc.role !== 'LEADER' && acc.role !== 'DIRECTOR_QUALITY') return false;
      } else if (selectedTier === 'STAFF') {
        if (acc.role !== 'EMPLOYEE') return false;
      }

      // Role filter
      if (selectedRoleFilter !== 'ALL' && acc.role !== selectedRoleFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL' && acc.accessStatus !== selectedStatusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesCode = acc.employeeCode.toLowerCase().includes(q) || acc.id.toLowerCase().includes(q);
        const matchesDesig = acc.designation.toLowerCase().includes(q);
        const matchesDept = acc.departmentName.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesig && !matchesDept) {
          return false;
        }
      }

      return true;
    });
  }, [accounts, selectedTier, selectedRoleFilter, selectedStatusFilter, searchQuery]);

  // Fast Status Toggle (Active <-> Suspended)
  const handleToggleStatus = (staff: EmployeeAccount) => {
    const nextStatus = staff.accessStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      hospitalStaffAuthStore.setAccessStatus(staff.id, nextStatus);
      setAccounts([...hospitalStaffAuthStore.getAllAccounts()]);
      setToastMessage(`Updated access status for ${staff.name} to ${nextStatus}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Toggle Capability directly
  const handleToggleCapability = (staff: EmployeeAccount, capId: string) => {
    const isCurrentlyGranted = staff.capabilities.includes(capId);
    try {
      hospitalStaffAuthStore.toggleCapability(staff.id, capId, !isCurrentlyGranted);
      setAccounts([...hospitalStaffAuthStore.getAllAccounts()]);
      setToastMessage(
        `${!isCurrentlyGranted ? 'Granted' : 'Revoked'} ${capId} for ${staff.name.split(' ')[0]}`
      );
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // 1-Click Login / Impersonate
  const handleImpersonateLogin = async (staff: EmployeeAccount) => {
    if (staff.accessStatus === 'SUSPENDED') {
      alert(`Cannot log in as ${staff.name}: Account is currently SUSPENDED.`);
      return;
    }

    try {
      await login(staff.employeeCode, '1234');
      setToastMessage(`Switched session to ${staff.name} (${staff.roleTitle})`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e: any) {
      alert(`Impersonation failed: ${e.message}`);
    }
  };

  // Save Modal Updates
  const handleSaveStaffEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      hospitalStaffAuthStore.updateEmployeePrivileges(editingStaff.id, {
        role: editingStaff.role,
        roleTitle: editingStaff.roleTitle,
        accessStatus: editingStaff.accessStatus,
        capabilities: editingStaff.capabilities,
        departmentName: editingStaff.departmentName,
      });

      setAccounts([...hospitalStaffAuthStore.getAllAccounts()]);
      setToastMessage(`Privileges updated for ${editingStaff.name}`);
      setEditingStaff(null);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Stats Counters
  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.accessStatus === 'ACTIVE').length;
    const suspended = accounts.filter((a) => a.accessStatus === 'SUSPENDED').length;
    const qualityAuthorized = accounts.filter((a) => a.capabilities.includes('QUALITY_COMMAND_VIEW')).length;
    const champions = accounts.filter((a) => a.isChapterChampion).length;
    return { total, active, suspended, qualityAuthorized, champions };
  }, [accounts]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden space-y-0">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-blue-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 via-white to-slate-50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                Master Administration
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                214 Hospital Staff Access Control &amp; RBAC
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hospital Staff Privilege &amp; Access Governance
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium">
              Manage platform access, roles, and granular capabilities across all 214 hospital employees from the Stavya Spine Org Chart.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl p-2.5 shrink-0 shadow-2xs">
            <div className="text-center px-2.5 border-r border-slate-200">
              <p className="text-[10px] uppercase text-slate-500 font-bold">Total Staff</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</p>
            </div>
            <div className="text-center px-2.5 border-r border-slate-200">
              <p className="text-[10px] uppercase text-emerald-600 font-bold">Active Logins</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">{stats.active}</p>
            </div>
            <div className="text-center px-2.5 border-r border-slate-200">
              <p className="text-[10px] uppercase text-blue-600 font-bold">Quality Access</p>
              <p className="text-xl font-black text-blue-600 mt-0.5">{stats.qualityAuthorized}</p>
            </div>
            <div className="text-center px-2.5">
              <p className="text-[10px] uppercase text-indigo-600 font-bold">NABH Champions</p>
              <p className="text-xl font-black text-indigo-600 mt-0.5">{stats.champions}</p>
            </div>
          </div>
        </div>

        {/* Tier Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100">
          {[
            { id: 'ALL', label: `All Staff (${stats.total})` },
            { id: 'GOVERNANCE', label: 'Executive Governance' },
            { id: 'CHAMPIONS', label: `NABH Champions (${stats.champions})` },
            { id: 'LEADERS', label: 'Department Heads & Leads' },
            { id: 'STAFF', label: 'Clinical Staff & Operations' },
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                selectedTier === tier.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, name, designation..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 w-52 sm:w-72 text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden focus:border-blue-600"
          >
            <option value="ALL">All Roles</option>
            <option value="MANAGING_DIRECTOR">Managing Director</option>
            <option value="MASTER">Master / Admin</option>
            <option value="DIRECTOR_QUALITY">Director Quality</option>
            <option value="LEADER">Leader / Head</option>
            <option value="EMPLOYEE">Employee / Staff</option>
          </select>

          {/* Access Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden focus:border-blue-600"
          >
            <option value="ALL">All Access Statuses</option>
            <option value="ACTIVE">Active Logins</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="READ_ONLY">Read Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Reset all 214 staff accounts and privileges to original factory baseline?')) {
                hospitalStaffAuthStore.resetToDefaults();
                setAccounts([...hospitalStaffAuthStore.getAllAccounts()]);
                setToastMessage('Reset all staff accounts to default roles and privileges.');
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
          <span className="text-xs text-slate-500 font-bold px-2 py-1 bg-white border border-slate-200 rounded-xl">
            {filteredAccounts.length} Staff
          </span>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0 z-10">
            <tr>
              <th className="p-3 pl-4">Staff Code &amp; Name</th>
              <th className="p-3">Designation &amp; Department</th>
              <th className="p-3">Platform Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Key Capabilities</th>
              <th className="p-3 pr-4 text-right">Admin Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500 font-semibold">
                  No staff members match the selected search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredAccounts.map((staff) => {
                const isQuality = staff.capabilities.includes('QUALITY_COMMAND_VIEW');
                const isRaci = staff.capabilities.includes('RACI_MANAGE');
                const isTask = staff.capabilities.includes('TASK_MANAGE');
                const isPolicies = staff.capabilities.includes('POLICIES_AUTHOR');

                return (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-all">
                    {/* Code & Name */}
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-black flex items-center justify-center text-xs shrink-0">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">{staff.name}</span>
                            {staff.isChapterChampion && (
                              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {staff.chapterAssigned || 'Champion'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-slate-400">{staff.employeeCode} • {staff.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Designation & Dept */}
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{staff.designation}</p>
                      <p className="text-[11px] text-slate-500">{staff.departmentName}</p>
                    </td>

                    {/* Role */}
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${
                          staff.role === 'MANAGING_DIRECTOR' || staff.role === 'MASTER'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : staff.role === 'DIRECTOR_QUALITY'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : staff.role === 'LEADER'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {staff.role}
                      </span>
                    </td>

                    {/* Access Status Toggle */}
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(staff)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 ${
                          staff.accessStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {staff.accessStatus === 'ACTIVE' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{staff.accessStatus}</span>
                      </button>
                    </td>

                    {/* Quick Capability Toggles */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleToggleCapability(staff, 'QUALITY_COMMAND_VIEW')}
                          title="Toggle Quality Command Centre Access"
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                            isQuality
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          QCC
                        </button>
                        <button
                          onClick={() => handleToggleCapability(staff, 'TASK_MANAGE')}
                          title="Toggle Task Management Privilege"
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                            isTask
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          Tasks
                        </button>
                        <button
                          onClick={() => handleToggleCapability(staff, 'RACI_MANAGE')}
                          title="Toggle RACI Governance Privilege"
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                            isRaci
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          RACI
                        </button>
                        <button
                          onClick={() => handleToggleCapability(staff, 'POLICIES_AUTHOR')}
                          title="Toggle Policy Authoring Privilege"
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                            isPolicies
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          SOP
                        </button>
                      </div>
                    </td>

                    {/* Admin Actions */}
                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingStaff({ ...staff })}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-all"
                          title="Edit Staff Privileges"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleImpersonateLogin(staff)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
                          title="Login and test session as this employee"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Login As</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Staff Privilege Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                  Staff Privilege Editor
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Manage Privileges: {editingStaff.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editingStaff.employeeCode} • {editingStaff.email}
                </p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaffEdit} className="space-y-4 text-xs">
              {/* Role & Access Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Platform Role</label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as Persona })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="MANAGING_DIRECTOR">MANAGING_DIRECTOR (Managing Director)</option>
                    <option value="MASTER">MASTER (Executive Board / Chairman)</option>
                    <option value="MD_OFFICE">MD_OFFICE (Executive Admin)</option>
                    <option value="DIRECTOR_QUALITY">DIRECTOR_QUALITY (Quality &amp; Patient Safety)</option>
                    <option value="LEADER">LEADER (Department Head / Consultant)</option>
                    <option value="EMPLOYEE">EMPLOYEE (Clinical &amp; Support Staff)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Platform Access Status</label>
                  <select
                    value={editingStaff.accessStatus}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        accessStatus: e.target.value as EmployeeAccount['accessStatus'],
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="ACTIVE">ACTIVE (Full Login Enabled)</option>
                    <option value="READ_ONLY">READ_ONLY (View Only Permissions)</option>
                    <option value="SUSPENDED">SUSPENDED (Login Prohibited)</option>
                  </select>
                </div>
              </div>

              {/* Designation Title & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation Role Title</label>
                  <input
                    type="text"
                    value={editingStaff.roleTitle}
                    onChange={(e) => setEditingStaff({ ...editingStaff, roleTitle: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department Unit</label>
                  <input
                    type="text"
                    value={editingStaff.departmentName}
                    onChange={(e) => setEditingStaff({ ...editingStaff, departmentName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Granular Capabilities Selection */}
              <div className="pt-2">
                <label className="block font-bold text-slate-900 mb-2">
                  Granular Platform Capabilities &amp; Access Rights
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CAPABILITIES_LIST.map((cap) => {
                    const isGranted = editingStaff.capabilities.includes(cap.id);
                    return (
                      <label
                        key={cap.id}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isGranted
                            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-500'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isGranted}
                          onChange={(e) => {
                            let newCaps = [...editingStaff.capabilities];
                            if (e.target.checked) {
                              newCaps.push(cap.id);
                            } else {
                              newCaps = newCaps.filter((c) => c !== cap.id);
                            }
                            setEditingStaff({ ...editingStaff, capabilities: newCaps });
                          }}
                          className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{cap.label}</p>
                          <p className="text-[10px] text-slate-500 leading-snug">{cap.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Privileges</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
