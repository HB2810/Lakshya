'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Lock,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  User,
  ShieldCheck,
  Building2,
  FileCheck,
  Zap,
} from 'lucide-react';
import { MDAttentionCategory, MDAttentionItem, MDAttentionSummary } from '../../types/mdAttention';
import { apiClient } from '../../lib/api/client';
import { useAuth } from '../../lib/auth/AuthContext';
import { isMDAttentionAuthorized } from '../../lib/auth/rbacPolicies';
import { MDAttentionItemDrawer } from './MDAttentionItemDrawer';

interface NeedsMDAttentionViewProps {
  onSelectItem?: (item: MDAttentionItem) => void;
}

export const NeedsMDAttentionView: React.FC<NeedsMDAttentionViewProps> = ({ onSelectItem }) => {
  const { user } = useAuth();

  const isMDOrMDOffice = isMDAttentionAuthorized(user?.role);

  const [summary, setSummary] = useState<MDAttentionSummary | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Drawer Detail & Action State
  const [selectedItem, setSelectedItem] = useState<MDAttentionItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const fetchAttentionItems = useCallback(async () => {
    if (!isMDOrMDOffice) {
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsUnauthorized(false);

    try {
      const data = await apiClient.mdAttention.getSummary();
      setSummary(data);

      // Keep active drawer item updated if it was modified
      if (selectedItem) {
        const updated = data.items.find(i => i.id === selectedItem.id || i.entity_id === selectedItem.entity_id);
        if (updated) {
          setSelectedItem(updated);
        }
      }
    } catch (err: any) {
      if (err?.status === 403) {
        setIsUnauthorized(true);
      } else {
        setError(err?.message || 'Failed to load executive attention items.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isMDOrMDOffice, selectedItem]);

  useEffect(() => {
    fetchAttentionItems();
  }, [fetchAttentionItems]);

  const handleOpenDrawer = (item: MDAttentionItem, event: React.MouseEvent<HTMLElement>) => {
    setTriggerElement(event.currentTarget);
    setSelectedItem(item);
    setIsDrawerOpen(true);
    onSelectItem?.(item);
  };

  // 1. UNAUTHORIZED STATE (Forbidden for standard employees)
  if (isUnauthorized || !isMDOrMDOffice) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-200 dark:border-amber-800/60">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Access Restricted — MD / MD Office Only
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The <strong>Needs MD Attention</strong> command center is strictly restricted to Managing Director and MD Office leadership. Operational tasks for your role are accessible in <strong>My Work</strong>.
          </p>
        </div>
      </div>
    );
  }

  // 2. LOADING STATE
  if (isLoading && !summary) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-50 dark:bg-slate-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // 3. ERROR STATE
  if (error && !summary) {
    return (
      <div className="p-6 bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-xs font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>Error loading Needs MD Attention telemetry</span>
        </div>
        <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
        <button
          onClick={fetchAttentionItems}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const items = summary?.items || [];

  // Filter Items
  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.accountable_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.why_included.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryConfig = (cat: MDAttentionCategory) => {
    switch (cat) {
      case 'CRITICAL_OVERDUE':
        return {
          label: 'Critical Overdue',
          badge: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
          icon: Clock,
        };
      case 'HIGH_IMPACT_BLOCKER':
        return {
          label: 'High-Impact Blocker',
          badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
          icon: ShieldAlert,
        };
      case 'DECISION_AWAITING_AUTHORITY':
        return {
          label: 'Decision Authority',
          badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
          icon: ShieldCheck,
        };
      case 'EVIDENCE_AWAITING_VERIFICATION':
        return {
          label: 'Evidence Verification',
          badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
          icon: FileCheck,
        };
      case 'AT_RISK_MILESTONE':
        return {
          label: 'At-Risk Milestone',
          badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
          icon: Zap,
        };
      case 'REPEATED_DEFERRAL':
        return {
          label: 'Repeated Deferral',
          badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
          icon: AlertTriangle,
        };
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-700 dark:text-red-400 rounded-md border border-red-500/20 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-600" /> Executive Priority
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {summary?.total_items || 0} Total Active Exceptions
              </span>
              {summary?.is_synthetic_fallback && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-md border border-amber-500/20 flex items-center gap-1">
                  <Info className="w-3 h-3" /> [Demo / Offline Fallback Data]
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Needs MD Attention
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Server-derived exceptions across overdue commitments, stuck needs, pending verification, and authority escalations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAttentionItems}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Refresh attention telemetry"
              aria-label="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Metric Halo Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { id: 'ALL', label: 'All Items', count: summary?.total_items || 0, color: 'border-slate-200 text-slate-900 dark:text-white' },
            { id: 'CRITICAL_OVERDUE', label: 'Critical Overdue', count: summary?.critical_overdue_count || 0, color: 'border-red-200 text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20' },
            { id: 'HIGH_IMPACT_BLOCKER', label: 'High Blockers', count: summary?.high_impact_blocker_count || 0, color: 'border-rose-200 text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20' },
            { id: 'DECISION_AWAITING_AUTHORITY', label: 'Decisions', count: summary?.decision_awaiting_count || 0, color: 'border-purple-200 text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20' },
            { id: 'EVIDENCE_AWAITING_VERIFICATION', label: 'Verification', count: summary?.evidence_verification_count || 0, color: 'border-amber-200 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20' },
            { id: 'AT_RISK_MILESTONE', label: 'Milestones', count: summary?.at_risk_milestone_count || 0, color: 'border-blue-200 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 shadow-xs'
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              } ${cat.color}`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{cat.label}</div>
              <div className="text-xl font-black mt-1">{cat.count}</div>
            </button>
          ))}
        </div>

        {/* Filter / Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter by keyword, owner, reason rule, or impact..."
            aria-label="Filter items"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        {/* 4. EMPTY STATE */}
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">All Executive Items Clear</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No active escalations, overdue blockers, or unverified items currently require Managing Director intervention.
            </p>
          </div>
        ) : (
          /* Items List */
          <div className="space-y-3.5">
            {filteredItems.map(item => {
              const config = getCategoryConfig(item.category);
              const Icon = config.icon;

              return (
                <div
                  key={item.id}
                  data-testid="md-attention-item-card"
                  onClick={(e) => handleOpenDrawer(item, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenDrawer(item, e as any);
                    }
                  }}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-all cursor-pointer space-y-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {/* Top Row: Category + Priority + Source */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border flex items-center gap-1 ${config.badge}`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.priority} Priority
                      </span>
                      {item.is_synthetic && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200">
                          [DEMO]
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Source: {item.source}
                      </span>
                    </div>

                    {item.due_age_days !== null && item.due_age_days !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                        Overdue by {item.due_age_days}d
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h4>
                  </div>

                  {/* RACI Ownership & Department */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-blue-600 dark:text-blue-400">Responsible (R):</span>
                      <span className="font-medium text-slate-900 dark:text-white">{item.owner_name}</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-purple-600 dark:text-purple-400">Accountable (A):</span>
                      <span className="font-medium text-slate-900 dark:text-white">{item.accountable_name}</span>
                    </div>
                    {item.department_name && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Building2 className="w-3 h-3" />
                          <span>{item.department_name}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Impact Statement Callout */}
                  <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      <Info className="w-3 h-3" /> Business Impact & Requested Action
                    </div>
                    <p className="text-[11px] font-medium">{item.impact}</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      <strong>Action:</strong> {item.requested_action}
                    </p>
                  </div>

                  {/* Bottom Metadata: Why Included + Evidence + Audit Provenance */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.why_included}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[9px]">
                        {item.audit_provenance}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                        Review & Act <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accessible Detail & Action Drawer */}
      <MDAttentionItemDrawer
        item={selectedItem}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onActionSuccess={fetchAttentionItems}
        triggerElement={triggerElement}
      />
    </>
  );
};
