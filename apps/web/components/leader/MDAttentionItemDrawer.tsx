'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
 X,
 ShieldAlert,
 Clock,
 CheckCircle2,
 AlertTriangle,
 FileCheck,
 Zap,
 ShieldCheck,
 Building2,
 Calendar,
 User,
 History,
 AlertCircle,
 FileText,
 Send,
 Check,
 XCircle,
 Edit3,
 ExternalLink,
 ChevronRight,
 Info,
 ArrowRight,
 RotateCcw,
 Sparkles,
} from 'lucide-react';
import {
 MDAttentionItem,
 MDAttentionCategory,
 CockpitActionResponse,
 VerifyEvidencePayload,
 RequestEvidencePayload,
 RecordDecisionPayload,
 ExecutiveOverridePayload,
 GrantExtensionPayload,
 ReassignRaciPayload,
 ResolveEscalationPayload,
} from '../../types/mdAttention';
import { apiClient } from '../../lib/api/client';

interface MDAttentionItemDrawerProps {
 item: MDAttentionItem | null;
 isOpen: boolean;
 onClose: () => void;
 onActionSuccess?: () => void;
 triggerElement?: HTMLElement | null;
}

type ModalType =
 | 'REQUEST_EVIDENCE'
 | 'VERIFY_EVIDENCE_ACCEPT'
 | 'VERIFY_EVIDENCE_REJECT'
 | 'RECORD_DECISION'
 | 'EXECUTIVE_OVERRIDE'
 | 'GRANT_EXTENSION'
 | 'REASSIGN_RACI'
 | 'RESOLVE_ESCALATION'
 | null;

export const MDAttentionItemDrawer: React.FC<MDAttentionItemDrawerProps> = ({
 item,
 isOpen,
 onClose,
 onActionSuccess,
 triggerElement,
}) => {
 const drawerRef = useRef<HTMLDivElement>(null);
 const closeButtonRef = useRef<HTMLButtonElement>(null);

 // Active Action Modal State
 const [activeModal, setActiveModal] = useState<ModalType>(null);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [actionError, setActionError] = useState<string | null>(null);
 const [actionSuccess, setActionSuccess] = useState<string | null>(null);
 const [conflictError, setConflictError] = useState<string | null>(null);

 // Form Fields for Modals
 const [requestNotes, setRequestNotes] = useState('');
 const [deadlineDays, setDeadlineDays] = useState<number>(3);
 const [verificationNotes, setVerificationNotes] = useState('');
 const [decisionText, setDecisionText] = useState('');
 const [directiveText, setDirectiveText] = useState('');
 const [unblockChecked, setUnblockChecked] = useState(true);
 const [overrideReason, setOverrideReason] = useState('');
 const [clearBlockerChecked, setClearBlockerChecked] = useState(true);
 const [extensionDate, setExtensionDate] = useState('');
 const [extensionJustification, setExtensionJustification] = useState('');
 const [responsibleName, setResponsibleName] = useState('');
 const [accountableName, setAccountableName] = useState('');
 const [raciRationale, setRaciRationale] = useState('');
 const [escalationDecision, setEscalationDecision] = useState<'APPROVED' | 'REJECTED' | 'DIRECTIVE_ISSUED'>('DIRECTIVE_ISSUED');
 const [escalationNotes, setEscalationNotes] = useState('');

 // Synchronize initial modal fields when item opens
 useEffect(() => {
  if (item) {
   setResponsibleName(item.owner_name || '');
   setAccountableName(item.accountable_name || '');
   const defaultExt = new Date();
   defaultExt.setDate(defaultExt.getDate() + 7);
   setExtensionDate(defaultExt.toISOString().split('T')[0]);
   setActionError(null);
   setActionSuccess(null);
   setConflictError(null);
  }
 }, [item]);

 // Accessibility: Focus Trap & Escape Key
 useEffect(() => {
  if (!isOpen) return;

  // Focus close button initially
  const timer = setTimeout(() => {
   closeButtonRef.current?.focus();
  }, 100);

  const handleKeyDown = (e: KeyboardEvent) => {
   if (e.key === 'Escape') {
    if (activeModal) {
     setActiveModal(null);
     setActionError(null);
    } else {
     onClose();
    }
   }

   if (e.key === 'Tab' && drawerRef.current) {
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
     'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
     e.preventDefault();
     last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
     e.preventDefault();
     first.focus();
    }
   }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => {
   clearTimeout(timer);
   window.removeEventListener('keydown', handleKeyDown);
   // Restore focus
   if (triggerElement) {
    triggerElement.focus();
   }
  };
 }, [isOpen, activeModal, onClose, triggerElement]);

 if (!isOpen || !item) return null;

 const getCategoryConfig = (cat: MDAttentionCategory) => {
  switch (cat) {
   case 'CRITICAL_OVERDUE':
    return {
     label: 'Critical Overdue',
     badge: 'bg-red-500/10 text-red-700 border-red-500/20',
     icon: Clock,
    };
   case 'HIGH_IMPACT_BLOCKER':
    return {
     label: 'High-Impact Blocker',
     badge: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
     icon: ShieldAlert,
    };
   case 'DECISION_AWAITING_AUTHORITY':
    return {
     label: 'Decision Authority',
     badge: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
     icon: ShieldCheck,
    };
   case 'EVIDENCE_AWAITING_VERIFICATION':
    return {
     label: 'Evidence Verification',
     badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
     icon: FileCheck,
    };
   case 'AT_RISK_MILESTONE':
    return {
     label: 'At-Risk Milestone',
     badge: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
     icon: Zap,
    };
   case 'REPEATED_DEFERRAL':
    return {
     label: 'Repeated Deferral',
     badge: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
     icon: AlertTriangle,
    };
  }
 };

 const config = getCategoryConfig(item.category);
 const Icon = config.icon;

 // Handle Safe Action Mutations
 const handleExecuteAction = async () => {
  setIsSubmitting(true);
  setActionError(null);
  setConflictError(null);

  try {
   let res: CockpitActionResponse;

   if (activeModal === 'REQUEST_EVIDENCE') {
    if (!requestNotes.trim()) throw new Error('Evidence request notes are required.');
    res = await apiClient.mdAttention.requestEvidence({
     work_item_id: item.entity_id,
     request_notes: requestNotes.trim(),
     deadline_extension_days: deadlineDays > 0 ? deadlineDays : undefined,
     expected_version: item.version,
    });
   } else if (activeModal === 'VERIFY_EVIDENCE_ACCEPT') {
    if (!verificationNotes.trim()) throw new Error('Verification notes confirming Definition of Done audit are required.');
    res = await apiClient.mdAttention.verifyEvidence({
     work_item_id: item.entity_id,
     verification_result: 'VERIFIED_CLOSED',
     verification_notes: verificationNotes.trim(),
     expected_version: item.version,
    });
   } else if (activeModal === 'VERIFY_EVIDENCE_REJECT') {
    if (!verificationNotes.trim()) throw new Error('Rejection rationale explaining missing DoD criteria is required.');
    res = await apiClient.mdAttention.verifyEvidence({
     work_item_id: item.entity_id,
     verification_result: 'REJECTED_REOPEN',
     verification_notes: verificationNotes.trim(),
     expected_version: item.version,
    });
   } else if (activeModal === 'RECORD_DECISION') {
    if (!decisionText.trim()) throw new Error('Formal decision text is required.');
    if (!directiveText.trim()) throw new Error('Executive directive for team execution is required.');
    res = await apiClient.mdAttention.recordDecision({
     work_item_id: item.entity_id,
     decision_text: decisionText.trim(),
     directive: directiveText.trim(),
     unblock: unblockChecked,
     expected_version: item.version,
    });
   } else if (activeModal === 'EXECUTIVE_OVERRIDE') {
    if (!overrideReason.trim()) throw new Error('Override rationale is mandatory for audit compliance.');
    res = await apiClient.mdAttention.executiveOverride({
     work_item_id: item.entity_id,
     override_reason: overrideReason.trim(),
     clear_blocker: clearBlockerChecked,
     expected_version: item.version,
    });
   } else if (activeModal === 'GRANT_EXTENSION') {
    if (!extensionDate) throw new Error('New due date is required.');
    if (!extensionJustification.trim()) throw new Error('Extension justification rationale is mandatory.');
    res = await apiClient.mdAttention.grantExtension({
     work_item_id: item.entity_id,
     new_due_at: new Date(extensionDate).toISOString(),
     justification: extensionJustification.trim(),
     expected_version: item.version,
    });
   } else if (activeModal === 'REASSIGN_RACI') {
    if (!responsibleName.trim() && !accountableName.trim()) throw new Error('At least one owner name is required.');
    if (!raciRationale.trim()) throw new Error('Ownership reassignment rationale is mandatory.');
    res = await apiClient.mdAttention.reassignRaci({
     work_item_id: item.entity_id,
     responsible_name: responsibleName.trim(),
     accountable_name: accountableName.trim(),
     rationale: raciRationale.trim(),
     expected_version: item.version,
    });
   } else if (activeModal === 'RESOLVE_ESCALATION') {
    if (!escalationNotes.trim()) throw new Error('Escalation directive notes are required.');
    res = await apiClient.mdAttention.resolveEscalation({
     escalation_id: item.escalation_id || item.entity_id,
     decision: escalationDecision,
     directive_notes: escalationNotes.trim(),
     unblock_work_item: true,
     expected_version: item.version,
    });
   } else {
    throw new Error('Unrecognized action type.');
   }

   setActionSuccess(res.message);
   setActiveModal(null);
   onActionSuccess?.();
  } catch (err: any) {
   if (err?.status === 409 || err?.message?.includes('concurrency') || err?.message?.includes('conflict')) {
    setConflictError('Optimistic Concurrency Conflict: This item was updated concurrently by another user session. Please refresh to load the latest state.');
   } else {
    setActionError(err?.message || 'Failed to execute executive action.');
   }
  } finally {
   setIsSubmitting(false);
  }
 };

 const isActionAllowed = (actionKey: string) => {
  if (!item.allowed_actions) return true;
  return item.allowed_actions.includes(actionKey);
 };

 const getActionDisabledReason = (actionKey: string) => {
  if (item.disabled_actions && item.disabled_actions[actionKey]) {
   return item.disabled_actions[actionKey];
  }
  return 'Action not permitted for the current entity state.';
 };

 return (
  <div
   className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity animate-in fade-in duration-200"
   role="dialog"
   aria-modal="true"
   aria-labelledby="md-drawer-title"
  >
   <div
    ref={drawerRef}
    className="w-full max-w-2xl bg-white h-[100dvh] shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden"
   >
    {/* Top Header Bar */}
    <div className="px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
     <div className="flex items-center gap-2 flex-wrap">
      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider border flex items-center gap-1.5 ${config.badge}`}>
       <Icon className="w-3.5 h-3.5" />
       {config.label}
      </span>
      <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-200/70 text-slate-800 uppercase">
       {item.priority} Priority
      </span>
      {item.is_synthetic && (
       <span className="px-2 py-0.5 text-[10px] font-black rounded bg-amber-500/10 text-amber-800 border border-amber-500/20 uppercase tracking-wider">
        [Demo / Fallback Data]
       </span>
      )}
      <span className="text-xs text-slate-500 font-mono">
       v{item.version || 1}
      </span>
     </div>

     <button
      ref={closeButtonRef}
      onClick={onClose}
      aria-label="Close executive drawer"
      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 :text-slate-200 hover:bg-slate-200/50 :bg-slate-800 transition-colors cursor-pointer"
     >
      <X className="w-5 h-5" />
     </button>
    </div>

    {/* Action Success / Conflict Notification Banners */}
    {actionSuccess && (
     <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
      <span>{actionSuccess}</span>
     </div>
    )}

    {conflictError && (
     <div className="p-3 bg-red-50 border-b border-red-200 text-red-800 text-xs font-bold flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
       <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
       <span>{conflictError}</span>
      </div>
      <button
       onClick={() => onActionSuccess?.()}
       className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
      >
       Refresh
      </button>
     </div>
    )}

    {/* Scrollable Body: Read-First Details & Evidence */}
    <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 sm:space-y-6">
     {/* Title & Description */}
     <div className="space-y-2">
      <h1 id="md-drawer-title" className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
       {item.title}
      </h1>
      {item.description && (
       <p className="text-xs text-slate-600 leading-relaxed">
        {item.description}
       </p>
      )}
     </div>

     {/* Why Included Rule Box */}
     <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
       <Info className="w-3.5 h-3.5 text-indigo-600 " />
       <span>Governance Inclusion Rule & Provenance</span>
      </div>
      <p className="text-xs text-slate-800 font-medium">
       {item.why_included}
      </p>
      <div className="text-[10px] font-mono text-slate-500 pt-1 flex flex-wrap items-center gap-x-2 gap-y-1 break-all">
       <span>Source: {item.source}</span>
       <span>•</span>
       <span>Entity: {item.audit_provenance}</span>
      </div>
     </div>

     {/* RACI Ownership Matrix */}
     <div className="space-y-2">
      <div className="flex items-center justify-between">
       <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 ">
        RACI Ownership Matrix
       </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
       <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
        <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
         Responsible (R) — Execution
        </div>
        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
         <User className="w-3.5 h-3.5 text-blue-600" />
         {item.owner_name}
        </div>
        <div className="text-[10px] text-slate-500">Primary operational lead for deliverable execution</div>
       </div>

       <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
        <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
         Accountable (A) — Final Sign-off
        </div>
        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
         <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
         {item.accountable_name}
        </div>
        <div className="text-[10px] text-slate-500">Executive leader holding organizational accountability</div>
       </div>
      </div>
     </div>

     {/* Timeline, Due Date & Deferral History */}
     <div className="space-y-2">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 ">
       Timeline & Deferral History
      </h3>
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div>
         <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Due Date</span>
         <span className="font-black text-slate-900 ">
          {item.due_at ? new Date(item.due_at).toLocaleDateString() : 'No Deadline Set'}
         </span>
        </div>
        <div>
         <span className="text-[10px] text-slate-400 font-bold uppercase block">Original Due Date</span>
         <span className="font-medium text-slate-600 ">
          {item.original_due_at ? new Date(item.original_due_at).toLocaleDateString() : (item.due_at ? new Date(item.due_at).toLocaleDateString() : '—')}
         </span>
        </div>
        <div>
         <span className="text-[10px] text-slate-400 font-bold uppercase block">Deferral Count</span>
         <span className={`font-black ${item.deferral_count && item.deferral_count > 1 ? 'text-red-600' : 'text-slate-900 '}`}>
          {item.deferral_count || 0} Extension(s)
         </span>
        </div>
       </div>

       {item.deferral_history && item.deferral_history.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
         <span className="text-[10px] font-bold uppercase text-slate-500 block">Deferral Audit Trail</span>
         <div className="space-y-1.5">
          {item.deferral_history.map((def, idx) => (
           <div key={idx} className="p-2 rounded bg-slate-50 text-[11px] space-y-0.5 border border-slate-100 ">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
             <span>{def.author_name}</span>
             <span>{def.created_at ? new Date(def.created_at).toLocaleDateString() : ''}</span>
            </div>
            <p className="text-slate-700 font-medium">{def.note}</p>
           </div>
          ))}
         </div>
        </div>
       )}
      </div>
     </div>

     {/* Blocker Context (If Blocked or High Impact Blocker) */}
     {(item.category === 'HIGH_IMPACT_BLOCKER' || item.status === 'blocked' || item.status === 'stuck') && (
      <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
       <div className="flex items-center gap-1.5 text-xs font-black text-rose-800 uppercase tracking-wider">
        <ShieldAlert className="w-4 h-4 text-rose-600" />
        <span>Active Blocker & Stuck-Need Telemetry</span>
       </div>
       <p className="text-xs text-rose-900 font-medium">
        {item.impact}
       </p>
       {item.blocker_details && (
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-rose-800 ">
         <div><strong>Reason:</strong> {item.blocker_details.reason}</div>
         <div><strong>Urgency:</strong> {item.blocker_details.urgency || 'HIGH'}</div>
         {item.blocker_details.helpedByPersonOrDept && (
          <div className="col-span-2"><strong>Assistance Required From:</strong> {item.blocker_details.helpedByPersonOrDept}</div>
         )}
        </div>
       )}
      </div>
     )}

     {/* Requested Decision & Executive Directive */}
     <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 uppercase tracking-wider">
       <Sparkles className="w-4 h-4 text-amber-600" />
       <span>Requested Executive Action / Directive</span>
      </div>
      <p className="text-xs text-amber-950 font-medium">
       {item.requested_action}
      </p>
      {item.requested_decision && (
       <p className="text-[11px] text-amber-800 ">
        <strong>Specific Decision:</strong> {item.requested_decision}
       </p>
      )}
     </div>

     {/* Evidence List & Definition of Done Inspection */}
     <div className="space-y-2">
      <div className="flex items-center justify-between">
       <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
        <FileCheck className="w-4 h-4 text-emerald-600" />
        <span>Evidence & Definition of Done Review</span>
       </h3>
       <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 ">
        {item.evidence_state}
       </span>
      </div>

      <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
       {item.evidence_list && item.evidence_list.length > 0 ? (
        <div className="space-y-2">
         {item.evidence_list.map((ev, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
           <div className="flex items-center justify-between font-bold text-slate-900 ">
            <span>{ev.name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 ">
             {ev.status || 'SUBMITTED'}
            </span>
           </div>
           {ev.notes && <p className="text-[11px] text-slate-600 ">{ev.notes}</p>}
           <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
            <span>By: {ev.submitted_by}</span>
            <span>{ev.submitted_at ? new Date(ev.submitted_at).toLocaleDateString() : ''}</span>
           </div>
          </div>
         ))}
        </div>
       ) : (
        <div className="text-center py-4 text-xs text-slate-500 ">
         No physical DoD checklist or digital proof has been submitted yet.
        </div>
       )}
      </div>
     </div>

     {/* Activity Provenance & Chronological Log */}
     {item.activity_history && item.activity_history.length > 0 && (
      <div className="space-y-2">
       <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
        <History className="w-4 h-4 text-slate-500" />
        <span>Complete Activity & Audit Log</span>
       </h3>
       <div className="space-y-1.5">
        {item.activity_history.map((act) => (
         <div key={act.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-0.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
           <span className="font-bold text-slate-700 ">{act.author_name}</span>
           <span>{act.created_at ? new Date(act.created_at).toLocaleString() : ''}</span>
          </div>
          <div className="text-[11px] text-slate-800 ">
           <span className="font-mono text-[10px] text-indigo-600 uppercase font-bold mr-1.5">
            [{act.activity_type}]
           </span>
           {act.note || 'Status updated'}
          </div>
         </div>
        ))}
       </div>
      </div>
     )}
    </div>

    {/* Bottom Action Command Bar (Gated Human-Authority Actions) */}
    <div className="max-h-[44dvh] overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5 border-t border-slate-200 bg-slate-50/95 space-y-3">
     <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 ">
      Executive Cockpit Decisions & Authority Controls
     </div>

     {/* Action Buttons Grid */}
     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {/* 1. Request Evidence */}
      <button
       onClick={() => {
        setActiveModal('REQUEST_EVIDENCE');
        setActionError(null);
       }}
       disabled={!isActionAllowed('REQUEST_EVIDENCE')}
       title={!isActionAllowed('REQUEST_EVIDENCE') ? getActionDisabledReason('REQUEST_EVIDENCE') : 'Request concrete DoD evidence'}
       className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
        isActionAllowed('REQUEST_EVIDENCE')
         ? 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800 cursor-pointer shadow-2xs'
         : 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-transparent'
       }`}
      >
       <Send className="w-3.5 h-3.5 text-blue-600" />
       <span>Request Evidence</span>
      </button>

      {/* 2. Accept Evidence / Approve Closure */}
      <button
       onClick={() => {
        setActiveModal('VERIFY_EVIDENCE_ACCEPT');
        setActionError(null);
       }}
       disabled={!isActionAllowed('VERIFY_EVIDENCE')}
       title={!isActionAllowed('VERIFY_EVIDENCE') ? getActionDisabledReason('VERIFY_EVIDENCE') : 'Approve Definition of Done and mark VERIFIED / CLOSED'}
       className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
        isActionAllowed('VERIFY_EVIDENCE')
         ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent cursor-pointer shadow-2xs'
         : 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-transparent'
       }`}
      >
       <Check className="w-3.5 h-3.5" />
       <span>Approve Closure</span>
      </button>

      {/* 3. Reject Evidence / Reopen */}
      <button
       onClick={() => {
        setActiveModal('VERIFY_EVIDENCE_REJECT');
        setActionError(null);
       }}
       disabled={!isActionAllowed('VERIFY_EVIDENCE')}
       title={!isActionAllowed('VERIFY_EVIDENCE') ? getActionDisabledReason('VERIFY_EVIDENCE') : 'Reject evidence and reopen task to in_progress'}
       className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
        isActionAllowed('VERIFY_EVIDENCE')
         ? 'bg-white border-red-200 hover:bg-red-50 :bg-red-950/30 text-red-700 cursor-pointer shadow-2xs'
         : 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-transparent'
       }`}
      >
       <XCircle className="w-3.5 h-3.5 text-red-600" />
       <span>Reject Evidence</span>
      </button>

      {/* 4. Record Decision */}
      <button
       onClick={() => {
        setActiveModal('RECORD_DECISION');
        setActionError(null);
       }}
       disabled={!isActionAllowed('RECORD_DECISION')}
       title={!isActionAllowed('RECORD_DECISION') ? getActionDisabledReason('RECORD_DECISION') : 'Record authoritative MD executive decision'}
       className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
        isActionAllowed('RECORD_DECISION')
         ? 'bg-white border-purple-200 hover:bg-purple-50 :bg-purple-950/30 text-purple-700 cursor-pointer shadow-2xs'
         : 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-transparent'
       }`}
      >
       <Sparkles className="w-3.5 h-3.5 text-purple-600" />
       <span>Record Decision</span>
      </button>

      {/* 5. Executive Blocker Override */}
      <button
       onClick={() => {
        setActiveModal('EXECUTIVE_OVERRIDE');
        setActionError(null);
       }}
       disabled={!isActionAllowed('EXECUTIVE_OVERRIDE')}
       title={!isActionAllowed('EXECUTIVE_OVERRIDE') ? getActionDisabledReason('EXECUTIVE_OVERRIDE') : 'Issue executive blocker override'}
       className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
        isActionAllowed('EXECUTIVE_OVERRIDE')
         ? 'bg-white border-rose-200 hover:bg-rose-50 :bg-rose-950/30 text-rose-700 cursor-pointer shadow-2xs'
         : 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-transparent'
       }`}
      >
       <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
       <span>Blocker Override</span>
      </button>

      {/* 6. Grant Extension */}
      <button
       onClick={() => {
        setActiveModal('GRANT_EXTENSION');
        setActionError(null);
       }}
       disabled={!isActionAllowed('GRANT_EXTENSION')}
       title={!isActionAllowed('GRANT_EXTENSION') ? getActionDisabledReason('GRANT_EXTENSION') : 'Authorize deadline extension'}
       className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
        isActionAllowed('GRANT_EXTENSION')
         ? 'bg-white border-orange-200 hover:bg-orange-50 :bg-orange-950/30 text-orange-700 cursor-pointer shadow-2xs'
         : 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-transparent'
       }`}
      >
       <Clock className="w-3.5 h-3.5 text-orange-600" />
       <span>Grant Extension</span>
      </button>

      {/* 7. Reassign RACI */}
      <button
       onClick={() => {
        setActiveModal('REASSIGN_RACI');
        setActionError(null);
       }}
       disabled={!isActionAllowed('REASSIGN_RACI')}
       title={!isActionAllowed('REASSIGN_RACI') ? getActionDisabledReason('REASSIGN_RACI') : 'Authoritatively reassign RACI owners'}
       className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all col-span-2 sm:col-span-3 ${
        isActionAllowed('REASSIGN_RACI')
         ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 :bg-slate-100 border-transparent cursor-pointer shadow-2xs'
         : 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-transparent'
       }`}
      >
       <Edit3 className="w-3.5 h-3.5" />
       <span>Reassign RACI Ownership</span>
      </button>
     </div>
    </div>

    {/* ------------------------------------------------------------- */}
    {/* ACTION CONFIRMATION MODALS (MANDATORY RATIONALE & CONCURRENCY) */}
    {/* ------------------------------------------------------------- */}
    {activeModal && (
     <div
      className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-action-title"
     >
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
       {/* Modal Header */}
       <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
         <ShieldCheck className="w-5 h-5 text-indigo-600" />
         <h3 id="modal-action-title" className="text-sm font-black uppercase tracking-wider text-slate-900 ">
          {activeModal === 'REQUEST_EVIDENCE' && 'Request Concrete DoD Evidence'}
          {activeModal === 'VERIFY_EVIDENCE_ACCEPT' && 'Approve & Formally Close Deliverable'}
          {activeModal === 'VERIFY_EVIDENCE_REJECT' && 'Reject Evidence & Reopen Deliverable'}
          {activeModal === 'RECORD_DECISION' && 'Record Formal MD Decision'}
          {activeModal === 'EXECUTIVE_OVERRIDE' && 'Authoritative Blocker Override'}
          {activeModal === 'GRANT_EXTENSION' && 'Authorize Executive Deadline Extension'}
          {activeModal === 'REASSIGN_RACI' && 'Reassign RACI Ownership'}
          {activeModal === 'RESOLVE_ESCALATION' && 'Resolve Escalation with Directive'}
         </h3>
        </div>
        <button
         onClick={() => {
          setActiveModal(null);
          setActionError(null);
         }}
         className="text-slate-400 hover:text-slate-700 :text-slate-200 cursor-pointer"
        >
         <X className="w-4 h-4" />
        </button>
       </div>

       {/* Error in modal */}
       {actionError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
         <AlertCircle className="w-4 h-4 shrink-0" />
         <span>{actionError}</span>
        </div>
       )}

       {/* Modal-Specific Input Forms */}
       {activeModal === 'REQUEST_EVIDENCE' && (
        <div className="space-y-3 text-xs">
         <p className="text-slate-600 ">
          Instruct the accountable lead ({item.owner_name}) to submit specific physical or digital artifacts.
         </p>
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           Evidence Requirement Notes <span className="text-red-500">*</span>
          </label>
          <textarea
           rows={3}
           value={requestNotes}
           onChange={e => setRequestNotes(e.target.value)}
           placeholder="e.g. Upload scanned physical NABH sterilization logbook with signatures before approval."
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           Grace Period for Submission (Days)
          </label>
          <input
           type="number"
           min={1}
           max={30}
           value={deadlineDays}
           onChange={e => setDeadlineDays(parseInt(e.target.value) || 3)}
           className="w-24 p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
        </div>
       )}

       {activeModal === 'VERIFY_EVIDENCE_ACCEPT' && (
        <div className="space-y-3 text-xs">
         <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 ">
          <strong>Authority Check:</strong> By verifying this deliverable, you confirm that physical or recorded evidence satisfies the organizational Definition of Done.
         </div>
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           Audit Verification Notes <span className="text-red-500">*</span>
          </label>
          <textarea
           rows={3}
           value={verificationNotes}
           onChange={e => setVerificationNotes(e.target.value)}
           placeholder="e.g. Verified OT sterilization logs against checklist. Met 100% compliance criteria."
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
        </div>
       )}

       {activeModal === 'VERIFY_EVIDENCE_REJECT' && (
        <div className="space-y-3 text-xs">
         <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 ">
          <strong>Reopen Item:</strong> Rejecting evidence returns the deliverable to <code>in_progress</code> (80%) status and requires the owner to rectify gaps.
         </div>
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           Rejection Rationale & Missing Criteria <span className="text-red-500">*</span>
          </label>
          <textarea
           rows={3}
           value={verificationNotes}
           onChange={e => setVerificationNotes(e.target.value)}
           placeholder="e.g. Sterilization batch record missing microbiologist signoff stamp. Resubmit with completed endorsements."
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
        </div>
       )}

       {activeModal === 'RECORD_DECISION' && (
        <div className="space-y-3 text-xs">
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           MD Executive Decision <span className="text-red-500">*</span>
          </label>
          <textarea
           rows={2}
           value={decisionText}
           onChange={e => setDecisionText(e.target.value)}
           placeholder="e.g. Approved emergency procurement of backup autoclave machine."
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           Execution Directive <span className="text-red-500">*</span>
          </label>
          <input
           type="text"
           value={directiveText}
           onChange={e => setDirectiveText(e.target.value)}
           placeholder="e.g. Operations to release PO within 24 hours."
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
         <div className="flex items-center gap-2 pt-1">
          <input
           type="checkbox"
           id="unblock-check"
           checked={unblockChecked}
           onChange={e => setUnblockChecked(e.target.checked)}
           className="rounded border-slate-300"
          />
          <label htmlFor="unblock-check" className="font-medium text-slate-700 cursor-pointer">
           Unblock deliverable and return status to in-progress
          </label>
         </div>
        </div>
       )}

       {activeModal === 'EXECUTIVE_OVERRIDE' && (
        <div className="space-y-3 text-xs">
         <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 ">
          <strong>Audit Warning:</strong> An executive override clears active blockers and logs an immutable audit event under your identity.
         </div>
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           Override Justification <span className="text-red-500">*</span>
          </label>
          <textarea
           rows={3}
           value={overrideReason}
           onChange={e => setOverrideReason(e.target.value)}
           placeholder="e.g. Authorized temporary manual signoff while vendor resolves PACS API integration."
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
         <div className="flex items-center gap-2">
          <input
           type="checkbox"
           id="clear-blocker-check"
           checked={clearBlockerChecked}
           onChange={e => setClearBlockerChecked(e.target.checked)}
           className="rounded border-slate-300"
          />
          <label htmlFor="clear-blocker-check" className="font-medium text-slate-700 cursor-pointer">
           Clear blocked status immediately
          </label>
         </div>
        </div>
       )}

       {activeModal === 'GRANT_EXTENSION' && (
        <div className="space-y-3 text-xs">
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           New Authorized Due Date <span className="text-red-500">*</span>
          </label>
          <input
           type="date"
           value={extensionDate}
           onChange={e => setExtensionDate(e.target.value)}
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           Extension Justification <span className="text-red-500">*</span>
          </label>
          <textarea
           rows={3}
           value={extensionJustification}
           onChange={e => setExtensionJustification(e.target.value)}
           placeholder="e.g. Granted 7-day extension due to OT maintenance schedule rescheduling."
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
        </div>
       )}

       {activeModal === 'REASSIGN_RACI' && (
        <div className="space-y-3 text-xs">
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           Responsible (R) — Operational Lead <span className="text-red-500">*</span>
          </label>
          <input
           type="text"
           value={responsibleName}
           onChange={e => setResponsibleName(e.target.value)}
           placeholder="e.g. Sister Sunita Rao"
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           Accountable (A) — Executive Owner <span className="text-red-500">*</span>
          </label>
          <input
           type="text"
           value={accountableName}
           onChange={e => setAccountableName(e.target.value)}
           placeholder="e.g. Dr. Mirant Dave (MD)"
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
         <div>
          <label className="font-bold text-slate-700 block mb-1">
           Reassignment Rationale <span className="text-red-500">*</span>
          </label>
          <textarea
           rows={2}
           value={raciRationale}
           onChange={e => setRaciRationale(e.target.value)}
           placeholder="e.g. Reassigned clinical coordinator role to senior nursing supervisor."
           className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 "
          />
         </div>
        </div>
       )}

       {/* Modal Action Buttons */}
       <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 ">
        <button
         type="button"
         onClick={() => {
          setActiveModal(null);
          setActionError(null);
         }}
         disabled={isSubmitting}
         className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 :bg-slate-800 text-slate-700 cursor-pointer"
        >
         Cancel
        </button>
        <button
         type="button"
         onClick={handleExecuteAction}
         disabled={isSubmitting}
         className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
         {isSubmitting ? (
          <>
           <RotateCcw className="w-3.5 h-3.5 animate-spin" />
           <span>Recording...</span>
          </>
         ) : (
          <span>Confirm & Authorize</span>
         )}
        </button>
       </div>
      </div>
     </div>
    )}
   </div>
  </div>
 );
};
