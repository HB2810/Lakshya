'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Mail,
  Users2,
  Mic,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Calendar,
  AlertCircle,
  Plus,
  Send,
  FileText,
  Layers,
  Flame,
  Check,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { workItemStore } from '../../lib/mocks/workItemMock';
import { STAVYA_STAFF_DATABASE } from '../../lib/data/stavyaHospitalOrgData';
import { WorkItemPriority } from '../../types/workItem';

interface StagedItem {
  id: string;
  sourceType: 'WHATSAPP' | 'EMAIL' | 'ONE_ON_ONE' | 'MD_DIRECTIVE';
  rawSnippet: string;
  sender: string;
  senderRole?: string;
  parsedTitle: string;
  parsedDescription: string;
  suggestedOwnerId: string;
  suggestedOwnerName: string;
  department: string;
  priority: WorkItemPriority;
  targetDue: string;
  evidenceRequired: string;
  confidenceScore: number;
}

const INITIAL_STAGED_ITEMS: StagedItem[] = [
  {
    id: 'stg-001',
    sourceType: 'WHATSAPP',
    rawSnippet: 'Dr. Akruti in Quality Group: "@Brijesh please ensure the OT 3 air particle count report from biomedical is attached to the PSQ audit file before 4 PM tomorrow."',
    sender: 'Dr. Akruti Mirant Dave',
    senderRole: 'Director of Quality & Patient Safety',
    parsedTitle: 'OT 3 Air Particle Count Report Attachment & PSQ Audit Filing',
    parsedDescription: 'Procure biomedical air particle count validation report for OT 3 and attach to NABH PSQ compliance register.',
    suggestedOwnerId: 'e026',
    suggestedOwnerName: 'Brijesh Hasmukhkumar Bhatt',
    department: 'Nursing Services & Quality',
    priority: 'urgent',
    targetDue: '2026-08-30T16:00:00.000Z',
    evidenceRequired: 'Biomedical engineering particle count report PDF + physical register log',
    confidenceScore: 96,
  },
  {
    id: 'stg-002',
    sourceType: 'EMAIL',
    rawSnippet: 'From: hr@stavyaspine.com\nSubject: BLS/ACLS Recertification for Spine Night Shift Nursing\n"All 14 night-shift nurses in 3rd & 4th floor IPD need mandatory BLS refresher by Sept 5."',
    sender: 'Payal Manan Mehta',
    senderRole: 'HR Head',
    parsedTitle: 'IPD Night Shift Nursing BLS / ACLS Recertification Batch 2',
    parsedDescription: 'Coordinate with Code Blue committee to schedule hands-on BLS simulator assessment for 14 night-shift nurses.',
    suggestedOwnerId: 'e131',
    suggestedOwnerName: 'Manilal Mangilal Hadat',
    department: 'Human Resource & Nursing',
    priority: 'high',
    targetDue: '2026-09-05T18:00:00.000Z',
    evidenceRequired: 'Signed AHA/IRC BLS training certificates and attendance roster',
    confidenceScore: 92,
  },
  {
    id: 'stg-003',
    sourceType: 'ONE_ON_ONE',
    rawSnippet: '1-on-1 MD & Head Anaesthesia (Dr. Kashyap Shah): Discussed high-risk airway pre-assessment SOP for pediatric deformity corrections.',
    sender: 'Dr. Mirant Bharat Dave (MD)',
    senderRole: 'Managing Director',
    parsedTitle: 'Pediatric Spine Deformity Difficult Airway Pre-Op Assessment SOP',
    parsedDescription: 'Formalize structured pre-op pediatric airway assessment checklist and fiberoptic cart readiness sign-off.',
    suggestedOwnerId: 'e062',
    suggestedOwnerName: 'Dr. Kashyap Rameshchandra Shah',
    department: 'Anesthesia',
    priority: 'high',
    targetDue: '2026-09-03T17:00:00.000Z',
    evidenceRequired: 'Approved SOP document signed by HOD Anaesthesia and MD Office',
    confidenceScore: 94,
  },
];

export function OmnichannelIntakeHub({ onTaskCreated }: { onTaskCreated?: () => void }) {
  const [activeChannel, setActiveChannel] = useState<'WHATSAPP' | 'EMAIL' | 'ONE_ON_ONE' | 'MD_DIRECTIVE'>('WHATSAPP');
  const [stagedList, setStagedList] = useState<StagedItem[]>(INITIAL_STAGED_ITEMS);
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('e026');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const staffList = Object.values(STAVYA_STAFF_DATABASE);

  const handleSimulateParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setTimeout(() => {
      const staff = staffList.find(s => s.id === selectedStaffId) || staffList[0];
      const newStaged: StagedItem = {
        id: `stg-${Date.now()}`,
        sourceType: activeChannel,
        rawSnippet: inputText.trim(),
        sender: senderName.trim() || 'MD / Clinical Lead',
        senderRole: 'Hospital Leadership',
        parsedTitle: inputText.trim().length > 60 ? `${inputText.trim().substring(0, 60)}...` : inputText.trim(),
        parsedDescription: `Extracted from ${activeChannel} stream: "${inputText.trim()}"`,
        suggestedOwnerId: staff.id,
        suggestedOwnerName: staff.name,
        department: staff.unit,
        priority: 'high',
        targetDue: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        evidenceRequired: 'Execution confirmation report and register update',
        confidenceScore: 95,
      };

      setStagedList([newStaged, ...stagedList]);
      setInputText('');
      setSenderName('');
      setIsProcessing(false);
      setSuccessToast(`Successfully parsed and staged new action item from ${activeChannel}!`);
      setTimeout(() => setSuccessToast(null), 3500);
    }, 600);
  };

  const handleApproveAndDeploy = (item: StagedItem) => {
    workItemStore.createWorkItem({
      title: item.parsedTitle,
      description: item.parsedDescription,
      priority: item.priority,
      status: 'in_progress',
      owner_id: item.suggestedOwnerId,
      owner_name: item.suggestedOwnerName,
      due_at: item.targetDue,
      source_type: item.sourceType,
      source_title: `Omnichannel Ingestion (${item.sourceType}): ${item.sender}`,
      edc: {
        expected_outcome: item.parsedDescription,
        definition_of_done: 'Action completed, deliverable verified, and evidence attached.',
        evidence_required: item.evidenceRequired,
      },
    }, item.department);

    setStagedList(stagedList.filter(s => s.id !== item.id));
    setSuccessToast(`Deployed "${item.parsedTitle}" to active Hospital WorkItems!`);
    setTimeout(() => setSuccessToast(null), 3500);

    if (onTaskCreated) {
      onTaskCreated();
    }
  };

  const handleDismiss = (id: string) => {
    setStagedList(stagedList.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Omnichannel Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveChannel('WHATSAPP')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeChannel === 'WHATSAPP'
              ? 'bg-blue-50/80 border-blue-500 shadow-xs text-blue-900 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-slate-50/60 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              WhatsApp Bot
            </span>
          </div>
          <p className="font-bold text-slate-900 text-sm">WhatsApp / Chat</p>
          <p className="text-xs text-slate-500 mt-1">Direct bot &amp; group mentions</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannel('EMAIL')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeChannel === 'EMAIL'
              ? 'bg-blue-50/80 border-blue-500 shadow-xs text-blue-900 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-slate-50/60 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              Email Parser
            </span>
          </div>
          <p className="font-bold text-slate-900 text-sm">Hospital Emails</p>
          <p className="text-xs text-slate-500 mt-1">tasks@stavya.org ingestion</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannel('ONE_ON_ONE')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeChannel === 'ONE_ON_ONE'
              ? 'bg-blue-50/80 border-blue-500 shadow-xs text-blue-900 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-slate-50/60 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Users2 className="w-5 h-5 text-blue-600" />
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              1-on-1 Logs
            </span>
          </div>
          <p className="font-bold text-slate-900 text-sm">1-to-1 Conversations</p>
          <p className="text-xs text-slate-500 mt-1">Bilateral standup notes</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannel('MD_DIRECTIVE')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeChannel === 'MD_DIRECTIVE'
              ? 'bg-blue-50/80 border-blue-500 shadow-xs text-blue-900 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-slate-50/60 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              Executive
            </span>
          </div>
          <p className="font-bold text-slate-900 text-sm">MD Directives</p>
          <p className="text-xs text-slate-500 mt-1">Priority voice &amp; text orders</p>
        </button>
      </div>

      {/* Live Ingestion Simulator & Dispatcher Form */}
      <Card className="p-5 border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Intelligent Intake Dispatcher ({activeChannel})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Natural Language Action &amp; Owner Extraction</span>
        </div>

        <form onSubmit={handleSimulateParse} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Source Sender / Initiator
              </label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder={
                  activeChannel === 'WHATSAPP'
                    ? 'e.g. Dr. Akruti Dave (WhatsApp Group)'
                    : activeChannel === 'EMAIL'
                    ? 'e.g. billing@stavyaspine.com'
                    : activeChannel === 'ONE_ON_ONE'
                    ? 'e.g. Dr. Mirant Dave + Brijesh Bhatt'
                    : 'Dr. Mirant Bharat Dave (Managing Director)'
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Suggested Assignee / Owner (Mapped from 213 Staff)
              </label>
              <select
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              >
                {staffList.slice(0, 40).map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} — {staff.desig} ({staff.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Raw Communication Text / Audio Transcript
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Paste chat message, email body, voice memo transcript, or standup action note here..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              AI model extracts deliverables, due dates, priority, and required evidence automatically.
            </span>

            <Button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              {isProcessing ? (
                <>
                  <Clock className="w-4 h-4 mr-1.5 animate-spin" />
                  Extracting Intent...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Parse &amp; Stage for Review
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Staged Actions Review Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Staged Omnichannel Review Queue ({stagedList.length})
            </h3>
            <p className="text-xs text-slate-500">
              Extracted action items awaiting executive approval to convert into active LAKSHYA commitments.
            </p>
          </div>
        </div>

        {stagedList.length === 0 ? (
          <Card className="p-8 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto" />
            <p className="font-bold text-slate-900 text-sm">Review Queue Empty</p>
            <p className="text-xs text-slate-500">All incoming messages have been approved and deployed.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {stagedList.map(item => (
              <Card
                key={item.id}
                className="p-5 border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs rounded-2xl"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.sourceType === 'WHATSAPP'
                            ? 'success'
                            : item.sourceType === 'EMAIL'
                            ? 'primary'
                            : item.sourceType === 'MD_DIRECTIVE'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {item.sourceType}
                      </Badge>
                      <Badge
                        variant={
                          item.priority === 'urgent'
                            ? 'danger'
                            : item.priority === 'high'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {item.priority.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        From: <strong className="text-slate-800">{item.sender}</strong>
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                        {item.confidenceScore}% Extraction Match
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base">{item.parsedTitle}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.parsedDescription}</p>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                      <p className="text-[11px] text-slate-500 font-mono italic">{`"${item.rawSnippet}"`}</p>
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-slate-600">
                        <span>Assignee: <strong className="text-blue-700 font-bold">{item.suggestedOwnerName}</strong> ({item.department})</span>
                        <span>Due: <strong className="text-slate-900">{item.targetDue.substring(0, 10)}</strong></span>
                      </div>
                      {item.evidenceRequired && (
                        <div className="text-[11px] text-blue-700 pt-1 border-t border-slate-200/80">
                          <strong>Deliverable EDC:</strong> {item.evidenceRequired}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-end gap-2 shrink-0">
                    <Button
                      onClick={() => handleApproveAndDeploy(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve &amp; Deploy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(item.id)}
                      className="text-xs text-slate-500 hover:text-slate-800 border-slate-200 hover:bg-slate-50"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
