import React from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  action,
  icon = <Inbox className="w-10 h-10 text-slate-300" />,
}) => {
  return (
    <div className="p-8 text-center bg-white border border-workspace-border rounded-lg shadow-card flex flex-col items-center justify-center space-y-3">
      <div className="p-3 bg-workspace-subtle rounded-full">{icon}</div>
      <h4 className="text-base font-semibold text-text-primary">{title}</h4>
      <p className="text-xs text-text-muted max-w-sm">{description}</p>
      {action ? (
        action
      ) : actionLabel && onAction ? (
        <Button size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading execution intelligence...' }) => {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      <p className="text-xs font-medium text-text-secondary">{message}</p>
    </div>
  );
};

export const ErrorState: React.FC<{ title?: string; message: string; onRetry?: () => void }> = ({
  title = 'Failed to load operational data',
  message,
  onRetry,
}) => {
  return (
    <div className="p-8 bg-red-50/50 border border-red-200 rounded-lg text-center flex flex-col items-center justify-center space-y-3">
      <div className="p-3 bg-red-100 text-brand-red rounded-full">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-brand-red">{title}</h4>
      <p className="text-xs text-slate-600 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
