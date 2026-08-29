'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Activity,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../../lib/api/client';

export const AuditLogViewer: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const pageSize = 20;

  const fetchAuditEvents = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.audit.listEvents({
        limit: pageSize,
        offset: page * pageSize,
        entity_type: selectedEntityType === 'ALL' ? undefined : selectedEntityType,
        action: searchQuery ? searchQuery : undefined,
      });
      setEvents(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.warn('Failed to load audit events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [page, selectedEntityType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchAuditEvents();
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('created')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (action.includes('updated') || action.includes('modified')) return 'bg-blue-50 text-blue-800 border-blue-200';
    if (action.includes('escalated') || action.includes('blocked')) return 'bg-rose-50 text-rose-800 border-rose-200';
    if (action.includes('deleted') || action.includes('cancelled')) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Append-Only Audit Ledger
            </span>
            <span className="text-xs text-slate-500 font-mono">
              • {total} Verified Events Recorded
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            Live Organizational Governance & Mutation Log
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable, cryptographically correlated audit evidence for compliance, security, and accountability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAuditEvents}
            disabled={isLoading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh audit ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by action or keyword..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedEntityType}
            onChange={e => {
              setSelectedEntityType(e.target.value);
              setPage(0);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
          >
            <option value="ALL">All Entity Types</option>
            <option value="work_item">WorkItem</option>
            <option value="quarterly_priority">Quarterly Priority</option>
            <option value="calendar_event">Calendar Event</option>
            <option value="user">User Account</option>
            <option value="role_assignment">Role Assignment</option>
            <option value="department">Department</option>
          </select>
        </div>
      </div>

      {/* 3. Audit Events Timeline Table */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />
          Loading verified audit records...
        </div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          No audit events found matching the criteria.
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((evt: any) => {
            const isExpanded = expandedEventId === evt.id;
            const occurredDate = new Date(evt.occurred_at || evt.created_at);
            const dateFormatted = occurredDate.toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={evt.id}
                className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl p-3.5 transition-all text-xs space-y-2"
              >
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">
                      {dateFormatted}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border shrink-0 ${getActionBadgeColor(
                        evt.action
                      )}`}
                    >
                      {evt.action}
                    </span>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {evt.reason || `Mutated ${evt.entity_type} record`}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Actor: <strong className="text-slate-700">{evt.actor_name || evt.actor_label || 'System'}</strong> • Entity: <span className="font-mono">{evt.entity_type}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {evt.correlation_id?.substring(0, 16) || 'api-request'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expandable Before/After State Diff */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px] animate-in fade-in duration-100">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 overflow-x-auto">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block mb-1">
                        Before State
                      </span>
                      {evt.before_state ? (
                        <pre className="text-slate-700 text-[10px] whitespace-pre-wrap">
                          {JSON.stringify(evt.before_state, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-slate-400 italic text-[10px] font-sans">
                          (Null - Record Creation)
                        </span>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 overflow-x-auto">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 font-sans block mb-1">
                        After State / Mutation Applied
                      </span>
                      {evt.after_state ? (
                        <pre className="text-slate-700 text-[10px] whitespace-pre-wrap">
                          {JSON.stringify(evt.after_state, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-slate-400 italic text-[10px] font-sans">
                          (Null - Record Deletion)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Pagination Controls */}
      {total > pageSize && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} of {total} events
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * pageSize >= total}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
