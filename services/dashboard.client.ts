import { requestApiClient } from '@/lib/api-client-browser';
import type {
  CreateDashboardExportJobInput,
  CreateDashboardExportJobResult,
  DashboardExportJobResult,
  DashboardExportJobListResult,
  DashboardGroupBy,
  DashboardProgressResult,
  DashboardResultsResult
} from '@/types/dashboard-reporting';

type DashboardQueryInput = {
  surveySlug: string;
  groupBy: DashboardGroupBy;
};

const buildDashboardQueryString = (input: DashboardQueryInput): string => {
  const query = new URLSearchParams();
  query.set('surveySlug', input.surveySlug);
  query.set('groupBy', input.groupBy);
  return query.toString();
};

export const getDashboardProgressClient = async (input: DashboardQueryInput) => {
  return requestApiClient<DashboardProgressResult>(
    `/dashboard/progress?${buildDashboardQueryString(input)}`
  );
};

export const getDashboardResultsClient = async (input: DashboardQueryInput) => {
  return requestApiClient<DashboardResultsResult>(
    `/dashboard/results?${buildDashboardQueryString(input)}`
  );
};

export const createDashboardExportJobClient = async (
  input: CreateDashboardExportJobInput
) => {
  return requestApiClient<CreateDashboardExportJobResult>('/dashboard/results/export', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};

export const getDashboardExportJobClient = async (jobId: string) => {
  return requestApiClient<DashboardExportJobResult>(
    `/dashboard/results/export/${encodeURIComponent(jobId)}`
  );
};

export const listDashboardExportJobsClient = async (input: {
  surveySlug: string;
  groupBy: DashboardGroupBy;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  query.set('surveySlug', input.surveySlug);
  query.set('groupBy', input.groupBy);
  if (typeof input.limit === 'number') {
    query.set('limit', String(input.limit));
  }

  return requestApiClient<DashboardExportJobListResult>(
    `/dashboard/results/export?${query.toString()}`
  );
};
