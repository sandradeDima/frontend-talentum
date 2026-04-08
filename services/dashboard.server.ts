import { requestApiServer } from '@/lib/api-client-server';
import type {
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

export const getDashboardProgressServer = async (input: DashboardQueryInput) => {
  return requestApiServer<DashboardProgressResult>(
    `/dashboard/progress?${buildDashboardQueryString(input)}`
  );
};

export const getDashboardResultsServer = async (input: DashboardQueryInput) => {
  return requestApiServer<DashboardResultsResult>(
    `/dashboard/results?${buildDashboardQueryString(input)}`
  );
};

export const getDashboardExportJobServer = async (jobId: string) => {
  return requestApiServer<DashboardExportJobResult>(
    `/dashboard/results/export/${encodeURIComponent(jobId)}`
  );
};

export const listDashboardExportJobsServer = async (input: {
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

  return requestApiServer<DashboardExportJobListResult>(
    `/dashboard/results/export?${query.toString()}`
  );
};
