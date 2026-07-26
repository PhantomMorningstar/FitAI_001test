const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateRollingAverages,
  calculateGoalProgress,
  calculateWeightTrend,
  getLatestRollingAverage,
  normalizeEntries
} = require('../public/assets/js/weight-utils');

test('weight entries are validated and sorted by calendar date', () => {
  assert.deepEqual(normalizeEntries([
    { dateKey: '2026-07-20', weightKg: '79.5' },
    { dateKey: 'bad-date', weightKg: 70 },
    { dateKey: '2026-07-01', weightKg: 80 },
    { dateKey: '2026-07-03', weightKg: 500 }
  ]), [
    { dateKey: '2026-07-01', weightKg: 80 },
    { dateKey: '2026-07-20', weightKg: 79.5 }
  ]);
});

test('goal progress measures movement toward a weight-loss target', () => {
  assert.deepEqual(calculateGoalProgress([
    { dateKey: '2026-07-01', weightKg: 80 },
    { dateKey: '2026-07-15', weightKg: 76 }
  ], 70, 'lose'), {
    status: 'toward-goal',
    startWeightKg: 80,
    latestWeightKg: 76,
    targetWeightKg: 70,
    changeTowardGoalKg: 4,
    remainingKg: 6,
    progressPercent: 40
  });
});

test('goal progress recognizes moving away and reaching a gain target', () => {
  assert.equal(calculateGoalProgress([
    { dateKey: '2026-07-01', weightKg: 70 },
    { dateKey: '2026-07-10', weightKg: 69 }
  ], 75, 'gain').status, 'away-from-goal');

  assert.equal(calculateGoalProgress([
    { dateKey: '2026-07-01', weightKg: 70 },
    { dateKey: '2026-07-20', weightKg: 75.5 }
  ], 75, 'gain').status, 'reached');
});

test('maintenance progress uses a two-kilogram target range', () => {
  assert.equal(calculateGoalProgress([
    { dateKey: '2026-07-01', weightKg: 70 },
    { dateKey: '2026-07-15', weightKg: 71.5 }
  ], 70, 'maintain').status, 'maintaining');
});

test('weight trend compares earliest and latest measurements', () => {
  const trend = calculateWeightTrend([
    { dateKey: '2026-07-01', weightKg: 80 },
    { dateKey: '2026-07-15', weightKg: 78 }
  ]);
  assert.equal(trend.count, 2);
  assert.equal(trend.changeKg, -2);
  assert.equal(trend.days, 14);
  assert.equal(trend.weeklyRateKg, -1);
});

test('weekly weight rate is withheld until seven days of data exist', () => {
  const trend = calculateWeightTrend([
    { dateKey: '2026-07-01', weightKg: 80 },
    { dateKey: '2026-07-04', weightKg: 79 }
  ]);
  assert.equal(trend.changeKg, -1);
  assert.equal(trend.weeklyRateKg, null);
});

test('empty history returns a neutral trend', () => {
  assert.deepEqual(calculateWeightTrend([]), {
    count: 0,
    first: null,
    latest: null,
    changeKg: null,
    days: 0,
    weeklyRateKg: null
  });
});

test('7-day rolling average uses the current day and previous six calendar days', () => {
  const averages = calculateRollingAverages([
    { dateKey: '2026-07-01', weightKg: 80 },
    { dateKey: '2026-07-02', weightKg: 79 },
    { dateKey: '2026-07-07', weightKg: 78 },
    { dateKey: '2026-07-08', weightKg: 77 }
  ]);

  assert.equal(averages[2].averageKg, 79);
  assert.equal(averages[2].sampleCount, 3);
  assert.equal(averages[3].averageKg, 78);
  assert.equal(averages[3].sampleCount, 3);
});

test('7-day average requires at least three measurements in the calendar window', () => {
  const averages = calculateRollingAverages([
    { dateKey: '2026-07-01', weightKg: 80 },
    { dateKey: '2026-07-07', weightKg: 78 }
  ]);
  assert.equal(averages[1].sampleCount, 2);
  assert.equal(averages[1].averageKg, null);
});

test('latest rolling average exposes its sample count', () => {
  assert.deepEqual(getLatestRollingAverage([
    { dateKey: '2026-07-01', weightKg: 80 },
    { dateKey: '2026-07-03', weightKg: 79 },
    { dateKey: '2026-07-07', weightKg: 78 }
  ]), {
    dateKey: '2026-07-07',
    weightKg: 78,
    averageKg: 79,
    sampleCount: 3
  });
});
