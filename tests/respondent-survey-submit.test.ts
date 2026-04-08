import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePendingFollowUpQuestionKeys } from '../lib/respondent-survey-submit';

test('parsePendingFollowUpQuestionKeys returns pending keys for FOLLOW_UP_REQUIRED payload', () => {
  const keys = parsePendingFollowUpQuestionKeys(
    JSON.stringify({
      code: 'FOLLOW_UP_REQUIRED',
      pending: [
        {
          sectionKey: 'leader',
          questionKey: 'leader_followup'
        },
        {
          sectionKey: 'team',
          questionKey: 'team_followup'
        }
      ]
    })
  );

  assert.deepEqual(keys, ['leader_followup', 'team_followup']);
});

test('parsePendingFollowUpQuestionKeys ignores malformed or unrelated payloads', () => {
  assert.deepEqual(parsePendingFollowUpQuestionKeys(null), []);
  assert.deepEqual(parsePendingFollowUpQuestionKeys('SURVEY_RESPONSE_ALREADY_SUBMITTED'), []);
  assert.deepEqual(
    parsePendingFollowUpQuestionKeys(
      JSON.stringify({
        code: 'OTHER_ERROR',
        pending: [{ questionKey: 'leader_followup' }]
      })
    ),
    []
  );
  assert.deepEqual(parsePendingFollowUpQuestionKeys('{bad-json'), []);
});
