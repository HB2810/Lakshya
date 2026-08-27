'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  User,
  Calendar,
  FileCheck2,
  AlertCircle,
  TrendingUp,
  MapPin,
  Check,
} from 'lucide-react';
import { MilestoneStep, QuarterlyPriority } from '../../types/strategy';
import { strategyStore } from '../../lib/mocks/strategyMock';

interface ZomatoDeliveryStepperProps {
  priority: QuarterlyPriority;
}

export const ZomatoDeliveryStepper: React.FC<ZomatoDeliveryStepperProps> = ({ priority }) => {
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(priority.currentStep || 1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  const selectedStep =
    priority.milestones.find(m => m.stepNumber === selectedStepNumber) || priority.milestones[0];

  const handleUpdateStatus = (newStatus: MilestoneStep['status']) => {
    setIsUpdating(true);
    strategyStore.updateMilestoneStatus(
      priority.id,
      selectedStep.stepNumber,
      newStatus,
      verificationNotes || undefined
    );
    setTimeout(() => {
      setIsUpdating(false);
      setVerificationNotes('');
    }, 400);
  };

  const completedCount = priority.milestones.filter(m => m.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* 1. TOP LIVE DELIVERY PROGRESS SUMMARY */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Background glow accent */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Milestone Delivery Tracker
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Step {priority.currentStep} of 10
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {priority.title}
          </h3>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {priority.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Reporting Authority: <strong className="text-white">{priority.reportingAuthority}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Target Quarter End: <strong className="text-white">{priority.targetDate}</strong>
            </span>
          </div>
        </div>

        {/* Big Progress Metric Pill */}
        <div className="shrink-0 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 text-center min-w-[170px] relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Overall Completion
          </p>
          <div className="text-3xl font-black text-emerald-400 mt-1">
            {priority.progressPercent}%
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${priority.progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
            {completedCount} / 10 Milestones Delivered
          </p>
        </div>
      </div>

      {/* 2. ZOMATO-STYLE PROGRESSIVE STEPPER TRACK (HORIZONTAL & RESPONSIVE) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              10-Milestone Delivery Stepper
            </h4>
            <p className="text-xs text-slate-500">
              Click any step to inspect deliverables, verification notes, and progress.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            Active: Step {selectedStepNumber}
          </span>
        </div>

        {/* The 10-Step Timeline Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 relative">
          {priority.milestones.map((milestone) => {
            const isCompleted = milestone.status === 'COMPLETED';
            const isCurrent = milestone.stepNumber === priority.currentStep && !isCompleted;
            const isSelected = milestone.stepNumber === selectedStepNumber;

            return (
              <button
                key={milestone.stepNumber}
                type="button"
                onClick={() => setSelectedStepNumber(milestone.stepNumber)}
                className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[110px] cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-slate-900 border-slate-900 shadow-sm bg-slate-50/80'
                    : 'hover:border-slate-300 bg-white border-slate-200'
                }`}
              >
                {/* Step Header with Node Icon */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      milestone.stepNumber
                    )}
                  </span>

                  {isCurrent && (
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
                        ? 'text-slate-700'
                        : isCurrent
                        ? 'text-blue-700 font-extrabold'
                        : 'text-slate-600'
                    }`}
                  >
                    {milestone.title}
                  </p>
                </div>

                {/* Step Status Badge */}
                <div className="mt-auto">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700'
                        : isCurrent
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? 'Delivered' : isCurrent ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. SELECTED STEP EXPANDED DETAIL INSPECTION PANEL */}
        {selectedStep && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-xs ${
                    selectedStep.status === 'COMPLETED'
                      ? 'bg-emerald-600 text-white'
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
                      Milestone Step {selectedStep.stepNumber} of 10
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        selectedStep.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedStep.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedStep.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedStep.title}
                  </h4>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedStep.status !== 'COMPLETED' ? (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                    Reopen to In-Progress
                  </button>
                )}
              </div>
            </div>

            {/* Step Specifications & Deliverables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Execution Description
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {selectedStep.description}
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                  Key Tangible Deliverable
                </p>
                <p className="text-slate-900 font-semibold">
                  {selectedStep.keyDeliverable}
                </p>
              </div>
            </div>

            {/* Owner & Timing Details */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-500 border-t border-slate-200/80">
              <div className="flex items-center gap-4">
                <span>
                  Accountable Lead: <strong className="text-slate-800">{selectedStep.ownerName}</strong>
                </span>
                <span>
                  Target Delivery Date: <strong className="text-slate-800">{selectedStep.targetDate}</strong>
                </span>
                {selectedStep.completedAt && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Completed: {selectedStep.completedAt}
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
