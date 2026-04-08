import { requestApiServer } from '@/lib/api-client-server';
import type {
  GlobalSurveyCampaignListData,
  SurveyCampaignDetail,
  SurveyCampaignListData,
  SurveyCampaignStatus
} from '@/types/survey';

export const getSurveyCampaignsByCompanySlugServer = async (companySlug: string) => {
  return requestApiServer<SurveyCampaignListData>(
    `/companies/${encodeURIComponent(companySlug)}/surveys`
  );
};

export const getSurveyCampaignBySlugServer = async (
  companySlug: string,
  surveySlug: string
) => {
  return requestApiServer<SurveyCampaignDetail>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}`
  );
};

export const getGlobalSurveyCampaignsServer = async (params: {
  page?: number;
  pageSize?: number;
  search?: string;
  company?: string;
  status?: SurveyCampaignStatus;
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

  if (params.status) {
    query.set('status', params.status);
  }

  const queryString = query.toString();
  const path = queryString ? `/admin/surveys?${queryString}` : '/admin/surveys';
  return requestApiServer<GlobalSurveyCampaignListData>(path);
};
