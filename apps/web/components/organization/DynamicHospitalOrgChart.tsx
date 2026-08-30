'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Edit3,
  Trash2,
  Lock,
  UserPlus,
  GitBranch,
  LayoutGrid,
} from 'lucide-react';
import {
  STAVYA_ORG_STRUCTURE,
  HospitalStaffMember,
  UnitGroup,
  UnitLeaf,
} from '../../lib/data/stavyaHospitalOrgData';
import { dynamicOrgStore } from '../../lib/data/dynamicOrgStore';
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
  
  // Dynamic Org Chart Gating: Both MD and Leaders can modify org structure
  const isMD = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER', 'LEADERS', 'MASTER', 'ADMIN'].includes(user.role);
  const isLeader = isMD;

  // Live dynamic staff state from store
  const [staffList, setStaffList] = useState<HospitalStaffMember[]>(() => dynamicOrgStore.getStaffList());

  useEffect(() => {
    const unsub = dynamicOrgStore.subscribe(() => {
      setStaffList(dynamicOrgStore.getStaffList());
    });
    return () => unsub();
  }, []);

  // View Mode: 'tree' (Interactive Visual Org Tree) is now the default
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState<'all' | 'gov' | 'clin' | 'nursing' | 'adm'>('all');
  const [filterWorkload, setFilterWorkload] = useState<'all' | 'active_tasks' | 'blocked' | 'probation' | 'wide_span'>('all');
  const [selectedStaff, setSelectedStaff] = useState<HospitalStaffMember | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const applyResponsiveView = (matches: boolean) => setViewMode(matches ? 'grid' : 'tree');

    applyResponsiveView(mobileQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => applyResponsiveView(event.matches);
    mobileQuery.addEventListener('change', handleChange);
    return () => mobileQuery.removeEventListener('change', handleChange);
  }, []);

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

  // MD DYNAMIC ORG MODAL STATES (Strictly for MD)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStaff, setTransferStaff] = useState<HospitalStaffMember | null>(null);
  const [targetUnit, setTargetUnit] = useState('');
  const [targetSupervisor, setTargetSupervisor] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferSuccessMessage, setTransferSuccessMessage] = useState<string | null>(null);

  // MD Re-parenting / Change Supervisor Modal
  const [isReparentModalOpen, setIsReparentModalOpen] = useState(false);
  const [reparentStaff, setReparentStaff] = useState<HospitalStaffMember | null>(null);
  const [newSupervisor, setNewSupervisor] = useState('');

  // MD Add New Position Modal
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffCode, setNewStaffCode] = useState('');
  const [newStaffDesig, setNewStaffDesig] = useState('');
  const [newStaffUnit, setNewStaffUnit] = useState('Spine Surgery');
  const [newStaffReports, setNewStaffReports] = useState('Dr. Mirant Bharat Dave');
  const [newStaffShift, setNewStaffShift] = useState('General Shift');
  const [newStaffEmp, setNewStaffEmp] = useState('Confirm');

  // MD Edit Details Modal
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<HospitalStaffMember | null>(null);
  const [editDesig, setEditDesig] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editEmp, setEditEmp] = useState('');

  // Compute direct reports per staff dynamically
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

  // Unique Units for Dropdowns
  const uniqueUnits = useMemo(() => {
    const units = new Set<string>();
    staffList.forEach((s) => {
      if (s.unit) units.add(s.unit);
    });
    return Array.from(units).sort();
  }, [staffList]);

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

  const isStaffMatch = (staff: HospitalStaffMember): boolean => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const match =
        staff.name.toLowerCase().includes(q) ||
        staff.desig.toLowerCase().includes(q) ||
        staff.code.toLowerCase().includes(q) ||
        staff.unit.toLowerCase().includes(q) ||
        staff.reports.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filterWorkload === 'active_tasks') {
      const active = getStaffTasks(staff.id).filter((t) => t.status !== 'completed');
      if (active.length === 0) return false;
    } else if (filterWorkload === 'blocked') {
      const blocked = getStaffTasks(staff.id).some((t) => t.status === 'blocked' || t.status === 'stuck');
      if (!blocked) return false;
    } else if (filterWorkload === 'probation') {
      if (staff.emp !== 'Probation') return false;
    } else if (filterWorkload === 'wide_span') {
      const dCount = reportCounts[staff.name.toLowerCase()] || 0;
      if (dCount <= 12) return false;
    }

    return true;
  };

  const toggleNode = (name: string) => {
    setExpandedNodes((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    staffList.forEach((s) => {
      next[s.name] = true;
    });
    setExpandedNodes(next);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const openStaffDetail = (staff: HospitalStaffMember) => {
    setSelectedStaff(staff);
    setIsDrawerOpen(true);
  };

  // Inline Task Creation Handler
  const handleStartTaskModal = (staff: HospitalStaffMember) => {
    setTaskAssignee(staff);
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('medium');
    setTaskSuccessMessage(null);
    setIsTaskModalOpen(true);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskAssignee || !taskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      if (onOpenTaskModal) {
        onOpenTaskModal(taskAssignee.id, taskAssignee.name);
        setIsTaskModalOpen(false);
        return;
      }

      await apiClient.workItems.create({
        title: taskTitle.trim(),
        description: taskDescription.trim() || `Delegated from Org Chart to ${taskAssignee.name} (${taskAssignee.desig})`,
        priority: taskPriority,
        owner_id: taskAssignee.id,
        owner_name: taskAssignee.name,
        due_at: new Date(taskDueDate).toISOString(),
        status: 'todo',
      });

      setTaskSuccessMessage(`Task successfully delegated to ${taskAssignee.name}.`);
      setTimeout(() => {
        setIsTaskModalOpen(false);
        setTaskSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create task from org chart:', err);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // MD DYNAMIC ACTIONS
  const handleStartTransfer = (staff: HospitalStaffMember) => {
    if (!isMD) return;
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

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMD || !transferStaff) return;

    dynamicOrgStore.updateStaffUnit(transferStaff.id, targetUnit, targetSupervisor, transferReason);
    setTransferSuccessMessage(`Unit reassignment confirmed for ${transferStaff.name}. Org chart updated.`);
    if (selectedStaff && selectedStaff.id === transferStaff.id) {
      setSelectedStaff({ ...transferStaff, unit: targetUnit, reports: targetSupervisor });
    }
    setTimeout(() => {
      setIsTransferModalOpen(false);
      setTransferSuccessMessage(null);
    }, 1000);
  };

  const handleStartReparent = (staff: HospitalStaffMember) => {
    if (!isMD) return;
    setReparentStaff(staff);
    setNewSupervisor(staff.reports || '');
    setIsReparentModalOpen(true);
  };

  const handleReparentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMD || !reparentStaff || !newSupervisor.trim()) return;

    dynamicOrgStore.updateStaffSupervisor(reparentStaff.id, newSupervisor);
    if (selectedStaff && selectedStaff.id === reparentStaff.id) {
      setSelectedStaff({ ...reparentStaff, reports: newSupervisor });
    }
    setIsReparentModalOpen(false);
  };

  const handleStartEditDetails = (staff: HospitalStaffMember) => {
    if (!isMD) return;
    setEditingStaff(staff);
    setEditDesig(staff.desig);
    setEditCode(staff.code);
    setEditShift(staff.shift);
    setEditEmp(staff.emp);
    setIsEditStaffModalOpen(true);
  };

  const handleEditDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMD || !editingStaff) return;

    dynamicOrgStore.updateStaffDetails(editingStaff.id, {
      desig: editDesig,
      code: editCode,
      shift: editShift,
      emp: editEmp,
    });
    if (selectedStaff && selectedStaff.id === editingStaff.id) {
      setSelectedStaff({ ...editingStaff, desig: editDesig, code: editCode, shift: editShift, emp: editEmp });
    }
    setIsEditStaffModalOpen(false);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMD || !newStaffName.trim()) return;

    const created = dynamicOrgStore.addStaffMember({
      name: newStaffName.trim(),
      code: newStaffCode.trim() || `${Math.floor(100 + Math.random() * 900)}`,
      desig: newStaffDesig.trim() || 'Specialist',
      unit: newStaffUnit,
      reports: newStaffReports,
      shift: newStaffShift,
      emp: newStaffEmp,
      dept_master: newStaffUnit.toUpperCase(),
      email: `${newStaffName.toLowerCase().replace(/\s+/g, '.')}@stavya.local`,
      mobile: '9825000000',
      gender: 'other',
      join: new Date().toISOString().substring(0, 10),
      worker: 'Company Staff',
      skill: 'SKILLED',
      branch: 'Ahmedabad',
    });

    setExpandedNodes((prev) => ({ ...prev, [newStaffReports]: true }));
    setIsAddStaffModalOpen(false);
    openStaffDetail(created);
  };

  const handleRemoveStaff = (staff: HospitalStaffMember) => {
    if (!isMD) return;
    if (window.confirm(`Are you sure you want to remove ${staff.name} (#${staff.code}) from the hospital org chart?`)) {
      dynamicOrgStore.removeStaffMember(staff.id);
      setIsDrawerOpen(false);
      setSelectedStaff(null);
    }
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

  // Render a Structured Tree Node Card with Perfectly Aligned SVG / CSS Branch Arms
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
      <div key={staff.id} className="flex flex-col items-center select-none">
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
                ? (staff.name.includes('Amita') ? 'Co-Founder & Vice Chairperson' : 'Founder & Chairman')
                : staff.unit}
            </span>

            <div className="flex items-center gap-1">
              {staff.code && (
                <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-200/60">
                  #{staff.code}
                </span>
              )}

              {/* MD Quick Inline Edit Actions */}
              {isMD && !isFounderNode && (
                <button
                  type="button"
                  title="Change Reporting Supervisor"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartReparent(staff);
                  }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <GitBranch className="w-3 h-3" />
                </button>
              )}
            </div>
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
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <span>{subordinates.length} Reports</span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Structured Children Branches with Pure CSS Balanced Horizontal Connector Arms */}
        {hasSubs && isExpanded && (
          <div className="flex flex-col items-center">
            {/* Vertical stem from parent */}
            <div className="w-0.5 h-6 bg-slate-300" />

            {/* Horizontal Split and Child Nodes */}
            <div className="flex justify-center items-start">
              {subordinates.map((sub, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === subordinates.length - 1;
                const isOnly = subordinates.length === 1;

                return (
                  <div key={sub.staff.id} className="flex flex-col items-center relative px-3">
                    {/* Balanced horizontal connector arm */}
                    {!isOnly && (
                      <div className="absolute top-0 left-0 right-0 flex h-4 pointer-events-none">
                        <div
                          className={`flex-1 border-t-2 ${
                            isFirst ? 'border-transparent' : 'border-slate-300'
                          }`}
                        />
                        <div className="w-0.5 bg-slate-300 h-4" />
                        <div
                          className={`flex-1 border-t-2 ${
                            isLast ? 'border-transparent' : 'border-slate-300'
                          }`}
                        />
                      </div>
                    )}
                    {isOnly && <div className="w-0.5 h-4 bg-slate-300" />}

                    {/* Subordinate tree container */}
                    <div className="pt-4">
                      {renderTreeNode(sub, level + 1)}
                    </div>
                  </div>
                );
              })}
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
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 min-h-[52px]">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-slate-900 leading-snug break-words tracking-tight">{unitName}</h4>
              {headName && (
                <button
                  type="button"
                  onClick={() => {
                    const headStaff = staffList.find((s) => s.name === headName);
                    if (headStaff) openStaffDetail(headStaff);
                  }}
                  className="text-[11px] text-blue-600 font-semibold leading-snug hover:underline cursor-pointer text-left block mt-1"
                >
                  <span className="block break-words">Lead: {headName}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {group.children.map((child) => renderGroup(child))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP MINIMALIST CONTROL HEADER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
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

          {/* Quick Metrics & Mobile View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 md:hidden" aria-label="Organization view">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Directory
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                aria-pressed={viewMode === 'tree'}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  viewMode === 'tree' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                <Network className="h-4 w-4" />
                Tree
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

        {/* 2. MD EXECUTIVE GOVERNANCE CONTROLS BAR (STRICTLY MD ONLY) */}
        {isMD ? (
          <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-white border border-blue-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
                <Crown className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-900">MD Executive Org Controls</h4>
                <p className="text-[10px] text-slate-500">Live restructuring, reporting reassignments, and personnel additions</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Staff / Position</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all dynamic org modifications back to baseline?')) {
                    dynamicOrgStore.resetToDefault();
                  }
                }}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset modifications to baseline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Read-Only Org Structure · Structural modifications restricted to Managing Director</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Role: {user.role}
            </span>
          </div>
        )}

        {/* 3. FILTER & ZOOM TOOLBAR */}
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
                    activeTier === t.id ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Collapse All
                </button>

                {/* Zoom Controls for Tree */}
                <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(z - 10, 50))}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-[10px] font-mono font-bold text-slate-700">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="px-1.5 py-0.5 text-[9px] font-bold text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"
                    title="Reset Zoom"
                  >
                    100%
                  </button>
                </div>
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

      {/* 4. VIEW MODE RENDER */}
      {viewMode === 'tree' ? (
        /* HIERARCHICAL TOP-DOWN TREE VIEW WITH ZOOM & CLEAN CONNECTOR ARMS */
        <div className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-8 overflow-auto overscroll-contain shadow-xs min-h-[420px] sm:min-h-[550px]">
          <div
            className="inline-block min-w-full text-center space-y-12 transition-transform duration-150 origin-top"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* Executive Board Root Level */}
            <div className="flex flex-wrap justify-center gap-12">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                {STAVYA_ORG_STRUCTURE.governance.map((gov) => {
                  const matched = staffList.find((s) => s.name.toLowerCase() === gov.name.toLowerCase());
                  const isMD = gov.name.includes('Mirant') || gov.title.toLowerCase() === 'managing director';
                  const isFounder = gov.name.includes('Dr. Bharat') || gov.title.toLowerCase() === 'founder & chairman';
                  const isCoFounder = gov.name.includes('Amita') || gov.title.toLowerCase().includes('vice chairperson');
                  const isQuality = gov.name.includes('Akruti') || gov.title.toLowerCase().includes('quality');

                  const badgeText = isMD
                    ? 'Managing Director (MD)'
                    : isFounder
                    ? 'Founder & Chairman'
                    : isCoFounder
                    ? 'Co-Founder & Vice Chairperson'
                    : isQuality
                    ? 'Director of Quality & Safety'
                    : 'Governing Board';

                  const badgeStyle = isMD
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : isFounder
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : isCoFounder
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : isQuality
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700';

                  return (
                    <div
                      key={gov.name}
                      onClick={() => matched && openStaffDetail(matched)}
                      className={`bg-white border ${
                        isMD ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                      } rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 min-h-[175px]`}
                    >
                      <div className="space-y-2.5">
                        <span className={`inline-block px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider ${badgeStyle}`}>
                          {badgeText}
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 tracking-tight leading-snug">{gov.name}</h4>
                          <p className="text-xs text-blue-700 font-bold mt-1 leading-normal">{gov.title}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium border-t border-slate-100 pt-2.5 leading-relaxed">{gov.role}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clinical Divisions */}
          {(activeTier === 'all' || activeTier === 'clin') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Stethoscope className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Clinical Specialty Divisions &amp; Medical Operations
                </h3>
              </div>
              <div className="space-y-4">
                {STAVYA_ORG_STRUCTURE.clinical.map((grp) => renderGroup(grp))}
              </div>
            </div>
          )}

          {/* Administrative Divisions */}
          {(activeTier === 'all' || activeTier === 'adm') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Building className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Hospital Administration, Operations &amp; Finance
                </h3>
              </div>
              <div className="space-y-4">
                {STAVYA_ORG_STRUCTURE.admin.map((grp) => renderGroup(grp))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. STAFF PROFILE & ACTION DRAWER */}
      {isDrawerOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white h-[100dvh] shadow-2xl flex flex-col border-l border-slate-200 animate-slideInRight" role="dialog" aria-modal="true" aria-label="Staff profile and actions">
            {/* Header */}
            <div className="px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-b from-slate-50 to-white">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded uppercase tracking-wider">
                    {selectedStaff.unit}
                  </span>
                  {selectedStaff.code && (
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      #{selectedStaff.code}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{selectedStaff.name}</h3>
                <p className="text-xs text-blue-700 font-semibold">{selectedStaff.desig}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Close staff profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5 space-y-5 text-xs">
              {/* Action Buttons */}
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

              {/* MD Direct Controls inside Drawer */}
              {isMD && (
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-900 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-blue-700" /> MD Quick Controls
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStaff(selectedStaff)}
                      className="text-[10px] text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartReparent(selectedStaff)}
                      className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <GitBranch className="w-3 h-3" /> Reassign Boss
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditDetails(selectedStaff)}
                      className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Details
                    </button>
                  </div>
                </div>
              )}

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
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'high'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {task.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900">{task.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subordinate Direct Reports List */}
              {subordinatesMap[selectedStaff.name] && subordinatesMap[selectedStaff.name].length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    Subordinate Team ({subordinatesMap[selectedStaff.name].length})
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {subordinatesMap[selectedStaff.name].map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => openStaffDetail(sub)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/60 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{sub.name}</p>
                          <p className="text-[10px] text-slate-500">{sub.desig}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Contact Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">Contact Details</h4>
                <div className="space-y-2">
                  <a
                    href={`tel:${selectedStaff.mobile}`}
                    className="flex items-center gap-2 text-slate-700 hover:text-blue-700 font-medium"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>+91 {selectedStaff.mobile}</span>
                  </a>
                  <a
                    href={`mailto:${selectedStaff.email}`}
                    className="flex items-center gap-2 text-slate-700 hover:text-blue-700 font-medium truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{selectedStaff.email}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. INLINE TASK DELEGATION MODAL */}
      {isTaskModalOpen && taskAssignee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Delegate Execution Task</h3>
                <p className="text-xs text-blue-700 font-semibold">Assigning to: {taskAssignee.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {taskSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center">
                ✓ {taskSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleCreateTaskSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Conduct OT-2 sterilization protocol audit"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Description &amp; Specifics</label>
                  <textarea
                    rows={3}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Detailed requirements, deliverables, or checklist..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent Escalation</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Due Date</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTask || !taskTitle.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors"
                  >
                    {isCreatingTask ? 'Assigning...' : 'Assign Commitment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 7. MD DYNAMIC RE-PARENTING / CHANGE SUPERVISOR MODAL */}
      {isReparentModalOpen && reparentStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <GitBranch className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reassign Reporting Line</h3>
                  <p className="text-xs text-slate-500">Re-parent node for {reparentStaff.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReparentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReparentSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-slate-500">Current Reporting Supervisor:</p>
                <p className="font-black text-slate-900">{reparentStaff.reports || 'None (Apex)'}</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">New Reporting Supervisor *</label>
                <select
                  required
                  value={newSupervisor}
                  onChange={(e) => setNewSupervisor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Supervisor...</option>
                  {staffList
                    .filter((s) => s.id !== reparentStaff.id)
                    .map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.desig} · {s.unit})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReparentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSupervisor.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs"
                >
                  Update Reporting Hierarchy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MD DYNAMIC DEPARTMENT TRANSFER MODAL */}
      {isTransferModalOpen && transferStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <ArrowRightLeft className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Hospital Unit Reassignment</h3>
                  <p className="text-xs text-slate-500">{transferStaff.name} (#{transferStaff.code})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center">
                ✓ {transferSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-500">Current Unit</p>
                    <p className="font-bold text-slate-900">{transferStaff.unit}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-500">Current Supervisor</p>
                    <p className="font-bold text-slate-900">{transferStaff.reports}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Hospital Unit / Department *</label>
                  <select
                    required
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    {uniqueUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">New Supervisor (Optional)</label>
                  <select
                    value={targetSupervisor}
                    onChange={(e) => setTargetSupervisor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Keep Existing Supervisor</option>
                    {staffList
                      .filter((s) => s.id !== transferStaff.id)
                      .map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.desig} · {s.unit})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">MD Transfer Authorization Note</label>
                  <input
                    type="text"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Operational rotation / Clinical requirement"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    Authorize &amp; Transfer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 9. MD ADD NEW STAFF / POSITION MODAL */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-lg w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Hospital Staff Position</h3>
                  <p className="text-xs text-slate-500">Create and integrate into the live organizational chart</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Dr. Ananya Sharma"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Stavyan Code</label>
                  <input
                    type="text"
                    value={newStaffCode}
                    onChange={(e) => setNewStaffCode(e.target.value)}
                    placeholder="e.g. 212"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Designation *</label>
                  <input
                    type="text"
                    required
                    value={newStaffDesig}
                    onChange={(e) => setNewStaffDesig(e.target.value)}
                    placeholder="e.g. Spine Fellow / Staff Nurse"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Department Unit *</label>
                  <select
                    value={newStaffUnit}
                    onChange={(e) => setNewStaffUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    {uniqueUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reports Directly To (Supervisor) *</label>
                <select
                  value={newStaffReports}
                  onChange={(e) => setNewStaffReports(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.desig} · {s.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Shift</label>
                  <select
                    value={newStaffShift}
                    onChange={(e) => setNewStaffShift(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="General Shift">General Shift</option>
                    <option value="Morning Shift">Morning Shift</option>
                    <option value="Evening Shift">Evening Shift</option>
                    <option value="Night Shift">Night Shift</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status</label>
                  <select
                    value={newStaffEmp}
                    onChange={(e) => setNewStaffEmp(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Confirm">Confirm</option>
                    <option value="Probation">Probation</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newStaffName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Add to Org Chart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MD EDIT DETAILS MODAL */}
      {isEditStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Position Details</h3>
                  <p className="text-xs text-slate-500">{editingStaff.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditStaffModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditDetailsSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Designation *</label>
                <input
                  type="text"
                  required
                  value={editDesig}
                  onChange={(e) => setEditDesig(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Stavyan Code</label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Shift</label>
                  <select
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="General Shift">General Shift</option>
                    <option value="Morning Shift">Morning Shift</option>
                    <option value="Evening Shift">Evening Shift</option>
                    <option value="Night Shift">Night Shift</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status</label>
                  <select
                    value={editEmp}
                    onChange={(e) => setEditEmp(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Confirm">Confirm</option>
                    <option value="Probation">Probation</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditStaffModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
