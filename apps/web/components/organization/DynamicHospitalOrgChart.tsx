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
  Check,
  ChevronUp,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import {
  STAVYA_STAFF_DATABASE,
  STAVYA_ORG_STRUCTURE,
  HospitalStaffMember,
  UnitGroup,
  UnitLeaf,
} from '../../lib/data/stavyaHospitalOrgData';
import { WorkItem, WorkItemPriority } from '../../types/workItem';
import { useAuth } from '../../lib/auth/AuthContext';
import { apiClient } from '../../lib/api/client';

interface DynamicHospitalOrgChartProps {
  workItems?: WorkItem[];
  onOpenTaskModal?: (assigneeId: string, assigneeName: string) => void;
  onTransferPerson?: (staff: HospitalStaffMember) => void;
}

interface TreeNode {
  staff: HospitalStaffMember;
  subordinates: TreeNode[];
  isExpanded?: boolean;
}

export const DynamicHospitalOrgChart: React.FC<DynamicHospitalOrgChartProps> = ({
  workItems = [],
  onOpenTaskModal,
  onTransferPerson,
}) => {
  const { user } = useAuth();
  const isMD = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'MASTER', 'ADMIN'].includes(user.role);
  const isLeader = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER', 'LEADERS', 'MASTER', 'ADMIN'].includes(user.role);

  // View Mode: 'grid' (Department & Unit Directory) or 'tree' (Interactive Top-Down Visual Org Tree)
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState<'all' | 'gov' | 'clin' | 'nursing' | 'adm'>('all');
  const [filterWorkload, setFilterWorkload] = useState<'all' | 'active_tasks' | 'blocked' | 'probation' | 'wide_span'>('all');
  const [selectedStaff, setSelectedStaff] = useState<HospitalStaffMember | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Expanded nodes in tree view
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'Dr. Bharat Rajendraprasad Dave': true,
    'Dr. Mirant Bharat Dave': true,
    'Brijesh Hasmukhkumar Bhatt': true,
    'Zankhana Chirag Joshi': true,
    'Rajiv Nair': true,
    'Nipa Shah': true,
    'Payal Manan Mehta': true,
    'Vatsal Maheshkumar Vaghasiya': true,
    'Dr. Preety Ajay Krishnan': true,
  });

  // Inline Quick Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskAssignee, setTaskAssignee] = useState<HospitalStaffMember | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<WorkItemPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().substring(0, 10);
  });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskSuccessMessage, setTaskSuccessMessage] = useState<string | null>(null);

  // Inline Transfer Confirmation Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStaff, setTransferStaff] = useState<HospitalStaffMember | null>(null);
  const [targetUnit, setTargetUnit] = useState('');
  const [targetSupervisor, setTargetSupervisor] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferSuccessMessage, setTransferSuccessMessage] = useState<string | null>(null);

  const staffList = useMemo(() => Object.values(STAVYA_STAFF_DATABASE), []);

  // Compute direct reports per staff
  const subordinatesMap = useMemo(() => {
    const map: Record<string, HospitalStaffMember[]> = {};
    staffList.forEach((s) => {
      const mgr = (s.reports || '').trim();
      if (mgr) {
        if (!map[mgr]) map[mgr] = [];
        map[mgr].push(s);
      }
    });
    return map;
  }, [staffList]);

  const reportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(subordinatesMap).forEach(([mgrName, subs]) => {
      counts[mgrName.toLowerCase()] = subs.length;
    });
    return counts;
  }, [subordinatesMap]);

  // Map tasks to staff
  const staffTasksMap = useMemo(() => {
    const map: Record<string, WorkItem[]> = {};
    workItems.forEach((w) => {
      const ownerId = w.owner_id || '';
      const ownerName = (w.owner_name || '').toLowerCase();

      staffList.forEach((s) => {
        if (s.id === ownerId || s.name.toLowerCase() === ownerName || (w.owner_id && s.email.toLowerCase() === w.owner_id.toLowerCase())) {
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

  // Filter matching
  const isStaffMatch = (staff: HospitalStaffMember): boolean => {
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

  const toggleNode = (name: string) => {
    setExpandedNodes((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    staffList.forEach((s) => {
      if (subordinatesMap[s.name] && subordinatesMap[s.name].length > 0) {
        all[s.name] = true;
      }
    });
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const openStaffDetail = (staff: HospitalStaffMember) => {
    setSelectedStaff(staff);
    setIsDrawerOpen(true);
  };

  const handleStartTaskModal = (staff: HospitalStaffMember) => {
    if (onOpenTaskModal) {
      onOpenTaskModal(staff.id, staff.name);
      return;
    }
    setTaskAssignee(staff);
    setTaskTitle('');
    setTaskDescription('');
    setTaskSuccessMessage(null);
    setIsTaskModalOpen(true);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskAssignee || !taskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      await apiClient.workItems.create({
        title: taskTitle.trim(),
        description: taskDescription.trim() || `Delegated work commitment to ${taskAssignee.name} (${taskAssignee.desig}).`,
        priority: taskPriority,
        owner_id: taskAssignee.id,
        owner_name: taskAssignee.name,
        department_name: taskAssignee.unit,
        due_at: new Date(taskDueDate).toISOString(),
        source_type: 'MANUAL',
        source_title: 'Assigned via Org Chart',
      });
      setTaskSuccessMessage(`Task successfully assigned to ${taskAssignee.name}!`);
      setTimeout(() => {
        setIsTaskModalOpen(false);
        setTaskSuccessMessage(null);
      }, 1200);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleStartTransfer = (staff: HospitalStaffMember) => {
    if (onTransferPerson) {
      onTransferPerson(staff);
      return;
    }
    setTransferStaff(staff);
    setTargetUnit(staff.unit);
    setTargetSupervisor(staff.reports || '');
    setTransferReason('');
    setTransferSuccessMessage(null);
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStaff) return;
    setTransferSuccessMessage(`Position reassignment confirmed for ${transferStaff.name}.`);
    setTimeout(() => {
      setIsTransferModalOpen(false);
      setTransferSuccessMessage(null);
    }, 1200);
  };

  // Build recursive tree node from staff member
  const buildTree = (staff: HospitalStaffMember, visited = new Set<string>()): TreeNode => {
    if (visited.has(staff.id)) {
      return { staff, subordinates: [] };
    }
    visited.add(staff.id);
    const directSubs = (subordinatesMap[staff.name] || []).map((sub) => buildTree(sub, new Set(visited)));
    return { staff, subordinates: directSubs };
  };

  const mdStaff = staffList.find((s) => s.name.includes('Mirant Bharat Dave')) || staffList.find((s) => s.code === '4');
  const founderStaff = staffList.find((s) => s.name.includes('Bharat Rajendraprasad Dave')) || staffList.find((s) => s.code === '3');

  // Total stats
  const totalStaff = staffList.length;
  const probationCount = staffList.filter((s) => s.emp === 'Probation').length;
  const wideSpanCount = staffList.filter((s) => (reportCounts[s.name.toLowerCase()] || 0) > 12).length;

  // Render a Tree Node Card
  const renderTreeNode = (node: TreeNode, level = 0) => {
    const { staff, subordinates } = node;
    const isExpanded = expandedNodes[staff.name] ?? false;
    const hasSubs = subordinates.length > 0;
    const tasks = getStaffTasks(staff.id);
    const activeTasks = tasks.filter((t) => t.status !== 'completed');
    const hasBlocked = tasks.some((t) => t.status === 'blocked' || t.status === 'stuck');
    const isHighlighted = isStaffMatch(staff);

    const isMDNode = staff.name.includes('Mirant Bharat Dave') || staff.desig.toLowerCase().includes('managing director');
    const isFounderNode = staff.name.includes('Bharat Rajendraprasad Dave') || staff.desig.toLowerCase().includes('founder');
    const isExecutive = isMDNode || isFounderNode || staff.desig.includes('CNO') || staff.desig.includes('CFO') || staff.desig.includes('CAO') || staff.desig.includes('Head');

    return (
      <div key={staff.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          className={`relative z-10 w-64 md:w-72 bg-white border transition-all rounded-2xl p-3.5 shadow-2xs hover:shadow-md cursor-pointer ${
            isMDNode
              ? 'border-blue-500 ring-2 ring-blue-100 bg-gradient-to-b from-blue-50/50 via-white to-white'
              : isFounderNode
              ? 'border-purple-300 ring-2 ring-purple-50 bg-gradient-to-b from-purple-50/40 via-white to-white'
              : isHighlighted
              ? 'border-slate-300 hover:border-blue-400'
              : 'opacity-40 border-slate-200 bg-slate-50'
          }`}
          onClick={() => openStaffDetail(staff)}
        >
          {/* Header Tag */}
          <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
            <span
              className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                isMDNode
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : isFounderNode
                  ? 'bg-purple-100 text-purple-800'
                  : isExecutive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isMDNode
                ? 'Managing Director'
                : isFounderNode
                ? 'Founder & Chairman'
                : staff.unit}
            </span>

            {staff.code && (
              <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-200/60">
                #{staff.code}
              </span>
            )}
          </div>

          {/* Person Info */}
          <div className="pt-2 space-y-0.5">
            <h4 className="text-xs font-black text-slate-900 truncate">{staff.name}</h4>
            <p className="text-[11px] text-blue-700 font-semibold truncate leading-tight">{staff.desig}</p>
          </div>

          {/* Quick Metrics Footer */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[10px]">
            <div className="flex items-center gap-1.5">
              {hasBlocked && (
                <span className="flex items-center gap-1 text-red-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Blocked
                </span>
              )}
              {activeTasks.length > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold">
                  {activeTasks.length} task{activeTasks.length > 1 ? 's' : ''}
                </span>
              )}
              {staff.emp === 'Probation' && (
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold uppercase text-[8px]">
                  Probation
                </span>
              )}
            </div>

            {hasSubs && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(staff.name);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  isExpanded
                    ? 'bg-slate-900 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <span>{subordinates.length} Reports</span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Child Tree Branches (Connected via SVG Lines) */}
        {hasSubs && isExpanded && (
          <div className="flex flex-col items-center mt-3">
            {/* Connecting Vertical Line from Parent */}
            <div className="w-0.5 h-6 bg-blue-300" />

            {/* Horizontal Branch Bar */}
            {subordinates.length > 1 && (
              <div
                className="h-0.5 bg-blue-300 relative"
                style={{
                  width: `${Math.min(subordinates.length * 280, 1100)}px`,
                  maxWidth: '92vw',
                }}
              />
            )}

            {/* Subordinate Grid Container */}
            <div className="flex flex-wrap justify-center gap-6 pt-3">
              {subordinates.map((sub) => (
                <div key={sub.staff.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-blue-300 -mt-3 mb-1" />
                  {renderTreeNode(sub, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render a Unit Card in Grid View
  const renderUnitCard = (unitName: string) => {
    const members = staffList.filter((s) => s.unit.toLowerCase() === unitName.toLowerCase());
    const headName = STAVYA_ORG_STRUCTURE.heads[unitName];
    const visibleMembers = members.filter(isStaffMatch);

    if (searchTerm.trim() && visibleMembers.length === 0 && !unitName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

    const sortedMembers = [...members].sort((a, b) => {
      const aIsHead = a.name === headName ? 1 : 0;
      const bIsHead = b.name === headName ? 1 : 0;
      if (aIsHead !== bIsHead) return bIsHead - aIsHead;
      return a.name.localeCompare(b.name);
    });

    const activeUnitTasks = members.reduce(
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
                <button
                  type="button"
                  onClick={() => {
                    const headStaff = staffList.find((s) => s.name === headName);
                    if (headStaff) openStaffDetail(headStaff);
                  }}
                  className="text-[11px] text-blue-600 font-semibold truncate flex items-center gap-1 mt-0.5 hover:underline cursor-pointer text-left"
                >
                  <span>Lead: {headName}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeUnitTasks > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
                  {activeUnitTasks} Active
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
              const dReports = reportCounts[member.name.toLowerCase()] || 0;
              const isHighlighted = isStaffMatch(member);

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

  const renderGroup = (group: UnitGroup | UnitLeaf) => {
    if (group.type === 'leaf') {
      return renderUnitCard(group.name);
    }

    const headName = group.head;
    const directReports = headName ? reportCounts[headName.toLowerCase()] || 0 : 0;

    return (
      <div key={group.name} className="col-span-full bg-white border border-slate-200/90 rounded-3xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase rounded-md tracking-wider">
                DIVISION
              </span>
              <h3 className="text-base font-black text-slate-900 tracking-tight">{group.name}</h3>
            </div>
            {headName ? (
              <p className="text-xs text-blue-700 font-semibold mt-1">
                Lead:{' '}
                <strong
                  onClick={() => {
                    const headStaff = staffList.find((s) => s.name === headName);
                    if (headStaff) openStaffDetail(headStaff);
                  }}
                  className="text-slate-900 cursor-pointer hover:underline"
                >
                  {headName}
                </strong>{' '}
                · <span className="text-slate-500">{group.head_title}</span>
                {directReports > 12 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded">
                    ⚠ {directReports} direct reports (Wide Span &gt; 12)
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

  return (
    <div className="space-y-6">
      {/* 1. TOP MINIMALIST CONTROL HEADER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black rounded-full uppercase tracking-wider">
                HOSPITAL OPERATING STRUCTURE
              </span>
              <span className="text-xs text-slate-500 font-medium">• 211 Verified Personnel</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Hospital Organizational Operating Structure
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Stavya Spine Hospital enterprise governance, clinical specialty divisions, nursing operations, and administrative support units.
            </p>
          </div>

          {/* Quick Metrics & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'tree' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Network className="w-3.5 h-3.5 text-blue-600" />
                <span>Hierarchical Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Department Grid</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <div className="bg-slate-50 px-3.5 py-2 rounded-xl text-center border border-slate-200">
                <span className="block text-sm font-black text-slate-900">{totalStaff}</span>
                <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold">Staff</span>
              </div>
              <div className="bg-amber-50/70 px-3.5 py-2 rounded-xl text-center border border-amber-200/60">
                <span className="block text-sm font-black text-amber-800">{probationCount}</span>
                <span className="block text-[8px] uppercase tracking-wider text-amber-700 font-bold">Probation</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FILTER & TOOLBAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {viewMode === 'grid' ? (
              [
                { id: 'all', label: 'All Divisions' },
                { id: 'gov', label: 'Governance' },
                { id: 'clin', label: 'Clinical Services' },
                { id: 'nursing', label: 'Nursing & OT' },
                { id: 'adm', label: 'Administration & IT' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTier(t.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTier === t.id ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Expand All Branches
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            )}
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

            {/* Filter Workload Dropdown */}
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

      {/* 3. VIEW MODE RENDER */}
      {viewMode === 'tree' ? (
        /* HIERARCHICAL TOP-DOWN TREE VIEW */
        <div className="bg-white border border-slate-200 rounded-3xl p-8 overflow-x-auto shadow-xs min-h-[500px]">
          <div className="inline-block min-w-full text-center space-y-8">
            {/* Executive Board Root Level */}
            <div className="flex flex-wrap justify-center gap-6">
              {founderStaff && renderTreeNode(buildTree(founderStaff))}
              {mdStaff && renderTreeNode(buildTree(mdStaff))}
            </div>
          </div>
        </div>
      ) : (
        /* DEPARTMENT & UNIT DIRECTORY GRID VIEW */
        <div className="space-y-8">
          {/* Governance */}
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
                  const matched = staffList.find((s) => s.name.toLowerCase() === gov.name.toLowerCase());
                  const isMDGov = gov.name.includes('Mirant') || gov.title.toLowerCase().includes('managing director');
                  const isFounderGov = gov.title.toLowerCase().includes('founder');

                  return (
                    <div
                      key={gov.name}
                      onClick={() => matched && openStaffDetail(matched)}
                      className={`bg-white border ${
                        isMDGov ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                      } rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all cursor-pointer space-y-2`}
                    >
                      <span
                        className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                          isMDGov
                            ? 'bg-blue-600 text-white'
                            : isFounderGov
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {isMDGov ? 'Managing Director' : isFounderGov ? 'Founder & Chairman' : 'Board'}
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

          {/* Clinical Services */}
          {(activeTier === 'all' || activeTier === 'clin') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Clinical Specialty &amp; Surgical Divisions
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {STAVYA_ORG_STRUCTURE.clinical.map((item) => renderGroup(item))}
              </div>
            </div>
          )}

          {/* Administrative Services */}
          {(activeTier === 'all' || activeTier === 'adm' || activeTier === 'nursing') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Building className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Administrative, Technical &amp; Operational Divisions
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {STAVYA_ORG_STRUCTURE.admin.map((item) => renderGroup(item))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. EXECUTIVE STAFF DETAIL DRAWER */}
      {isDrawerOpen && selectedStaff && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40"
            onClick={() => {
              setIsDrawerOpen(false);
              setSelectedStaff(null);
            }}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-blue-100 text-blue-800 rounded">
                    {selectedStaff.unit}
                  </span>
                  {selectedStaff.code && (
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      EMP #{selectedStaff.code}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{selectedStaff.name}</h3>
                <p className="text-xs font-bold text-blue-700">{selectedStaff.desig}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setSelectedStaff(null);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Action Buttons: Assign Task & Transfer */}
              <div className="grid grid-cols-2 gap-2">
                {isLeader && (
                  <button
                    type="button"
                    onClick={() => handleStartTaskModal(selectedStaff)}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Assign Task
                  </button>
                )}

                {isMD ? (
                  <button
                    type="button"
                    onClick={() => handleStartTransfer(selectedStaff)}
                    className="py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    Transfer Unit
                  </button>
                ) : (
                  <div className="py-2 px-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-[10px] flex items-center justify-center text-center">
                    Transfer: MD Only
                  </div>
                )}
              </div>

              {/* Reporting & Organizational Role */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-blue-600" />
                  Reporting Hierarchy &amp; Structure
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reports Directly To:</span>
                    <span className="font-bold text-slate-900">{selectedStaff.reports || 'Board of Governance'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Direct Reports:</span>
                    <span className="font-bold text-blue-700">
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
                    <span className="text-slate-500">Shift Timing:</span>
                    <span className="font-bold text-slate-900">{selectedStaff.shift}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Work Items / Tasks */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Assigned Execution Tasks ({getStaffTasks(selectedStaff.id).length})
                </h4>

                {getStaffTasks(selectedStaff.id).length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
                    <p className="text-slate-500 font-medium">No active tasks currently assigned.</p>
                    <p className="text-[11px] text-slate-400">Available for immediate delegation.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getStaffTasks(selectedStaff.id).map((task) => (
                      <div key={task.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
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
                            ⚠ Blocked: {task.blocked_reason || 'Needs assistance'}
                          </p>
                        )}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${task.progressPercent || 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Reports List */}
              {(subordinatesMap[selectedStaff.name] || []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    Direct Team Subordinates ({(subordinatesMap[selectedStaff.name] || []).length})
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(subordinatesMap[selectedStaff.name] || []).map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedStaff(sub)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{sub.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{sub.desig}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">Contact Information</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Mobile:
                    </span>
                    <a href={`tel:${selectedStaff.mobile}`} className="font-bold text-blue-600 hover:underline font-mono">
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
            </div>
          </div>
        </>
      )}

      {/* 5. INLINE TASK ASSIGNMENT MODAL */}
      {isTaskModalOpen && taskAssignee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Work Item</h3>
                <p className="text-xs text-slate-500">
                  Assignee: <strong className="text-blue-700">{taskAssignee.name}</strong> ({taskAssignee.desig})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {taskSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold text-xs">
                ✓ {taskSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Task Commitment Title
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Calibrate 2D barcode scanner in OT-2"
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Scope / Execution Details
                  </label>
                  <textarea
                    rows={3}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Provide specific guidelines, criteria for done, or hospital protocol..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent (Clinical Stat)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Target Due Date</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTask}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingTask ? 'Creating...' : 'Assign Work Item'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. INLINE DEPARTMENT TRANSFER MODAL (MD ONLY) */}
      {isTransferModalOpen && transferStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Personnel Position &amp; Unit Transfer</h3>
                <p className="text-xs text-slate-500">
                  Staff Member: <strong className="text-slate-900">{transferStaff.name}</strong> (#{transferStaff.code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {transferSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold text-xs">
                ✓ {transferSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleTransferSubmit} className="space-y-3.5">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-1">
                  <p className="font-bold">Current Assignment:</p>
                  <p>Unit: {transferStaff.unit} · Reporting To: {transferStaff.reports || 'Governance'}</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    New Target Department / Unit
                  </label>
                  <input
                    type="text"
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    New Reporting Supervisor
                  </label>
                  <input
                    type="text"
                    value={targetSupervisor}
                    onChange={(e) => setTargetSupervisor(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Administrative Transfer Rationale
                  </label>
                  <textarea
                    rows={2}
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="e.g. Clinical OT staffing rotation for Q3..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    Confirm Reassignment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
