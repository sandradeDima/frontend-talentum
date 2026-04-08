import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatSupportedDashboardExportFormats,
  isDashboardExportDownloadReady,
  isDashboardExportPending
} from '@/lib/dashboard-exports';

test('isDashboardExportPending marks queued statuses as pending', () => {
  assert.equal(isDashboardExportPending('PENDING'), true);
  assert.equal(isDashboardExportPending('PROCESSING'), true);
  assert.equal(isDashboardExportPending('COMPLETED'), false);
  assert.equal(isDashboardExportPending('FAILED'), false);
});

test('isDashboardExportDownloadReady requires completed status and URL', () => {
  assert.equal(
    isDashboardExportDownloadReady({
      status: 'COMPLETED',
      canDownload: true,
      downloadUrl: '/api/dashboard/results/export/job/download'
    }),
    true
  );

  assert.equal(
    isDashboardExportDownloadReady({
      status: 'FAILED',
      canDownload: true,
      downloadUrl: '/api/dashboard/results/export/job/download'
    }),
    false
  );

  assert.equal(
    isDashboardExportDownloadReady({
      status: 'COMPLETED',
      canDownload: false,
      downloadUrl: '/api/dashboard/results/export/job/download'
    }),
    false
  );
});

test('formatSupportedDashboardExportFormats handles empty and populated lists', () => {
  assert.equal(formatSupportedDashboardExportFormats([]), 'Sin formatos disponibles');
  assert.equal(formatSupportedDashboardExportFormats(['XLSX']), 'XLSX');
});
