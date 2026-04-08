type StoredAnswerValue = string | number;

export type StoredSurveyProgressSnapshot = {
  version: 2;
  savedAt: string;
  lastSavedAt: string | null;
  currentPageIndex: number;
  answers: Record<string, StoredAnswerValue>;
};

const STORAGE_PREFIX = 'talentum:survey-progress:';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isStoredAnswerValue = (value: unknown): value is StoredAnswerValue => {
  if (typeof value === 'string') {
    return true;
  }

  return typeof value === 'number' && Number.isFinite(value);
};

const sanitizeAnswers = (rawValue: unknown): Record<string, StoredAnswerValue> => {
  if (!isRecord(rawValue)) {
    return {};
  }

  const answers: Record<string, StoredAnswerValue> = {};

  Object.entries(rawValue).forEach(([key, value]) => {
    if (typeof key !== 'string' || key.trim().length === 0) {
      return;
    }

    if (isStoredAnswerValue(value)) {
      answers[key] = value;
    }
  });

  return answers;
};

export const buildSurveyProgressStorageKey = (
  campaignId: string,
  respondentId: string
): string => {
  return `${STORAGE_PREFIX}${campaignId}:${respondentId}`;
};

export const loadSurveyProgressSnapshot = (
  storageKey: string
): StoredSurveyProgressSnapshot | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    if (parsed.version !== 2) {
      return null;
    }

    return {
      version: 2,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      lastSavedAt: typeof parsed.lastSavedAt === 'string' ? parsed.lastSavedAt : null,
      currentPageIndex: typeof parsed.currentPageIndex === 'number' ? parsed.currentPageIndex : 0,
      answers: sanitizeAnswers(parsed.answers)
    };
  } catch {
    return null;
  }
};

export const saveSurveyProgressSnapshot = (
  storageKey: string,
  snapshot: Omit<StoredSurveyProgressSnapshot, 'version' | 'savedAt'>
) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredSurveyProgressSnapshot = {
    version: 2,
    savedAt: new Date().toISOString(),
    lastSavedAt: snapshot.lastSavedAt,
    currentPageIndex: snapshot.currentPageIndex,
    answers: snapshot.answers
  };

  window.localStorage.setItem(storageKey, JSON.stringify(payload));
};

export const clearSurveyProgressSnapshot = (storageKey: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(storageKey);
};
