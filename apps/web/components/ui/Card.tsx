import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, action, children, className = '', ...props }) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden hover-lift-light ${className}`} {...props}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
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
  const getIconHalo = () => {
    if (changeType === 'positive') return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
    if (changeType === 'negative') return 'bg-red-50 border border-red-200 text-brand-red';
    return 'bg-blue-50 border border-blue-200 text-brand-blue';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex items-start justify-between hover-lift-light">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight font-mono">{value}</p>
        {(change || subtext) && (
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {change && (
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                  changeType === 'positive'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : changeType === 'negative'
                    ? 'bg-red-50 text-brand-red border border-red-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {change}
              </span>
            )}
            {subtext && <span className="text-slate-500 text-[11px]">{subtext}</span>}
          </div>
        )}
      </div>
      {icon && <div className={`p-3 rounded-xl shrink-0 shadow-sm ${getIconHalo()}`}>{icon}</div>}
    </div>
  );
};
