import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FATAL_RUNNER_CODES,
  isCompletedLockoutCode,
  mapTechnicalCodeToAccessIssue,
  parseRespondentTechnicalCode
} from '../lib/respondent-survey-errors';

test('mapTechnicalCodeToAccessIssue classifies completed lockout correctly', () => {
  const issue = mapTechnicalCodeToAccessIssue(
    'SURVEY_RESPONSE_ALREADY_SUBMITTED',
    'La encuesta ya fue enviada'
  );

  assert.equal(issue.kind, 'locked');
  assert.equal(issue.title, 'Encuesta ya completada');
});

test('mapTechnicalCodeToAccessIssue classifies revoked access as locked', () => {
  const issue = mapTechnicalCodeToAccessIssue(
    'RESPONDENT_ACCESS_REVOKED',
    'Credencial revocada'
  );

  assert.equal(issue.kind, 'locked');
  assert.equal(issue.title, 'Encuesta bloqueada');
});

test('mapTechnicalCodeToAccessIssue classifies invalid and expired states', () => {
  const invalidIssue = mapTechnicalCodeToAccessIssue(
    'RESPONDENT_ACCESS_INVALID',
    'Acceso inválido'
  );
  const expiredIssue = mapTechnicalCodeToAccessIssue(
    'RESPONDENT_ACCESS_EXPIRED',
    'Acceso expirado'
  );

  assert.equal(invalidIssue.kind, 'invalid');
  assert.equal(expiredIssue.kind, 'expired');
});

test('parseRespondentTechnicalCode extracts code from JSON payload', () => {
  const code = parseRespondentTechnicalCode(
    JSON.stringify({
      code: 'FOLLOW_UP_REQUIRED'
    })
  );

  assert.equal(code, 'FOLLOW_UP_REQUIRED');
});

test('FATAL_RUNNER_CODES contains submission lockout code', () => {
  assert.equal(FATAL_RUNNER_CODES.has('SURVEY_RESPONSE_ALREADY_SUBMITTED'), true);
  assert.equal(FATAL_RUNNER_CODES.has('UNKNOWN_CODE'), false);
});

test('FATAL_RUNNER_CODES check works with JSON-encoded technical payload', () => {
  const technicalCode = parseRespondentTechnicalCode(
    JSON.stringify({
      code: 'SURVEY_SESSION_EXPIRED'
    })
  );

  assert.equal(technicalCode, 'SURVEY_SESSION_EXPIRED');
  assert.equal(FATAL_RUNNER_CODES.has(technicalCode ?? ''), true);
});

test('isCompletedLockoutCode marks completed lockout states only', () => {
  assert.equal(isCompletedLockoutCode('SURVEY_RESPONSE_ALREADY_SUBMITTED'), true);
  assert.equal(isCompletedLockoutCode('RESPONDENT_ACCESS_CONSUMED'), true);
  assert.equal(isCompletedLockoutCode('RESPONDENT_ACCESS_REVOKED'), false);
  assert.equal(isCompletedLockoutCode(null), false);
});
