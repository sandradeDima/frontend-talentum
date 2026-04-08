export const toCompletionPercent = (completionRate: number): number => {
  if (!Number.isFinite(completionRate)) {
    return 0;
  }

  const boundedRate = Math.min(1, Math.max(0, completionRate));
  return Math.round(boundedRate * 100);
};

export const toEmailCoveragePercent = (
  respondentsWithEmail: number,
  activeRespondents: number
): number => {
  if (!Number.isFinite(respondentsWithEmail) || !Number.isFinite(activeRespondents)) {
    return 0;
  }

  if (activeRespondents <= 0) {
    return 0;
  }

  const coverage = respondentsWithEmail / activeRespondents;
  return toCompletionPercent(coverage);
};
