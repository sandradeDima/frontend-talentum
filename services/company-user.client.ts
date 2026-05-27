import { requestApiClient } from '@/lib/api-client-browser';
import type {
  CompanyUserRow,
  CreateCompanyUserResult,
  CreateGlobalAdminInput,
  CreateCompanyUserInput,
  ResendCompanyUserInviteResult,
  ResetCompanyUserPasswordResult,
  UpdateCompanyUserInput
} from '@/types/company-user';

export const createGlobalAdminClient = async (input: CreateGlobalAdminInput) => {
  return requestApiClient<{ user: CompanyUserRow }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};

export const createCompanyUserClient = async (
  companySlug: string,
  input: CreateCompanyUserInput
) => {
  return requestApiClient<CreateCompanyUserResult>(
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
  return requestApiClient<ResetCompanyUserPasswordResult>(
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
  return requestApiClient<ResendCompanyUserInviteResult>(
    `/companies/${encodeURIComponent(companySlug)}/users/${encodeURIComponent(userId)}/resend-invite`,
    {
      method: 'POST'
    }
  );
};
