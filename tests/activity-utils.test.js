const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEntries, summarizeActivity } = require('../public/assets/js/activity-utils');

test('activity entries are validated and sorted', () => {
  assert.deepEqual(normalizeEntries([
    { dateKey: '2026-07-02', steps: '7000', activeMinutes: '25' },
    { dateKey: 'bad', steps: 1000, activeMinutes: 10 },
    { dateKey: '2026-07-01', steps: 5000, activeMinutes: 15 }
  ]).map(({ dateKey, steps, activeMinutes }) => ({ dateKey, steps, activeMinutes })), [
    { dateKey: '2026-07-01', steps: 5000, activeMinutes: 15 },
    { dateKey: '2026-07-02', steps: 7000, activeMinutes: 25 }
  ]);
});

test('four recorded days produce an activity-adjusted TDEE', () => {
  const summary = summarizeActivity([
    { dateKey: '2026-07-01', steps: 8000, activeMinutes: 30 },
    { dateKey: '2026-07-02', steps: 7000, activeMinutes: 35 },
    { dateKey: '2026-07-03', steps: 8500, activeMinutes: 30 },
    { dateKey: '2026-07-04', steps: 7500, activeMinutes: 25 }
  ], 1500, '2026-07-04');
  assert.equal(summary.observedActivity, 'moderately');
  assert.equal(summary.activityFactor, 1.55);
  assert.equal(summary.adjustedTdee, 2325);
  assert.equal(summary.confidence, 'medium');
});

test('fewer than four days never changes the TDEE estimate', () => {
  const summary = summarizeActivity([
    { dateKey: '2026-07-01', steps: 12000, activeMinutes: 60 },
    { dateKey: '2026-07-02', steps: 12000, activeMinutes: 60 }
  ], 1500, '2026-07-02');
  assert.equal(summary.activityFactor, null);
  assert.equal(summary.adjustedTdee, null);
  assert.equal(summary.confidence, 'insufficient');
});

test('weekly active-minute progress is capped at 100 percent', () => {
  const summary = summarizeActivity([
    { dateKey: '2026-07-01', steps: 5000, activeMinutes: 100 },
    { dateKey: '2026-07-02', steps: 5000, activeMinutes: 100 }
  ], 1500, '2026-07-02');
  assert.equal(summary.guidelinePercent, 100);
});

test('old activity is not treated as part of the current seven-day window', () => {
  const summary = summarizeActivity([
    { dateKey: '2026-07-01', steps: 10000, activeMinutes: 60 },
    { dateKey: '2026-07-02', steps: 10000, activeMinutes: 60 }
  ], 1500, '2026-07-31');

  assert.deepEqual(summary, {
    sampleDays: 0,
    averageSteps: null,
    activeMinutes: 0,
    guidelinePercent: 0,
    observedActivity: null,
    activityFactor: null,
    adjustedTdee: null,
    confidence: 'insufficient'
  });
});

test('future activity is excluded from the current seven-day window', () => {
  const summary = summarizeActivity([
    { dateKey: '2026-07-31', steps: 6000, activeMinutes: 20 },
    { dateKey: '2026-08-01', steps: 20000, activeMinutes: 300 }
  ], 1500, '2026-07-31');

  assert.equal(summary.sampleDays, 1);
  assert.equal(summary.averageSteps, 6000);
  assert.equal(summary.activeMinutes, 20);
});
