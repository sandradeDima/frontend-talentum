import { requestApiServer } from '@/lib/api-client-server';
import type {
  CompanyUserActivationStatus,
  CompanyUserListData,
  GlobalCompanyUserListData
} from '@/types/company-user';

export const getCompanyUsersBySlugServer = async (companySlug: string) => {
  return requestApiServer<CompanyUserListData>(
    `/companies/${encodeURIComponent(companySlug)}/users`
  );
};

export const getGlobalCompanyUsersServer = async (params: {
  page?: number;
  pageSize?: number;
  search?: string;
  company?: string;
  activationStatus?: CompanyUserActivationStatus;
}) => {
  const query = new URLSearchParams();

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.pageSize) {
    query.set('pageSize', String(params.pageSize));
  }

  if (params.search) {
    query.set('search', params.search);
  }

  if (params.company) {
    query.set('company', params.company);
  }

  if (params.activationStatus) {
    query.set('activationStatus', params.activationStatus);
  }

  const queryString = query.toString();
  const path = queryString ? `/admin/users?${queryString}` : '/admin/users';
  return requestApiServer<GlobalCompanyUserListData>(path);
};
