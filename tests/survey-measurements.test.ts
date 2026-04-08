import test from 'node:test';
import assert from 'node:assert/strict';
import { splitMeasurementsByLifecycle } from '../lib/survey-measurements';
import type { SurveyCampaignSummary } from '../types/survey';

const makeSurvey = (input: {
  id: string;
  slug: string;
  state: SurveyCampaignSummary['lifecycle']['state'];
  startDate: string;
  endDate: string;
  finalizedAt?: string | null;
}): SurveyCampaignSummary => ({
  id: input.id,
  slug: input.slug,
  name: input.slug,
  templateKey: 'BASE_CLIMA_V1',
  status: input.state === 'FINALIZED' ? 'FINALIZADA' : 'CREADA',
  createdAt: '2026-01-01T00:00:00.000Z',
  startDate: input.startDate,
  endDate: input.endDate,
  totalEnabledDays: 10,
  initialSendScheduledAt: '2026-01-01T12:00:00.000Z',
  remindersLockedAt: null,
  remindersLocked: false,
  finalizedAt: input.finalizedAt ?? null,
  genericLinkPath: '/survey/test',
  lifecycle: {
    state: input.state,
    started: input.state !== 'DRAFT' && input.state !== 'SCHEDULED',
    ended: input.state === 'CLOSED' || input.state === 'FINALIZED',
    finalized: input.state === 'FINALIZED',
    remindersLocked: false,
    canScheduleInitialSend: input.state === 'DRAFT',
    canConfigureReminders: input.state === 'SCHEDULED' || input.state === 'ACTIVE',
    canCloseNow: input.state === 'ACTIVE',
    canFinalize: input.state === 'CLOSED'
  }
});

test('splitMeasurementsByLifecycle separates finalized from in-progress', () => {
  const rows: SurveyCampaignSummary[] = [
    makeSurvey({
      id: '1',
      slug: 'activa',
      state: 'ACTIVE',
      startDate: '2026-04-10T00:00:00.000Z',
      endDate: '2026-04-20T00:00:00.000Z'
    }),
    makeSurvey({
      id: '2',
      slug: 'finalizada',
      state: 'FINALIZED',
      startDate: '2026-03-10T00:00:00.000Z',
      endDate: '2026-03-20T00:00:00.000Z',
      finalizedAt: '2026-03-22T10:00:00.000Z'
    })
  ];

  const buckets = splitMeasurementsByLifecycle(rows);
  assert.equal(buckets.inProgress.length, 1);
  assert.equal(buckets.finalized.length, 1);
  assert.equal(buckets.inProgress[0]?.slug, 'activa');
  assert.equal(buckets.finalized[0]?.slug, 'finalizada');
});

test('splitMeasurementsByLifecycle sorts finalized by finalizedAt desc', () => {
  const rows: SurveyCampaignSummary[] = [
    makeSurvey({
      id: 'a',
      slug: 'historia-antigua',
      state: 'FINALIZED',
      startDate: '2026-02-01T00:00:00.000Z',
      endDate: '2026-02-10T00:00:00.000Z',
      finalizedAt: '2026-02-11T00:00:00.000Z'
    }),
    makeSurvey({
      id: 'b',
      slug: 'historia-reciente',
      state: 'FINALIZED',
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-03-10T00:00:00.000Z',
      finalizedAt: '2026-03-11T00:00:00.000Z'
    })
  ];

  const buckets = splitMeasurementsByLifecycle(rows);
  assert.equal(buckets.finalized[0]?.slug, 'historia-reciente');
  assert.equal(buckets.finalized[1]?.slug, 'historia-antigua');
});

test('splitMeasurementsByLifecycle sorts in-progress by startDate desc', () => {
  const rows: SurveyCampaignSummary[] = [
    makeSurvey({
      id: 'c',
      slug: 'corte-viejo',
      state: 'SCHEDULED',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-10T00:00:00.000Z'
    }),
    makeSurvey({
      id: 'd',
      slug: 'corte-nuevo',
      state: 'ACTIVE',
      startDate: '2026-04-01T00:00:00.000Z',
      endDate: '2026-04-10T00:00:00.000Z'
    })
  ];

  const buckets = splitMeasurementsByLifecycle(rows);
  assert.equal(buckets.inProgress[0]?.slug, 'corte-nuevo');
  assert.equal(buckets.inProgress[1]?.slug, 'corte-viejo');
});
