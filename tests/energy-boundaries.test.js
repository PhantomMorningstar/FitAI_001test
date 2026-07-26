const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ACTIVITY_FACTORS,
  calculateBmi,
  calculateEnergyMetrics
} = require('../src/services/energy.service');

test('BMI remains stable across equivalent metric inputs', () => {
  assert.equal(calculateBmi(70, 175), calculateBmi(70000 / 1000, 1.75 * 100));
});

test('every supported activity level uses its documented multiplier', () => {
  const profile = { gender: 'Male', age: 30, height: 175, weight: 70, targetWeight: 65 };
  Object.entries(ACTIVITY_FACTORS).forEach(([activity, factor]) => {
    const metrics = calculateEnergyMetrics({ ...profile, activity });
    assert.equal(metrics.activityFactor, factor);
    assert.equal(metrics.tdee, Math.round(metrics.bmr * factor));
  });
});

test('target BMI uses target weight while current BMI uses current weight', () => {
  const metrics = calculateEnergyMetrics({
    gender: 'Male', age: 30, height: 180, weight: 90,
    targetWeight: 80, activity: 'sedentary'
  });
  assert.equal(metrics.bmi, 27.8);
  assert.equal(metrics.targetBmi, 24.7);
  assert.equal(metrics.bmiCategory, 'overweight');
  assert.equal(metrics.targetBmiCategory, 'healthy');
});
