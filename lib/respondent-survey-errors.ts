import { extractErrorMessage } from '@/lib/auth-shared';
import { ApiRequestError } from '@/types/api';

export type RespondentAccessIssueKind = 'invalid' | 'expired' | 'locked' | 'temporary';

export type RespondentAccessIssue = {
  kind: RespondentAccessIssueKind;
  title: string;
  description: string;
  technicalCode: string | null;
};

const COMPLETED_LOCKOUT_CODES = new Set([
  'RESPONDENT_ACCESS_CONSUMED',
  'SURVEY_RESPONSE_ALREADY_SUBMITTED'
]);

const BLOCKED_LOCKOUT_CODES = new Set(['RESPONDENT_ACCESS_REVOKED', 'RESPONDENT_INACTIVE']);

const EXPIRED_CODES = new Set([
  'RESPONDENT_ACCESS_EXPIRED',
  'SURVEY_SESSION_EXPIRED',
  'SURVEY_CAMPAIGN_FINISHED',
  'SURVEY_CAMPAIGN_DATE_FINISHED'
]);

const INVALID_CODES = new Set([
  'RESPONDENT_ACCESS_INVALID',
  'RESPONDENT_IDENTIFIER_REQUIRED',
  'INVALID_SURVEY_CAMPAIGN_SLUG',
  'SURVEY_SESSION_INVALID',
  'RESPONDENT_ONLY_ENDPOINT',
  'SURVEY_CAMPAIGN_NOT_AVAILABLE',
  'SURVEY_CAMPAIGN_NOT_STARTED'
]);

export const FATAL_RUNNER_CODES = new Set([
  'SURVEY_SESSION_INVALID',
  'SURVEY_SESSION_EXPIRED',
  'RESPONDENT_ACCESS_REVOKED',
  'RESPONDENT_ACCESS_CONSUMED',
  'RESPONDENT_ACCESS_EXPIRED',
  'RESPONDENT_INACTIVE',
  'SURVEY_RESPONSE_ALREADY_SUBMITTED',
  'SURVEY_CAMPAIGN_FINISHED',
  'SURVEY_CAMPAIGN_DATE_FINISHED',
  'SURVEY_CAMPAIGN_NOT_AVAILABLE',
  'SURVEY_CAMPAIGN_NOT_STARTED'
]);

export const parseRespondentTechnicalCode = (
  technicalMessage: string | null
): string | null => {
  if (!technicalMessage) {
    return null;
  }

  const raw = technicalMessage.trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as { code?: unknown };
      if (typeof parsed.code === 'string' && parsed.code.trim().length > 0) {
        return parsed.code.trim();
      }
    } catch {
      return raw;
    }
  }

  return raw;
};

export const mapTechnicalCodeToAccessIssue = (
  technicalCode: string | null,
  fallbackDescription: string
): RespondentAccessIssue => {
  if (technicalCode === 'RESPONDENT_ONLY_ENDPOINT') {
    return {
      kind: 'invalid',
      title: 'Acceso reservado para respondentes',
      description:
        'Este enlace no está disponible mientras exista una sesión administrativa activa. Cierra sesión e inténtalo nuevamente.',
      technicalCode
    };
  }

  if (technicalCode && INVALID_CODES.has(technicalCode)) {
    return {
      kind: 'invalid',
      title: 'Acceso inválido',
      description: fallbackDescription,
      technicalCode
    };
  }

  if (technicalCode && EXPIRED_CODES.has(technicalCode)) {
    return {
      kind: 'expired',
      title: 'Acceso expirado',
      description: fallbackDescription,
      technicalCode
    };
  }

  if (technicalCode && COMPLETED_LOCKOUT_CODES.has(technicalCode)) {
    return {
      kind: 'locked',
      title: 'Encuesta ya completada',
      description: fallbackDescription,
      technicalCode
    };
  }

  if (technicalCode && BLOCKED_LOCKOUT_CODES.has(technicalCode)) {
    return {
      kind: 'locked',
      title: 'Encuesta bloqueada',
      description: fallbackDescription,
      technicalCode
    };
  }

  return {
    kind: 'temporary',
    title: 'Error temporal',
    description: fallbackDescription,
    technicalCode
  };
};

export const resolveRespondentAccessIssue = (
  error: unknown
): RespondentAccessIssue => {
  const fallbackDescription = extractErrorMessage(error);
  const technicalCode =
    error instanceof ApiRequestError
      ? parseRespondentTechnicalCode(error.mensajeTecnico)
      : null;

  return mapTechnicalCodeToAccessIssue(technicalCode, fallbackDescription);
};

export const isCompletedLockoutCode = (technicalCode: string | null): boolean => {
  if (!technicalCode) {
    return false;
  }

  return COMPLETED_LOCKOUT_CODES.has(technicalCode);
};
