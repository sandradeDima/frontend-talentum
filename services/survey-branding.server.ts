import { requestApiServer } from '@/lib/api-client-server';
import type { CompanyBranding } from '@/types/survey-branding';

export const getSurveyBrandingServer = async (campaignSlug: string) => {
  return requestApiServer<CompanyBranding>(
    `/survey-access/branding/${encodeURIComponent(campaignSlug)}`
  );
};
