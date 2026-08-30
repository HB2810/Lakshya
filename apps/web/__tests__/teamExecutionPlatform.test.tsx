import { describe, it, expect, beforeEach } from 'vitest';
import { can } from '../lib/permissions/can';
import { User } from '../types/auth';
import { workItemStore } from '../lib/mocks/workItemMock';
import { STAVYA_STAFF_DATABASE } from '../lib/data/stavyaHospitalOrgData';

describe('LAKSHYA Team Task Creation, Verification & Audit Platform', () => {
  beforeEach(() => {
    workItemStore.resetData();
  });

  describe('1. 4-Tier Authority & Permission Gates', () => {
    const mdUser: User = {
      id: 'usr-md-1',
      name: 'Dr. Bharat Dave',
      email: 'md@stavya.org',
      role: 'MANAGING_DIRECTOR',
      roleTitle: 'Managing Director & Chief Spine Surgeon',
      departmentId: 'dept-md',
      departmentName: 'MD Office',
    };

    const leaderUser: User = {
      id: 'usr-leader-1',
      name: 'Dr. Quality Lead',
      email: 'quality@stavya.org',
      role: 'LEADER',
      roleTitle: 'Director of Quality & Patient Safety',
      departmentId: 'dept-quality',
      departmentName: 'Quality & Patient Safety',
    };

    const inchargeUser: User = {
      id: 'usr-incharge-1',
      name: 'OT Incharge Sister',
      email: 'otincharge@stavya.org',
      role: 'DEPARTMENT_HEAD',
      roleTitle: 'OT Nursing Incharge',
      departmentId: 'dept-nursing',
      departmentName: 'Nursing',
    };

    const employeeUser: User = {
      id: 'usr-emp-1',
      name: 'Pooja Parmar',
      email: 'pooja.parmar@stavya.org',
      role: 'EMPLOYEE',
      roleTitle: 'OT Technician',
      departmentId: 'dept-ot',
      departmentName: 'Spine Surgery & OT',
    };

    it('allows Governance and Leaders to delegate, verify, and audit tasks', () => {
      expect(can('team.tasks.delegate', mdUser)).toBe(true);
      expect(can('team.tasks.delegate', leaderUser)).toBe(true);
      expect(can('team.tasks.delegate', inchargeUser)).toBe(true);
      expect(can('team.tasks.delegate', employeeUser)).toBe(false);

      expect(can('team.tasks.verify', mdUser)).toBe(true);
      expect(can('team.tasks.verify', leaderUser)).toBe(true);
      expect(can('team.tasks.verify', inchargeUser)).toBe(true);
      expect(can('team.tasks.verify', employeeUser)).toBe(false);

      expect(can('team.tasks.audit', mdUser)).toBe(true);
      expect(can('team.tasks.audit', leaderUser)).toBe(true);
      expect(can('team.tasks.audit', inchargeUser)).toBe(true);
      expect(can('team.tasks.audit', employeeUser)).toBe(false);
    });

    it('allows only Governance to view hospital-wide macro scope', () => {
      expect(can('team.tasks.view_all', mdUser)).toBe(true);
      expect(can('team.tasks.view_all', leaderUser)).toBe(false);
      expect(can('team.tasks.view_all', employeeUser)).toBe(false);
    });

    it('allows Employees to create personal tasks and complete them', () => {
      expect(can('task.create', employeeUser)).toBe(true);
      expect(can('task.complete', employeeUser)).toBe(true);
    });
  });

  describe('2. Work Item Verification & Audit Lifecycle', () => {
    it('allows an employee to submit deliverable for incharge verification', () => {
      const items = workItemStore.getWorkItems();
      const targetItem = items[0];

      const updated = workItemStore.submitForVerification(
        targetItem.id,
        'Sterilization calibration run finished at 134°C with 0 cycle faults. Physical register signed.',
        'Pooja Parmar'
      );

      expect(updated.status).toBe('submitted_for_verification');
      expect(updated.submission_notes).toContain('Sterilization calibration');
      expect(updated.submitted_for_verification_at).toBeDefined();

      const latestActivity = updated.activity_history?.[0];
      expect(latestActivity?.type).toBe('SUBMITTED_FOR_VERIFICATION');
      expect(latestActivity?.authorName).toBe('Pooja Parmar');
    });

    it('allows an Incharge / Leader to audit and approve a deliverable with 5-star score', () => {
      const items = workItemStore.getWorkItems();
      const targetItem = items[0];

      // 1. Employee submits
      workItemStore.submitForVerification(targetItem.id, 'Finished tasks with evidence.', 'Staff');

      // 2. Leader audits and approves
      const verified = workItemStore.auditVerify(targetItem.id, {
        decision: 'APPROVED',
        auditScore: 5,
        sopCompliance: true,
        remarks: 'All quality checks and autoclave printouts verified. Exceptional compliance.',
        verifierId: 'usr-incharge-1',
        verifierName: 'Sister Mary',
        verifierRole: 'OT Incharge',
      });

      expect(verified.status).toBe('verified');
      expect(verified.progressPercent).toBe(100);
      expect(verified.completed_at).toBeDefined();
      expect(verified.verification?.decision).toBe('APPROVED');
      expect(verified.verification?.audit_score).toBe(5);
      expect(verified.verification?.sop_compliance).toBe(true);
      expect(verified.verification?.verified_by_name).toBe('Sister Mary');
    });

    it('allows an Incharge to request revisions when criteria are not met', () => {
      const items = workItemStore.getWorkItems();
      const targetItem = items[0];

      // 1. Employee submits
      workItemStore.submitForVerification(targetItem.id, 'Draft log attached.', 'Staff');

      // 2. Incharge requests revision
      const revised = workItemStore.auditVerify(targetItem.id, {
        decision: 'REVISION_REQUESTED',
        remarks: 'The temperature sensor trace from 04:00 AM is missing. Please re-export telemetry.',
        verifierName: 'Sister Mary',
      });

      expect(revised.status).toBe('revision_requested');
      expect(revised.verification?.decision).toBe('REVISION_REQUESTED');
      expect(revised.verification?.remarks).toContain('telemetry');
    });
  });

  describe('3. Hospital Organizational Structure & Staff Pool', () => {
    it('contains all 214 hospital staff members mapped to units and managers', () => {
      const allStaff = Object.values(STAVYA_STAFF_DATABASE);
      expect(allStaff.length).toBe(214);

      const sampleStaff = allStaff.find(s => s.name.includes('Dr. Mirant Bharat Dave') || s.name.includes('Dr. Bharat Rajendraprasad Dave'));
      expect(sampleStaff).toBeDefined();
      expect(sampleStaff?.name).toContain('Dave');
    });
  });
});
