import { requestApiClient } from '@/lib/api-client-browser';
import type {
  AutosaveSurveyResponseInput,
  AutosaveSurveyResponseResult,
  StartSurveyResponseInput,
  StartSurveyResponseResult,
  SubmitSurveyResponseInput,
  SubmitSurveyResponseResult,
  ValidateSurveyAccessInput,
  ValidateSurveyAccessResult
} from '@/types/respondent-survey';

export const validateSurveyAccessClient = async (input: ValidateSurveyAccessInput) => {
  return requestApiClient<ValidateSurveyAccessResult>('/survey-access/validate', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};

export const startSurveyResponseClient = async (input: StartSurveyResponseInput) => {
  return requestApiClient<StartSurveyResponseResult>('/survey-response/start', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};

export const autosaveSurveyResponseClient = async (
  input: AutosaveSurveyResponseInput
) => {
  return requestApiClient<AutosaveSurveyResponseResult>('/survey-response/autosave', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};

export const submitSurveyResponseClient = async (input: SubmitSurveyResponseInput) => {
  return requestApiClient<SubmitSurveyResponseResult>('/survey-response/submit', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};
