const test = require('node:test');
const assert = require('node:assert/strict');
const {
  fetchFoodDetails,
  normalizeFood,
  normalizePortions,
  searchFoods,
  validateSearchInput
} = require('../src/services/nutrition.service');

const sampleFood = {
  fdcId: 123,
  description: 'Chicken breast, cooked',
  dataType: 'Foundation',
  foodNutrients: [
    { nutrientId: 1008, value: 165 },
    { nutrientId: 1003, value: 31.02 },
    { nutrientId: 1005, value: 0 },
    { nutrientId: 1004, value: 3.57 },
    { nutrientId: 1079, value: 0 }
  ]
};

test('nutrition search validates food name and measured portion', () => {
  assert.equal(validateSearchInput(' chicken ', 150).valid, true);
  assert.equal(validateSearchInput('x', 150).valid, false);
  assert.equal(validateSearchInput('chicken', 0).valid, false);
  assert.equal(validateSearchInput('chicken', 2001).valid, false);
});

test('USDA nutrients per 100 g scale to the selected portion', () => {
  assert.deepEqual(normalizeFood(sampleFood, 150), {
    fdcId: 123,
    name: 'Chicken breast, cooked',
    dataType: 'Foundation',
    brandName: null,
    gtinUpc: null,
    grams: 150,
    calories: 248,
    protein: 46.5,
    carbs: 0,
    fat: 5.4,
    fiber: 0,
    source: 'USDA FoodData Central'
  });
});

test('nutrition search keeps API credentials server-side and normalizes results', async () => {
  let requestedUrl;
  let requestedOptions;
  const foods = await searchFoods({
    query: ' chicken breast ',
    grams: 100,
    apiKey: 'private-key',
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      requestedOptions = options;
      return { ok: true, json: async () => ({ foods: [sampleFood] }) };
    }
  });

  assert.match(requestedUrl, /api_key=private-key/);
  assert.equal(JSON.parse(requestedOptions.body).query, 'chicken breast');
  assert.deepEqual(JSON.parse(requestedOptions.body).dataType, [
    'Foundation',
    'Survey (FNDDS)',
    'Branded',
    'SR Legacy'
  ]);
  assert.equal(foods[0].calories, 165);
  assert.equal(JSON.stringify(foods).includes('private-key'), false);
});

test('food details expose USDA household portions and scale nutrients', async () => {
  const detailedFood = {
    ...sampleFood,
    foodNutrients: sampleFood.foodNutrients.map(({ nutrientId, value }) => ({
      nutrient: { id: nutrientId },
      amount: value
    })),
    foodPortions: [{
      id: 9,
      amount: 1,
      measureUnit: { name: 'cup' },
      modifier: 'chopped',
      gramWeight: 140
    }]
  };
  const result = await fetchFoodDetails({
    fdcId: 123,
    grams: 140,
    apiKey: 'private-key',
    fetchImpl: async () => ({ ok: true, json: async () => detailedFood })
  });

  assert.equal(result.food.calories, 231);
  assert.deepEqual(result.portions, [{
    id: 9,
    label: '1 cup chopped',
    gramWeight: 140
  }]);
});

test('branded label servings are offered as portions without duplicates', () => {
  assert.deepEqual(normalizePortions({
    servingSize: 30,
    servingSizeUnit: 'g',
    foodPortions: []
  }), [{
    id: 'label-serving',
    label: '1 label serving',
    gramWeight: 30
  }]);
});

test('nutrition search reports USDA rate limiting clearly', async () => {
  await assert.rejects(
    searchFoods({
      query: 'banana',
      apiKey: 'key',
      fetchImpl: async () => ({ ok: false, status: 429 })
    }),
    (error) => error.statusCode === 429 && /rate limit/i.test(error.message)
  );
});
