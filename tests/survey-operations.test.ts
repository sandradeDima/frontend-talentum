import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFileSize,
  isSurveyImportEnabled,
  resolveRespondentImportMimeType
} from '../lib/survey-operations';

test('resolveRespondentImportMimeType accepts known mime types', () => {
  const mimeType = resolveRespondentImportMimeType({
    fileName: 'participantes.csv',
    mimeType: 'text/csv'
  });

  assert.equal(mimeType, 'text/csv');
});

test('resolveRespondentImportMimeType falls back to extension when browser mime is generic', () => {
  const mimeType = resolveRespondentImportMimeType({
    fileName: 'participantes.xlsx',
    mimeType: 'application/octet-stream'
  });

  assert.equal(
    mimeType,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
});

test('resolveRespondentImportMimeType rejects unsupported files', () => {
  const mimeType = resolveRespondentImportMimeType({
    fileName: 'participantes.txt',
    mimeType: 'text/plain'
  });

  assert.equal(mimeType, null);
});

test('isSurveyImportEnabled only allows campaigns outside BORRADOR/FINALIZADA', () => {
  assert.equal(isSurveyImportEnabled('BORRADOR'), false);
  assert.equal(isSurveyImportEnabled('CREADA'), true);
  assert.equal(isSurveyImportEnabled('EN_PROCESO'), true);
  assert.equal(isSurveyImportEnabled('FINALIZADA'), false);
});

test('formatFileSize renders expected units', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(-10), '0 B');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(5 * 1024 * 1024), '5.00 MB');
});
