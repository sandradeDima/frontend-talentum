import type { SurveyCampaignStatus } from '@/types/survey';
import type { RespondentImportMimeType } from '@/types/survey-operations';

const RESPONDENT_IMPORT_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const;

const respondentImportMimeTypeSet = new Set<string>(RESPONDENT_IMPORT_MIME_TYPES);

const mimeTypeByExtension: Record<string, RespondentImportMimeType> = {
  csv: 'text/csv',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const normalizeMimeType = (value: string): string => {
  return value.trim().toLowerCase();
};

const resolveExtension = (fileName: string): string => {
  const parts = fileName.trim().split('.');
  if (parts.length < 2) {
    return '';
  }

  return parts[parts.length - 1]?.toLowerCase() ?? '';
};

export const resolveRespondentImportMimeType = (input: {
  fileName: string;
  mimeType: string;
}): RespondentImportMimeType | null => {
  const normalizedMimeType = normalizeMimeType(input.mimeType);

  if (respondentImportMimeTypeSet.has(normalizedMimeType)) {
    return normalizedMimeType as RespondentImportMimeType;
  }

  const extension = resolveExtension(input.fileName);
  if (!extension) {
    return null;
  }

  return mimeTypeByExtension[extension] ?? null;
};

export const isSurveyImportEnabled = (status: SurveyCampaignStatus): boolean => {
  return status !== 'BORRADOR' && status !== 'FINALIZADA';
};

export const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
