const test = require('node:test');
const assert = require('node:assert/strict');
const { generateMealSuggestions } = require('../src/services/meal-suggestion.service');
const { validProfile } = require('./helpers/profile.fixture');

const plan = { targetCalories: 1800 };
const macros = { protein: 120, carbs: 210, fat: 50, fiber: 25 };
const safe = { allowed: true };

test('meal suggestions use calorie and protein targets from the validated plan', () => {
  const result = generateMealSuggestions(validProfile(), plan, macros, safe);
  assert.equal(result.available, true);
  assert.equal(result.basedOn.targetCalories, 1800);
  assert.equal(result.meals.length, 3);
  assert.deepEqual(result.meals[0].calorieRange, { minimum: 410, maximum: 500 });
  assert.equal(result.meals[0].proteinTarget, 30);
});

test('meal suggestions exclude every selected allergen', () => {
  const profile = validProfile({
    allergies: ['seafood', 'milk', 'eggs', 'gluten', 'soy']
  });
  const result = generateMealSuggestions(profile, plan, macros, safe);
  const names = result.meals.flatMap((meal) => meal.options);
  assert.ok(names.length >= 3);
  assert.ok(names.every((name) => !/cá|trứng|sữa chua|yến mạch|đậu phụ/i.test(name)));
});

test('unsafe profiles do not receive meal suggestions', () => {
  const result = generateMealSuggestions(validProfile(), plan, macros, { allowed: false });
  assert.equal(result.available, false);
  assert.deepEqual(result.meals, []);
});
