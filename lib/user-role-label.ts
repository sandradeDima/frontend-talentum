import type { UserRole } from '@/types/auth';
import type { CompanyUserRole } from '@/types/company-user';

type SupportedRole = UserRole | CompanyUserRole;

const ROLE_LABELS: Record<SupportedRole, string> = {
  ADMIN: 'Administrador global',
  CLIENT_ADMIN: 'Perfil de empresa'
};

export const getUserRoleLabel = (role: SupportedRole) => {
  return ROLE_LABELS[role];
};
