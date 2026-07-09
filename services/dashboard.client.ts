import { env } from '@/lib/env';
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

export const downloadDashboardExportClient = async (input: DashboardQueryInput): Promise<{ blob: Blob; fileName: string }> => {
  const apiBase = env.backendApiUrl.endsWith('/') ? env.backendApiUrl.slice(0, -1) : env.backendApiUrl;
  const url = `${apiBase}/dashboard/results/export/download?${buildDashboardQueryString(input)}`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  });

  if (!response.ok) {
    let message = `Error HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as { mensaje?: string };
      if (payload?.mensaje) {
        message = payload.mensaje;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="([^"]+)"/.exec(disposition);
  const fileName = match?.[1] ?? `reporte-${input.surveySlug}-${input.groupBy.toLowerCase()}.xlsx`;

  return { blob, fileName };
};
