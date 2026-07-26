const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateBmi,
  calculateBmr,
  calculateEnergyMetrics,
  classifyBmi
} = require('../src/services/energy.service');

test('calculates and rounds BMI to one decimal place', () => {
  assert.equal(calculateBmi(70, 175), 22.9);
});

test('classifies adult BMI boundary values', () => {
  assert.equal(classifyBmi(18.4), 'underweight');
  assert.equal(classifyBmi(18.5), 'healthy');
  assert.equal(classifyBmi(25), 'overweight');
  assert.equal(classifyBmi(30), 'obesity-class-1');
  assert.equal(classifyBmi(40), 'obesity-class-3');
});

test('calculates Mifflin-St Jeor BMR for male and female profiles', () => {
  const base = { weight: 70, height: 175, age: 30 };
  assert.equal(calculateBmr({ ...base, gender: 'Male' }), 1649);
  assert.equal(calculateBmr({ ...base, gender: 'Female' }), 1483);
});

test('calculates TDEE from validated profile and activity factor', () => {
  const metrics = calculateEnergyMetrics({
    gender: 'Female', age: 31, height: 165, weight: 70,
    targetWeight: 62, activity: 'lightly'
  });
  assert.deepEqual({
    bmi: metrics.bmi,
    targetBmi: metrics.targetBmi,
    bmr: metrics.bmr,
    activityFactor: metrics.activityFactor,
    tdee: metrics.tdee
  }, { bmi: 25.7, targetBmi: 22.8, bmr: 1415, activityFactor: 1.375, tdee: 1946 });
});

test('rejects unsupported activity levels', () => {
  assert.throws(() => calculateEnergyMetrics({ activity: 'extreme' }), /Unsupported activity/);
});
