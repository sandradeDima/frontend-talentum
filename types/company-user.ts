export type CompanyUserRole = 'ADMIN' | 'CLIENT_ADMIN';

export type CompanyUserActivationStatus =
  | 'PENDIENTE_ACTIVACION'
  | 'ACTIVO'
  | 'INACTIVO';

export type CompanyUserRow = {
  id: string;
  name: string;
  lastName: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: CompanyUserRole;
  activationStatus: CompanyUserActivationStatus;
  isActive: boolean;
  status: CompanyUserActivationStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  hasCredentialAccess: boolean;
  hasGoogleLinked: boolean;
  hasMicrosoftLinked: boolean;
  hasSocialAccess: boolean;
  isSocialOnly: boolean;
  accessModeLabel: string;
  canResendInvite: boolean;
  canResetPassword: boolean;
};

export type CompanyUserListData = {
  company: {
    id: string;
    slug: string;
    name: string;
  };
  rows: CompanyUserRow[];
};

export type GlobalCompanyUserRow = CompanyUserRow & {
  company: {
    id: string;
    name: string;
    slug: string;
    status: 'PENDING_SETUP' | 'ACTIVE' | 'INACTIVE';
  } | null;
};

export type GlobalCompanyUserListData = {
  rows: GlobalCompanyUserRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CreateCompanyUserInput = {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  role?: CompanyUserRole;
};

export type UpdateCompanyUserInput = {
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: CompanyUserRole;
  activationStatus?: CompanyUserActivationStatus;
};

export type CreateGlobalAdminInput = {
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
};
