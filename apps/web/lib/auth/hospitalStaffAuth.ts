import { STAVYA_STAFF_DATABASE, HospitalStaffMember } from '../data/stavyaHospitalOrgData';
import { User, Persona } from '../../types/auth';

export interface EmployeeAccount {
  id: string; // e.g. e001, e048, e069
  employeeCode: string; // e.g. STAVYA-001, STAVYA-048
  numericCode: string; // e.g. 113, 001
  name: string;
  email: string;
  mobile: string;
  designation: string;
  departmentName: string;
  departmentMaster: string;
  unit: string;
  role: Persona;
  roleTitle: string;
  accessStatus: 'ACTIVE' | 'SUSPENDED' | 'READ_ONLY';
  capabilities: string[];
  permissions: string[];
  isChapterChampion?: boolean;
  chapterAssigned?: string;
  isStatutoryCommitteeChair?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'lakshya_hospital_staff_privileges_v1';

class HospitalStaffAuthStore {
  private accounts: Record<string, EmployeeAccount> = {};
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.accounts = JSON.parse(stored);
          this.isInitialized = true;
          return;
        }
      } catch (e) {
        console.warn('Could not read stored hospital staff privileges from localStorage', e);
      }
    }

    // Initialize all 214 staff members from STAVYA_STAFF_DATABASE
    this.bootstrapStaffAccounts();
    this.isInitialized = true;
  }

  private bootstrapStaffAccounts() {
    const rawStaffList = Object.values(STAVYA_STAFF_DATABASE);
    const newAccounts: Record<string, EmployeeAccount> = {};

    rawStaffList.forEach((staff) => {
      const staffId = staff.id;
      const desig = (staff.desig || '').toLowerCase();
      const unit = (staff.unit || '').toLowerCase();
      const name = staff.name;

      // Determine Canonical Role
      let role: Persona = 'EMPLOYEE';
      if (name.includes('Dr. Mirant') || name.includes('Mirant Bharat Dave')) {
        role = 'MANAGING_DIRECTOR';
      } else if (name.includes('Dr. Bharat') || name.includes('Bharat Rajendraprasad Dave')) {
        role = 'MASTER';
      } else if (name.includes('Amita') || name.includes('Amita Bharat Dave')) {
        role = 'MASTER';
      } else if (name.includes('Dr. Akruti') || name.includes('Akruti Mirant Dave')) {
        role = 'DIRECTOR_QUALITY';
      } else if (name.includes('Het Bhatt') || name.includes('Het Dave')) {
        role = 'MD_OFFICE';
      } else if (
        desig.includes('director') ||
        desig.includes('head') ||
        desig.includes('consultant') ||
        desig.includes('lead') ||
        desig.includes('superintendent') ||
        desig.includes('incharge') ||
        desig.includes('in charge') ||
        desig.includes('manager')
      ) {
        role = 'LEADER';
      } else {
        role = 'EMPLOYEE';
      }

      // Determine Capabilities
      const capabilities: string[] = ['TASK_READ', 'TASK_COMPLETE'];
      const permissions: string[] = ['user.read', 'department.read', 'task.read', 'task.complete'];

      // Quality Command Centre Access Grant
      const isQualityPerson =
        role === 'MANAGING_DIRECTOR' ||
        role === 'MASTER' ||
        role === 'DIRECTOR_QUALITY' ||
        role === 'MD_OFFICE' ||
        name.includes('Akruti') ||
        name.includes('Preety') ||
        name.includes('Brijesh') ||
        name.includes('Jatin') ||
        name.includes('Bhavana') ||
        name.includes('Vatsal') ||
        name.includes('Manilal') ||
        unit.includes('quality') ||
        desig.includes('quality');

      if (isQualityPerson) {
        capabilities.push('QUALITY_COMMAND_VIEW', 'QUALITY_MANAGE', 'AUDIT_VIEW');
        permissions.push('quality.command.view', 'quality.manage', 'audit.view');
      }

      if (role === 'MANAGING_DIRECTOR' || role === 'MASTER' || role === 'MD_OFFICE') {
        capabilities.push('SUPER_ADMIN', 'RACI_MANAGE', 'TASK_MANAGE', 'GOVERNANCE_VIEW', 'POLICIES_AUTHOR', 'INTAKE_DISPATCH');
        permissions.push('*');
      } else if (role === 'LEADER' || role === 'DIRECTOR_QUALITY') {
        capabilities.push('RACI_MANAGE', 'TASK_MANAGE', 'POLICIES_AUTHOR', 'INTAKE_DISPATCH');
        permissions.push('task.assign', 'task.create', 'meeting.create', 'priority.read', 'milestone.read', 'stuck.create');
      }

      // Check Chapter Champion assignment
      let isChapterChampion = false;
      let chapterAssigned: string | undefined;
      if (staffId === 'e048') { isChapterChampion = true; chapterAssigned = 'AAC & IMS'; }
      else if (staffId === 'e026') { isChapterChampion = true; chapterAssigned = 'COP'; }
      else if (staffId === 'e133') { isChapterChampion = true; chapterAssigned = 'MOM'; }
      else if (staffId === 'e058') { isChapterChampion = true; chapterAssigned = 'PRE'; }
      else if (staffId === 'e069') { isChapterChampion = true; chapterAssigned = 'IPC, PSQ & ROM'; }
      else if (staffId === 'e198') { isChapterChampion = true; chapterAssigned = 'FMS & IMS'; }
      else if (staffId === 'e131') { isChapterChampion = true; chapterAssigned = 'HRM'; }

      // Standardize employee code
      const empNum = staff.code || staff.id.replace('e', '');
      const paddedNum = empNum.padStart(3, '0');
      const employeeCode = `STAVYA-${paddedNum}`;

      // Email fallback
      const email = staff.email && staff.email.includes('@') 
        ? staff.email.toLowerCase() 
        : `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@stavyaspine.com`;

      newAccounts[staffId] = {
        id: staffId,
        employeeCode,
        numericCode: staff.code || empNum,
        name: staff.name,
        email,
        mobile: staff.mobile || '+91 98250 00000',
        designation: staff.desig || 'Hospital Staff Member',
        departmentName: staff.unit || 'Hospital Administration',
        departmentMaster: staff.dept_master || staff.unit || 'General Operations',
        unit: staff.unit || 'General',
        role,
        roleTitle: staff.desig || 'Hospital Team Member',
        accessStatus: 'ACTIVE',
        capabilities,
        permissions,
        isChapterChampion,
        chapterAssigned,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-29T12:00:00Z',
      };
    });

    this.accounts = newAccounts;
    this.persist();
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.accounts));
      } catch (e) {
        console.warn('Failed to persist hospital staff privileges', e);
      }
    }
  }

  public getAllAccounts(): EmployeeAccount[] {
    return Object.values(this.accounts);
  }

  public getAccountById(id: string): EmployeeAccount | null {
    return this.accounts[id] || null;
  }

  public getAccountByCode(code: string): EmployeeAccount | null {
    const clean = code.trim().toUpperCase();
    if (clean === 'STAVYA-001' || clean === 'STAVYANS-001' || clean === 'MD') {
      return Object.values(this.accounts).find(a => a.role === 'MANAGING_DIRECTOR' || a.id === 'e071') || null;
    }
    return Object.values(this.accounts).find(
      acc => acc.employeeCode.toUpperCase() === clean || acc.numericCode === clean || acc.id.toUpperCase() === clean
    ) || null;
  }

  public getAccountByEmailOrName(query: string): EmployeeAccount | null {
    const clean = query.trim().toLowerCase();
    return Object.values(this.accounts).find(
      acc => acc.email.toLowerCase() === clean || acc.name.toLowerCase().includes(clean)
    ) || null;
  }

  /**
   * Authenticate employee by Code, ID, Email, or Name with default password check
   */
  public authenticate(identifier: string, password?: string): EmployeeAccount {
    const cleanId = identifier.trim().toUpperCase();
    const cleanLower = identifier.trim().toLowerCase();

    // 1. Match by Employee Code / ID / MD alias
    let account: EmployeeAccount | undefined;
    if (cleanId === 'STAVYA-001' || cleanId === 'STAVYANS-001' || cleanId === 'MD' || cleanId === 'MANAGING_DIRECTOR') {
      account = Object.values(this.accounts).find(a => a.role === 'MANAGING_DIRECTOR' || a.id === 'e071');
    } else if (cleanId === 'STAVYA-000' || cleanId === 'STAVYANS-000' || cleanId === 'MASTER' || cleanId === 'ADMIN') {
      account = Object.values(this.accounts).find(a => a.role === 'MASTER' || a.id === 'e000');
    } else {
      account = Object.values(this.accounts).find(
        acc => acc.employeeCode.toUpperCase() === cleanId || 
               acc.id.toUpperCase() === cleanId || 
               acc.numericCode === cleanId
      );
    }

    // 2. Match by Email
    if (!account) {
      account = Object.values(this.accounts).find(acc => acc.email.toLowerCase() === cleanLower);
    }

    // 3. Match by Name
    if (!account) {
      account = Object.values(this.accounts).find(acc => acc.name.toLowerCase().includes(cleanLower));
    }

    // 4. Fallback for generic demo aliases (e.g. STAVYANS-101, EMPLOYEE)
    if (!account) {
      if (cleanId === 'STAVYANS-101' || cleanId === 'EMPLOYEE' || cleanId === 'STAVYANS') {
        account = this.accounts['e101'] || Object.values(this.accounts)[10];
      } else if (cleanId === 'STAVYANS-002' || cleanId === 'LEADER' || cleanId === 'LEADERS') {
        account = Object.values(this.accounts).find(a => a.role === 'LEADER') || this.accounts['e048'];
      }
    }

    if (!account) {
      throw new Error(`Employee record "${identifier}" not found in Stavya Hospital database.`);
    }

    if (account.accessStatus === 'SUSPENDED') {
      throw new Error(`Account for ${account.name} (${account.employeeCode}) has been SUSPENDED by Master Admin.`);
    }

    // Validate Password
    const validPasswords = ['1234', 'Stavya@2026', 'stavya2026', 'password123', '••••••••••••', 'securepass123', 'admin123'];
    if (password && !validPasswords.includes(password)) {
      throw new Error('Invalid credentials. (Default password: Stavya@2026 or 1234)');
    }

    // Record last login
    account.lastLoginAt = new Date().toISOString();
    this.persist();

    return account;
  }

  /**
   * Master Admin: Update privileges, role, status, and capabilities for any staff member
   */
  public updateEmployeePrivileges(
    id: string,
    updates: Partial<Pick<EmployeeAccount, 'role' | 'roleTitle' | 'accessStatus' | 'capabilities' | 'permissions' | 'departmentName'>>
  ): EmployeeAccount {
    const account = this.accounts[id];
    if (!account) {
      throw new Error(`Staff member with ID ${id} not found.`);
    }

    const updated: EmployeeAccount = {
      ...account,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.accounts[id] = updated;
    this.persist();
    return updated;
  }

  /**
   * Master Admin: Toggle quick access status (ACTIVE, SUSPENDED, READ_ONLY)
   */
  public setAccessStatus(id: string, status: EmployeeAccount['accessStatus']): EmployeeAccount {
    return this.updateEmployeePrivileges(id, { accessStatus: status });
  }

  /**
   * Master Admin: Grant or Revoke specific capability
   */
  public toggleCapability(id: string, capability: string, enabled: boolean): EmployeeAccount {
    const account = this.accounts[id];
    if (!account) throw new Error(`Staff ID ${id} not found.`);

    let newCaps = [...account.capabilities];
    if (enabled && !newCaps.includes(capability)) {
      newCaps.push(capability);
    } else if (!enabled && newCaps.includes(capability)) {
      newCaps = newCaps.filter(c => c !== capability);
    }

    return this.updateEmployeePrivileges(id, { capabilities: newCaps });
  }

  public resetToDefaults() {
    this.bootstrapStaffAccounts();
  }

  /**
   * Convert EmployeeAccount to frontend User object for AuthContext
   */
  public toFrontendUser(acc: EmployeeAccount): User {
    return {
      id: acc.id,
      name: acc.name,
      email: acc.email,
      role: acc.role,
      roleTitle: acc.roleTitle,
      departmentId: `dept-${acc.id}`,
      departmentName: acc.departmentName,
      capabilities: acc.capabilities,
      permissions: acc.permissions,
      roles: [acc.role.toLowerCase()],
      organizationId: 'org-stavya-001',
      organizationSlug: 'stavya-spine',
      mustChangePassword: false,
    };
  }
}

export const hospitalStaffAuthStore = new HospitalStaffAuthStore();
