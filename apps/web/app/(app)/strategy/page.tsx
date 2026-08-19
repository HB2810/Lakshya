'use client';

import React, { useState, useEffect } from 'react';
import { Target, ChevronDown, ChevronRight, CheckSquare, Plus, Calendar, Layers, Award } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiClient } from '../../../lib/api/client';
import { QuarterlyDirection, MonthlyPriority, WeeklyMilestone } from '../../../types/strategy';

export default function StrategyPage() {
  const [directions, setDirections] = useState<QuarterlyDirection[]>([]);
  const [priorities, setPriorities] = useState<MonthlyPriority[]>([]);
  const [milestones, setMilestones] = useState<WeeklyMilestone[]>([]);
  const [expandedPriority, setExpandedPriority] = useState<string | null>('mp-2026-08-01');

  useEffect(() => {
    Promise.all([
      apiClient.strategy.getQuarterlyDirections(),
      apiClient.strategy.getMonthlyPriorities(),
      apiClient.strategy.getWeeklyMilestones(),
    ]).then(([qdRes, mpRes, wmRes]) => {
      setDirections(qdRes);
      setPriorities(mpRes);
      setMilestones(wmRes);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-workspace-border rounded-lg p-6 shadow-card">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Strategic Direction & Priorities</h2>
          <p className="text-xs text-text-secondary mt-1">
            Visual organizational alignment: Quarterly Direction $\rightarrow$ Monthly Priority $\rightarrow$ Weekly Milestone $\rightarrow$ Commitment.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          New Monthly Priority
        </Button>
      </div>

      {/* Directions */}
      {directions.map(qd => (
        <Card
          key={qd.id}
          title={`${qd.quarter} ${qd.year} Strategic Direction`}
          action={<StatusBadge status={qd.status} />}
        >
          <div className="space-y-6">
            {/* Direction Overview Box */}
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg space-y-3">
              <h3 className="text-lg font-extrabold text-brand-blue">{qd.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{qd.description}</p>
              <div className="flex items-center gap-4 text-xs font-semibold text-text-primary pt-1">
                <span>Objective: {qd.objective}</span>
              </div>
              <ProgressBar value={qd.progressPercent} size="md" />
            </div>

            {/* Monthly Priorities Tree */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-blue" />
                Monthly Priorities ({qd.quarter})
              </h4>

              <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                {priorities
                  .filter(p => p.quarterlyDirectionId === qd.id)
                  .map(p => {
                    const isExpanded = expandedPriority === p.id;
                    const linkedMilestones = milestones.filter(m => m.monthlyPriorityId === p.id);

                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-workspace-border rounded-lg shadow-subtle overflow-hidden"
                      >
                        {/* Priority Accordion Bar */}
                        <div
                          onClick={() => setExpandedPriority(isExpanded ? null : p.id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <button className="text-text-muted hover:text-text-primary">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-brand-blue" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-brand-blue">{p.month}</span>
                                <StatusBadge status={p.status} size="sm" />
                              </div>
                              <h5 className="text-sm font-bold text-text-primary mt-0.5">{p.title}</h5>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-xs">
                            <div className="text-right hidden sm:block">
                              <p className="font-medium text-text-secondary">{p.ownerName}</p>
                              <p className="text-[10px] text-text-muted">{p.departmentName}</p>
                            </div>
                            <div className="w-28 hidden sm:block">
                              <ProgressBar value={p.progressPercent} showLabel={false} size="sm" />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Weekly Milestones */}
                        {isExpanded && (
                          <div className="p-4 border-t border-workspace-border bg-workspace-subtle/30 space-y-3">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                              Weekly Milestones
                            </h5>

                            <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                              {linkedMilestones.length === 0 ? (
                                <p className="text-xs text-text-muted italic">No weekly milestones registered yet.</p>
                              ) : (
                                linkedMilestones.map(m => (
                                  <div
                                    key={m.id}
                                    className="p-3 bg-white border border-workspace-border rounded-md flex items-start justify-between gap-4"
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="neutral">{m.weekLabel}</Badge>
                                        <StatusBadge status={m.status} size="sm" />
                                      </div>
                                      <p className="text-xs font-bold text-text-primary mt-1">{m.title}</p>
                                      {m.completionOutcome && (
                                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                                          Outcome: {m.completionOutcome}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-xs font-semibold text-text-secondary shrink-0">
                                      Owner: {m.ownerName}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
