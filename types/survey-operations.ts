import type { RespondentCredentialType, SurveyResponseStatus } from '@/types/respondent-survey';

export type RespondentImportMimeType =
  | 'text/csv'
  | 'application/csv'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type ImportSurveyRespondentsSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdRespondents?: number;
  updatedRespondents?: number;
  credentialsGenerated?: number;
  invitationsSent?: number;
  invitationFailures?: number;
};

export type ImportSurveyRespondentRowError = {
  rowNumber: number;
  identifier: string | null;
  errors: string[];
};

export type ImportSurveyRespondentCredentialPreview = {
  respondentId: string;
  identifier: string | null;
  credentialType: RespondentCredentialType;
  rawCredential?: string;
  expiresAt: string;
  reused: boolean;
};

export type ImportSurveyRespondentInvitationFailure = {
  respondentId: string;
  reason: string;
};

export type ImportSurveyRespondentsResult = {
  dryRun: boolean;
  summary: ImportSurveyRespondentsSummary;
  errors: ImportSurveyRespondentRowError[];
  credentials?: ImportSurveyRespondentCredentialPreview[];
  invitationFailures?: ImportSurveyRespondentInvitationFailure[];
};

export type ImportSurveyRespondentsInput = {
  file: File;
  dryRun?: boolean;
  generateCredentials?: boolean;
  credentialType?: RespondentCredentialType;
  credentialExpiresAt?: string;
  regenerateCredentials?: boolean;
  sendInvitations?: boolean;
  includeRawCredentials?: boolean;
};

export type SurveyCampaignOperationsSummary = {
  survey: {
    id: string;
    slug: string;
    name: string;
    status: 'BORRADOR' | 'CREADA' | 'EN_PROCESO' | 'FINALIZADA';
    startDate: string;
    endDate: string;
  };
  participants: {
    total: number;
    active: number;
    inactive: number;
    withEmail: number;
    withoutEmail: number;
    lastImportedAt: string | null;
  };
  responses: {
    notStarted: number;
    inProgress: number;
    submitted: number;
    completionRate: number;
  };
  credentials: {
    totalIssued: number;
    active: number;
    expired: number;
    consumed: number;
    revoked: number;
    byType: {
      TOKEN: number;
      PIN: number;
    };
    latestIssuedAt: string | null;
  };
  reminders: {
    totalSchedules: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    nextScheduledAt: string | null;
    lastProcessedAt: string | null;
  };
};

export type RespondentListItem = {
  id: string;
  identifier: string | null;
  fullName: string | null;
  email: string | null;
  gerencia: string | null;
  centro: string | null;
  isActive: boolean;
  invitedAt: string;
  responseStatus: SurveyResponseStatus | null;
};

export type RespondentListResult = RespondentListItem[];
