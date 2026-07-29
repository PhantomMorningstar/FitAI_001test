const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPlanCalibration, calculateRegressionRate } = require('../public/assets/js/plan-calibration-utils');
const weightUtils = require('../public/assets/js/weight-utils');

const profile = {
  goal: 'lose',
  plan: { targetCalories: 1800, estimatedWeeklyChangeKg: 0.5 },
  safety: { allowed: true }
};

const weights = (endWeight) => [
  { dateKey: '2026-07-01', weightKg: 80 },
  { dateKey: '2026-07-04', weightKg: 79.8 },
  { dateKey: '2026-07-07', weightKg: 79.6 },
  { dateKey: '2026-07-10', weightKg: 79.4 },
  { dateKey: '2026-07-13', weightKg: 79.2 },
  { dateKey: '2026-07-15', weightKg: endWeight }
];

const diary = (calories = 1800) => Array.from({ length: 15 }, (_, index) => ({
  dateKey: `2026-07-${String(index + 1).padStart(2, '0')}`,
  calories,
  completed: true
}));

test('regression estimates weekly weight rate without relying on two individual readings', () => {
  assert.equal(calculateRegressionRate(weights(79), weightUtils), -0.49);
});

test('calibration waits for enough weight, diary, and elapsed-day evidence', () => {
  const result = buildPlanCalibration(profile, weights(79).slice(0, 3), diary().slice(0, 4), weightUtils);
  assert.equal(result.ready, false);
  assert.equal(result.status, 'collecting');
  assert.equal(result.adjustmentCalories, 0);
});

test('calibration ignores diary days that the user has not marked complete', () => {
  const entries = diary().map((entry, index) => ({
    ...entry,
    completed: index < 9
  }));
  const result = buildPlanCalibration(profile, weights(79), entries, weightUtils);
  assert.equal(result.ready, false);
  assert.equal(result.requirements.diaryDays, 9);
  assert.equal(result.averageLoggedCalories, 1800);
});

test('calibration keeps calories unchanged when actual loss follows the plan', () => {
  const result = buildPlanCalibration(profile, weights(79), diary(), weightUtils);
  assert.equal(result.ready, true);
  assert.equal(result.status, 'on-track');
  assert.equal(result.suggestedTargetCalories, 1800);
  assert.equal(result.adjustmentCalories, 0);
  assert.equal(result.confidence, 'medium');
});

test('calibration suggests only a 100 kcal step when progress is too slow', () => {
  const slowWeights = weights(79.8).map((entry, index) => ({
    ...entry,
    weightKg: Number((80 - index * 0.04).toFixed(2))
  }));
  slowWeights[slowWeights.length - 1].dateKey = '2026-07-15';
  const result = buildPlanCalibration(profile, slowWeights, diary(), weightUtils);
  assert.equal(result.status, 'too-slow');
  assert.equal(result.adjustmentCalories, -100);
  assert.equal(result.suggestedTargetCalories, 1700);
});

test('calibration does not silently replace a low proposal with 1200 calories', () => {
  const lowTargetProfile = {
    ...profile,
    plan: { targetCalories: 1050, estimatedWeeklyChangeKg: 0.5 }
  };
  const slowWeights = weights(79.8).map((entry, index) => ({
    ...entry,
    weightKg: Number((80 - index * 0.04).toFixed(2))
  }));
  slowWeights[slowWeights.length - 1].dateKey = '2026-07-15';
  const result = buildPlanCalibration(lowTargetProfile, slowWeights, diary(1050), weightUtils);
  assert.equal(result.adjustmentCalories, -100);
  assert.equal(result.suggestedTargetCalories, 950);
});

test('calibration suggests eating 100 kcal more when loss is too fast', () => {
  const fastWeights = weights(78).map((entry, index) => ({
    ...entry,
    weightKg: Number((80 - index * 0.4).toFixed(1))
  }));
  const result = buildPlanCalibration(profile, fastWeights, diary(), weightUtils);
  assert.equal(result.status, 'too-fast');
  assert.equal(result.adjustmentCalories, 100);
  assert.equal(result.suggestedTargetCalories, 1900);
});

test('calibration refuses automated advice for health-blocked profiles', () => {
  const result = buildPlanCalibration(
    { ...profile, safety: { allowed: false } },
    weights(79),
    diary(),
    weightUtils
  );
  assert.equal(result.ready, false);
  assert.equal(result.status, 'health-review');
  assert.equal(result.suggestedTargetCalories, null);
});

test('implausible observed TDEE is treated as a logging-quality problem', () => {
  const result = buildPlanCalibration(profile, weights(79), diary(100), weightUtils);
  assert.equal(result.ready, false);
  assert.equal(result.status, 'data-quality');
  assert.equal(result.suggestedTargetCalories, null);
});
