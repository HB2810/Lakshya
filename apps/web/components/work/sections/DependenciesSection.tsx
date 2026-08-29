import React from 'react';
import { Link2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { WorkItem, DependencyStatus, WorkItemDependencyItem } from '../../../types/workItem';

interface DependenciesSectionProps {
  workItem: WorkItem;
}

export const DependenciesSection: React.FC<DependenciesSectionProps> = ({ workItem }) => {
  const dependencies: WorkItemDependencyItem[] = workItem.dependencies || [];

  if (dependencies.length === 0) {
    return null; // Or show "No dependencies"
  }

  const getDepStatusConfig = (status: DependencyStatus) => {
    switch (status) {
      case 'BLOCKED':
        return { icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" />, class: 'bg-red-50 text-red-700 border-red-200', text: 'Blocked' };
      case 'READY':
        return { icon: <Clock className="w-3.5 h-3.5 text-blue-600" />, class: 'bg-blue-50 text-blue-700 border-blue-200', text: 'In Progress' };
      case 'COMPLETED':
        return { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />, class: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Completed' };
      default:
        return { icon: <Link2 className="w-3.5 h-3.5 text-slate-500" />, class: 'bg-slate-50 text-slate-600 border-slate-200', text: 'Unknown' };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Link2 className="w-4 h-4 text-slate-500" />
          Dependencies ({dependencies.length})
        </h3>
      </div>

      <div className="space-y-2">
        {dependencies.map(dep => {
          const config = getDepStatusConfig(dep.status);
          return (
            <div key={dep.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-3">
              <div className={`mt-0.5 p-1 rounded-full bg-white border ${config.class.split(' ')[2]}`}>
                {config.icon}
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">{dep.target_title}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${config.class}`}>
                    {config.text}
                  </span>
                </div>
                {dep.notes && <p className="text-[11px] text-slate-500 line-clamp-2">{dep.notes}</p>}
                {/* Visual marker for cross-team dependencies (if backend provides department context, usually would) */}
                <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded inline-block mt-1">Depends On</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
