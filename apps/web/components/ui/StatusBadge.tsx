import React from 'react';
import { ExecutionStatus } from '../../types/execution';
import { PriorityStatus } from '../../types/strategy';
import { MeetingStatus } from '../../types/meeting';

export type StatusType = ExecutionStatus | PriorityStatus | MeetingStatus | 'DRAFT' | 'SUPERSEDED' | 'ACKNOWLEDGED' | 'APPROVED' | 'PENDING_APPROVAL' | 'OPEN' | 'RESOLVED';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');

  let style = 'bg-slate-100 text-slate-700 border-slate-300';
  let label = status.replace(/_/g, ' ');

  switch (normalized) {
    case 'OPEN':
      style = 'bg-amber-50 text-amber-800 border-amber-300';
      label = 'Open';
      break;

    case 'NOT_STARTED':
    case 'DRAFT':
    case 'SCHEDULED':
      style = 'bg-slate-100 text-slate-700 border-slate-200';
      label = normalized === 'DRAFT' ? 'Draft' : normalized === 'SCHEDULED' ? 'Scheduled' : 'Not Started';
      break;

    case 'IN_PROGRESS':
    case 'ACTIVE':
      style = 'bg-blue-50 text-blue-700 border-blue-200';
      label = normalized === 'ACTIVE' ? 'Active' : 'In Progress';
      break;

    case 'AT_RISK':
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'At Risk';
      break;

    case 'BLOCKED':
      style = 'bg-red-50 text-red-700 border-red-200';
      label = 'Blocked';
      break;

    case 'PENDING_APPROVAL':
    case 'AWAITING_DECISION':
      style = 'bg-purple-50 text-purple-700 border-purple-200';
      label = normalized === 'AWAITING_DECISION' ? 'Awaiting Decision' : 'Pending Approval';
      break;

    case 'COMPLETED':
    case 'APPROVED':
    case 'RESOLVED':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = normalized === 'APPROVED' ? 'Approved' : normalized === 'RESOLVED' ? 'Resolved' : 'Completed';
      break;

    case 'OVERDUE':
      style = 'bg-red-900 text-white border-red-950 font-semibold';
      label = 'Overdue';
      break;

    case 'CANCELLED':
    case 'SUPERSEDED':
      style = 'bg-gray-100 text-gray-500 border-gray-200 line-through';
      label = normalized === 'SUPERSEDED' ? 'Superseded' : 'Cancelled';
      break;

    case 'ACKNOWLEDGED':
      style = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      label = 'Acknowledged';
      break;
  }

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full uppercase tracking-wider ${sizeStyles} ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
      {label}
    </span>
  );
};
