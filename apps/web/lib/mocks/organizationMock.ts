import { Department, RoleDefinition, AuditEvent, CanonicalOrgNode, OrgTreeResponse } from '../../types/organization';
import { User } from '../../types/auth';

export const DEMO_USERS: Record<string, User> = {
  STAVYANS: {
    id: 'usr-stav-101',
    name: 'Priyesh Shah',
    email: 'priyesh.shah@stavyaspine.com',
    role: 'STAVYANS',
    roleTitle: 'Systems Engineer & IT Lead',
    departmentId: 'dept-it',
    departmentName: 'Facilities & IT Engineering',
  },
  MANAGING_DIRECTOR: {
    id: 'usr-md-001',
    name: 'Dr. Mirant Dave',
    email: 'dr.mirant.dave@stavyaspine.com',
    role: 'MANAGING_DIRECTOR',
    roleTitle: 'Managing Director & Consultant Spine Surgeon',
    departmentId: 'dept-exec',
    departmentName: 'MD Office',
  },
  ADMIN: {
    id: 'usr-adm-001',
    name: 'System Administrator',
    email: 'admin@stavyaspine.com',
    role: 'ADMIN',
    roleTitle: 'System Administrator & IT Security',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
  },
  HR: {
    id: 'usr-hr-001',
    name: 'Roshni Patel',
    email: 'roshni.patel@stavyaspine.com',
    role: 'HR',
    roleTitle: 'Head of Human Resources',
    departmentId: 'dept-hr',
    departmentName: 'Human Resources',
  },
  LEADERS: {
    id: 'usr-dh-003',
    name: 'Dr. Rohan Sharma',
    email: 'rohan.sharma@stavyaspine.com',
    role: 'LEADERS',
    roleTitle: 'Head of Spine Surgery Department',
    departmentId: 'dept-surgery',
    departmentName: 'Spine Surgery Leadership',
  },
  LEADER: {
    id: 'usr-dh-003',
    name: 'Dr. Rohan Sharma',
    email: 'rohan.sharma@stavyaspine.com',
    role: 'LEADER',
    roleTitle: 'Head of Spine Surgery Department',
    departmentId: 'dept-surgery',
    departmentName: 'Spine Surgery Leadership',
  },
  // Compatibility Aliases for tests & roles
  STAVYAN: {
    id: 'usr-stav-101',
    name: 'Priyesh Shah',
    email: 'priyesh.shah@stavyaspine.com',
    role: 'STAVYAN',
    roleTitle: 'Systems Engineer & IT Lead',
    departmentId: 'dept-it',
    departmentName: 'Facilities & IT Engineering',
  },
  MD: {
    id: 'usr-md-001',
    name: 'Dr. Mirant Dave',
    email: 'dr.mirant.dave@stavyaspine.com',
    role: 'MD',
    roleTitle: 'Managing Director & Consultant Spine Surgeon',
    departmentId: 'dept-exec',
    departmentName: 'MD Office',
  },
  MASTER: {
    id: 'usr-adm-001',
    name: 'Executive Master',
    email: 'master@stavyaspine.com',
    role: 'MASTER',
    roleTitle: 'Executive Master & Enterprise Control',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration',
  },
  MD_OFFICE: {
    id: 'usr-mdo-002',
    name: 'Het Bhatt',
    email: 'het.bhatt@stavyaspine.com',
    role: 'MD_OFFICE',
    roleTitle: 'MD Office Administrator & Operations Lead',
    departmentId: 'dept-exec',
    departmentName: 'MD Office',
  },
  DEPARTMENT_HEAD: {
    id: 'usr-dh-003',
    name: 'Dr. Rohan Sharma',
    email: 'rohan.sharma@stavyaspine.com',
    role: 'DEPARTMENT_HEAD',
    roleTitle: 'Head of Spine Surgery Department',
    departmentId: 'dept-surgery',
    departmentName: 'Spine Surgery',
  },
  MANAGER: {
    id: 'usr-mgr-004',
    name: 'Zankhana Joshi',
    email: 'zankhana.joshi@stavyaspine.com',
    role: 'MANAGER',
    roleTitle: 'Operations & Patient Flow Manager',
    departmentId: 'dept-ops',
    departmentName: 'Operations',
  },
};

export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 'dept-exec',
    name: 'MD Office',
    code: 'MDO',
    headUserId: 'usr-md-001',
    headUserName: 'Managing Director',
    membersCount: 4,
    activeTasksCount: 12,
    stuckItemsCount: 1,
  },
  {
    id: 'dept-surgery',
    name: 'Spine Surgery',
    code: 'SURG',
    headUserId: 'usr-dh-003',
    headUserName: 'Dr. Rohan Sharma',
    membersCount: 18,
    activeTasksCount: 24,
    stuckItemsCount: 2,
  },
  {
    id: 'dept-ops',
    name: 'Hospital Operations',
    code: 'OPS',
    headUserId: 'usr-mgr-004',
    headUserName: 'Ananya Patel',
    membersCount: 32,
    activeTasksCount: 38,
    stuckItemsCount: 4,
  },
  {
    id: 'dept-it',
    name: 'IT & Digital Health',
    code: 'IT',
    headUserId: 'usr-stav-101',
    headUserName: 'Priyesh Shah',
    membersCount: 8,
    activeTasksCount: 16,
    stuckItemsCount: 1,
  },
  {
    id: 'dept-physio',
    name: 'Physiotherapy & Rehab',
    code: 'PHY',
    headUserId: 'usr-phy-006',
    headUserName: 'Amit Patel',
    membersCount: 14,
    activeTasksCount: 15,
    stuckItemsCount: 0,
  },
  {
    id: 'dept-nursing',
    name: 'Nursing & Patient Care',
    code: 'NRS',
    headUserId: 'usr-nrs-007',
    headUserName: 'Sister Sunita Rao',
    membersCount: 45,
    activeTasksCount: 29,
    stuckItemsCount: 2,
  },
];

export const MOCK_ORG_TREE: OrgTreeResponse = {
  organization_id: 'org-stavya-001',
  organization_name: 'Stavya Spine Hospital & Research Institute',
  root_nodes: [
    {
      position_id: 'pos-md-001',
      title: 'Managing Director & Chief Spine Surgeon',
      code: 'EXEC-MD',
      is_leadership: true,
      department_id: 'dept-exec',
      department_name: 'MD Office',
      reports_to_position_id: null,
      current_occupant: {
        user_id: 'usr-md-001',
        full_name: 'Managing Director',
        assignment_id: 'asgn-001',
        started_on: '2020-01-01',
      },
      subordinates: [
        {
          position_id: 'pos-mdo-002',
          title: 'MD Office Administrator & Operations Lead',
          code: 'EXEC-MDO',
          is_leadership: true,
          department_id: 'dept-exec',
          department_name: 'MD Office',
          reports_to_position_id: 'pos-md-001',
          current_occupant: {
            user_id: 'usr-mdo-002',
            full_name: 'Het Bhatt',
            assignment_id: 'asgn-002',
            started_on: '2022-03-15',
          },
          subordinates: [],
        },
        {
          position_id: 'pos-surg-head',
          title: 'Head of Spine Surgery Department',
          code: 'SURG-HEAD',
          is_leadership: true,
          department_id: 'dept-surgery',
          department_name: 'Spine Surgery',
          reports_to_position_id: 'pos-md-001',
          current_occupant: {
            user_id: 'usr-dh-003',
            full_name: 'Dr. Rohan Sharma',
            assignment_id: 'asgn-003',
            started_on: '2021-06-01',
          },
          subordinates: [
            {
              position_id: 'pos-surg-assoc',
              title: 'Senior Spine Surgeon & Consultant',
              code: 'SURG-SR',
              is_leadership: false,
              department_id: 'dept-surgery',
              department_name: 'Spine Surgery',
              reports_to_position_id: 'pos-surg-head',
              current_occupant: {
                user_id: 'usr-surg-001',
                full_name: 'Dr. Rajesh Mehta',
                assignment_id: 'asgn-004',
                started_on: '2023-01-10',
              },
              subordinates: [
                {
                  position_id: 'pos-surg-fellow',
                  title: 'Spine Surgery Fellow & Clinical Registrar',
                  code: 'SURG-FEL',
                  is_leadership: false,
                  department_id: 'dept-surgery',
                  department_name: 'Spine Surgery',
                  reports_to_position_id: 'pos-surg-assoc',
                  current_occupant: {
                    user_id: 'usr-surg-002',
                    full_name: 'Dr. Sneha Desai',
                    assignment_id: 'asgn-005',
                    started_on: '2024-02-01',
                  },
                  subordinates: [],
                },
              ],
            },
            {
              position_id: 'pos-surg-ot-coord',
              title: 'OT Floor Coordinator',
              code: 'SURG-OT',
              is_leadership: false,
              department_id: 'dept-surgery',
              department_name: 'Spine Surgery',
              reports_to_position_id: 'pos-surg-head',
              current_occupant: {
                user_id: 'usr-surg-003',
                full_name: 'Vikram Singh',
                assignment_id: 'asgn-006',
                started_on: '2023-08-15',
              },
              subordinates: [],
            },
          ],
        },
        {
          position_id: 'pos-ops-head',
          title: 'Operations & Patient Flow Manager',
          code: 'OPS-MGR',
          is_leadership: true,
          department_id: 'dept-ops',
          department_name: 'Hospital Operations',
          reports_to_position_id: 'pos-md-001',
          current_occupant: {
            user_id: 'usr-mgr-004',
            full_name: 'Ananya Patel',
            assignment_id: 'asgn-007',
            started_on: '2022-09-01',
          },
          subordinates: [
            {
              position_id: 'pos-ops-opd',
              title: 'OPD Reception & Flow Supervisor',
              code: 'OPS-OPD',
              is_leadership: false,
              department_id: 'dept-ops',
              department_name: 'Hospital Operations',
              reports_to_position_id: 'pos-ops-head',
              current_occupant: {
                user_id: 'usr-ops-001',
                full_name: 'Meera Trivedi',
                assignment_id: 'asgn-008',
                started_on: '2023-04-10',
              },
              subordinates: [],
            },
            {
              position_id: 'pos-ops-biomed',
              title: 'Biomedical & Equipment Lead',
              code: 'OPS-BM',
              is_leadership: false,
              department_id: 'dept-ops',
              department_name: 'Hospital Operations',
              reports_to_position_id: 'pos-ops-head',
              current_occupant: {
                user_id: 'usr-phy-006',
                full_name: 'Amit Patel',
                assignment_id: 'asgn-009',
                started_on: '2022-11-20',
              },
              subordinates: [],
            },
          ],
        },
        {
          position_id: 'pos-it-lead',
          title: 'Head of IT & Digital Health',
          code: 'IT-LEAD',
          is_leadership: true,
          department_id: 'dept-it',
          department_name: 'IT & Digital Health',
          reports_to_position_id: 'pos-md-001',
          current_occupant: {
            user_id: 'usr-stav-101',
            full_name: 'Priyesh Shah',
            assignment_id: 'asgn-010',
            started_on: '2023-05-01',
          },
          subordinates: [
            {
              position_id: 'pos-it-emr',
              title: 'EMR & PACS Systems Engineer',
              code: 'IT-ENG',
              is_leadership: false,
              department_id: 'dept-it',
              department_name: 'IT & Digital Health',
              reports_to_position_id: 'pos-it-lead',
              current_occupant: {
                user_id: 'usr-it-002',
                full_name: 'Kavita Joshi',
                assignment_id: 'asgn-011',
                started_on: '2024-01-15',
              },
              subordinates: [],
            },
            {
              position_id: 'pos-it-network',
              title: 'Network & Hardware Specialist',
              code: 'IT-NET',
              is_leadership: false,
              department_id: 'dept-it',
              department_name: 'IT & Digital Health',
              reports_to_position_id: 'pos-it-lead',
              current_occupant: null,
              subordinates: [],
            },
          ],
        },
        {
          position_id: 'pos-nrs-head',
          title: 'Director of Nursing & Patient Care',
          code: 'NRS-DIR',
          is_leadership: true,
          department_id: 'dept-nursing',
          department_name: 'Nursing & Patient Care',
          reports_to_position_id: 'pos-md-001',
          current_occupant: {
            user_id: 'usr-nrs-007',
            full_name: 'Sister Sunita Rao',
            assignment_id: 'asgn-012',
            started_on: '2021-02-10',
          },
          subordinates: [
            {
              position_id: 'pos-nrs-icu',
              title: 'ICU Charge Nurse',
              code: 'NRS-ICU',
              is_leadership: false,
              department_id: 'dept-nursing',
              department_name: 'Nursing & Patient Care',
              reports_to_position_id: 'pos-nrs-head',
              current_occupant: {
                user_id: 'usr-nrs-002',
                full_name: 'Pooja Nair',
                assignment_id: 'asgn-013',
                started_on: '2023-03-01',
              },
              subordinates: [],
            },
          ],
        },
        {
          position_id: 'pos-phy-head',
          title: 'Chief of Physiotherapy & Spine Rehabilitation',
          code: 'PHY-HEAD',
          is_leadership: true,
          department_id: 'dept-physio',
          department_name: 'Physiotherapy & Rehab',
          reports_to_position_id: 'pos-md-001',
          current_occupant: {
            user_id: 'usr-phy-001',
            full_name: 'Dr. Hardik Vyas',
            assignment_id: 'asgn-014',
            started_on: '2022-04-01',
          },
          subordinates: [],
        },
      ],
    },
  ],
};

export function getScopedMockOrgTree(userId?: string, role?: string): OrgTreeResponse {
  const upperRole = (role || '').toUpperCase();
  if (upperRole === 'MD' || upperRole === 'MD_OFFICE' || upperRole === 'MANAGING_DIRECTOR' || upperRole === 'MASTER' || upperRole === 'ADMIN') {
    return MOCK_ORG_TREE;
  }

  // Find node matching userId (only if userId is provided)
  const findNode = (nodes: CanonicalOrgNode[]): CanonicalOrgNode | null => {
    if (!userId) return null;
    for (const node of nodes) {
      if (node.current_occupant?.user_id && node.current_occupant.user_id === userId) {
        return node;
      }
      if (node.subordinates && node.subordinates.length > 0) {
        const found = findNode(node.subordinates);
        if (found) return found;
      }
    }
    return null;
  };

  const scopedRoot = findNode(MOCK_ORG_TREE.root_nodes);
  if (scopedRoot) {
    return {
      organization_id: MOCK_ORG_TREE.organization_id,
      organization_name: MOCK_ORG_TREE.organization_name,
      root_nodes: [scopedRoot],
    };
  }

  // Fallback for leader role if user id not directly matched
  if (upperRole === 'LEADER' || upperRole === 'LEADERS' || upperRole === 'DEPARTMENT_HEAD') {
    const surgHead = MOCK_ORG_TREE.root_nodes[0].subordinates.find(s => s.position_id === 'pos-surg-head');
    if (surgHead) {
      return {
        organization_id: MOCK_ORG_TREE.organization_id,
        organization_name: MOCK_ORG_TREE.organization_name,
        root_nodes: [surgHead],
      };
    }
  }

  if (upperRole === 'MANAGER') {
    const opsHead = MOCK_ORG_TREE.root_nodes[0].subordinates.find(s => s.position_id === 'pos-ops-head');
    if (opsHead) {
      return {
        organization_id: MOCK_ORG_TREE.organization_id,
        organization_name: MOCK_ORG_TREE.organization_name,
        root_nodes: [opsHead],
      };
    }
  }

  return {
    organization_id: MOCK_ORG_TREE.organization_id,
    organization_name: MOCK_ORG_TREE.organization_name,
    root_nodes: [MOCK_ORG_TREE.root_nodes[0]],
  };
}

export const MOCK_ROLES: RoleDefinition[] = [
  {
    name: 'MD',
    title: 'Managing Director',
    description: 'Executive oversight, strategic decision approval, high-level exception dashboard, and organizational governance.',
    allowedCapabilities: ['dashboard.md.read', 'decision.approve', 'commitment.approve', 'escalation.resolve', 'priority.create'],
  },
  {
    name: 'MD_OFFICE',
    title: 'MD Office Administrator',
    description: 'Operational coordination, cross-department work assignment, tracking commitments, meeting follow-ups, and audit exports.',
    allowedCapabilities: ['dashboard.md.read', 'commitment.create', 'task.assign', 'stuck.resolve', 'audit.export'],
  },
  {
    name: 'DEPARTMENT_HEAD',
    title: 'Department Head',
    description: 'Departmental leadership, priority execution, team work assignment, and milestone completion within department scope.',
    allowedCapabilities: ['dashboard.department.read', 'task.assign', 'milestone.complete', 'stuck.create'],
  },
  {
    name: 'MANAGER',
    title: 'Manager',
    description: 'Direct team execution, task assignment, deadline tracking, and stuck/need reporting.',
    allowedCapabilities: ['dashboard.department.read', 'task.assign', 'task.complete', 'stuck.create'],
  },
  {
    name: 'STAVYAN',
    title: 'Stavyan / Individual Contributor',
    description: 'Self-task creation, task execution, progress updates, stuck/need reporting for assigned work.',
    allowedCapabilities: ['task.create', 'task.complete', 'stuck.create'],
  },
];

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [];
