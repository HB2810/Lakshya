import React, { useState, useEffect } from 'react';
import { Link2, AlertCircle, CheckCircle2, Clock, Plus, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { WorkItem, DependencyStatus, WorkItemDependencyItem } from '../../../types/workItem';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthContext';

interface DependenciesSectionProps {
  workItem: WorkItem;
  onUpdate?: () => void;
}

export const DependenciesSection: React.FC<DependenciesSectionProps> = ({ workItem, onUpdate }) => {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [allTasks, setAllTasks] = useState<WorkItem[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [dependencyType, setDependencyType] = useState<string>('PREREQUISITE');
  const [dependencyNotes, setDependencyNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const dependencies: WorkItemDependencyItem[] = workItem.dependencies || [];

  const isAuthorized = ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER', 'LEADERS', 'MASTER', 'ADMIN'].includes(user.role);

  useEffect(() => {
    if (isAdding && allTasks.length === 0) {
      apiClient.workItems.list().then((res) => {
        setAllTasks((res?.items || []).filter((item) => item.id !== workItem.id));
      });
    }
  }, [isAdding, allTasks.length, workItem.id]);

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) return;

    const targetItem = allTasks.find((t) => t.id === selectedTargetId);
    if (!targetItem) return;

    setIsLoading(true);
    try {
      const newDep: WorkItemDependencyItem = {
        id: `dep-${Date.now()}`,
        target_work_item_id: targetItem.id,
        target_title: targetItem.title,
        status: targetItem.status === 'completed' ? 'COMPLETED' : targetItem.status === 'blocked' ? 'BLOCKED' : 'READY',
        notes: dependencyNotes.trim() || undefined,
      };

      const updatedDependencies = [...dependencies, newDep];

      await apiClient.workItems.patch(workItem.id, {
        dependencies: updatedDependencies as any,
        update_note: `Linked dependency to: ${targetItem.title}`,
      });

      setIsAdding(false);
      setSelectedTargetId('');
      setDependencyNotes('');
      onUpdate?.();
    } catch (err) {
      console.error('Failed to add dependency:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    try {
      const updatedDependencies = dependencies.filter((d) => d.id !== depId);
      await apiClient.workItems.patch(workItem.id, {
        dependencies: updatedDependencies as any,
        update_note: 'Removed task dependency.',
      });
      onUpdate?.();
    } catch (err) {
      console.error('Failed to remove dependency:', err);
    }
  };

  const getDepStatusConfig = (status: DependencyStatus) => {
    switch (status) {
      case 'BLOCKED':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" />,
          class: 'bg-red-50 text-red-700 border-red-200',
          text: 'Blocked',
        };
      case 'READY':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-blue-600" />,
          class: 'bg-blue-50 text-blue-700 border-blue-200',
          text: 'In Progress',
        };
      case 'COMPLETED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          text: 'Completed',
        };
      default:
        return {
          icon: <Link2 className="w-3.5 h-3.5 text-slate-500" />,
          class: 'bg-slate-50 text-slate-600 border-slate-200',
          text: 'Active',
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Link2 className="w-4 h-4 text-blue-600" />
          Task Dependencies ({dependencies.length})
        </h3>
        {isAuthorized && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Prerequisite
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddDependency} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Link Prerequisite Work Item</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-600">Select Dependent Task</label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select target task...</option>
              {allTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status}) · {t.owner_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-600">Dependency Notes / Hand-off Criteria</label>
            <input
              type="text"
              value={dependencyNotes}
              onChange={(e) => setDependencyNotes(e.target.value)}
              placeholder="e.g., Must complete OT room sterilization before starting case"
              className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedTargetId}
              className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
            >
              {isLoading ? 'Linking...' : 'Link Dependency'}
            </button>
          </div>
        </form>
      )}

      {dependencies.length === 0 && !isAdding ? (
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
          <p className="text-xs text-slate-500">No prerequisites or blockers linked.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dependencies.map((dep) => {
            const config = getDepStatusConfig(dep.status);
            return (
              <div
                key={dep.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5">{config.icon}</div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 truncate">{dep.target_title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${config.class}`}>
                        {config.text}
                      </span>
                    </div>
                    {dep.notes && <p className="text-[11px] text-slate-500">{dep.notes}</p>}
                  </div>
                </div>

                {isAuthorized && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDependency(dep.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer shrink-0"
                    title="Remove dependency"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
