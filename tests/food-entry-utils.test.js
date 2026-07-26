const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeServingGrams, scaleFoodEntry } = require('../public/assets/js/food-entry-utils');

const chicken = {
  servingGrams: 100,
  calories: 250,
  protein: 20,
  carbs: 10,
  fat: 14,
  fiber: 2
};

test('changing portion scales every nutrient by the same ratio', () => {
  assert.deepEqual(scaleFoodEntry(chicken, 150), {
    servingGrams: 150,
    calories: 375,
    protein: 30,
    carbs: 15,
    fat: 21,
    fiber: 3
  });
});

test('repeated portion edits use the current portion as their baseline', () => {
  const firstEdit = { ...chicken, ...scaleFoodEntry(chicken, 150) };
  const secondEdit = scaleFoodEntry(firstEdit, 75);
  assert.equal(secondEdit.calories, 188);
  assert.equal(secondEdit.protein, 15);
});

test('legacy entries without serving size use 100 grams as baseline', () => {
  const legacyEntry = { ...chicken };
  delete legacyEntry.servingGrams;
  assert.equal(scaleFoodEntry(legacyEntry, 200).calories, 500);
});

test('portion validation rejects unsafe or implausible values', () => {
  for (const value of [0, -1, 2001, '', 'not-a-number']) {
    assert.throws(() => normalizeServingGrams(value), /between 1 and 2000 grams/);
  }
});
