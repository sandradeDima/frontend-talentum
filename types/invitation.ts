import type { CompanyStatus } from './company';
import type { AuthUser } from './auth';

export type InvitationValidationData = {
  email: string;
  role: 'CLIENT_ADMIN';
  expiresAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    status: CompanyStatus;
  };
};

export type AcceptInvitationInput = {
  token: string;
  name: string;
  password: string;
};

export type AcceptInvitationData = {
  user: AuthUser;
  company?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    workerCount: number;
    contactEmail: string;
    status: CompanyStatus;
    createdAt: string;
  };
};
