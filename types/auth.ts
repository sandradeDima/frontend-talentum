export type UserRole = 'ADMIN' | 'CLIENT_ADMIN';
export type SocialProvider = 'google' | 'microsoft';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  companySlug: string | null;
  isActive?: boolean;
};

export type AuthSession = {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
};

export type MeResponse = {
  session: AuthSession;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
  companySlug?: string;
};

export type LoginResponse = {
  redirect?: boolean;
  token?: string;
  url?: string;
  user: AuthUser;
};

export type SocialStartResponse = {
  provider: SocialProvider;
  url: string;
};

export type SocialFinalizeInput = {
  companySlug?: string;
};

export type SocialFinalizeResponse = {
  user: AuthUser;
  redirectPath: string;
  activatedBySocialLogin: boolean;
};

export type CompanyContext = {
  id: string;
  name: string;
  slug: string;
  status: 'PENDING_SETUP' | 'ACTIVE' | 'INACTIVE';
  logoUrl: string | null;
};
