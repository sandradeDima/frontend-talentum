import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toCompletionPercent,
  toEmailCoveragePercent
} from '../lib/survey-operations-summary';

test('toCompletionPercent clamps negative and over-100 rates', () => {
  assert.equal(toCompletionPercent(-0.5), 0);
  assert.equal(toCompletionPercent(0.456), 46);
  assert.equal(toCompletionPercent(1.5), 100);
});

test('toCompletionPercent returns zero for non-finite values', () => {
  assert.equal(toCompletionPercent(Number.NaN), 0);
  assert.equal(toCompletionPercent(Number.POSITIVE_INFINITY), 0);
});

test('toEmailCoveragePercent calculates participant email coverage safely', () => {
  assert.equal(toEmailCoveragePercent(0, 0), 0);
  assert.equal(toEmailCoveragePercent(4, 10), 40);
  assert.equal(toEmailCoveragePercent(11, 10), 100);
});
