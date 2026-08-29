'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Eye,
  Info,
  Search,
  Shield,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthContext';
import { evaluateRaciGovernance } from '../../../lib/raci/governance';
import { User } from '../../../types/auth';
import { WorkItem, WorkItemRACI } from '../../../types/workItem';

interface RaciSectionProps {
  workItem: WorkItem;
  onUpdate: () => void;
}

type MultiRole = 'consulted' | 'informed';

function initialRaci(workItem: WorkItem): WorkItemRACI {
  return {
    accountable_id: workItem.raci?.accountable_id || '',
    accountable_name: workItem.raci?.accountable_name || '',
    responsible_id: workItem.raci?.responsible_id || workItem.owner_id || '',
    responsible_name: workItem.raci?.responsible_name || workItem.owner_name || '',
    consulted_ids: workItem.raci?.consulted_ids || [],
    consulted_names: workItem.raci?.consulted_names || [],
    informed_ids: workItem.raci?.informed_ids || [],
    informed_names: workItem.raci?.informed_names || [],
    consultation_expectation: workItem.raci?.consultation_expectation || '',
    information_cadence: workItem.raci?.information_cadence || '',
    updated_at: workItem.raci?.updated_at || null,
    updated_by_name: workItem.raci?.updated_by_name || null,
  };
}

export const RaciSection: React.FC<RaciSectionProps> = ({ workItem, onUpdate }) => {
  const { user, can } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [raci, setRaci] = useState<WorkItemRACI>(() => initialRaci(workItem));
  const [staffList, setStaffList] = useState<User[]>([]);
  const [searchConsulted, setSearchConsulted] = useState('');
  const [searchInformed, setSearchInformed] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRaci(initialRaci(workItem));
  }, [workItem]);

  useEffect(() => {
    let active = true;
    apiClient.organization.getUsers().then((users) => {
      if (active) setStaffList(users as User[]);
    }).catch((err) => {
      console.warn('Failed to load organizational users:', err);
    });
    return () => {
      active = false;
    };
  }, []);

  const health = useMemo(
    () => evaluateRaciGovernance(raci, workItem),
    [raci, workItem],
  );

  // Scoped authorization: check server permission raci.manage
  const isAuthorized = can('raci.manage');

  const assignedIds = useMemo(
    () =>
      new Set(
        [
          raci.responsible_id,
          raci.accountable_id,
          ...(raci.consulted_ids || []),
          ...(raci.informed_ids || []),
        ].filter((id): id is string => Boolean(id && id.trim()))
      ),
    [raci],
  );

  const setSingleRole = (role: 'responsible' | 'accountable', id: string) => {
    const staff = staffList.find((member) => member.id === id);
    setRaci((current) => ({
      ...current,
      [`${role}_id`]: id,
      [`${role}_name`]: staff?.name || '',
    }));
  };

  const addMember = (role: MultiRole, staff: User) => {
    if (assignedIds.has(staff.id)) return;
    setRaci((current) => ({
      ...current,
      [`${role}_ids`]: [...(current[`${role}_ids`] || []), staff.id],
      [`${role}_names`]: [...(current[`${role}_names`] || []), staff.name],
    }));
    if (role === 'consulted') setSearchConsulted('');
    else setSearchInformed('');
  };

  const removeMember = (role: MultiRole, id: string) => {
    setRaci((current) => {
      const ids = current[`${role}_ids`] || [];
      const names = current[`${role}_names`] || [];
      const index = ids.indexOf(id);
      if (index < 0) return current;
      return {
        ...current,
        [`${role}_ids`]: ids.filter((memberId) => memberId !== id),
        [`${role}_names`]: names.filter((_, nameIndex) => nameIndex !== index),
      };
    });
  };

  const handleSave = async () => {
    if (!health.ready || changeReason.trim().length < 5) return;
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.workItems.replaceRaci(
        workItem.id,
        {
          ...raci,
          updated_at: new Date().toISOString(),
          updated_by_name: user.name,
        },
        changeReason.trim(),
      );
      setIsEditing(false);
      setChangeReason('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'RACI could not be updated.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <section
        aria-labelledby="raci-editor-heading"
        className="space-y-5 rounded-2xl border border-blue-200 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              id="raci-editor-heading"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900"
            >
              <Users className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
              Assign Responsibility and Accountability
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              One Person · One Role
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            <strong>R</strong> executes the work. <strong>A</strong> owns the outcome. <strong>C</strong> provides mandatory input before action. <strong>I</strong> receives updates and does not approve.
          </p>
        </div>

        {/* Dynamic Ready/Gaps Summary */}
        <div
          role="region"
          aria-live="polite"
          className={`rounded-xl border p-3.5 ${
            health.ready
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {health.ready ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
            )}
            <p className="text-xs font-black">
              {health.ready ? 'RACI Invariants Satisfied' : 'Accountability Gaps to Resolve'}
            </p>
          </div>
          {!health.ready && (
            <ul className="mt-2 space-y-1 pl-5 text-xs text-amber-900 list-disc">
              {health.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Single Role Selects: Responsible & Accountable */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SingleRoleSelect
            id="raci-select-responsible"
            label="Responsible (R)"
            help="The single executor who completes the work and reports status."
            icon={<UserCheck className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />}
            value={raci.responsible_id || ''}
            staffList={staffList}
            disabledId={raci.accountable_id || ''}
            onChange={(id) => setSingleRole('responsible', id)}
          />
          <SingleRoleSelect
            id="raci-select-accountable"
            label="Accountable (A)"
            help="The single decision authority who approves the outcome."
            icon={<Shield className="h-4 w-4 text-purple-600 shrink-0" aria-hidden="true" />}
            value={raci.accountable_id || ''}
            staffList={staffList}
            disabledId={raci.responsible_id || ''}
            onChange={(id) => setSingleRole('accountable', id)}
          />
        </div>

        {/* Multi-Role Editors: Consulted & Informed */}
        <div className="grid gap-4 lg:grid-cols-2">
          <RolePeopleEditor
            label="Consulted (C)"
            help="People whose input is mandatory before taking action."
            accent="amber"
            icon={<Users className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />}
            search={searchConsulted}
            onSearch={setSearchConsulted}
            ids={raci.consulted_ids || []}
            names={raci.consulted_names || []}
            staffList={staffList}
            assignedIds={assignedIds}
            onAdd={(staff) => addMember('consulted', staff)}
            onRemove={(id) => removeMember('consulted', id)}
          />
          <RolePeopleEditor
            label="Informed (I)"
            help="People who receive progress updates but do not approve."
            accent="emerald"
            icon={<Eye className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />}
            search={searchInformed}
            onSearch={setSearchInformed}
            ids={raci.informed_ids || []}
            names={raci.informed_names || []}
            staffList={staffList}
            assignedIds={assignedIds}
            onAdd={(staff) => addMember('informed', staff)}
            onRemove={(id) => removeMember('informed', id)}
          />
        </div>

        {/* Mandatory Consultation Expectation if C is assigned */}
        {(raci.consulted_ids || []).length > 0 && (
          <label className="block space-y-1.5 text-xs font-bold text-slate-800">
            <span>
              Consultation Expectation <span className="text-red-600">*</span>
            </span>
            <textarea
              value={raci.consultation_expectation || ''}
              onChange={(event) =>
                setRaci((current) => ({
                  ...current,
                  consultation_expectation: event.target.value,
                }))
              }
              placeholder="e.g. Consult OT Supervisor on sterilization autoclave logs before final sign-off."
              rows={3}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-medium text-slate-900 outline-none focus:border-amber-500 focus:bg-white sm:text-sm"
              aria-required="true"
            />
          </label>
        )}

        {/* Mandatory Information Cadence if I is assigned */}
        {(raci.informed_ids || []).length > 0 && (
          <label className="block space-y-1.5 text-xs font-bold text-slate-800">
            <span>
              Information Cadence <span className="text-red-600">*</span>
            </span>
            <textarea
              value={raci.information_cadence || ''}
              onChange={(event) =>
                setRaci((current) => ({
                  ...current,
                  information_cadence: event.target.value,
                }))
              }
              placeholder="e.g. Weekly progress summary every Friday at 5 PM and immediate alert on blockers."
              rows={3}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white sm:text-sm"
              aria-required="true"
            />
          </label>
        )}

        {/* Mandatory Change Reason */}
        <label className="block space-y-1.5 text-xs font-bold text-slate-800">
          <span>
            Reason for RACI Assignment / Change <span className="text-red-600">*</span>
          </span>
          <textarea
            value={changeReason}
            onChange={(event) => setChangeReason(event.target.value)}
            placeholder="Document why accountability or execution ownership is being assigned (minimum 5 characters)."
            rows={2}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white sm:text-sm"
            aria-required="true"
          />
          <span className="block text-[11px] font-medium text-slate-500">
            Required by governance audit rules. Recorded permanently in the activity history.
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setRaci(initialRaci(workItem));
              setChangeReason('');
              setError(null);
              setIsEditing(false);
            }}
            className="min-h-[44px] rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !health.ready || changeReason.trim().length < 5}
            className="min-h-[44px] rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? 'Saving Governance Update…' : 'Save RACI Assignment'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="raci-view-heading"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id="raci-view-heading"
              className="text-xs font-black uppercase tracking-wider text-slate-900"
            >
              RACI Accountability
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${
                health.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {health.ready ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              {health.ready ? 'RACI Ready' : 'Needs Attention'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Single execution ownership, single final authority, and structured consultation flow.
          </p>
        </div>
        {isAuthorized && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Edit RACI
          </button>
        )}
      </div>

      {!health.ready && (
        <div
          role="region"
          aria-label="Accountability gaps"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3"
        >
          <p className="text-xs font-black text-amber-900">Accountability Gaps</p>
          <ul className="mt-1 space-y-1 pl-5 text-xs text-amber-900 list-disc">
            {health.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <RaciRoleCard
          code="R"
          title="Responsible"
          help="Executes and reports progress"
          names={[health.responsibleName]}
          tone="blue"
        />
        <RaciRoleCard
          code="A"
          title="Accountable"
          help="Owns final outcome & approval"
          names={[health.accountableName]}
          tone="purple"
        />
        <RaciRoleCard
          code="C"
          title="Consulted"
          help="Mandatory input before action"
          names={raci.consulted_names || []}
          detail={raci.consultation_expectation}
          tone="amber"
        />
        <RaciRoleCard
          code="I"
          title="Informed"
          help="Receives updates; does not approve"
          names={raci.informed_names || []}
          detail={raci.information_cadence}
          tone="emerald"
        />
      </div>

      {(raci.updated_at || raci.updated_by_name) && (
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500">
          <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>
            Last RACI update{raci.updated_by_name ? ` by ${raci.updated_by_name}` : ''}
            {raci.updated_at ? ` · ${new Date(raci.updated_at).toLocaleString()}` : ''}
          </span>
        </div>
      )}
    </section>
  );
};

function SingleRoleSelect({
  id,
  label,
  help,
  icon,
  value,
  staffList,
  disabledId,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  icon: React.ReactNode;
  value: string;
  staffList: User[];
  disabledId: string;
  onChange: (id: string) => void;
}) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-black text-slate-900">
        {icon}
        {label}
      </span>
      <span className="block text-[11px] font-medium text-slate-500">{help}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white sm:text-sm"
      >
        <option value="">Select a team member</option>
        {staffList.map((staff) => (
          <option key={staff.id} value={staff.id} disabled={staff.id === disabledId}>
            {staff.name} · {staff.positionTitle || staff.roleTitle || staff.departmentName}
            {staff.id === disabledId ? ' (Already assigned in other role)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

function RolePeopleEditor({
  label,
  help,
  icon,
  accent,
  search,
  onSearch,
  ids,
  names,
  staffList,
  assignedIds,
  onAdd,
  onRemove,
}: {
  label: string;
  help: string;
  icon: React.ReactNode;
  accent: 'amber' | 'emerald';
  search: string;
  onSearch: (value: string) => void;
  ids: string[];
  names: string[];
  staffList: User[];
  assignedIds: Set<string>;
  onAdd: (staff: User) => void;
  onRemove: (id: string) => void;
}) {
  const matches = staffList
    .filter((staff) => {
      if (assignedIds.has(staff.id)) return false;
      const query = search.trim().toLowerCase();
      return (
        !query ||
        `${staff.name} ${staff.positionTitle || ''} ${staff.departmentName || ''}`
          .toLowerCase()
          .includes(query)
      );
    })
    .slice(0, 12);

  const chipClasses =
    accent === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-emerald-200 bg-emerald-50 text-emerald-900';

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-black text-slate-900">
          {icon}
          {label}
        </p>
        <p className="mt-1 text-[11px] font-medium text-slate-500">{help}</p>
      </div>
      <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl bg-slate-50 p-2">
        {ids.length === 0 && (
          <span className="text-xs italic text-slate-400">None assigned</span>
        )}
        {ids.map((id, index) => (
          <span
            key={id}
            className={`inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold ${chipClasses}`}
          >
            {names[index] || id}
            <button
              type="button"
              onClick={() => onRemove(id)}
              aria-label={`Remove ${names[index] || id}`}
              className="min-h-[28px] min-w-[28px] flex items-center justify-center rounded p-0.5 hover:bg-white/80 transition-colors"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search team directory to add…"
          className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base text-slate-900 outline-none focus:border-blue-500 sm:text-sm"
          aria-label={`Search team to add to ${label}`}
        />
      </div>
      {search.trim() && (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {matches.length === 0 && (
            <p className="p-2 text-xs text-slate-500">No matching available staff found</p>
          )}
          {matches.map((staff) => (
            <button
              key={staff.id}
              type="button"
              onClick={() => onAdd(staff)}
              className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-900">{staff.name}</span>
              <span className="ml-2 truncate text-[11px] text-slate-500">
                {staff.positionTitle || staff.departmentName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RaciRoleCard({
  code,
  title,
  help,
  names,
  detail,
  tone,
}: {
  code: string;
  title: string;
  help: string;
  names: string[];
  detail?: string | null;
  tone: 'blue' | 'purple' | 'amber' | 'emerald';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-800',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="rounded-2xl border border-slate-200 p-3.5 bg-white">
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${tones[tone]}`}
        >
          {code}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-900">{title}</p>
          <p className="text-[11px] font-medium text-slate-500">{help}</p>
        </div>
      </div>
      <p className="mt-3 break-words text-sm font-bold text-slate-900">
        {names.length ? names.join(', ') : 'None assigned'}
      </p>
      {detail && (
        <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-600 break-words">
          {detail}
        </p>
      )}
    </div>
  );
}
