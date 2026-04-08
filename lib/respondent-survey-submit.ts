type FollowUpPendingPayload = {
  code?: string;
  pending?: Array<{
    sectionKey?: string;
    questionKey?: string;
  }>;
};

const parseTechnicalPayload = (
  technicalMessage: string | null
): string | FollowUpPendingPayload | null => {
  if (!technicalMessage) {
    return null;
  }

  const raw = technicalMessage.trim();
  if (!raw) {
    return null;
  }

  if (!raw.startsWith('{')) {
    return raw;
  }

  try {
    return JSON.parse(raw) as FollowUpPendingPayload;
  } catch {
    return raw;
  }
};

export const parsePendingFollowUpQuestionKeys = (
  technicalMessage: string | null
): string[] => {
  const parsed = parseTechnicalPayload(technicalMessage);
  if (!parsed || typeof parsed !== 'object') {
    return [];
  }

  if (parsed.code !== 'FOLLOW_UP_REQUIRED' || !Array.isArray(parsed.pending)) {
    return [];
  }

  return parsed.pending
    .map((item) => item.questionKey)
    .filter((questionKey): questionKey is string => typeof questionKey === 'string');
};
