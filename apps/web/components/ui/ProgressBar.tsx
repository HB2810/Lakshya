import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'emerald' | 'amber' | 'red';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  showLabel = true,
  size = 'md',
  color = 'blue',
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colors = {
    blue: 'bg-brand-blue shadow-sm shadow-blue-500/20',
    emerald: 'bg-emerald-600 shadow-sm shadow-emerald-500/20',
    amber: 'bg-amber-500 shadow-sm shadow-amber-500/20',
    red: 'bg-brand-red shadow-sm shadow-red-500/20',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="font-semibold text-slate-600">Progress</span>
          <span className="font-bold text-slate-900 font-mono">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden p-0.5 ${heights[size]}`}>
        <div
          className={`${heights[size]} ${colors[color]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
