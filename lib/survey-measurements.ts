import type { SurveyCampaignSummary } from '@/types/survey';

type MeasurementBuckets = {
  inProgress: SurveyCampaignSummary[];
  finalized: SurveyCampaignSummary[];
};

const toTime = (value: string | null | undefined): number => {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }

  return parsed.getTime();
};

const sortInProgress = (left: SurveyCampaignSummary, right: SurveyCampaignSummary): number => {
  const leftStart = toTime(left.startDate);
  const rightStart = toTime(right.startDate);
  return rightStart - leftStart;
};

const sortFinalized = (left: SurveyCampaignSummary, right: SurveyCampaignSummary): number => {
  const leftFinalizedAt = toTime(left.finalizedAt);
  const rightFinalizedAt = toTime(right.finalizedAt);

  if (leftFinalizedAt !== rightFinalizedAt) {
    return rightFinalizedAt - leftFinalizedAt;
  }

  const leftEndDate = toTime(left.endDate);
  const rightEndDate = toTime(right.endDate);
  return rightEndDate - leftEndDate;
};

export const splitMeasurementsByLifecycle = (
  rows: SurveyCampaignSummary[]
): MeasurementBuckets => {
  const inProgress: SurveyCampaignSummary[] = [];
  const finalized: SurveyCampaignSummary[] = [];

  for (const row of rows) {
    if (row.lifecycle.state === 'FINALIZED') {
      finalized.push(row);
    } else {
      inProgress.push(row);
    }
  }

  inProgress.sort(sortInProgress);
  finalized.sort(sortFinalized);

  return {
    inProgress,
    finalized
  };
};
