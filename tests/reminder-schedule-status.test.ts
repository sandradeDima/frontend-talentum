import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveReminderScheduleHealth } from '../lib/reminder-schedule-status';

test('deriveReminderScheduleHealth marks pending schedules as pending', () => {
  const health = deriveReminderScheduleHealth({
    status: 'PENDING',
    dispatchSummary: {
      failed: 0
    }
  });

  assert.equal(health, 'pending');
});

test('deriveReminderScheduleHealth marks processing schedules as processing', () => {
  const health = deriveReminderScheduleHealth({
    status: 'PROCESSING',
    dispatchSummary: {
      failed: 0
    }
  });

  assert.equal(health, 'processing');
});

test('deriveReminderScheduleHealth marks completed schedules as sent when failures are zero', () => {
  const health = deriveReminderScheduleHealth({
    status: 'COMPLETED',
    dispatchSummary: {
      failed: 0
    }
  });

  assert.equal(health, 'sent');
});

test('deriveReminderScheduleHealth marks completed schedules with failed dispatches as failed', () => {
  const health = deriveReminderScheduleHealth({
    status: 'COMPLETED',
    dispatchSummary: {
      failed: 2
    }
  });

  assert.equal(health, 'failed');
});

test('deriveReminderScheduleHealth marks failed schedules as failed', () => {
  const health = deriveReminderScheduleHealth({
    status: 'FAILED',
    dispatchSummary: {
      failed: 0
    }
  });

  assert.equal(health, 'failed');
});
