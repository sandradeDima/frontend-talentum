import type { SurveyCampaignStatus } from '@/types/survey';

export type RespondentCredentialType = 'TOKEN' | 'PIN';

export type SurveyResponseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';

export type ValidateSurveyAccessInput = {
  campaignSlug: string;
  credentialType: RespondentCredentialType;
  credential: string;
  respondentIdentifier?: string;
};

export type StartSurveyResponseInput = {
  sessionToken: string;
};

export type SurveySectionKey = 'leader' | 'team' | 'organization' | 'final';

export type SurveyAnswerInput = {
  questionKey: string;
  sectionKey?: SurveySectionKey | null;
  value: string | number | boolean | null | Array<unknown> | Record<string, unknown>;
};

export type AutosaveSurveyResponseInput = {
  sessionToken: string;
  answers: SurveyAnswerInput[];
};

export type SubmitSurveyResponseInput = {
  sessionToken: string;
  answers?: SurveyAnswerInput[];
};

export type SurveyCampaignExecutionContext = {
  id: string;
  slug: string;
  name: string;
  status: SurveyCampaignStatus;
  startDate: string;
  endDate: string;
  tutorialVideoUrl: string | null;
  content: {
    introGeneral: string;
    leaderIntro: string;
    leaderQuestions: string[];
    leaderExtraQuestion: string | null;
    teamIntro: string;
    teamQuestions: string[];
    teamExtraQuestion: string | null;
    organizationIntro: string;
    organizationQuestions: string[];
    organizationExtraQuestion: string | null;
    finalNpsQuestion: string;
    finalOpenQuestion: string;
    closingText: string;
  };
};

export type SurveyResponseLifecycle = {
  id: string;
  status: SurveyResponseStatus;
  startedAt: string | null;
  lastActivityAt: string | null;
  submittedAt: string | null;
  sessionExpiresAt: string | null;
};

export type ValidateSurveyAccessResult = {
  sessionToken: string;
  sessionExpiresAt: string;
  campaign: SurveyCampaignExecutionContext;
  respondent: {
    id: string;
    identifier: string;
    fullName: string;
  };
  response: SurveyResponseLifecycle;
};

export type StartSurveyResponseResult = {
  response: SurveyResponseLifecycle;
  sessionExpiresAt: string;
};

export type AutosaveSurveyResponseResult = {
  responseId: string;
  status: SurveyResponseStatus;
  savedAnswers: number;
  lastActivityAt: string;
  sessionExpiresAt: string;
};

export type SubmitSurveyResponseResult = {
  responseId: string;
  status: SurveyResponseStatus;
  submittedAt: string;
};
