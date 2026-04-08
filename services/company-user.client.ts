import { requestApiClient } from '@/lib/api-client-browser';
import type {
  CompanyUserRow,
  CreateCompanyUserInput,
  UpdateCompanyUserInput
} from '@/types/company-user';

export const createCompanyUserClient = async (
  companySlug: string,
  input: CreateCompanyUserInput
) => {
  return requestApiClient<{ user: CompanyUserRow }>(
    `/companies/${encodeURIComponent(companySlug)}/users`,
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  );
};

export const updateCompanyUserClient = async (
  companySlug: string,
  userId: string,
  input: UpdateCompanyUserInput
) => {
  return requestApiClient<CompanyUserRow>(
    `/companies/${encodeURIComponent(companySlug)}/users/${encodeURIComponent(userId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input)
    }
  );
};

export const deactivateCompanyUserClient = async (
  companySlug: string,
  userId: string
) => {
  return requestApiClient<CompanyUserRow>(
    `/companies/${encodeURIComponent(companySlug)}/users/${encodeURIComponent(userId)}/deactivate`,
    {
      method: 'PATCH'
    }
  );
};

export const resetCompanyUserPasswordClient = async (
  companySlug: string,
  userId: string
) => {
  return requestApiClient<{ email: string; expiresAt: string }>(
    `/companies/${encodeURIComponent(companySlug)}/users/${encodeURIComponent(userId)}/reset-password`,
    {
      method: 'POST'
    }
  );
};

export const resendCompanyUserInviteClient = async (
  companySlug: string,
  userId: string
) => {
  return requestApiClient<{ invitationId: string; email: string; expiresAt: string }>(
    `/companies/${encodeURIComponent(companySlug)}/users/${encodeURIComponent(userId)}/resend-invite`,
    {
      method: 'POST'
    }
  );
};
