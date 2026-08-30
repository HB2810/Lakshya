'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  FileCheck,
  ShieldCheck,
  User,
  Clock,
  Link2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { WorkItem } from '../../types/workItem';
import { apiClient } from '../../lib/api/client';
import { useAuth } from '../../lib/auth/AuthContext';

interface TaskVerificationAuditDrawerProps {
  workItem: WorkItem | null;
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const TaskVerificationAuditDrawer: React.FC<TaskVerificationAuditDrawerProps> = ({
  workItem,
  isOpen,
  onClose,
  onVerified,
}) => {
  const { user } = useAuth();

  const [decision, setDecision] = useState<'APPROVED' | 'REVISION_REQUESTED'>('APPROVED');
  const [auditScore, setAuditScore] = useState<number>(5);
  const [sopCompliance, setSopCompliance] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !workItem) return null;

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.workItems.auditVerify(workItem.id, {
        decision,
        auditScore: decision === 'APPROVED' ? auditScore : undefined,
        sopCompliance,
        remarks: remarks.trim() || undefined,
        verifierId: user?.id,
        verifierName: user?.name,
        verifierRole: user?.roleTitle || user?.role,
      });

      onVerified();
      onClose();
    } catch (err: any) {
      console.error('Failed to audit verify task:', err);
      setError(err?.message || 'Failed to submit verification sign-off.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen sm:w-[500px] lg:w-[560px] max-w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  VERIFICATION &amp; AUDIT WORKBENCH
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Incharge Sign-Off
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 leading-snug mt-1.5">
                {workItem.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Task Snapshot */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned Executor</span>
                  <p className="font-bold text-slate-900 mt-0.5">{workItem.owner_name || 'Staff Member'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Department / Unit</span>
                  <p className="font-bold text-slate-900 mt-0.5">{workItem.department_name || 'Hospital Operations'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Current Status</span>
                  <p className="font-bold text-slate-900 mt-0.5 uppercase tracking-wide text-[11px]">
                    {workItem.status.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Current Progress</span>
                  <p className="font-bold text-slate-900 mt-0.5">{workItem.progressPercent || 0}% Complete</p>
                </div>
              </div>

              {workItem.edc?.definition_of_done && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Expected Definition of Done</span>
                  <p className="font-medium text-slate-800 text-[11px] mt-0.5">{workItem.edc.definition_of_done}</p>
                </div>
              )}
            </div>

            {/* Employee Submission Notes & Evidence */}
            <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Employee Deliverable &amp; Submission Evidence</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-blue-100">
                {workItem.submission_notes || 'Deliverable completed per instructions. Requesting sign-off and verification.'}
              </p>
              {workItem.submitted_for_verification_at && (
                <p className="text-[10px] text-slate-400 text-right">
                  Submitted at: {new Date(workItem.submitted_for_verification_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* Audit & Verification Form */}
            <form id="audit-form" onSubmit={handleAuditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Audit Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVED')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      decision === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify &amp; Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('REVISION_REQUESTED')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      decision === 'REVISION_REQUESTED'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Request Revision</span>
                  </button>
                </div>
              </div>

              {decision === 'APPROVED' && (
                <div className="space-y-3 p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl">
                  {/* Star Rating */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                      Quality &amp; Execution Audit Score (1 to 5 Stars)
                    </label>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setAuditScore(star)}
                          className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= auditScore
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-black text-emerald-900 ml-2">
                        {auditScore === 5 ? '5/5 — Flawless Standard' : `${auditScore}/5 Stars`}
                      </span>
                    </div>
                  </div>

                  {/* SOP Compliance Check */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-emerald-900 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={sopCompliance}
                      onChange={(e) => setSopCompliance(e.target.checked)}
                      className="rounded accent-emerald-600 w-4 h-4"
                    />
                    <span>NABH &amp; Hospital SOP standards verified and confirmed</span>
                  </label>
                </div>
              )}

              {/* Remarks / Feedback */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {decision === 'APPROVED'
                    ? 'Incharge Audit Remarks (Optional)'
                    : 'Revision Feedback & Required Corrections *'}
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    decision === 'APPROVED'
                      ? 'e.g. Excellent work. Calibration log verified and PACS telemetry confirmed.'
                      : 'e.g. Please re-check the sensor wiring on COM3 and attach the signed telemetry printout.'
                  }
                  required={decision === 'REVISION_REQUESTED'}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="audit-form"
              disabled={isSubmitting || (decision === 'REVISION_REQUESTED' && !remarks.trim())}
              className={`px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active-press ${
                decision === 'APPROVED'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {decision === 'APPROVED' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Confirming...' : 'Verify & Approve Sign-Off'}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Send Revision Feedback'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
