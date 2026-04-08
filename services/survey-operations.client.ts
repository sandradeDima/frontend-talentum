import { requestApiClient } from '@/lib/api-client-browser';
import { resolveRespondentImportMimeType } from '@/lib/survey-operations';
import type {
  ImportSurveyRespondentsInput,
  ImportSurveyRespondentsResult,
  RespondentListResult,
  SurveyCampaignOperationsSummary
} from '@/types/survey-operations';

const fileToBase64 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index] as number);
  }

  return btoa(binary);
};

export const importSurveyRespondentsClient = async (
  companySlug: string,
  surveySlug: string,
  input: ImportSurveyRespondentsInput
) => {
  const mimeType = resolveRespondentImportMimeType({
    fileName: input.file.name,
    mimeType: input.file.type
  });

  if (!mimeType) {
    throw new Error(
      'Formato no soportado. Usa CSV, XLS o XLSX para cargar participantes.'
    );
  }

  const base64 = await fileToBase64(input.file);

  return requestApiClient<ImportSurveyRespondentsResult>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}/respondents/import`,
    {
      method: 'POST',
      body: JSON.stringify({
        fileName: input.file.name,
        mimeType,
        base64,
        dryRun: input.dryRun ?? false,
        generateCredentials: input.generateCredentials ?? true,
        credentialType: input.credentialType ?? 'TOKEN',
        ...(input.credentialExpiresAt
          ? { credentialExpiresAt: input.credentialExpiresAt }
          : {}),
        regenerateCredentials: input.regenerateCredentials ?? false,
        sendInvitations: input.sendInvitations ?? false,
        includeRawCredentials: input.includeRawCredentials ?? false
      })
    }
  );
};

export const sendSurveyInvitationsNowClient = async (
  companySlug: string,
  surveySlug: string
) => {
  return requestApiClient<{ summary: { respondents: number; invitationsSent: number; invitationFailures: number } }>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}/respondents/invitations/send`,
    { method: 'POST' }
  );
};

export const getSurveyCampaignOperationsSummaryClient = async (
  companySlug: string,
  surveySlug: string
) => {
  return requestApiClient<SurveyCampaignOperationsSummary>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}/operations/summary`
  );
};

export const listSurveyRespondentsClient = async (
  companySlug: string,
  surveySlug: string
) => {
  return requestApiClient<RespondentListResult>(
    `/companies/${encodeURIComponent(companySlug)}/surveys/${encodeURIComponent(surveySlug)}/respondents`
  );
};
