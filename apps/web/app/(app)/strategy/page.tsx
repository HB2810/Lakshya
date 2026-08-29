'use client';

import React, { useState, useEffect } from 'react';
import { Target, Plus, Sparkles, Building, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { QuarterlyPriority } from '../../../types/strategy';
import { apiClient } from '../../../lib/api/client';
import { ZomatoDeliveryStepper } from '../../../components/strategy/ZomatoDeliveryStepper';

export default function StrategyPage() {
  const [priorities, setPriorities] = useState<QuarterlyPriority[]>([]);
  const [activePriorityId, setActivePriorityId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New QP Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAuthority, setNewAuthority] = useState('Managing Director');
  const [newDepartment, setNewDepartment] = useState('Spine Surgery & Operations');

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const list = await apiClient.strategy.getQuarterlyPriorities();
      setPriorities([...list]);
      if (list.length > 0 && !activePriorityId) {
        setActivePriorityId(list[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreatePriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = await apiClient.strategy.createQuarterlyPriority({
      title: newTitle.trim(),
      description: newDescription.trim() || 'Strategic operational transformation target.',
      reportingAuthority: newAuthority,
      department: newDepartment,
      quarter: 'Q3',
      year: 2026,
    });

    await refreshData();
    setActivePriorityId(created.id);
    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  const selectedPriority = priorities.find(p => p.id === activePriorityId) || priorities[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. STRATEGIC PRIORITIES EXECUTIVE HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-brand-blue border border-blue-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Strategic Roadmaps
            </span>
            <span className="text-xs text-slate-500 font-mono">
              • Q3 2026 Execution Cycle
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Quarterly Priorities & 10-Milestone Delivery Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time step-by-step milestone delivery visibility for executive leadership & reporting authorities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Quarterly Priority</span>
        </button>
      </div>

      {/* 2. PRIORITY SELECTOR TABS */}
      {priorities.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {priorities.map(qp => {
            const isActive = qp.id === activePriorityId;
            return (
              <button
                key={qp.id}
                type="button"
                onClick={() => setActivePriorityId(qp.id)}
                className={`px-4 py-3 rounded-xl text-left border transition-all shrink-0 min-w-[260px] cursor-pointer ${
                  isActive
                    ? 'bg-white border-slate-900 shadow-sm ring-1 ring-slate-900'
                    : 'bg-white/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {qp.quarter} {qp.year}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      qp.progressPercent === 100
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {qp.progressPercent}% Complete
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                  {qp.title}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Step {qp.currentStep} of 10 in progress
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. ACTIVE QUARTERLY PRIORITY ZOMATO DELIVERY STEPPER */}
      {selectedPriority ? (
        <ZomatoDeliveryStepper priority={selectedPriority} onRefresh={refreshData} />
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Quarterly Priorities Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create your first Quarterly Priority to track its 10 sequential delivery milestones.
          </p>
        </div>
      )}

      {/* 4. MODAL: CREATE NEW QUARTERLY PRIORITY */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Quarterly Priority</h3>
                <p className="text-xs text-slate-500">Auto-generates a 10-milestone delivery roadmap.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePriority} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Quarterly Priority Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Q3 Clinical Infection Rate Reduction & CSSD Protocol"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Strategic Scope / Deliverable Objective
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Describe the overarching hospital outcome to achieve across the 10 milestone steps..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Reporting Authority
                  </label>
                  <input
                    type="text"
                    value={newAuthority}
                    onChange={e => setNewAuthority(e.target.value)}
                    placeholder="e.g. Managing Director"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    placeholder="e.g. Spine Surgery / CSSD"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Create & Initialize 10 Milestones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
