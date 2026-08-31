import { STAVYA_STAFF_DATABASE, HospitalStaffMember } from '../data/stavyaHospitalOrgData';
import { User, Persona } from '../../types/auth';

export type AuthorityTier = 'GOVERNANCE' | 'LEADERS' | 'INCHARGES' | 'EMPLOYEES';

export interface EmployeeAccount {
  id: string; // e.g. e000, e001, e048, e069, e071
  loginId: string; // e.g. STAVYA-001, STAVYA-113
  employeeCode: string; // e.g. STAVYA-001, STAVYA-048
  numericCode: string; // e.g. 113, 001
  name: string;
  email: string;
  mobile: string;
  designation: string;
  departmentName: string;
  departmentMaster: string;
  unit: string;
  tier: AuthorityTier;
  role: Persona;
  roleTitle: string;
  defaultPassword: string;
  password?: string;
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

const STORAGE_KEY = 'lakshya_hospital_staff_privileges_v4';
const DEFAULT_HOSPITAL_PASSWORD = 'Stavya@2026';

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

      // Determine Canonical Role & Authority Tier
      let role: Persona = 'STAVYAN';
      let tier: AuthorityTier = 'EMPLOYEES';

      if (name.includes('Dr. Mirant') || name.includes('Mirant Bharat Dave') || staffId === 'e071') {
        role = 'MANAGING_DIRECTOR';
        tier = 'GOVERNANCE';
      } else if (name.includes('Dr. Bharat') || name.includes('Bharat Rajendraprasad Dave') || staffId === 'e057' || staffId === 'e000') {
        role = 'MASTER';
        tier = 'GOVERNANCE';
      } else if (name.includes('Amita') || name.includes('Amita Bharat Dave')) {
        role = 'MASTER';
        tier = 'GOVERNANCE';
      } else if (name.includes('Dr. Akruti') || name.includes('Akruti Mirant Dave') || staffId === 'e048') {
        role = 'DIRECTOR_QUALITY';
        tier = 'GOVERNANCE';
      } else if (name.includes('Het') && (name.includes('Bhatt') || name.includes('Dave'))) {
        role = 'MD_OFFICE';
        tier = 'GOVERNANCE';
      } else if (
        desig.includes('director') ||
        desig.includes('medical superintendent') ||
        desig.includes('chief') ||
        desig.includes('quality director')
      ) {
        role = 'LEADER';
        tier = 'LEADERS';
      } else if (
        desig.includes('head') ||
        desig.includes('incharge') ||
        desig.includes('in charge') ||
        desig.includes('manager') ||
        desig.includes('lead') ||
        desig.includes('consultant')
      ) {
        role = 'DEPARTMENT_HEAD';
        tier = 'INCHARGES';
      } else {
        role = 'STAVYAN';
        tier = 'EMPLOYEES';
      }

      // Determine Capabilities
      const capabilities: string[] = ['TASK_READ', 'TASK_CREATE', 'TASK_COMPLETE'];
      const permissions: string[] = ['user.read', 'department.read', 'task.read', 'task.create', 'task.complete'];

      // Quality Command Centre Access Grant
      const isQualityPerson =
        tier === 'GOVERNANCE' ||
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

      if (tier === 'GOVERNANCE') {
        capabilities.push(
          'SUPER_ADMIN',
          'RACI_MANAGE',
          'TASK_MANAGE',
          'GOVERNANCE_VIEW',
          'POLICIES_AUTHOR',
          'INTAKE_DISPATCH',
          'TEAM_DELEGATE',
          'TEAM_VERIFY',
          'TEAM_AUDIT'
        );
        permissions.push('*');
      } else if (tier === 'LEADERS' || tier === 'INCHARGES') {
        capabilities.push(
          'RACI_MANAGE',
          'TASK_MANAGE',
          'POLICIES_AUTHOR',
          'INTAKE_DISPATCH',
          'TEAM_DELEGATE',
          'TEAM_VERIFY',
          'TEAM_AUDIT'
        );
        permissions.push(
          'task.assign',
          'task.create',
          'meeting.create',
          'priority.read',
          'milestone.read',
          'stuck.create',
          'team.tasks.delegate',
          'team.tasks.verify',
          'team.tasks.audit',
          'team.tasks.realtime_progress'
        );
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
      let employeeCode = `STAVYA-${staff.id.replace('e', '').padStart(3, '0')}`;
      if (role === 'MANAGING_DIRECTOR' || name.includes('Mirant')) {
        employeeCode = 'STAVYA-001';
      } else if (staffId === 'e057' || (name.includes('Bharat') && !name.includes('Mirant'))) {
        employeeCode = 'STAVYA-000';
      }

      // Email generation / resolution
      let email = staff.email;
      if (!email || !email.includes('@')) {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
        email = `${cleanName}@stavyaspine.com`;
      } else {
        email = email.toLowerCase().trim();
      }

      newAccounts[staffId] = {
        id: staffId,
        loginId: employeeCode,
        employeeCode,
        numericCode: staff.code || staff.id.replace('e', ''),
        name: staff.name,
        email,
        mobile: staff.mobile || '+91 98250 00000',
        designation: staff.desig || 'Hospital Staff Member',
        departmentName: staff.unit || staff.dept_master || 'Hospital Administration',
        departmentMaster: staff.dept_master || staff.unit || 'General Operations',
        unit: staff.unit || 'General',
        tier,
        role,
        roleTitle: staff.desig || 'Hospital Team Member',
        defaultPassword: DEFAULT_HOSPITAL_PASSWORD,
        password: DEFAULT_HOSPITAL_PASSWORD,
        accessStatus: 'ACTIVE',
        capabilities,
        permissions,
        isChapterChampion,
        chapterAssigned,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-30T12:00:00Z',
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

  public getAccountsByTier(tier: AuthorityTier): EmployeeAccount[] {
    return Object.values(this.accounts).filter(a => a.tier === tier);
  }

  public getAccountById(id: string): EmployeeAccount | null {
    return this.accounts[id] || null;
  }

  public getAccountByCode(code: string): EmployeeAccount | null {
    const clean = code.trim().toUpperCase();
    if (clean === 'STAVYA-001' || clean === 'STAVYANS-001' || clean === 'MD' || clean === 'MANAGING_DIRECTOR') {
      return Object.values(this.accounts).find(a => a.role === 'MANAGING_DIRECTOR' || a.id === 'e071') || null;
    }
    if (clean === 'STAVYA-000' || clean === 'STAVYANS-000' || clean === 'MASTER' || clean === 'ADMIN') {
      return Object.values(this.accounts).find(a => a.role === 'MASTER' || a.id === 'e000' || a.id === 'e057') || null;
    }
    return (
      Object.values(this.accounts).find(
        acc =>
          acc.employeeCode.toUpperCase() === clean ||
          acc.loginId.toUpperCase() === clean ||
          acc.numericCode === clean ||
          acc.id.toUpperCase() === clean
      ) || null
    );
  }

  public getAccountByEmailOrName(query: string): EmployeeAccount | null {
    const clean = query.trim().toLowerCase();
    return (
      Object.values(this.accounts).find(
        acc => acc.email.toLowerCase() === clean || acc.name.toLowerCase().includes(clean)
      ) || null
    );
  }

  /**
   * Search real hospital accounts by text query and optional tier filter
   */
  public searchAccounts(query: string, tierFilter?: string): EmployeeAccount[] {
    const clean = query.trim().toLowerCase();
    return Object.values(this.accounts).filter((acc) => {
      if (tierFilter && tierFilter !== 'ALL') {
        if (tierFilter === 'CHAMPIONS') {
          if (!acc.isChapterChampion) return false;
        } else if (acc.tier !== tierFilter) {
          return false;
        }
      }

      if (!clean) return true;

      return (
        acc.name.toLowerCase().includes(clean) ||
        acc.employeeCode.toLowerCase().includes(clean) ||
        acc.loginId.toLowerCase().includes(clean) ||
        acc.numericCode.includes(clean) ||
        acc.id.toLowerCase().includes(clean) ||
        acc.email.toLowerCase().includes(clean) ||
        acc.designation.toLowerCase().includes(clean) ||
        acc.departmentName.toLowerCase().includes(clean)
      );
    });
  }

  /**
   * Authenticate employee by Login ID, Code, Raw ID, Email, or Name with flexible password check
   */
  public authenticate(identifier: string, password?: string): EmployeeAccount {
    const cleanId = identifier.trim().toUpperCase();
    const cleanLower = identifier.trim().toLowerCase();

    const accountsList = Object.values(this.accounts);

    // 1. Check MD & Master Direct Aliases
    let account: EmployeeAccount | undefined;
    if (cleanId === 'STAVYA-001' || cleanId === 'STAVYANS-001' || cleanId === 'MD' || cleanId === 'MANAGING_DIRECTOR') {
      account = accountsList.find(a => a.role === 'MANAGING_DIRECTOR' || a.id === 'e071');
    } else if (cleanId === 'STAVYA-000' || cleanId === 'STAVYANS-000' || cleanId === 'MASTER' || cleanId === 'ADMIN') {
      account = accountsList.find(a => a.role === 'MASTER' || a.id === 'e000' || a.id === 'e057');
    } else if (cleanId === 'STAVYA-002' || cleanId === 'STAVYANS-002' || cleanId === 'LEADER' || cleanId === 'LEADERS') {
      account = accountsList.find(a => a.role === 'LEADER') || this.accounts['e048'];
    } else if (cleanId === 'STAVYA-101' || cleanId === 'STAVYANS-101' || cleanId === 'EMPLOYEE' || cleanId === 'STAVYANS' || cleanId === 'STAVYAN') {
      account = accountsList.find(a => a.role === 'STAVYAN' || a.role === 'EMPLOYEE') || accountsList[10];
    }

    // 2. Direct Match by Raw ID (e.g. e000, e048, e071)
    if (!account) {
      account = accountsList.find(acc => acc.id.toUpperCase() === cleanId);
    }

    // 3. Direct Match by Employee Code / Login ID (e.g. STAVYA-048, STAVYA-113)
    if (!account) {
      account = accountsList.find(
        acc => acc.employeeCode.toUpperCase() === cleanId || acc.loginId.toUpperCase() === cleanId
      );
    }

    // 4. Direct Match by Numeric Code (e.g. 113, 048)
    if (!account) {
      account = accountsList.find(acc => acc.numericCode === identifier.trim());
    }

    // 5. Match by Email or Email Alias
    if (!account) {
      account = accountsList.find(acc => acc.email.toLowerCase() === cleanLower);
      if (!account) {
        if (cleanLower === 'dr.mirant.dave@stavyaspine.com' || cleanLower === 'mirant@stavyaspine.com' || cleanLower === 'md@stavya.org' || cleanLower === 'md@stavya.local') {
          account = accountsList.find(a => a.role === 'MANAGING_DIRECTOR' || a.id === 'e071');
        } else if (cleanLower === 'dr.bharat.dave@stavyaspine.com' || cleanLower === 'bharat@stavyaspine.com' || cleanLower === 'master@stavya.local') {
          account = accountsList.find(a => a.name.includes('Bharat') && a.role === 'MASTER');
        } else if (cleanLower === 'het.bhatt@stavyaspine.com' || cleanLower === 'hetbhatt10@gmail.com') {
          account = accountsList.find(a => a.name.includes('Het'));
        }
      }
    }

    // 6. Match by Exact or Partial Name
    if (!account) {
      account = accountsList.find(acc => acc.name.toLowerCase() === cleanLower);
      if (!account) {
        account = accountsList.find(acc => acc.name.toLowerCase().includes(cleanLower));
      }
    }

    if (!account) {
      throw new Error(`Employee record "${identifier}" not found in Stavya Hospital database.`);
    }

    if (account.accessStatus === 'SUSPENDED') {
      throw new Error(`Account for ${account.name} (${account.employeeCode}) has been SUSPENDED by Master Admin.`);
    }

    // Validate Password:
    // Accept standard hospital password, dev PINs, or numeric code variations
    const validPasswords = [
      DEFAULT_HOSPITAL_PASSWORD,
      'stavya2026',
      'Stavya@2026',
      '1234',
      'password123',
      '••••••••••••',
      'securepass123',
      'admin123',
      `Stavya#${account.numericCode}`,
      account.password,
    ].filter(Boolean);

    if (password && !validPasswords.includes(password)) {
      throw new Error(`Invalid credentials. (Default password: ${DEFAULT_HOSPITAL_PASSWORD} or 1234)`);
    }

    // Record last login
    account.lastLoginAt = new Date().toISOString();
    this.persist();

    return account;
  }

  /**
   * Master Admin / User: Update account password
   */
  public updatePassword(id: string, newPassword: string): EmployeeAccount {
    const account = this.accounts[id];
    if (!account) throw new Error(`Staff member with ID ${id} not found.`);

    account.password = newPassword;
    account.updatedAt = new Date().toISOString();
    this.persist();
    return account;
  }

  /**
   * Master Admin: Update privileges, role, status, and capabilities for any staff member
   */
  public updateEmployeePrivileges(
    id: string,
    updates: Partial<Pick<EmployeeAccount, 'role' | 'roleTitle' | 'accessStatus' | 'capabilities' | 'permissions' | 'departmentName' | 'tier'>>
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
export { DEFAULT_HOSPITAL_PASSWORD };
