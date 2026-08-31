import { describe, it, expect } from 'vitest';
import { can } from '../lib/permissions/can';
import { DEMO_USERS } from '../lib/mocks/organizationMock';

describe('LAKSHYA RBAC Permission Helper Tests', () => {
  it('MD persona should possess executive dashboard and decision approval permissions', () => {
    const md = DEMO_USERS.MD;
    expect(can('dashboard.md.read', md)).toBe(true);
    expect(can('decision.approve', md)).toBe(true);
    expect(can('commitment.approve', md)).toBe(true);
    expect(can('audit.export', md)).toBe(true);
  });

  it('MD Office persona should possess organizational task assignment and commitment creation', () => {
    const mdo = DEMO_USERS.MD_OFFICE;
    expect(can('dashboard.md.read', mdo)).toBe(true);
    expect(can('commitment.create', mdo)).toBe(true);
    expect(can('task.assign', mdo)).toBe(true);
    expect(can('stuck.resolve', mdo)).toBe(true);
  });

  it('Department Head persona should possess department dashboard and task assignment', () => {
    const dh = DEMO_USERS.DEPARTMENT_HEAD;
    expect(can('dashboard.md.read', dh)).toBe(false);
    expect(can('dashboard.department.read', dh)).toBe(true);
    expect(can('task.assign', dh)).toBe(true);
    expect(can('milestone.complete', dh)).toBe(true);
  });

  it('Stavyan persona should NOT be allowed to reassign tasks, change deadlines, or approve commitments', () => {
    const emp = DEMO_USERS.STAVYAN;
    expect(can('dashboard.md.read', emp)).toBe(false);
    expect(can('task.assign', emp)).toBe(false);
    expect(can('task.deadline.change', emp)).toBe(false);
    expect(can('commitment.approve', emp)).toBe(false);
    expect(can('commitment.reopen', emp)).toBe(false);
    expect(can('task.create', emp)).toBe(true); // Self task creation is permitted
    expect(can('task.complete', emp)).toBe(true); // Assignee task completion is permitted
  });
});
