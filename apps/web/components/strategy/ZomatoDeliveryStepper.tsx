'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Calendar,
  FileCheck2,
  AlertCircle,
  Check,
  Lock,
  Edit3,
  Plus,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { MilestoneStep, QuarterlyPriority } from '../../types/strategy';
import { apiClient } from '../../lib/api/client';
import { useAuth } from '../../lib/auth/AuthContext';

interface ZomatoDeliveryStepperProps {
  priority: QuarterlyPriority;
  onRefresh?: () => void;
}

export const ZomatoDeliveryStepper: React.FC<ZomatoDeliveryStepperProps> = ({ priority, onRefresh }) => {
  const { user } = useAuth();
  const isLeader =
    user?.role === 'MD' ||
    user?.role === 'MANAGING_DIRECTOR' ||
    user?.role === 'MASTER' ||
    user?.role === 'ADMIN' ||
    user?.role === 'LEADER' ||
    user?.role === 'LEADERS' ||
    user?.role === 'DEPARTMENT_HEAD';

  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(priority.currentStep || 1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Edit Form State
  const selectedStep =
    priority.milestones.find(m => m.stepNumber === selectedStepNumber) || priority.milestones[0];

  const [editTitle, setEditTitle] = useState(selectedStep?.title || '');
  const [editDesc, setEditDesc] = useState(selectedStep?.description || '');
  const [editDeliverable, setEditDeliverable] = useState(selectedStep?.keyDeliverable || '');
  const [editOwner, setEditOwner] = useState(selectedStep?.ownerName || '');
  const [editTargetDate, setEditTargetDate] = useState(selectedStep?.targetDate || '');

  // Keep edit state in sync when selection changes
  const handleSelectStep = (num: number) => {
    setSelectedStepNumber(num);
    setIsEditing(false);
    const step = priority.milestones.find(m => m.stepNumber === num) || priority.milestones[0];
    if (step) {
      setEditTitle(step.title);
      setEditDesc(step.description);
      setEditDeliverable(step.keyDeliverable || '');
      setEditOwner(step.ownerName || '');
      setEditTargetDate(step.targetDate || '');
    }
  };

  // Check if current selected step is locked because a previous step is incomplete
  const priorIncompleteStep = priority.milestones
    .slice(0, (selectedStep?.stepNumber || 1) - 1)
    .find(m => m.status !== 'COMPLETED');
  const isStepLocked = Boolean(priorIncompleteStep);

  const handleUpdateStatus = async (newStatus: MilestoneStep['status']) => {
    if (!selectedStep) return;
    if (newStatus === 'COMPLETED' && isStepLocked) {
      alert(`Cannot deliver Step #${selectedStep.stepNumber}. Please complete Step #${priorIncompleteStep?.stepNumber} first.`);
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.strategy.updateMilestone(
        priority.id,
        selectedStep.stepNumber,
        {
          status: newStatus,
          verificationNotes: verificationNotes || undefined,
        }
      );
      if (onRefresh) onRefresh();
    } finally {
      setIsUpdating(false);
      setVerificationNotes('');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStep) return;

    setIsUpdating(true);
    try {
      await apiClient.strategy.updateMilestone(priority.id, selectedStep.stepNumber, {
        title: editTitle,
        description: editDesc,
        keyDeliverable: editDeliverable,
        ownerName: editOwner,
        targetDate: editTargetDate,
      });
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddStep = async () => {
    if (priority.milestones.length >= 10) {
      alert('Maximum 10 milestone steps allowed per quarterly priority.');
      return;
    }
    setIsUpdating(true);
    try {
      const nextNum = priority.milestones.length + 1;
      await apiClient.strategy.addMilestoneStep(priority.id, {
        title: `Milestone Step ${nextNum}: Checkpoint`,
        description: `Execution deliverable checkpoint #${nextNum}`,
        ownerName: priority.reportingAuthority || 'Assigned Lead',
      });
      handleSelectStep(nextNum);
      if (onRefresh) onRefresh();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStep = async (stepNum: number) => {
    if (priority.milestones.length <= 1) {
      alert('A priority must have at least 1 milestone step.');
      return;
    }
    if (!confirm(`Are you sure you want to remove Step #${stepNum}?`)) return;

    setIsUpdating(true);
    try {
      await apiClient.strategy.removeMilestoneStep(priority.id, stepNum);
      handleSelectStep(1);
      if (onRefresh) onRefresh();
    } finally {
      setIsUpdating(false);
    }
  };

  const completedCount = priority.milestones.filter(m => m.status === 'COMPLETED').length;
  const totalMilestones = priority.milestones.length;

  return (
    <div className="space-y-6">
      {/* 1. TOP LIVE DELIVERY PROGRESS SUMMARY (PURE WHITE & LIGHT ACCENTS) */}
      <div className="bg-white border border-blue-200/90 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden bg-gradient-to-r from-blue-50/40 via-white to-indigo-50/30">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Milestone Delivery Stepper
            </span>
            <span className="text-xs text-slate-600 font-semibold font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              Step {priority.currentStep} of {totalMilestones} (Max 10)
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {priority.title}
          </h3>

          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed font-medium">
            {priority.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Reporting Authority: <strong className="text-slate-800 font-bold">{priority.reportingAuthority}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Target Quarter End: <strong className="text-slate-800 font-bold">{priority.targetDate}</strong>
            </span>
          </div>
        </div>

        {/* Big Progress Metric Pill */}
        <div className="shrink-0 bg-white border border-blue-200/90 rounded-2xl p-4 text-center min-w-[190px] shadow-xs relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Overall Completion
          </p>
          <div className="text-3xl font-black text-emerald-600 mt-1">
            {priority.progressPercent}%
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full mt-2 overflow-hidden border border-slate-200/60">
            <div
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${priority.progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 mt-1.5 font-bold">
            {completedCount} / {totalMilestones} Milestones Delivered
          </p>
        </div>
      </div>

      {/* 2. ZOMATO-STYLE PROGRESSIVE STEPPER TRACK (STRICT PREREQUISITE LOCKS) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Delivery Stepper ({totalMilestones} Steps · Max 10)
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
                Sequential Delivery Lock Enforced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Prerequisite gate: You cannot progress to the next milestone until prior steps are completed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isLeader && totalMilestones < 10 && (
              <button
                type="button"
                onClick={handleAddStep}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step ({totalMilestones}/10)</span>
              </button>
            )}
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              Active: Step {selectedStepNumber}
            </span>
          </div>
        </div>

        {/* Dynamic Timeline Grid */}
        <div
          className={`grid gap-2 relative ${
            totalMilestones <= 4
              ? 'grid-cols-2 sm:grid-cols-4'
              : totalMilestones <= 6
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-5 lg:grid-cols-10'
          }`}
        >
          {priority.milestones.map((milestone, idx) => {
            const isCompleted = milestone.status === 'COMPLETED';
            const isCurrent = milestone.stepNumber === priority.currentStep && !isCompleted;
            const isSelected = milestone.stepNumber === selectedStepNumber;
            const isLocked = priority.milestones.slice(0, idx).some(m => m.status !== 'COMPLETED');

            return (
              <button
                key={milestone.stepNumber}
                type="button"
                onClick={() => handleSelectStep(milestone.stepNumber)}
                className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[115px] cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-blue-600 border-blue-600 shadow-sm bg-blue-50/40'
                    : isLocked
                    ? 'bg-slate-50/70 border-slate-200/80 opacity-75 hover:opacity-100'
                    : 'hover:border-slate-300 bg-white border-slate-200'
                }`}
              >
                {/* Step Header with Node Icon */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : isLocked
                        ? 'bg-slate-200 text-slate-500'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isLocked ? (
                      <Lock className="w-3 h-3 text-slate-500" />
                    ) : (
                      milestone.stepNumber
                    )}
                  </span>

                  {isLocked && (
                    <span className="text-[8px] font-bold text-slate-400 font-mono">LOCKED</span>
                  )}
                  {isCurrent && !isLocked && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                    </span>
                  )}
                </div>

                {/* Step Title Summary */}
                <div className="my-1.5">
                  <p
                    className={`text-[11px] font-bold leading-tight line-clamp-2 ${
                      isCompleted
                        ? 'text-slate-800'
                        : isCurrent
                        ? 'text-blue-700 font-extrabold'
                        : isLocked
                        ? 'text-slate-500'
                        : 'text-slate-700'
                    }`}
                  >
                    {milestone.title}
                  </p>
                </div>

                {/* Step Status Badge */}
                <div className="mt-auto">
                  <span
                    className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isLocked
                        ? 'bg-slate-100 text-slate-500 border border-slate-200'
                        : isCurrent
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isCompleted ? 'Delivered' : isLocked ? 'Locked' : isCurrent ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. SELECTED STEP EXPANDED DETAIL & EDIT PANEL */}
        {selectedStep && (
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
            {/* Prerequisite Gate Banner */}
            {isStepLocked && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Milestone Locked (Prerequisite Required):</strong> You cannot mark this milestone delivered until <strong>Step #{priorIncompleteStep?.stepNumber} ({priorIncompleteStep?.title})</strong> is completed.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectStep(priorIncompleteStep?.stepNumber || 1)}
                  className="text-xs font-bold text-amber-900 underline shrink-0 hover:text-amber-950"
                >
                  Go to Step #{priorIncompleteStep?.stepNumber}
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-xs ${
                    selectedStep.status === 'COMPLETED'
                      ? 'bg-emerald-600 text-white'
                      : isStepLocked
                      ? 'bg-slate-300 text-slate-600'
                      : selectedStep.stepNumber === priority.currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  #{selectedStep.stepNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Milestone Step {selectedStep.stepNumber} of {totalMilestones}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        selectedStep.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isStepLocked
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : selectedStep.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isStepLocked ? 'LOCKED' : selectedStep.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedStep.title}
                  </h4>
                </div>
              </div>

              {/* Status & Edit Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {isLeader && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5 text-blue-600" />}
                    <span>{isEditing ? 'Cancel Edit' : 'Edit Milestone'}</span>
                  </button>
                )}

                {isLeader && totalMilestones > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteStep(selectedStep.stepNumber)}
                    className="p-2 bg-white hover:bg-red-50 border border-slate-200 text-red-600 hover:border-red-200 rounded-xl transition-colors cursor-pointer"
                    title="Remove this milestone step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {selectedStep.status !== 'COMPLETED' ? (
                  <button
                    type="button"
                    disabled={isUpdating || isStepLocked}
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    title={isStepLocked ? 'Unlock by completing previous steps' : 'Deliver this milestone'}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Milestone Delivered</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus('IN_PROGRESS')}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Reopen Step
                  </button>
                )}
              </div>
            </div>

            {/* Inline Milestone Edit Form */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="p-4 bg-white border border-blue-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-blue-900 border-b border-slate-100 pb-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <h5 className="text-xs font-bold uppercase tracking-wider">Edit Milestone Step #{selectedStep.stepNumber}</h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Milestone Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Accountable Lead / Owner</label>
                    <input
                      type="text"
                      value={editOwner}
                      onChange={e => setEditOwner(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Description</label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Key Deliverable</label>
                    <input
                      type="text"
                      value={editDeliverable}
                      onChange={e => setEditDeliverable(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Target Delivery Date</label>
                    <input
                      type="date"
                      value={editTargetDate}
                      onChange={e => setEditTargetDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Step Specifications & Deliverables Display */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Execution Description
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedStep.description}
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                    Key Tangible Deliverable
                  </p>
                  <p className="text-slate-900 font-semibold">
                    {selectedStep.keyDeliverable || 'Verification checkpoint deliverable'}
                  </p>
                </div>
              </div>
            )}

            {/* Owner & Timing Details Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-500 border-t border-slate-200/80">
              <div className="flex items-center gap-4 flex-wrap">
                <span>
                  Accountable Lead: <strong className="text-slate-800">{selectedStep.ownerName}</strong>
                </span>
                <span>
                  Target Delivery Date: <strong className="text-slate-800">{selectedStep.targetDate}</strong>
                </span>
                {selectedStep.completedAt && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Delivered on: {selectedStep.completedAt}
                  </span>
                )}
              </div>

              {selectedStep.verificationNotes && (
                <div className="text-[11px] text-slate-600 italic bg-white px-3 py-1 rounded-md border border-slate-200">
                  Notes: {selectedStep.verificationNotes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
