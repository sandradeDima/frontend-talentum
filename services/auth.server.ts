import { requestApiServer } from '@/lib/api-client-server';
import type { CompanyContext, MeResponse } from '@/types/auth';

export const getMeServer = async (): Promise<MeResponse> => {
  return requestApiServer<MeResponse>('/auth/me');
};

export const getCompanyContextBySlugServer = async (
  companySlug: string
): Promise<CompanyContext> => {
  return requestApiServer<CompanyContext>(
    `/auth/company-context/${encodeURIComponent(companySlug)}`
  );
};
