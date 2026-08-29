import { WorkItem, WorkItemRACI } from '../../types/workItem';

export interface RaciGovernanceHealth {
  ready: boolean;
  needsAttention: boolean;
  issues: string[];
  responsibleName: string;
  accountableName: string;
  consultedCount: number;
  informedCount: number;
}

const compact = (values: Array<string | null | undefined>): string[] =>
  values.filter((value): value is string => Boolean(value && value.trim()));

export function evaluateRaciGovernance(
  raci: WorkItemRACI | null | undefined,
  fallback?: Pick<WorkItem, 'owner_id' | 'owner_name'>,
): RaciGovernanceHealth {
  const responsibleId = raci?.responsible_id || fallback?.owner_id || '';
  const responsibleName = raci?.responsible_name || fallback?.owner_name || '';
  const accountableId = raci?.accountable_id || '';
  const accountableName = raci?.accountable_name || '';
  const consultedIds = compact(raci?.consulted_ids || []);
  const informedIds = compact(raci?.informed_ids || []);
  const issues: string[] = [];

  if (!responsibleId || !responsibleName) {
    issues.push('Assign one Responsible executor.');
  }
  if (!accountableId || !accountableName) {
    issues.push('Assign exactly one Accountable authority.');
  }
  if (responsibleId && accountableId && responsibleId === accountableId) {
    issues.push('Responsible and Accountable must be different until Stavya approves an exception policy.');
  }

  type RoleTuple = readonly [string, string];
  const roleMemberships: RoleTuple[] = [
    ...(responsibleId ? ([['R', responsibleId]] as const) : []),
    ...(accountableId ? ([['A', accountableId]] as const) : []),
    ...consultedIds.map((id) => ['C', id] as const),
    ...informedIds.map((id) => ['I', id] as const),
  ];

  const rolesByPerson = new Map<string, string[]>();
  roleMemberships.forEach(([role, id]) => {
    const existing = rolesByPerson.get(id) || [];
    rolesByPerson.set(id, [...existing, role]);
  });

  rolesByPerson.forEach((roles) => {
    if (roles.length > 1) {
      issues.push(`One person cannot hold multiple RACI roles (${roles.join('/')}).`);
    }
  });

  if (new Set(consultedIds).size !== consultedIds.length) {
    issues.push('Consulted assignments contain duplicates.');
  }
  if (new Set(informedIds).size !== informedIds.length) {
    issues.push('Informed assignments contain duplicates.');
  }
  if (consultedIds.length > 0 && !raci?.consultation_expectation?.trim()) {
    issues.push('Describe what input is expected from Consulted participants and when.');
  }
  if (informedIds.length > 0 && !raci?.information_cadence?.trim()) {
    issues.push('Describe what updates Informed participants should receive and when.');
  }

  return {
    ready: issues.length === 0,
    needsAttention: issues.length > 0,
    issues: Array.from(new Set(issues)),
    responsibleName: responsibleName || 'Unassigned',
    accountableName: accountableName || 'Unassigned',
    consultedCount: consultedIds.length,
    informedCount: informedIds.length,
  };
}
