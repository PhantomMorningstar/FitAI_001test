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
  assert.equal(result.meals.length, 4);
  assert.deepEqual(result.meals[0].calorieRange, { minimum: 410, maximum: 500 });
  assert.equal(result.meals[0].proteinTarget, 30);
  assert.equal(result.meals.at(-1).slot, 'snack');
  assert.equal(result.meals.at(-1).sharePercent, 10);
  assert.equal(
    result.meals.reduce((total, meal) => total + meal.calorieTarget, 0),
    plan.targetCalories
  );
  assert.equal(
    result.meals.reduce((total, meal) => total + meal.proteinTarget, 0),
    macros.protein
  );
  assert.match(result.disclaimer, /ngân sách cho cả bữa/);
  assert.match(result.disclaimer, /cân nguyên liệu.*USDA/);
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

test('vegetarian profiles only receive meat-free and fish-free meal ideas', () => {
  const result = generateMealSuggestions(
    validProfile({ dietaryPreference: 'vegetarian' }),
    plan,
    macros,
    safe
  );
  const names = result.meals.flatMap((meal) => meal.options);

  assert.equal(result.basedOn.dietaryPreference, 'vegetarian');
  assert.ok(names.length >= 4);
  assert.ok(names.every((name) => !/gà|cá|thịt|bò/i.test(name)));
  assert.match(result.dietaryGuidance, /chế độ ăn chay/i);
});

test('restrictive vegetarian allergies expose empty meal slots instead of bypassing filters', () => {
  const result = generateMealSuggestions(
    validProfile({
      dietaryPreference: 'vegetarian',
      allergies: ['eggs', 'milk', 'soy', 'peanuts', 'gluten']
    }),
    plan,
    macros,
    safe
  );

  assert.ok(result.emptyMealSlots.length >= 1);
  assert.ok(result.meals.some((meal) => meal.options.length === 0));
  assert.match(result.compatibilityWarning, /không tự bỏ qua dị ứng/i);
  assert.ok(result.meals.flatMap((meal) => meal.options).every((name) =>
    !/gà|cá|thịt|bò|trứng|sữa|đậu phụ|đậu nành|yến mạch|hạt/i.test(name)
  ));
});
