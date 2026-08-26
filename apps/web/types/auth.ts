export type Persona = 'MD' | 'MD_OFFICE' | 'DEPARTMENT_HEAD' | 'MANAGER' | 'EMPLOYEE';

export interface BackendUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  organization_id: string;
  department_id?: string | null;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
}

export interface SessionSummary {
  id: string;
  issued_at: string;
  expires_at: string;
  last_activity_at: string;
}

export interface CurrentUserResponse {
  user: BackendUser;
  organization_id: string;
  organization_slug: string;
  session: SessionSummary;
  roles: string[];
  permissions: string[];
  department_ids: string[];
  must_change_password: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Persona;
  roleTitle: string;
  departmentId: string;
  departmentName: string;
  avatarUrl?: string;
  roles?: string[];
  permissions?: string[];
  organizationId?: string;
  organizationSlug?: string;
  mustChangePassword?: boolean;
}

export type Capability = string;

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  csrfToken?: string;
  roles: string[];
  permissions: string[];
  mustChangePassword?: boolean;
}
