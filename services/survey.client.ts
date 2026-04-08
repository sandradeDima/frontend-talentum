import { requestApiClient } from '@/lib/api-client-browser';
import type {
  ConfigureSurveyRemindersInput,
  ScheduleSurveySendInput,
  SurveyCampaignDetail,
  SurveyCampaignUpsertInput
} from '@/types/survey';

export const createSurveyCampaignClient = async (
  companySlug: string,
  input: SurveyCampaignUpsertInput
) => {
  return requestApiClient<SurveyCampaignDetail>(
    `/companies/${encodeURIComponent(companySlug)}/surveys`,
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  );
};

export const updateSurveyCampaignClient = async (
  companySlug: string,
  surveySlug: string,
  input: SurveyCampaignUpsertInput
) => {
  return requestApiClient<SurveyCampaignDetail>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input)
    }
  );
};

export const scheduleSurveySendClient = async (
  companySlug: string,
  surveySlug: string,
  input: ScheduleSurveySendInput
) => {
  return requestApiClient<SurveyCampaignDetail>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}/schedule-send`,
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  );
};

export const configureSurveyRemindersClient = async (
  companySlug: string,
  surveySlug: string,
  input: ConfigureSurveyRemindersInput
) => {
  return requestApiClient<SurveyCampaignDetail>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}/reminders`,
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  );
};

export const closeSurveyCampaignClient = async (
  companySlug: string,
  surveySlug: string
) => {
  return requestApiClient<SurveyCampaignDetail>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}/close`,
    {
      method: 'POST',
      body: JSON.stringify({})
    }
  );
};

export const finalizeSurveyCampaignClient = async (
  companySlug: string,
  surveySlug: string
) => {
  return requestApiClient<SurveyCampaignDetail>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}/finalize`,
    {
      method: 'POST',
      body: JSON.stringify({})
    }
  );
};
