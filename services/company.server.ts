import { requestApiServer } from '@/lib/api-client-server';
import type { CompanyListData, CompanyRow, CompanyStatus } from '@/types/company';

export const getCompaniesServer = async (params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CompanyStatus;
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

  if (params.status) {
    query.set('status', params.status);
  }

  const queryString = query.toString();
  const path = queryString ? `/companies?${queryString}` : '/companies';
  return requestApiServer<CompanyListData>(path);
};

export const getCompanyByIdServer = async (companyId: string) => {
  return requestApiServer<CompanyRow>(`/companies/${companyId}`);
};

export const getCompanyBySlugServer = async (companySlug: string) => {
  return requestApiServer<CompanyRow>(
    `/companies/by-slug/${encodeURIComponent(companySlug)}`
  );
};
