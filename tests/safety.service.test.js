const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluatePlanSafety } = require('../src/services/safety.service');

const baseProfile = { goal: 'lose', gender: 'Female', weight: 70, targetWeight: 64 };
const baseMetrics = { bmi: 25.7, targetBmi: 23.5 };
const basePlan = { targetCalories: 1650, estimatedWeeklyChangeKg: 0.3 };

test('allows a moderate plan without safety messages', () => {
  const result = evaluatePlanSafety(baseProfile, baseMetrics, basePlan);
  assert.equal(result.allowed, true);
  assert.equal(result.status, 'ok');
});

test('blocks weight loss for a currently underweight adult', () => {
  const result = evaluatePlanSafety(baseProfile, { ...baseMetrics, bmi: 17.9 }, basePlan);
  assert.equal(result.allowed, false);
  assert.ok(result.blockers.some(({ code }) => code === 'CURRENT_BMI_UNDERWEIGHT'));
});

test('blocks a target BMI below 18.5', () => {
  const result = evaluatePlanSafety(baseProfile, { ...baseMetrics, targetBmi: 18.4 }, basePlan);
  assert.equal(result.allowed, false);
  assert.ok(result.blockers.some(({ code }) => code === 'TARGET_BMI_UNDERWEIGHT'));
});

test('blocks dangerously low intake and excessive weekly loss', () => {
  const result = evaluatePlanSafety(baseProfile, baseMetrics, { targetCalories: 990, estimatedWeeklyChangeKg: 1 });
  assert.equal(result.allowed, false);
  assert.equal(result.blockers.length, 2);
});

test('warns about low intake and a large initial goal', () => {
  const result = evaluatePlanSafety(
    { ...baseProfile, targetWeight: 55 },
    baseMetrics,
    { targetCalories: 1150, estimatedWeeklyChangeKg: 0.5 }
  );
  assert.equal(result.allowed, true);
  assert.equal(result.status, 'warning');
  assert.ok(result.warnings.some(({ code }) => code === 'LOW_CALORIE_INTAKE'));
  assert.ok(result.warnings.some(({ code }) => code === 'LARGE_INITIAL_GOAL'));
});

test('blocks automated plans for excluded health contexts', () => {
  for (const key of ['pregnant', 'breastfeeding', 'eatingDisorderHistory', 'clinicianSupervised']) {
    const result = evaluatePlanSafety({ ...baseProfile, healthContext: { [key]: true } }, baseMetrics, basePlan);
    assert.equal(result.allowed, false);
    assert.ok(result.blockers.some(({ code }) => code.startsWith('HEALTH_CONTEXT_')));
  }
});
