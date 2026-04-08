export type DashboardSuppressionMode = 'none' | 'partial' | 'full' | 'unknown';

export type DashboardSuppressionDescriptor = {
  mode: DashboardSuppressionMode;
  anonymityMinCount: number | null;
  suppressedGroups: number;
  visibleGroups: number;
  hasVisibleGroups: boolean;
  hasSuppressedGroups: boolean;
  metricsArePartial: boolean;
  metricsUnavailable: boolean;
};

const toSafeInteger = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
};

export const deriveDashboardSuppressionDescriptor = (input: {
  anonymityMinCount: number | null;
  suppressedGroups: number;
  visibleGroups: number;
}): DashboardSuppressionDescriptor => {
  const suppressedGroups = toSafeInteger(input.suppressedGroups);
  const visibleGroups = toSafeInteger(input.visibleGroups);

  if (input.anonymityMinCount === null || !Number.isFinite(input.anonymityMinCount)) {
    return {
      mode: 'unknown',
      anonymityMinCount: null,
      suppressedGroups,
      visibleGroups,
      hasVisibleGroups: visibleGroups > 0,
      hasSuppressedGroups: suppressedGroups > 0,
      metricsArePartial: false,
      metricsUnavailable: false
    };
  }

  const anonymityMinCount = Math.max(1, Math.trunc(input.anonymityMinCount));
  const hasVisibleGroups = visibleGroups > 0;
  const hasSuppressedGroups = suppressedGroups > 0;

  if (!hasSuppressedGroups) {
    return {
      mode: 'none',
      anonymityMinCount,
      suppressedGroups,
      visibleGroups,
      hasVisibleGroups,
      hasSuppressedGroups,
      metricsArePartial: false,
      metricsUnavailable: false
    };
  }

  if (hasVisibleGroups) {
    return {
      mode: 'partial',
      anonymityMinCount,
      suppressedGroups,
      visibleGroups,
      hasVisibleGroups,
      hasSuppressedGroups,
      metricsArePartial: true,
      metricsUnavailable: false
    };
  }

  return {
    mode: 'full',
    anonymityMinCount,
    suppressedGroups,
    visibleGroups,
    hasVisibleGroups,
    hasSuppressedGroups,
    metricsArePartial: true,
    metricsUnavailable: true
  };
};
