const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateWeightPlan, getDeficitRate } = require('../src/services/weight-plan.service');

test('uses a conservative deficit rate at a healthy BMI', () => {
  assert.equal(getDeficitRate('healthy'), 0.1);
});

test('uses a moderate personalized deficit for an overweight profile', () => {
  const plan = calculateWeightPlan(
    { goal: 'lose', weight: 70, targetWeight: 62 },
    { tdee: 1946, bmiCategory: 'overweight' }
  );
  assert.deepEqual(plan, {
    goal: 'lose',
    maintenanceCalories: 1946,
    targetCalories: 1650,
    adjustmentCalories: -296,
    adjustmentRate: 0.15,
    estimatedWeeklyChangeKg: 0.27,
    estimatedWeeks: 30,
    estimatedDays: 210,
    model: 'TDEE percentage adjustment',
    assumptions: {
      kcalPerKg: 7700,
      activityRemainsStable: true,
      estimateIsLinear: true,
      projectionIsEstimateNotPromise: true
    }
  });
});

test('returns maintenance calories without a weight-change projection', () => {
  const plan = calculateWeightPlan(
    { goal: 'maintain', weight: 70, targetWeight: 70 },
    { tdee: 2003, bmiCategory: 'healthy' }
  );
  assert.equal(plan.targetCalories, 2000);
  assert.equal(plan.adjustmentCalories, 0);
  assert.equal(plan.estimatedWeeks, null);
});

test('caps a weight-gain surplus at 400 kcal per day', () => {
  const plan = calculateWeightPlan(
    { goal: 'gain', weight: 90, targetWeight: 95 },
    { tdee: 5000, bmiCategory: 'healthy' }
  );
  assert.equal(plan.targetCalories, 5400);
  assert.equal(plan.adjustmentCalories, 400);
});

test('caps a weight-loss deficit at 750 kcal per day', () => {
  const plan = calculateWeightPlan(
    { goal: 'lose', weight: 150, targetWeight: 120 },
    { tdee: 5000, bmiCategory: 'obesity-class-3' }
  );
  assert.equal(plan.targetCalories, 4250);
  assert.equal(plan.adjustmentCalories, -750);
});
