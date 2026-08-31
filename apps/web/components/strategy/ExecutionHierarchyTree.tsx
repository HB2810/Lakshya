'use client';

import React, { useState } from 'react';
import {
 ChevronRight,
 ChevronDown,
 Target,
 Calendar,
 CheckCircle2,
 Clock,
 ShieldAlert,
 AlertTriangle,
 User,
 Layers,
 ArrowRight,
 Sparkles,
 Search,
 Filter,
} from 'lucide-react';
import { WorkItem, WorkItemRACI } from '../../types/workItem';

export interface HierarchyTaskNode {
 id: string;
 title: string;
 status: 'todo' | 'in_progress' | 'completed' | 'blocked';
 priority: 'low' | 'medium' | 'high' | 'urgent';
 ownerName: string;
 raciRole: 'R' | 'A' | 'C' | 'I';
 progressPercent: number;
}

export interface HierarchyCommitmentNode {
 id: string;
 code: string;
 title: string;
 status: 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
 targetDate: string;
 raci: {
  responsible: string;
  accountable: string;
  consulted?: string[];
  informed?: string[];
 };
 tasks: HierarchyTaskNode[];
}

export interface HierarchyMilestoneNode {
 id: string;
 stepNumber: number;
 title: string;
 weekCode: string;
 status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
 commitments: HierarchyCommitmentNode[];
}

export interface HierarchyPriorityNode {
 id: string;
 title: string;
 month: string;
 progressPercent: number;
 status: 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED';
 milestones: HierarchyMilestoneNode[];
}

export interface HierarchyObjectiveNode {
 id: string;
 quarter: string;
 title: string;
 description: string;
 progressPercent: number;
 priorities: HierarchyPriorityNode[];
}

export const SAMPLE_EXECUTION_HIERARCHY: HierarchyObjectiveNode = {
 id: 'obj-q3-2026',
 quarter: 'Q3 2026 Strategic Direction',
 title: 'OPD Flow Optimization & Surgical Sterile Pipeline',
 description: 'Zero surgical site infections, automated PACS image delivery, and sub-15min patient waiting times across all OPD consults.',
 progressPercent: 68,
 priorities: [
  {
   id: 'prio-aug-2026',
   title: 'Improve OPD Patient Flow & Waiting Time Tracking',
   month: 'August 2026',
   progressPercent: 75,
   status: 'ACTIVE',
   milestones: [
    {
     id: 'ms-w34',
     stepNumber: 1,
     weekCode: 'W34',
     title: 'Deploy Waiting Time API & Reception Displays',
     status: 'COMPLETED',
     commitments: [
      {
       id: 'cm-2026-089',
       code: 'CM-089',
       title: 'Deploy Real-Time OPD Display System',
       status: 'COMPLETED',
       targetDate: '2026-08-22',
       raci: {
        responsible: 'Ananya Patel',
        accountable: 'Het Bhatt',
        consulted: ['Dr. Rohan Sharma'],
        informed: ['Front Desk Staff'],
       },
       tasks: [
        {
         id: 'tk-401',
         title: 'Configure TV Displays & HDMI Gateways',
         status: 'completed',
         priority: 'high',
         ownerName: 'Priyesh Shah',
         raciRole: 'R',
         progressPercent: 100,
        },
        {
         id: 'tk-403',
         title: 'Receptionist Workflow Briefing & Handover',
         status: 'completed',
         priority: 'medium',
         ownerName: 'Ananya Patel',
         raciRole: 'R',
         progressPercent: 100,
        },
       ],
      },
     ],
    },
    {
     id: 'ms-w35',
     stepNumber: 2,
     weekCode: 'W35',
     title: 'PACS Gateway Sync & Radiology Bridge',
     status: 'IN_PROGRESS',
     commitments: [
      {
       id: 'cm-2026-092',
       code: 'CM-092',
       title: 'Bridge PACS Imaging Network to Consulting Suites',
       status: 'IN_PROGRESS',
       targetDate: '2026-08-30',
       raci: {
        responsible: 'Priyesh Shah',
        accountable: 'Het Bhatt',
        consulted: ['Dr. Mirant Dave'],
        informed: ['Radiology Team'],
       },
       tasks: [
        {
         id: 'tk-409',
         title: 'Configure DICOM Viewer cache on MD workstation',
         status: 'in_progress',
         priority: 'high',
         ownerName: 'Priyesh Shah',
         raciRole: 'R',
         progressPercent: 70,
        },
        {
         id: 'tk-410',
         title: 'Verify Vendor OAuth credentials for PACS cloud API',
         status: 'blocked',
         priority: 'urgent',
         ownerName: 'Priyesh Shah',
         raciRole: 'R',
         progressPercent: 30,
        },
       ],
      },
     ],
    },
   ],
  },
  {
   id: 'prio-sep-2026',
   title: 'Digital OT Protocol & Sterile Verification Pipeline',
   month: 'September 2026',
   progressPercent: 40,
   status: 'ACTIVE',
   milestones: [
    {
     id: 'ms-w37',
     stepNumber: 3,
     weekCode: 'W37',
     title: 'OT-1 and OT-2 Digital Checklist Deployment',
     status: 'IN_PROGRESS',
     commitments: [
      {
       id: 'cm-2026-104',
       code: 'CM-104',
       title: 'Mandate Pre-Incision Digital Safety Checklist Signoff',
       status: 'ACTIVE',
       targetDate: '2026-09-15',
       raci: {
        responsible: 'Sister Sunita Rao',
        accountable: 'Dr. Rohan Sharma',
        consulted: ['OT Incharge'],
        informed: ['Nursing Staff'],
       },
       tasks: [
        {
         id: 'tk-501',
         title: 'Calibrate RFID autoclaved tray scanners in OT-1',
         status: 'todo',
         priority: 'high',
         ownerName: 'Sister Sunita Rao',
         raciRole: 'R',
         progressPercent: 0,
        },
        {
         id: 'tk-502',
         title: 'SOP compliance training for scrub nurses',
         status: 'todo',
         priority: 'medium',
         ownerName: 'Sister Sunita Rao',
         raciRole: 'R',
         progressPercent: 0,
        },
       ],
      },
     ],
    },
   ],
  },
 ],
};

interface ExecutionHierarchyTreeProps {
 onSelectTask?: (taskId: string) => void;
}

export const ExecutionHierarchyTree: React.FC<ExecutionHierarchyTreeProps> = ({ onSelectTask }) => {
 const [data] = useState<HierarchyObjectiveNode>(SAMPLE_EXECUTION_HIERARCHY);
 const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
 const [filterText, setFilterText] = useState('');
 const [filterStatus, setFilterStatus] = useState<string>('ALL');

 const toggleNode = (nodeId: string) => {
  setCollapsedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
 };

 const expandAll = () => setCollapsedNodes({});
 const collapseAll = () => {
  const next: Record<string, boolean> = {};
  data.priorities.forEach(p => {
   next[p.id] = true;
   p.milestones.forEach(m => {
    next[m.id] = true;
    m.commitments.forEach(c => {
     next[c.id] = true;
    });
   });
  });
  setCollapsedNodes(next);
 };

 const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
   case 'COMPLETED':
    return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
   case 'IN_PROGRESS':
    return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
   case 'BLOCKED':
    return 'bg-red-500/10 text-red-700 border-red-500/20';
   default:
    return 'bg-slate-500/10 text-slate-700 border-slate-500/20';
  }
 };

 return (
  <div className="space-y-4">
   {/* Controls Bar */}
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
    <div className="flex items-center gap-2 flex-1">
     <div className="relative flex-1 max-w-xs">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      <input
       type="text"
       value={filterText}
       onChange={e => setFilterText(e.target.value)}
       placeholder="Search hierarchy..."
       className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none"
      />
     </div>
     <select
      value={filterStatus}
      onChange={e => setFilterStatus(e.target.value)}
      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 "
     >
      <option value="ALL">All Statuses</option>
      <option value="ACTIVE">Active</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="BLOCKED">Blocked</option>
      <option value="COMPLETED">Completed</option>
     </select>
    </div>

    <div className="flex items-center gap-2 text-xs">
     <button
      onClick={expandAll}
      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 :bg-slate-800 text-slate-600 font-medium cursor-pointer"
     >
      Expand All
     </button>
     <button
      onClick={collapseAll}
      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 :bg-slate-800 text-slate-600 font-medium cursor-pointer"
     >
      Collapse All
     </button>
    </div>
   </div>

   {/* 1. TOP OBJECTIVE LEVEL */}
   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
     <div className="space-y-1">
      <div className="flex items-center gap-2">
       <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 rounded border border-indigo-400/30">
        1. {data.quarter}
       </span>
       <span className="text-xs text-indigo-200 font-semibold">{data.progressPercent}% Complete</span>
      </div>
      <h2 className="text-lg font-black tracking-tight">{data.title}</h2>
      <p className="text-xs text-slate-300 max-w-2xl">{data.description}</p>
     </div>

     <div className="w-36 bg-white/10 rounded-full h-2.5 overflow-hidden border border-white/20">
      <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${data.progressPercent}%` }} />
     </div>
    </div>

    {/* 2. MONTHLY PRIORITIES LIST */}
    <div className="p-5 space-y-4">
     {data.priorities.map(prio => {
      const isPrioCollapsed = Boolean(collapsedNodes[prio.id]);

      return (
       <div key={prio.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 ">
        {/* Priority Row */}
        <div
         onClick={() => toggleNode(prio.id)}
         className="p-3.5 bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50/80 :bg-slate-800/40 transition-colors border-b border-slate-200/80 "
        >
         <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-slate-600 :text-slate-200">
           {isPrioCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-50 text-blue-700 border border-blue-200 ">
           2. Priority ({prio.month})
          </span>
          <h3 className="text-sm font-bold text-slate-900 ">{prio.title}</h3>
         </div>

         <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getStatusBadge(prio.status)}`}>
           {prio.status}
          </span>
          <span className="text-xs font-semibold text-slate-500">{prio.progressPercent}%</span>
         </div>
        </div>

        {/* 3. WEEKLY MILESTONES */}
        {!isPrioCollapsed && (
         <div className="p-4 pl-8 space-y-3">
          {prio.milestones.map(ms => {
           const isMsCollapsed = Boolean(collapsedNodes[ms.id]);

           return (
            <div key={ms.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white ">
             {/* Milestone Header */}
             <div
              onClick={() => toggleNode(ms.id)}
              className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 :bg-slate-800/40 transition-colors border-b border-slate-100 "
             >
              <div className="flex items-center gap-2.5">
               <button className="text-slate-400">
                {isMsCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
               </button>
               <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-purple-50 text-purple-700 border border-purple-200 ">
                3. Milestone {ms.weekCode}
               </span>
               <h4 className="text-xs font-bold text-slate-800 ">{ms.title}</h4>
              </div>

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${getStatusBadge(ms.status)}`}>
               {ms.status}
              </span>
             </div>

             {/* 4. COMMITMENTS */}
             {!isMsCollapsed && (
              <div className="p-3 pl-6 space-y-2.5 bg-slate-50/40 ">
               {ms.commitments.map(cm => {
                const isCmCollapsed = Boolean(collapsedNodes[cm.id]);

                return (
                 <div key={cm.id} className="border border-slate-200/80 rounded-lg bg-white overflow-hidden shadow-2xs">
                  {/* Commitment Header */}
                  <div
                   onClick={() => toggleNode(cm.id)}
                   className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 :bg-slate-800/30"
                  >
                   <div className="flex items-center gap-2">
                    <button className="text-slate-400">
                     {isCmCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-amber-50 text-amber-800 border border-amber-200 ">
                     4. Commitment ({cm.code})
                    </span>
                    <h5 className="text-xs font-extrabold text-slate-900 ">{cm.title}</h5>
                   </div>

                   {/* RACI Ownership Badge */}
                   <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                     <strong className="text-blue-600 ">R:</strong> {cm.raci.responsible} | <strong className="text-purple-600 ">A:</strong> {cm.raci.accountable}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getStatusBadge(cm.status)}`}>
                     {cm.status}
                    </span>
                   </div>
                  </div>

                  {/* 5. TASKS */}
                  {!isCmCollapsed && (
                   <div className="p-2.5 pl-6 border-t border-slate-100 bg-slate-50/60 space-y-1.5">
                    {cm.tasks.map(tk => (
                     <div
                      key={tk.id}
                      onClick={() => onSelectTask?.(tk.id)}
                      className="p-2 rounded-md bg-white border border-slate-200 flex items-center justify-between hover:border-blue-400 :border-blue-500 cursor-pointer transition-colors"
                     >
                      <div className="flex items-center gap-2">
                       <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-slate-100 text-slate-600 ">
                        5. Task
                       </span>
                       <span className="text-xs font-medium text-slate-800 ">{tk.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                       <span className="text-[10px] text-slate-500 font-medium">
                        {tk.ownerName} ({tk.raciRole})
                       </span>
                       <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${getStatusBadge(tk.status)}`}>
                        {tk.status}
                       </span>
                      </div>
                     </div>
                    ))}
                   </div>
                  )}
                 </div>
                );
               })}
              </div>
             )}
            </div>
           );
          })}
         </div>
        )}
       </div>
      );
     })}
    </div>
   </div>
  </div>
 );
};
