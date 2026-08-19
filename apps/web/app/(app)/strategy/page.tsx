'use client';

import React, { useState, useEffect } from 'react';
import { Target, ChevronDown, ChevronRight, CheckSquare, Plus, Calendar, Layers, Award } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/States';
import { QuarterlyDirection, MonthlyPriority, WeeklyMilestone } from '../../../types/strategy';
import { strategyStore } from '../../../lib/mocks/strategyMock';

export default function StrategyPage() {
  const [directions, setDirections] = useState<QuarterlyDirection[]>([]);
  const [priorities, setPriorities] = useState<MonthlyPriority[]>([]);
  const [milestones, setMilestones] = useState<WeeklyMilestone[]>([]);
  const [expandedPriority, setExpandedPriority] = useState<string | null>(null);

  const refreshData = () => {
    setDirections([...strategyStore.getQuarterlyDirections()]);
    setPriorities([...strategyStore.getMonthlyPriorities()]);
    setMilestones([...strategyStore.getWeeklyMilestones()]);
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = strategyStore.subscribe(refreshData);
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-workspace-border rounded-lg p-6 shadow-card">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Strategic Direction & Priorities</h2>
          <p className="text-xs text-text-secondary mt-1">
            Visual organizational alignment: Quarterly Direction &rarr; Monthly Priority &rarr; Weekly Milestone &rarr; Commitment.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => {
          strategyStore.addMonthlyPriority({ title: 'New Monthly Priority' });
        }}>
          New Monthly Priority
        </Button>
      </div>

      {/* Directions */}
      {directions.length === 0 ? (
        <EmptyState
          title="No Strategic Directions Set"
          description="Start by creating a quarterly direction and monthly priority to align organizational commitments."
          action={<Button size="sm" onClick={() => strategyStore.addQuarterlyDirection({ title: 'Q3 OPD & Operations Optimization' })}>+ Add Strategic Direction</Button>}
        />
      ) : (
        directions.map(qd => (
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

              {/* Priorities List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Associated Monthly Priorities
                </h4>

                {priorities.length === 0 ? (
                  <EmptyState title="No Monthly Priorities" description="No monthly priorities attached to this direction yet." />
                ) : (
                  priorities.map(p => (
                    <div
                      key={p.id}
                      className="border border-workspace-border rounded-lg bg-workspace-subtle/30 overflow-hidden"
                    >
                      <div
                        onClick={() => setExpandedPriority(expandedPriority === p.id ? null : p.id)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-workspace-subtle transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedPriority === p.id ? (
                            <ChevronDown className="w-4 h-4 text-text-muted" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                          )}
                          <div>
                            <h5 className="text-sm font-bold text-text-primary">{p.title}</h5>
                            <p className="text-xs text-text-muted">
                              Owner: {p.ownerName} • {p.departmentName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <ProgressBar value={p.progressPercent} size="sm" className="w-24 hidden sm:block" />
                          <StatusBadge status={p.status} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
