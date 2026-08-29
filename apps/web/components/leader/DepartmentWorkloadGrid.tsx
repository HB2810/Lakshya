import React, { useMemo } from 'react';
import { Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CanonicalOrgNode, OrgTreeResponse } from '../../types/organization';
import { WorkItem } from '../../types/workItem';

interface DepartmentStats {
  id: string;
  name: string;
  activeTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

interface DepartmentWorkloadGridProps {
  treeData: OrgTreeResponse | null;
  workItems?: WorkItem[];
  isLoading?: boolean;
}

export const DepartmentWorkloadGrid: React.FC<DepartmentWorkloadGridProps> = ({ treeData, workItems = [], isLoading }) => {
  const departmentStats = useMemo(() => {
    if (!treeData || !treeData.root_nodes) return [];

    const statsMap = new Map<string, DepartmentStats>();

    // Helper to extract unique departments from org tree
    const extractDepartments = (nodes: CanonicalOrgNode[]) => {
      nodes.forEach(node => {
        if (!statsMap.has(node.department_id)) {
          statsMap.set(node.department_id, {
            id: node.department_id,
            name: node.department_name,
            activeTasks: 0,
            completedTasks: 0,
            blockedTasks: 0,
            overdueTasks: 0
          });
        }
        if (node.subordinates && node.subordinates.length > 0) {
          extractDepartments(node.subordinates);
        }
      });
    };

    extractDepartments(treeData.root_nodes);

    // Helper to get all users in a department
    const deptUsers = new Map<string, Set<string>>();
    const mapUsersToDept = (nodes: CanonicalOrgNode[]) => {
      nodes.forEach(node => {
        if (!deptUsers.has(node.department_id)) {
          deptUsers.set(node.department_id, new Set());
        }
        if (node.current_occupant?.user_id) {
          deptUsers.get(node.department_id)!.add(node.current_occupant.user_id);
        }
        if (node.subordinates) {
          mapUsersToDept(node.subordinates);
        }
      });
    };
    mapUsersToDept(treeData.root_nodes);

    const nowStr = new Date().toISOString().substring(0, 10);

    workItems.forEach(item => {
      // Find which department this item belongs to
      let deptId = item.department_id;
      
      // If task doesn't have department_id, try to infer from owner
      if (!deptId && item.owner_id) {
        for (const [id, users] of deptUsers.entries()) {
          if (users.has(item.owner_id)) {
            deptId = id;
            break;
          }
        }
      }

      if (deptId && statsMap.has(deptId)) {
        const stats = statsMap.get(deptId)!;
        
        if (item.status === 'completed') {
          stats.completedTasks++;
        } else {
          stats.activeTasks++;
          if (item.status === 'blocked' || item.status === 'stuck') {
            stats.blockedTasks++;
          }
          if (item.due_at && item.due_at.substring(0, 10) < nowStr) {
            stats.overdueTasks++;
          }
        }
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => b.activeTasks - a.activeTasks);
  }, [treeData, workItems]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (departmentStats.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Building2 className="w-4 h-4 text-slate-700" />
        <h3 className="text-sm font-bold text-slate-900">Hospital Department Workload</h3>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg ml-auto">
          {departmentStats.length} Departments
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departmentStats.map(dept => (
          <div key={dept.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3 transition-colors hover:bg-slate-100/50">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-bold text-slate-900 line-clamp-1 flex-1">{dept.name}</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <div className="bg-white p-2 rounded-xl border border-slate-200/60 text-center">
                <span className="block text-lg font-black text-slate-700">{dept.activeTasks}</span>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/60 text-center">
                <span className="block text-lg font-black text-emerald-600">{dept.completedTasks}</span>
                <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
              </div>
              
              {dept.blockedTasks > 0 ? (
                <div className="bg-red-50 p-2 rounded-xl border border-red-100 text-center col-span-1">
                  <span className="block text-lg font-black text-red-600">{dept.blockedTasks}</span>
                  <span className="block text-[10px] font-bold text-red-600 uppercase tracking-wider">Blocked</span>
                </div>
              ) : (
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center opacity-50">
                  <span className="block text-lg font-black text-slate-400">0</span>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blocked</span>
                </div>
              )}
              
              {dept.overdueTasks > 0 ? (
                <div className="bg-amber-50 p-2 rounded-xl border border-amber-100 text-center col-span-1">
                  <span className="block text-lg font-black text-amber-600">{dept.overdueTasks}</span>
                  <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">Overdue</span>
                </div>
              ) : (
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center opacity-50">
                  <span className="block text-lg font-black text-slate-400">0</span>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
