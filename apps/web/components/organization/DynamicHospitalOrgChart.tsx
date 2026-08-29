'use client';

import React, { useState, useMemo } from 'react';
import {
  Network,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  User,
  Shield,
  Briefcase,
  Phone,
  Mail,
  Building2,
  Sparkles,
  ArrowRight,
  Filter,
  Plus,
  ArrowRightLeft,
  X,
  Stethoscope,
  Activity,
  Layers,
  Crown,
  Building,
} from 'lucide-react';
import {
  STAVYA_STAFF_DATABASE,
  STAVYA_ORG_STRUCTURE,
  HospitalStaffMember,
  UnitGroup,
  UnitLeaf,
} from '../../lib/data/stavyaHospitalOrgData';
import { WorkItem } from '../../types/workItem';
import { useAuth } from '../../lib/auth/AuthContext';

interface DynamicHospitalOrgChartProps {
  workItems?: WorkItem[];
  onOpenTaskModal?: (assigneeId: string, assigneeName: string) => void;
  onTransferPerson?: (staff: HospitalStaffMember) => void;
}

export const DynamicHospitalOrgChart: React.FC<DynamicHospitalOrgChartProps> = ({
  workItems = [],
  onOpenTaskModal,
  onTransferPerson,
}) => {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState<'all' | 'gov' | 'clin' | 'adm'>('all');
  const [filterWorkload, setFilterWorkload] = useState<'all' | 'active_tasks' | 'blocked' | 'probation' | 'wide_span'>('all');
  const [selectedStaff, setSelectedStaff] = useState<HospitalStaffMember | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const staffList = useMemo(() => Object.values(STAVYA_STAFF_DATABASE), []);

  // Compute direct reports count per staff
  const reportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    staffList.forEach((s) => {
      const mgrName = (s.reports || '').trim().toLowerCase();
      if (mgrName) {
        counts[mgrName] = (counts[mgrName] || 0) + 1;
      }
    });
    return counts;
  }, [staffList]);

  // Map tasks to staff members
  const staffTasksMap = useMemo(() => {
    const map: Record<string, WorkItem[]> = {};
    workItems.forEach((w) => {
      const ownerId = w.owner_id || '';
      const ownerName = (w.owner_name || '').toLowerCase();
      
      staffList.forEach((s) => {
        if (s.id === ownerId || s.name.toLowerCase() === ownerName || s.email.toLowerCase() === w.owner_id?.toLowerCase()) {
          if (!map[s.id]) map[s.id] = [];
          map[s.id].push(w);
        }
      });
    });
    return map;
  }, [workItems, staffList]);

  const getStaffTasks = (staffId: string): WorkItem[] => {
    return staffTasksMap[staffId] || [];
  };

  // Filter staff based on search and workload
  const isStaffVisible = (staff: HospitalStaffMember): boolean => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        staff.name.toLowerCase().includes(q) ||
        staff.desig.toLowerCase().includes(q) ||
        staff.unit.toLowerCase().includes(q) ||
        staff.code.toLowerCase().includes(q) ||
        staff.dept_master.toLowerCase().includes(q) ||
        (staff.reports && staff.reports.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filterWorkload === 'active_tasks') {
      const tasks = getStaffTasks(staff.id);
      return tasks.some((t) => t.status !== 'completed');
    }
    if (filterWorkload === 'blocked') {
      const tasks = getStaffTasks(staff.id);
      return tasks.some((t) => t.status === 'blocked' || t.status === 'stuck');
    }
    if (filterWorkload === 'probation') {
      return staff.emp === 'Probation';
    }
    if (filterWorkload === 'wide_span') {
      const rCount = reportCounts[staff.name.toLowerCase()] || 0;
      return rCount > 12;
    }

    return true;
  };

  const getUnitMembers = (unitName: string): HospitalStaffMember[] => {
    return staffList.filter((s) => s.unit.toLowerCase() === unitName.toLowerCase());
  };

  const openStaffDetail = (staff: HospitalStaffMember) => {
    setSelectedStaff(staff);
    setIsDrawerOpen(true);
  };

  // Render a pure white unit card
  const renderUnitCard = (unitName: string) => {
    const members = getUnitMembers(unitName);
    const headName = STAVYA_ORG_STRUCTURE.heads[unitName];
    const visibleMembers = members.filter(isStaffVisible);

    if (searchTerm.trim() && visibleMembers.length === 0 && !unitName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

    // Sort: head first, then alphabetically
    const sortedMembers = [...members].sort((a, b) => {
      const aIsHead = a.name === headName ? 1 : 0;
      const bIsHead = b.name === headName ? 1 : 0;
      if (aIsHead !== bIsHead) return bIsHead - aIsHead;
      return a.name.localeCompare(b.name);
    });

    const activeUnitTasksCount = members.reduce(
      (acc, m) => acc + getStaffTasks(m.id).filter((t) => t.status !== 'completed').length,
      0
    );

    return (
      <div
        key={unitName}
        className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="min-w-0">
              <h4 className="text-xs font-black text-slate-900 truncate tracking-tight">{unitName}</h4>
              {headName && (
                <p className="text-[11px] text-blue-600 font-semibold truncate flex items-center gap-1 mt-0.5">
                  <span>Lead: {headName}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeUnitTasksCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
                  {activeUnitTasksCount} Active
                </span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200/60">
                {members.length}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 max-h-[300px] overflow-y-auto pr-1">
            {sortedMembers.map((member) => {
              const isHead = member.name === headName;
              const tasks = getStaffTasks(member.id);
              const activeTasks = tasks.filter((t) => t.status !== 'completed');
              const hasBlocked = tasks.some((t) => t.status === 'blocked' || t.status === 'stuck');
              const reportsToMe = member.reports;
              const dReports = reportCounts[member.name.toLowerCase()] || 0;
              const isHighlighted = isStaffVisible(member);

              return (
                <div
                  key={member.id}
                  onClick={() => openStaffDetail(member)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 border text-xs ${
                    isHead
                      ? 'bg-blue-50/50 border-blue-200/70 hover:bg-blue-50'
                      : isHighlighted
                      ? 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                      : 'opacity-40 bg-slate-50 border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-bold truncate ${isHead ? 'text-blue-900' : 'text-slate-900'}`}>
                        {member.name}
                      </span>
                      {member.code && (
                        <span className="text-[9px] font-mono font-semibold px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                          #{member.code}
                        </span>
                      )}
                      {member.emp === 'Probation' && (
                        <span className="text-[8px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded uppercase">
                          Probation
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{member.desig}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasBlocked && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Has blocked work items" />
                    )}
                    {activeTasks.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        {activeTasks.length} task{activeTasks.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {dReports > 0 && (
                      <span className="text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                        👥 {dReports}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render a pure white department group container
  const renderGroup = (group: UnitGroup | UnitLeaf) => {
    if (group.type === 'leaf') {
      return renderUnitCard(group.name);
    }

    const headName = group.head;
    const directReports = headName ? reportCounts[headName.toLowerCase()] || 0 : 0;

    return (
      <div
        key={group.name}
        className="col-span-full bg-white border border-slate-200/90 rounded-3xl p-5 space-y-4 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase rounded-md tracking-wider">
                DEPARTMENT GROUP
              </span>
              <h3 className="text-base font-black text-slate-900 tracking-tight">{group.name}</h3>
            </div>
            {headName ? (
              <p className="text-xs text-blue-700 font-semibold mt-1">
                {headName} · <span className="text-slate-500 font-normal">{group.head_title}</span>
                {directReports > 12 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded">
                    ⚠ {directReports} direct reports (Span &gt; 12)
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">{group.head_title}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {group.children.map((child) => renderGroup(child))}
        </div>
      </div>
    );
  };

  const totalStaff = staffList.length;
  const probationCount = staffList.filter((s) => s.emp === 'Probation').length;
  const wideSpanCount = staffList.filter((s) => (reportCounts[s.name.toLowerCase()] || 0) > 12).length;

  return (
    <div className="space-y-6">
      {/* Pure White Minimalist Header & Control Center */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black rounded-full uppercase tracking-wider">
                HOSPITAL OPERATING STRUCTURE
              </span>
              <span className="text-xs text-slate-500 font-medium">• 211 Verified Personnel</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hospital Organizational Operating Structure</h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Stavya Spine Hospital enterprise governance, clinical specialty departments, nursing services, and administrative support operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl text-center border border-slate-200/80">
              <span className="block text-xl font-black text-slate-900">{totalStaff}</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Total Staff</span>
            </div>
            <div className="bg-amber-50/70 px-4 py-2.5 rounded-2xl text-center border border-amber-200/60">
              <span className="block text-xl font-black text-amber-800">{probationCount}</span>
              <span className="block text-[9px] uppercase tracking-wider text-amber-700 font-bold">On Probation</span>
            </div>
            <div className="bg-emerald-50/70 px-4 py-2.5 rounded-2xl text-center border border-emerald-200/60">
              <span className="block text-xl font-black text-emerald-800">
                {Object.keys(STAVYA_ORG_STRUCTURE.heads).length}
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-emerald-700 font-bold">Departments</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar (Pure White Theme) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Units (211 Staff)' },
              { id: 'gov', label: 'Governance' },
              { id: 'clin', label: 'Clinical Services' },
              { id: 'adm', label: 'Administrative & Support' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTier(t.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTier === t.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff, code, unit..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterWorkload}
              onChange={(e) => setFilterWorkload(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Personnel</option>
              <option value="active_tasks">With Active Tasks</option>
              <option value="blocked">Blocked / Needs Attention</option>
              <option value="probation">Probation Status ({probationCount})</option>
              <option value="wide_span">Wide Span &gt; 12 Reports ({wideSpanCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 1. GOVERNANCE TIER */}
      {(activeTier === 'all' || activeTier === 'gov') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Shield className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Executive Governance &amp; Founding Board
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STAVYA_ORG_STRUCTURE.governance.map((gov) => {
              const matchedStaff = staffList.find((s) => s.name.toLowerCase() === gov.name.toLowerCase());
              const isMD = gov.name.toLowerCase().includes('mirant') || gov.title.toLowerCase().includes('managing director');
              const isFounder = gov.title.toLowerCase().includes('founder');

              return (
                <div
                  key={gov.name}
                  onClick={() => matchedStaff && openStaffDetail(matchedStaff)}
                  className={`bg-white border ${
                    isMD
                      ? 'border-blue-500 ring-2 ring-blue-100 shadow-xs'
                      : 'border-slate-200/90'
                  } rounded-2xl p-4.5 shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all cursor-pointer space-y-2`}
                >
                  <span
                    className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                      isMD
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : isFounder
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}
                  >
                    {isMD ? 'Managing Director (MD)' : isFounder ? 'Founder & Chairman' : 'Executive Board'}
                  </span>
                  <h4 className="text-sm font-black text-slate-900">{gov.name}</h4>
                  <p className="text-xs text-blue-700 font-bold">{gov.title}</p>
                  <p className="text-[11px] text-slate-500">{gov.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. CLINICAL SERVICES TIER */}
      {(activeTier === 'all' || activeTier === 'clin') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Clinical Services &amp; Medical Operations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {STAVYA_ORG_STRUCTURE.clinical.map((item) => renderGroup(item))}
          </div>
        </div>
      )}

      {/* 3. ADMINISTRATIVE & SUPPORT SERVICES TIER */}
      {(activeTier === 'all' || activeTier === 'adm') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Administrative &amp; Hospital Operations Support
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {STAVYA_ORG_STRUCTURE.admin.map((item) => renderGroup(item))}
          </div>
        </div>
      )}

      {/* 4. PURE WHITE STAFF & POSITION DETAIL DRAWER */}
      {selectedStaff && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40 transition-opacity"
            onClick={() => {
              setIsDrawerOpen(false);
              setSelectedStaff(null);
            }}
          />

          <div className="fixed inset-y-2 right-2 w-[440px] max-w-[95vw] bg-white rounded-3xl shadow-2xl z-50 flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Pure White Drawer Header */}
            <div className="shrink-0 p-5 bg-white border-b border-slate-100 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black rounded uppercase">
                    {selectedStaff.unit}
                  </span>
                  {selectedStaff.code && (
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      #{selectedStaff.code}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900">{selectedStaff.name}</h3>
                <p className="text-xs text-blue-700 font-bold">{selectedStaff.desig}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setSelectedStaff(null);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Assigned Work Items / Tasks */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    Assigned Execution Tasks ({getStaffTasks(selectedStaff.id).length})
                  </h4>
                  {onOpenTaskModal && (
                    <button
                      type="button"
                      onClick={() => onOpenTaskModal(selectedStaff.id, selectedStaff.name)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-blue-200"
                    >
                      <Plus className="w-3 h-3" />
                      Assign Work
                    </button>
                  )}
                </div>

                {getStaffTasks(selectedStaff.id).length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
                    <p className="text-slate-500 font-medium">No active tasks currently assigned.</p>
                    <p className="text-[11px] text-slate-400">Available for new milestone assignments.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getStaffTasks(selectedStaff.id).map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase ${
                              task.priority === 'urgent'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Due {task.due_at?.substring(0, 10) || 'Soon'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900">{task.title}</p>
                        {task.status === 'blocked' && (
                          <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                            ⚠ Blocked: {task.blocked_reason || 'Pending action'}
                          </p>
                        )}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${task.progressPercent || 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reporting & Organizational Role */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  Reporting Hierarchy
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reports Directly To:</span>
                    <span className="font-bold text-slate-900">{selectedStaff.reports || 'Governing Body / Board'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Direct Reports:</span>
                    <span className="font-bold text-slate-900">
                      {reportCounts[selectedStaff.name.toLowerCase()] || 0} staff members
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payroll Department:</span>
                    <span className="font-bold text-slate-900">{selectedStaff.dept_master}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employment Status:</span>
                    <span className="font-bold text-slate-900">{selectedStaff.emp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shift:</span>
                    <span className="font-bold text-slate-900">{selectedStaff.shift}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  Contact Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Mobile:
                    </span>
                    <a
                      href={`tel:${selectedStaff.mobile}`}
                      className="font-bold text-blue-600 hover:underline font-mono"
                    >
                      {selectedStaff.mobile}
                    </a>
                  </div>
                  {selectedStaff.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Email:
                      </span>
                      <a
                        href={`mailto:${selectedStaff.email}`}
                        className="font-medium text-blue-600 hover:underline font-mono truncate max-w-[200px]"
                      >
                        {selectedStaff.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Transfer action */}
              {onTransferPerson && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onTransferPerson(selectedStaff);
                      setIsDrawerOpen(false);
                    }}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Transfer / Reassign Position
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
