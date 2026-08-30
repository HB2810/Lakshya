'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  User,
  Calendar,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ListTodo,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { apiClient } from '../../lib/api/client';
import { WorkItemPriority, WorkItemRACI } from '../../types/workItem';
import { STAVYA_STAFF_DATABASE, HospitalStaffMember } from '../../lib/data/stavyaHospitalOrgData';

interface LeaderTaskDelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  defaultAssigneeId?: string;
  allowedStaffList?: HospitalStaffMember[];
}

export const LeaderTaskDelegationModal: React.FC<LeaderTaskDelegationModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  defaultAssigneeId,
  allowedStaffList,
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId || '');
  const [priority, setPriority] = useState<WorkItemPriority>('high');
  const [dueDate, setDueDate] = useState('Today');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [evidenceRequired, setEvidenceRequired] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Determine available staff based on passed list or full DB
  const staffPool = allowedStaffList && allowedStaffList.length > 0
    ? allowedStaffList
    : Object.values(STAVYA_STAFF_DATABASE);

  const selectedStaff = staffPool.find(s => s.id === assigneeId || s.code === assigneeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }
    if (!assigneeId) {
      setError('Please select an employee to assign this task to.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const targetStaff = selectedStaff || staffPool[0];
      const targetStaffName = targetStaff ? targetStaff.name : 'Assigned Staff';
      const departmentName = targetStaff ? (targetStaff.unit || targetStaff.dept_master) : 'Hospital Operations';

      const raci: WorkItemRACI = {
        responsible_id: targetStaff?.id || assigneeId,
        responsible_name: targetStaffName,
        accountable_id: user?.id || 'usr-leader-1',
        accountable_name: user?.name || 'Managing Director / Incharge',
        consulted_names: [],
        informed_names: [],
      };

      const edc = {
        expected_outcome: title.trim(),
        definition_of_done: definitionOfDone.trim() || 'Work executed according to SOP and verified by Incharge.',
        evidence_required: evidenceRequired.trim() || 'Verification sign-off & completion audit log',
        completion_criteria: [
          'Work action completed per clinical/ops standard',
          'Documentary or operational evidence attached',
          'Incharge audit sign-off confirmed'
        ]
      };

      let dueAtIso: string;
      const today = new Date();
      if (dueDate === 'Today') {
        dueAtIso = today.toISOString();
      } else if (dueDate === 'Tomorrow') {
        today.setDate(today.getDate() + 1);
        dueAtIso = today.toISOString();
      } else {
        today.setDate(today.getDate() + 7);
        dueAtIso = today.toISOString();
      }

      await apiClient.workItems.create({
        title: title.trim(),
        description: description.trim() || undefined,
        owner_id: targetStaff?.id || assigneeId,
        owner_name: targetStaffName,
        department_name: departmentName,
        priority,
        due_at: dueAtIso,
        source_type: 'LEADER_DELEGATION',
        source_title: `Delegated by ${user?.name || 'Leadership'} (${user?.roleTitle || user?.role || 'Incharge'})`,
        raci,
        edc,
      });

      onTaskCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to delegate task:', err);
      setError(err?.message || 'Failed to create and delegate task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-2xs">
                DELEGATION WORKBENCH
              </span>
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Team Assignment Engine
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1.5">
              Delegate Work Item to Team Member
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign task deliverables with automatic RACI structure, accountability, and Definition of Done.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Assignee Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Responsible Team Member (Executor) <span className="text-red-500">*</span>
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">-- Select Reporting Employee from Your Hierarchy --</option>
              {staffPool.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} — {staff.desig} ({staff.unit || staff.dept_master}) [Code: {staff.code}]
                </option>
              ))}
            </select>
            {selectedStaff && (
              <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs flex items-center justify-between text-blue-900">
                <span className="font-semibold">
                  Unit: <strong>{selectedStaff.unit || selectedStaff.dept_master}</strong>
                </span>
                <span className="text-[11px] text-blue-700">
                  Reports to: <strong>{selectedStaff.reports || user?.name || 'Incharge'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Work Item Title / Objective <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conduct daily OT-2 sterilization audit and calibrate autoclave sensors"
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Description & Priority / Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkItemPriority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent (Clinical/Safety Critical)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Target Due Date
              </label>
              <select
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              >
                <option value="Today">Due Today (End of Shift)</option>
                <option value="Tomorrow">Due Tomorrow</option>
                <option value="Next Week">Next Week (7 Days)</option>
              </select>
            </div>
          </div>

          {/* Task Scope & Instructions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Scope &amp; Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, procedural steps, or specific equipment IDs..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Definition of Done & Evidence Required */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Definition of Done (EDC)
              </label>
              <input
                type="text"
                value={definitionOfDone}
                onChange={(e) => setDefinitionOfDone(e.target.value)}
                placeholder="e.g. All 10 check items signed off with 0 errors"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Evidence Required for Verification
              </label>
              <input
                type="text"
                value={evidenceRequired}
                onChange={(e) => setEvidenceRequired(e.target.value)}
                placeholder="e.g. Upload signed register photo / log export"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* RACI Matrix Summary Banner */}
          <div className="p-3 bg-slate-100/80 rounded-2xl text-[11px] text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">RACI Governance:</span>
              <span><strong>R:</strong> {selectedStaff?.name || 'Selected Employee'}</span>
              <span>•</span>
              <span><strong>A:</strong> {user?.name || 'Incharge / Leader'}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              R != A Compliant
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !assigneeId}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active-press"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Delegating...' : 'Delegate Work Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
