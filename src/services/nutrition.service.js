const FDC_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const FDC_FOOD_URL = 'https://api.nal.usda.gov/fdc/v1/food';
const MAX_QUERY_LENGTH = 100;

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

module.exports = {
  fetchFoodDetails,
  normalizeFood,
  normalizePortions,
  searchFoods,
  validateFdcId,
  validateSearchInput
};
