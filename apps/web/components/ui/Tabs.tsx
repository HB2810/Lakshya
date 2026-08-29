import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-slate-200 flex gap-5 overflow-x-auto overscroll-x-contain ${className}`}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 whitespace-nowrap py-3 px-1 border-b-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
              isActive
                ? 'border-brand-blue text-brand-blue font-bold'
                : 'border-transparent text-slate-700 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full font-bold ${
                  isActive ? 'bg-blue-100 text-brand-blue' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
