import { requestApiServer } from '@/lib/api-client-server';
import type { SurveyCampaignOperationsSummary } from '@/types/survey-operations';

export const getSurveyCampaignOperationsSummaryServer = async (
  companySlug: string,
  surveySlug: string
) => {
  return requestApiServer<SurveyCampaignOperationsSummary>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}/operations/summary`
  );
};
