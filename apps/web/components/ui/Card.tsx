import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, action, children, className = '', ...props }) => {
  return (
    <div className={`bg-white border border-workspace-border rounded-lg shadow-card overflow-hidden ${className}`} {...props}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-workspace-border flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-text-primary tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

export interface StatProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  subtext?: string;
}

export const Stat: React.FC<StatProps> = ({ label, value, change, changeType = 'neutral', icon, subtext }) => {
  return (
    <div className="bg-white border border-workspace-border rounded-lg p-4 shadow-subtle flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-2xl font-bold text-text-primary mt-1 tracking-tight">{value}</p>
        {(change || subtext) && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            {change && (
              <span
                className={`font-semibold ${
                  changeType === 'positive'
                    ? 'text-emerald-600'
                    : changeType === 'negative'
                    ? 'text-brand-red'
                    : 'text-text-secondary'
                }`}
              >
                {change}
              </span>
            )}
            {subtext && <span className="text-text-muted">{subtext}</span>}
          </div>
        )}
      </div>
      {icon && <div className="p-2.5 bg-workspace-subtle text-brand-blue rounded-md shrink-0">{icon}</div>}
    </div>
  );
};
