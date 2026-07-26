const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateWeightPlan } = require('../src/services/weight-plan.service');

test('a loss plan is below maintenance and a gain plan is above maintenance', () => {
  const metrics = { tdee: 2200, bmiCategory: 'overweight' };
  const loss = calculateWeightPlan({ goal: 'lose', weight: 80, targetWeight: 72 }, metrics);
  const gain = calculateWeightPlan({ goal: 'gain', weight: 80, targetWeight: 88 }, metrics);
  assert.ok(loss.targetCalories < metrics.tdee);
  assert.ok(gain.targetCalories > metrics.tdee);
  assert.ok(loss.adjustmentCalories < 0);
  assert.ok(gain.adjustmentCalories > 0);
});

test('calorie goals are rounded to increments of ten', () => {
  ['lose', 'maintain', 'gain'].forEach((goal) => {
    const targetWeight = goal === 'lose' ? 65 : goal === 'gain' ? 75 : 70;
    const plan = calculateWeightPlan(
      { goal, weight: 70, targetWeight },
      { tdee: 2017, bmiCategory: 'healthy' }
    );
    assert.equal(plan.targetCalories % 10, 0);
  });
});

test('a larger weight difference produces a longer projection at the same deficit', () => {
  const metrics = { tdee: 2200, bmiCategory: 'overweight' };
  const shortPlan = calculateWeightPlan({ goal: 'lose', weight: 80, targetWeight: 76 }, metrics);
  const longPlan = calculateWeightPlan({ goal: 'lose', weight: 80, targetWeight: 68 }, metrics);
  assert.ok(longPlan.estimatedWeeks > shortPlan.estimatedWeeks);
});
