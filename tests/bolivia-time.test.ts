import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatBoliviaDateTime,
  toBoliviaDateInputValue,
  toBoliviaDateTimeInputValue,
  toBoliviaDateTimeIso
} from '../lib/bolivia-time';

test('toBoliviaDateTimeInputValue renders ISO timestamps in La Paz time', () => {
  assert.equal(
    toBoliviaDateTimeInputValue('2026-06-10T12:30:00.000Z'),
    '2026-06-10T08:30'
  );
});

test('toBoliviaDateInputValue preserves the Bolivia calendar day', () => {
  assert.equal(toBoliviaDateInputValue('2026-06-11T03:59:00.000Z'), '2026-06-10');
});

test('toBoliviaDateTimeIso converts Bolivia wall-clock input to UTC ISO', () => {
  assert.equal(
    toBoliviaDateTimeIso('2026-06-10T08:30'),
    '2026-06-10T12:30:00.000Z'
  );
});

test('toBoliviaDateTimeIso rejects impossible Bolivia wall-clock inputs', () => {
  assert.equal(toBoliviaDateTimeIso('2026-02-30T08:30'), null);
});

test('formatBoliviaDateTime renders user-facing copy in Bolivia time', () => {
  const rendered = formatBoliviaDateTime('2026-06-10T12:30:00.000Z');

  assert.match(rendered, /10 jun/i);
  assert.match(rendered, /2026/);
  assert.match(rendered, /8:30/);
});
