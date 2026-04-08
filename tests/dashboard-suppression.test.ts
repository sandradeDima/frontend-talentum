import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveDashboardSuppressionDescriptor } from '../lib/dashboard-suppression';

test('deriveDashboardSuppressionDescriptor marks no suppression when hidden groups are zero', () => {
  const descriptor = deriveDashboardSuppressionDescriptor({
    anonymityMinCount: 5,
    suppressedGroups: 0,
    visibleGroups: 3
  });

  assert.equal(descriptor.mode, 'none');
  assert.equal(descriptor.metricsArePartial, false);
  assert.equal(descriptor.metricsUnavailable, false);
  assert.equal(descriptor.hasVisibleGroups, true);
});

test('deriveDashboardSuppressionDescriptor marks partial suppression when there are visible and hidden groups', () => {
  const descriptor = deriveDashboardSuppressionDescriptor({
    anonymityMinCount: 5,
    suppressedGroups: 2,
    visibleGroups: 4
  });

  assert.equal(descriptor.mode, 'partial');
  assert.equal(descriptor.metricsArePartial, true);
  assert.equal(descriptor.metricsUnavailable, false);
  assert.equal(descriptor.hasVisibleGroups, true);
  assert.equal(descriptor.hasSuppressedGroups, true);
});

test('deriveDashboardSuppressionDescriptor marks full suppression when all groups are hidden', () => {
  const descriptor = deriveDashboardSuppressionDescriptor({
    anonymityMinCount: 5,
    suppressedGroups: 3,
    visibleGroups: 0
  });

  assert.equal(descriptor.mode, 'full');
  assert.equal(descriptor.metricsArePartial, true);
  assert.equal(descriptor.metricsUnavailable, true);
  assert.equal(descriptor.hasVisibleGroups, false);
});

test('deriveDashboardSuppressionDescriptor sanitizes invalid counters', () => {
  const descriptor = deriveDashboardSuppressionDescriptor({
    anonymityMinCount: 5,
    suppressedGroups: Number.NaN,
    visibleGroups: -10
  });

  assert.equal(descriptor.suppressedGroups, 0);
  assert.equal(descriptor.visibleGroups, 0);
  assert.equal(descriptor.mode, 'none');
});

test('deriveDashboardSuppressionDescriptor returns unknown mode when threshold is unavailable', () => {
  const descriptor = deriveDashboardSuppressionDescriptor({
    anonymityMinCount: null,
    suppressedGroups: 2,
    visibleGroups: 0
  });

  assert.equal(descriptor.mode, 'unknown');
  assert.equal(descriptor.metricsArePartial, false);
  assert.equal(descriptor.metricsUnavailable, false);
  assert.equal(descriptor.hasSuppressedGroups, true);
});
