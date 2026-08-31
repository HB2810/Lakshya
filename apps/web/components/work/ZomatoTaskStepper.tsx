import React from 'react';
import { WorkItemStatus } from '../../types/workItem';
import {
  PackageOpen,
  Cog,
  SearchCheck,
  CheckCircle2,
  AlertOctagon,
  XCircle
} from 'lucide-react';

interface ZomatoTaskStepperProps {
  status: WorkItemStatus;
  compact?: boolean;
  className?: string;
}

export const ZomatoTaskStepper: React.FC<ZomatoTaskStepperProps> = ({ 
  status, 
  compact = false,
  className = ''
}) => {
  // Define steps
  const steps = [
    { id: 'todo', label: 'Assigned', icon: PackageOpen },
    { id: 'in_progress', label: 'In Progress', icon: Cog },
    { id: 'review', label: 'QA / Review', icon: SearchCheck },
    { id: 'completed', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getStepIndex = (s: WorkItemStatus): number => {
    switch (s) {
      case 'todo': return 0;
      case 'stuck':
      case 'blocked': return 1; // It reached progress but is now blocked
      case 'in_progress': return 1;
      case 'submitted_for_verification':
      case 'revision_requested': return 2;
      case 'completed':
      case 'verified': return 3;
      case 'cancelled': return 0; // Special case handled later
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);
  const isBlocked = status === 'blocked' || status === 'stuck';
  const isCancelled = status === 'cancelled';
  const isRevision = status === 'revision_requested';

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between relative pb-5">
        {/* Background Track */}
        <div className="absolute left-0 top-3 w-full h-1 bg-slate-100 rounded-full z-0" />
        
        {/* Active Track */}
        <div 
          className={`absolute left-0 top-3 h-1 rounded-full z-0 transition-all duration-500
            ${isCancelled ? 'bg-red-200' : isBlocked ? 'bg-amber-400' : 'bg-blue-600'}
          `}
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isPast = index < currentIndex;
          
          let StepIcon = step.icon;
          let bgColor = 'bg-white';
          let iconColor = 'text-slate-300';
          let ringColor = 'border-slate-200';
          let textColor = 'text-slate-400';

          if (isCancelled && index === currentIndex) {
            StepIcon = XCircle;
            bgColor = 'bg-red-50';
            iconColor = 'text-red-500';
            ringColor = 'border-red-200';
            textColor = 'text-red-600';
          } else if (isActive) {
            if (isBlocked) {
              StepIcon = AlertOctagon;
              bgColor = 'bg-amber-50';
              iconColor = 'text-amber-500';
              ringColor = 'border-amber-300';
              textColor = 'text-amber-600';
            } else if (isRevision && index === 2) {
              StepIcon = AlertOctagon;
              bgColor = 'bg-orange-50';
              iconColor = 'text-orange-500';
              ringColor = 'border-orange-300';
              textColor = 'text-orange-600';
            } else {
              bgColor = 'bg-blue-600';
              iconColor = 'text-white';
              ringColor = 'border-blue-600 shadow-md shadow-blue-200';
              textColor = 'text-blue-700 font-bold';
            }
          } else if (isPast) {
            bgColor = 'bg-blue-600';
            iconColor = 'text-white';
            ringColor = 'border-blue-600';
            textColor = 'text-slate-700 font-bold';
          }

          const iconSize = compact ? 'w-3 h-3' : 'w-3.5 h-3.5';
          const containerSize = compact ? 'w-5 h-5' : 'w-7 h-7';

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
              <div 
                className={`
                  ${containerSize} rounded-full border-2 flex items-center justify-center transition-all duration-300
                  ${bgColor} ${iconColor} ${ringColor}
                  ${isActive && !isBlocked && !isCancelled ? 'animate-pulse ring-4 ring-blue-50' : ''}
                `}
              >
                <StepIcon className={iconSize} />
              </div>
              
              <span 
                className={`
                  text-[9px] tracking-tight uppercase absolute top-full mt-1.5 whitespace-nowrap
                  ${textColor}
                  ${compact && !isActive ? 'opacity-0' : 'opacity-100'}
                  transition-opacity duration-300
                `}
              >
                {isActive && isBlocked ? 'Blocked' : 
                 isActive && isRevision ? 'Revision' : 
                 isActive && isCancelled ? 'Cancelled' : step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
