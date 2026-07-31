const test = require('node:test');
const assert = require('node:assert/strict');
const {
  fetchFoodDetails,
  normalizeFood,
  normalizePortions,
  searchBrandedFoodByBarcode,
  searchFoods,
  validateBarcode,
  validateFdcId,
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
  const food = normalizeFood(sampleFood, 150);
  assert.equal(food.fdcId, 123);
  assert.equal(food.calories, 248);
  assert.equal(food.protein, 46.5);
  assert.equal(food.fat, 5.4);
  assert.equal(food.nutritionComplete, true);
  assert.deepEqual(food.missingNutrients, []);
  assert.equal(food.source, 'USDA FoodData Central');
});

test('USDA missing nutrients remain missing while reported zero stays zero', () => {
  const food = normalizeFood({
    ...sampleFood,
    foodNutrients: [
      { nutrientId: 1008, value: 165 },
      { nutrientId: 1003, value: 0 },
      { nutrientId: 1005, value: 0 },
      { nutrientId: 1004, value: 3.57 }
    ]
  }, 100);
  assert.equal(food.protein, 0);
  assert.equal(food.carbs, 0);
  assert.equal(food.fiber, null);
  assert.equal(food.nutritionComplete, false);
  assert.deepEqual(food.missingNutrients, ['fiber']);
});

test('malformed USDA nutrient values are treated as missing instead of zero', () => {
  const food = normalizeFood({
    ...sampleFood,
    foodNutrients: sampleFood.foodNutrients.map((nutrient) => (
      nutrient.nutrientId === 1008 ? { ...nutrient, value: 'unknown' } : nutrient
    ))
  }, 100);
  assert.equal(food.calories, null);
  assert.ok(food.missingNutrients.includes('calories'));
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
    'Foundation', 'Survey (FNDDS)', 'Branded', 'SR Legacy'
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

test('branded label servings are offered without duplicates', () => {
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

test('USDA FDC ID validation rejects malformed identifiers', () => {
  assert.equal(validateFdcId('123'), 123);
  assert.throws(() => validateFdcId('not-an-id'), /USDA không hợp lệ/i);
});

test('nutrition search reports USDA rate limiting clearly', async () => {
  await assert.rejects(
    searchFoods({
      query: 'banana',
      apiKey: 'key',
      fetchImpl: async () => ({ ok: false, status: 429 })
    }),
    (error) => error.statusCode === 429 && /giới hạn số lần/i.test(error.message)
  );
});

test('barcode validation accepts UPC and EAN formats only', () => {
  assert.equal(validateBarcode('049000050103'), '049000050103');
  assert.equal(validateBarcode(' 893 8505 972 091 '), '8938505972091');
  assert.throws(() => validateBarcode('12345'), /8, 12, 13, or 14 digits/i);
});

test('barcode lookup searches branded foods and keeps only an exact GTIN match', async () => {
  let requestBody;
  const foods = await searchBrandedFoodByBarcode({
    barcode: '049000050103',
    grams: 250,
    apiKey: 'private-key',
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          foods: [
            { ...sampleFood, dataType: 'Branded', gtinUpc: '049000050103', brandOwner: 'Example Brand' },
            { ...sampleFood, fdcId: 456, dataType: 'Branded', gtinUpc: '111111111111' }
          ]
        })
      };
    }
  });
  assert.equal(requestBody.query, '049000050103');
  assert.deepEqual(requestBody.dataType, ['Branded']);
  assert.equal(foods.length, 1);
  assert.equal(foods[0].brandName, 'Example Brand');
  assert.equal(foods[0].grams, 250);
});

test('barcode lookup retries without a leading zero when USDA stores the shortened UPC', async () => {
  const queries = [];
  const foods = await searchBrandedFoodByBarcode({
    barcode: '049000050103',
    grams: 100,
    apiKey: 'private-key',
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      queries.push(body.query);
      return {
        ok: true,
        json: async () => ({
          foods: body.query === '49000050103'
            ? [{ ...sampleFood, dataType: 'Branded', gtinUpc: '49000050103' }]
            : []
        })
      };
    }
  });

  assert.deepEqual(queries, ['049000050103', '49000050103']);
  assert.equal(foods.length, 1);
  assert.equal(foods[0].gtinUpc, '49000050103');
});

test('barcode lookup retries with GTIN-14 when USDA indexes a zero-padded UPC', async () => {
  const queries = [];
  const foods = await searchBrandedFoodByBarcode({
    barcode: '049000050103',
    grams: 100,
    apiKey: 'private-key',
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      queries.push(body.query);
      return {
        ok: true,
        json: async () => ({
          foods: body.query === '00049000050103'
            ? [{ ...sampleFood, dataType: 'Branded', gtinUpc: '00049000050103' }]
            : []
        })
      };
    }
  });

  assert.deepEqual(queries, ['049000050103', '49000050103', '00049000050103']);
  assert.equal(foods.length, 1);
  assert.equal(foods[0].gtinUpc, '00049000050103');
});
