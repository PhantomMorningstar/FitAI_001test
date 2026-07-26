const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateMacroTargets } = require('../src/services/macro.service');
const { validProfile } = require('./helpers/profile.fixture');

test('calculates personalized daily protein, carbs, fat, and fiber targets', () => {
  const macros = calculateMacroTargets(validProfile(), { targetCalories: 1650 });

  assert.deepEqual(
    { protein: macros.protein, carbs: macros.carbs, fat: macros.fat, fiber: macros.fiber },
    { protein: 102, carbs: 207, fat: 46, fiber: 23 }
  );
  assert.deepEqual(macros.distribution, {
    proteinPercent: 25,
    carbsPercent: 50,
    fatPercent: 25
  });
});

test('macro calories remain close to the calorie target after gram rounding', () => {
  const macros = calculateMacroTargets(validProfile(), { targetCalories: 1650 });
  const macroCalories = (macros.protein * 4) + (macros.carbs * 4) + (macros.fat * 9);

  assert.ok(Math.abs(macroCalories - macros.targetCalories) <= 10);
});

test('fiber target scales at 14 grams per 1000 calories', () => {
  const lowEnergy = calculateMacroTargets(validProfile(), { targetCalories: 1500 });
  const highEnergy = calculateMacroTargets(validProfile(), { targetCalories: 2500 });

  assert.equal(lowEnergy.fiber, 21);
  assert.equal(highEnergy.fiber, 35);
});

test('more active maintenance profiles receive a higher protein target', () => {
  const plan = { targetCalories: 2200 };
  const sedentary = calculateMacroTargets(
    validProfile({ goal: 'maintain', targetWeight: 70, activity: 'sedentary' }),
    plan
  );
  const moderatelyActive = calculateMacroTargets(
    validProfile({ goal: 'maintain', targetWeight: 70, activity: 'moderately' }),
    plan
  );

  assert.ok(moderatelyActive.protein > sedentary.protein);
});

test('rejects an invalid calorie target', () => {
  assert.throws(
    () => calculateMacroTargets(validProfile(), { targetCalories: 0 }),
    /positive calorie target/
  );
});
