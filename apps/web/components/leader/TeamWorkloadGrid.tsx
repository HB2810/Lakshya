import React from 'react';
import { Users, AlertTriangle } from 'lucide-react';
import { OrgNode } from '../../types/organization';

interface TeamWorkloadGridProps {
  teamMembers: OrgNode[]; // Expected to be the direct subordinates or entire scoped tree nodes
  isLoading?: boolean;
}

export const TeamWorkloadGrid: React.FC<TeamWorkloadGridProps> = ({ teamMembers, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!teamMembers || teamMembers.length === 0) {
    return null; // Don't show if no team
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Users className="w-4 h-4 text-slate-700" />
        <h3 className="text-sm font-bold text-slate-900">Team Workload</h3>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg ml-auto">
          {teamMembers.length} Members
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <div key={member.id || member.positionId} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {member.userName || 'Vacant Position'}
                </h4>
                <p className="text-[10px] text-slate-500">{member.positionTitle}</p>
              </div>
              {!member.userId && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded uppercase">
                  Vacant
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase uppercase">Active</span>
                <span className="font-bold text-slate-700">{member.activeTasksCount || 0} tasks</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-red-400 font-bold uppercase uppercase">Blocked</span>
                <span className={`font-bold ${member.blockedTasksCount ? 'text-red-600' : 'text-slate-400'}`}>
                  {member.blockedTasksCount || 0} tasks
                </span>
              </div>
            </div>
            
            {/* Simple Capacity Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${member.blockedTasksCount ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(((member.activeTasksCount || 0) / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 text-right">
                {((member.activeTasksCount || 0) / 10 * 100) > 80 ? 'High Capacity' : 'Available'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
