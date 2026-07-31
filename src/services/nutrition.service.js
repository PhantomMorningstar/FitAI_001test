const FDC_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const FDC_FOOD_URL = 'https://api.nal.usda.gov/fdc/v1/food';
const MAX_QUERY_LENGTH = 100;
const BARCODE_PATTERN = /^\d{8}$|^\d{12,14}$/;

const NUTRIENT_IDS = {
  calories: [1008, 2047, 2048],
  protein: [1003],
  carbs: [1005],
  fat: [1004],
  fiber: [1079]
};

const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));

function validateSearchInput(query, grams) {
  const normalizedQuery = String(query || '').trim().replace(/\s+/g, ' ');
  const normalizedGrams = Number(grams ?? 100);
  const errors = [];
  if (normalizedQuery.length < 2 || normalizedQuery.length > MAX_QUERY_LENGTH) {
    errors.push('Food name must contain between 2 and 100 characters.');
  }
  if (!Number.isFinite(normalizedGrams) || normalizedGrams < 1 || normalizedGrams > 2000) {
    errors.push('Serving weight must be between 1 and 2000 grams.');
  }
  return { valid: errors.length === 0, errors, query: normalizedQuery, grams: normalizedGrams };
}

function validateBarcode(value) {
  const barcode = String(value || '').replace(/\D/g, '');
  if (!BARCODE_PATTERN.test(barcode)) {
    const error = new Error('Barcode must contain 8, 12, 13, or 14 digits.');
    error.statusCode = 422;
    throw error;
  }
  return barcode;
}

function comparableBarcode(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0+/, '');
}

function nutrientValue(food, ids) {
  const nutrient = (food.foodNutrients || []).find((item) =>
    ids.includes(Number(item.nutrientId ?? item.nutrient?.id))
  );
  if (!nutrient) return null;
  const rawValue = nutrient.value ?? nutrient.amount;
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;
  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function normalizeFood(food, grams) {
  const factor = grams / 100;
  const rawNutrients = Object.fromEntries(
    Object.entries(NUTRIENT_IDS).map(([name, ids]) => [name, nutrientValue(food, ids)])
  );
  const scaledNutrients = {
    calories: rawNutrients.calories === null ? null : Math.round(rawNutrients.calories * factor),
    protein: rawNutrients.protein === null ? null : round(rawNutrients.protein * factor),
    carbs: rawNutrients.carbs === null ? null : round(rawNutrients.carbs * factor),
    fat: rawNutrients.fat === null ? null : round(rawNutrients.fat * factor),
    fiber: rawNutrients.fiber === null ? null : round(rawNutrients.fiber * factor)
  };
  const missingNutrients = Object.entries(scaledNutrients)
    .filter(([, value]) => value === null)
    .map(([name]) => name);
  return {
    fdcId: food.fdcId,
    name: food.description,
    dataType: food.dataType,
    brandName: food.brandName || food.brandOwner || null,
    gtinUpc: food.gtinUpc || null,
    grams,
    ...scaledNutrients,
    missingNutrients,
    nutritionComplete: missingNutrients.length === 0,
    source: 'USDA FoodData Central'
  };
}

function normalizePortions(food) {
  const portions = (food.foodPortions || []).map((portion) => {
    const amount = Number(portion.amount || 1);
    const unit = portion.measureUnit?.name || portion.measureUnit?.abbreviation || '';
    const modifier = portion.modifier || portion.portionDescription || '';
    const gramWeight = Number(portion.gramWeight);
    if (!Number.isFinite(gramWeight) || gramWeight <= 0) return null;
    return {
      id: portion.id || `${amount}-${unit}-${modifier}-${gramWeight}`,
      label: [amount, unit, modifier].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
      gramWeight: round(gramWeight)
    };
  }).filter(Boolean);
  if (Number.isFinite(Number(food.servingSize)) && String(food.servingSizeUnit || '').toLowerCase() === 'g') {
    portions.unshift({
      id: 'label-serving',
      label: '1 label serving',
      gramWeight: round(food.servingSize)
    });
  }
  return portions.filter((portion, index, all) =>
    all.findIndex((candidate) =>
      candidate.label === portion.label && candidate.gramWeight === portion.gramWeight
    ) === index
  );
}

function validateFdcId(value) {
  const fdcId = Number(value);
  if (!Number.isSafeInteger(fdcId) || fdcId <= 0) {
    const error = new Error('Bản ghi USDA không hợp lệ. Hãy tìm và chọn lại món ăn.');
    error.statusCode = 422;
    throw error;
  }
  return fdcId;
}

async function fetchFoodDetails({ fdcId, grams = 100, apiKey, fetchImpl = fetch }) {
  const validFdcId = validateFdcId(fdcId);
  const input = validateSearchInput('food', grams);
  if (!input.valid) {
    const error = new Error(input.errors.join(' '));
    error.statusCode = 422;
    throw error;
  }
  const response = await fetchImpl(
    `${FDC_FOOD_URL}/${validFdcId}?api_key=${encodeURIComponent(apiKey)}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!response.ok) {
    const error = new Error(response.status === 404
      ? 'Bản ghi USDA này không còn tồn tại. Hãy tìm và chọn một kết quả khác.'
      : 'Không thể kết nối USDA lúc này. Hãy kiểm tra kết nối hoặc thử lại sau.');
    error.statusCode = response.status === 404 ? 404 : 502;
    throw error;
  }
  const food = await response.json();
  return { food: normalizeFood(food, input.grams), portions: normalizePortions(food) };
}

async function searchFoods({ query, grams = 100, apiKey, fetchImpl = fetch }) {
  const input = validateSearchInput(query, grams);
  if (!input.valid) {
    const error = new Error(input.errors.join(' '));
    error.statusCode = 422;
    throw error;
  }
  const response = await fetchImpl(`${FDC_SEARCH_URL}?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: input.query,
      dataType: ['Foundation', 'Survey (FNDDS)', 'Branded', 'SR Legacy'],
      pageSize: 8
    }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) {
    const error = new Error(response.status === 429
      ? 'USDA đang giới hạn số lần tra cứu. Hãy đợi một lúc rồi thử lại.'
      : 'Không thể kết nối USDA lúc này. Hãy kiểm tra kết nối hoặc thử lại sau.');
    error.statusCode = response.status === 429 ? 429 : 502;
    throw error;
  }
  const payload = await response.json();
  return (payload.foods || []).map((food) => normalizeFood(food, input.grams));
}

async function searchBrandedFoodByBarcode({ barcode, grams = 100, apiKey, fetchImpl = fetch }) {
  const validBarcode = validateBarcode(barcode);
  const input = validateSearchInput('branded food', grams);
  if (!input.valid) {
    const error = new Error(input.errors.join(' '));
    error.statusCode = 422;
    throw error;
  }
  const expected = comparableBarcode(validBarcode);
  // FoodData Central may index the same product as UPC-A, without a leading
  // zero, or as a zero-padded GTIN-14. Search every equivalent form, but still
  // require an exact normalized GTIN match before returning a product.
  const gtin14 = validBarcode.padStart(14, '0');
  const queries = [...new Set([validBarcode, expected, gtin14].filter(Boolean))];
  const matches = new Map();

  for (const query of queries) {
    const response = await fetchImpl(`${FDC_SEARCH_URL}?api_key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        dataType: ['Branded'],
        pageSize: 25
      }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      const error = new Error(response.status === 429
        ? 'USDA is temporarily rate limiting barcode searches. Please try again later.'
        : 'The branded-food database is temporarily unavailable. Enter the product name instead.');
      error.statusCode = response.status === 429 ? 429 : 502;
      throw error;
    }

    const payload = await response.json();
    for (const food of payload.foods || []) {
      if (comparableBarcode(food.gtinUpc) === expected) {
        matches.set(food.fdcId, food);
      }
    }
    if (matches.size > 0) break;
  }

  return [...matches.values()].map((food) => normalizeFood(food, input.grams));
}

module.exports = {
  fetchFoodDetails,
  normalizeFood,
  normalizePortions,
  searchBrandedFoodByBarcode,
  searchFoods,
  validateBarcode,
  validateFdcId,
  validateSearchInput
};
