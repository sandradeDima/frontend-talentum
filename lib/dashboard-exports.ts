import type {
  DashboardExportFormat,
  DashboardExportJobResult,
  DashboardExportJobStatus
} from '@/types/dashboard-reporting';

const pendingExportStatuses = new Set<DashboardExportJobStatus>(['PENDING', 'PROCESSING']);

export const isDashboardExportPending = (status: DashboardExportJobStatus): boolean => {
  return pendingExportStatuses.has(status);
};

export const isDashboardExportDownloadReady = (
  job: Pick<DashboardExportJobResult, 'status' | 'canDownload' | 'downloadUrl'>
): boolean => {
  return job.status === 'COMPLETED' && job.canDownload && typeof job.downloadUrl === 'string';
};

export const formatSupportedDashboardExportFormats = (
  formats: DashboardExportFormat[]
): string => {
  if (formats.length === 0) {
    return 'Sin formatos disponibles';
  }

  return formats.join(', ');
};
