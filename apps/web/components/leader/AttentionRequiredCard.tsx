import React from 'react';
import { AlertCircle, ChevronRight, ShieldAlert } from 'lucide-react';
import { WorkItem, WorkItemEscalationRecord } from '../../types/workItem';

interface AttentionRequiredCardProps {
  blockedTasks: WorkItem[];
  overdueTasks: WorkItem[];
  escalations: WorkItemEscalationRecord[];
  allTasks?: WorkItem[];
  onOpenTask: (task: WorkItem) => void;
  onOpenEscalation?: (esc: WorkItemEscalationRecord) => void;
}

export const AttentionRequiredCard: React.FC<AttentionRequiredCardProps> = ({
  blockedTasks,
  overdueTasks,
  escalations,
  allTasks = [],
  onOpenTask,
  onOpenEscalation,
}) => {
  const totalCount = blockedTasks.length + overdueTasks.length + escalations.length;

  if (totalCount === 0) return null;

  return (
    <div className="bg-red-50/40 border border-red-200/80 rounded-3xl p-5 space-y-3">
      <div className="flex items-center gap-2 text-red-900">
        <AlertCircle className="w-4 h-4 text-red-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider">
          Needs Immediate Attention ({totalCount})
        </h3>
      </div>

      <div className="space-y-2">
        {escalations.length > 0 && escalations.map((item, idx) => (
          <div
            key={`esc-${idx}`}
            onClick={() => onOpenEscalation?.(item)}
            className="p-3.5 bg-white border border-red-300 rounded-2xl flex items-center justify-between gap-3 hover:border-red-400 transition-colors cursor-pointer shadow-2xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-600 text-white rounded uppercase flex items-center gap-1">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  ESCALATION
                </span>
                <span className="text-[11px] font-semibold text-red-600">
                  {item.escalated_by_name || 'Escalated to you'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {allTasks.find(t => t.id === item.work_item_id)?.title || 'Escalated Task'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        ))}

        {blockedTasks.map(item => (
          <div
            key={item.id}
            onClick={() => onOpenTask(item)}
            className="p-3.5 bg-white border border-red-200 rounded-2xl flex items-center justify-between gap-3 hover:border-red-300 transition-colors cursor-pointer shadow-2xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded uppercase">
                  BLOCKED
                </span>
                <span className="text-[11px] font-semibold text-red-600">
                  {item.blocked_reason || 'Blocker reported'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">{item.title}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        ))}

        {overdueTasks.filter(item => item.status !== 'blocked').map(item => (
          <div
            key={item.id}
            onClick={() => onOpenTask(item)}
            className="p-3.5 bg-white border border-amber-200 rounded-2xl flex items-center justify-between gap-3 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded uppercase">
                  OVERDUE
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Target was: {item.due_at?.substring(0, 10)}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">{item.title}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
