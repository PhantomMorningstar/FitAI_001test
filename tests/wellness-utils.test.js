const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEntries, summarizeWellness } = require('../public/assets/js/wellness-utils');

test('wellness entries validate sleep and stress ranges', () => {
  assert.equal(normalizeEntries([
    { dateKey: '2026-07-01', sleepHours: 7.5, stressLevel: 3 },
    { dateKey: '2026-07-02', sleepHours: 25, stressLevel: 3 },
    { dateKey: '2026-07-03', sleepHours: 7, stressLevel: 6 }
  ]).length, 1);
});

test('seven-day wellness summary calculates sleep and stress patterns', () => {
  const summary = summarizeWellness([
    { dateKey: '2026-07-01', sleepHours: 6, stressLevel: 4 },
    { dateKey: '2026-07-02', sleepHours: 7, stressLevel: 3 },
    { dateKey: '2026-07-03', sleepHours: 8, stressLevel: 2 },
    { dateKey: '2026-07-04', sleepHours: 6, stressLevel: 5 }
  ]);
  assert.equal(summary.averageSleepHours, 6.8);
  assert.equal(summary.averageStress, 3.5);
  assert.equal(summary.sleepGoalDays, 2);
  assert.equal(summary.highStressDays, 2);
  assert.equal(summary.insight, 'short-sleep');
});

test('combined low sleep and high stress receives a combined insight', () => {
  const summary = summarizeWellness([
    { dateKey: '2026-07-01', sleepHours: 5, stressLevel: 5 },
    { dateKey: '2026-07-02', sleepHours: 6, stressLevel: 4 },
    { dateKey: '2026-07-03', sleepHours: 6, stressLevel: 4 },
    { dateKey: '2026-07-04', sleepHours: 5, stressLevel: 5 }
  ]);
  assert.equal(summary.insight, 'sleep-and-stress');
});

test('fewer than four days never produces a behavioral conclusion', () => {
  assert.equal(summarizeWellness([
    { dateKey: '2026-07-01', sleepHours: 4, stressLevel: 5 }
  ]).insight, 'insufficient');
});
