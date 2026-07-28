const MEAL_CATALOG = Object.freeze({
  breakfast: [
    {
      name: 'Cháo gạo lứt với ức gà và rau',
      tags: ['high-protein', 'high-fiber'],
      allergens: []
    },
    {
      name: 'Khoai lang, trứng và rau xanh',
      tags: ['high-protein', 'high-fiber'],
      allergens: ['eggs']
    },
    {
      name: 'Yến mạch, chuối và sữa chua không đường',
      tags: ['high-fiber'],
      allergens: ['gluten', 'milk']
    },
    {
      name: 'Cơm, đậu phụ và rau củ',
      tags: ['plant-protein', 'high-fiber'],
      allergens: ['soy']
    }
  ],
  lunch: [
    {
      name: 'Ức gà, cơm và rau luộc',
      tags: ['high-protein', 'balanced'],
      allergens: []
    },
    {
      name: 'Cá, khoai tây và salad',
      tags: ['high-protein', 'balanced'],
      allergens: ['seafood']
    },
    {
      name: 'Thịt bò nạc, cơm và rau xào ít dầu',
      tags: ['high-protein', 'balanced'],
      allergens: []
    },
    {
      name: 'Đậu phụ, cơm gạo lứt và rau củ',
      tags: ['plant-protein', 'high-fiber'],
      allergens: ['soy']
    }
  ],
  dinner: [
    {
      name: 'Canh gà, cơm và nhiều rau',
      tags: ['high-protein', 'balanced'],
      allergens: []
    },
    {
      name: 'Cá hấp, cơm và rau xanh',
      tags: ['high-protein', 'balanced'],
      allergens: ['seafood']
    },
    {
      name: 'Thịt nạc, khoai lang và rau',
      tags: ['high-protein', 'high-fiber'],
      allergens: []
    },
    {
      name: 'Đậu, cơm và bơ',
      tags: ['plant-protein', 'energy-dense', 'high-fiber'],
      allergens: []
    }
  ]
});

const SLOT_CONFIG = Object.freeze([
  { key: 'breakfast', label: 'Bữa sáng', calorieShare: 0.25, proteinShare: 0.25 },
  { key: 'lunch', label: 'Bữa trưa', calorieShare: 0.35, proteinShare: 0.35 },
  { key: 'dinner', label: 'Bữa tối', calorieShare: 0.3, proteinShare: 0.3 }
]);

function calorieRange(targetCalories, share) {
  const centre = targetCalories * share;
  return {
    minimum: Math.round((centre * 0.9) / 10) * 10,
    maximum: Math.round((centre * 1.1) / 10) * 10
  };
}

function rankOption(option, profile) {
  let score = 0;
  if (option.tags.includes('high-protein')) score += 2;
  if (profile.goal === 'lose' && option.tags.includes('high-fiber')) score += 2;
  if (profile.goal === 'gain' && option.tags.includes('energy-dense')) score += 3;
  if (profile.activity === 'moderately' && option.tags.includes('balanced')) score += 1;
  return score;
}

function compatibleOptions(options, allergies, profile) {
  const excluded = new Set(allergies);
  return options
    .filter((option) => option.allergens.every((allergen) => !excluded.has(allergen)))
    .sort((left, right) => rankOption(right, profile) - rankOption(left, profile))
    .slice(0, 2)
    .map(({ name }) => name);
}

function generateMealSuggestions(profile, plan, macros, safety) {
  if (!profile || !plan || !macros || safety?.allowed === false) {
    return {
      available: false,
      reason: 'FitAI chỉ tạo gợi ý món khi hồ sơ và kế hoạch đã vượt qua kiểm tra an toàn.',
      meals: []
    };
  }

  const allergies = Array.isArray(profile.allergies) ? profile.allergies : [];
  const meals = SLOT_CONFIG.map((slot) => ({
    slot: slot.key,
    label: slot.label,
    calorieRange: calorieRange(plan.targetCalories, slot.calorieShare),
    proteinTarget: Math.round(macros.protein * slot.proteinShare),
    options: compatibleOptions(MEAL_CATALOG[slot.key], allergies, profile)
  }));

  const goalGuidance = {
    lose: 'Ưu tiên thực phẩm giàu đạm và chất xơ để hỗ trợ cảm giác no trong mức năng lượng mục tiêu.',
    maintain: 'Ưu tiên bữa ăn cân bằng và duy trì khẩu phần ổn định.',
    gain: 'Tăng năng lượng bằng khẩu phần lớn hơn hoặc thực phẩm giàu năng lượng, không chỉ bằng đồ ngọt.'
  };

  return {
    available: true,
    basedOn: {
      goal: profile.goal,
      activity: profile.activity,
      targetCalories: plan.targetCalories,
      protein: macros.protein,
      allergies
    },
    guidance: goalGuidance[profile.goal],
    meals,
    disclaimer: 'Đây là gợi ý nhóm món, không phải thực đơn y khoa. Hãy cân khẩu phần và tra cứu USDA trước khi lưu dinh dưỡng.'
  };
}

module.exports = {
  MEAL_CATALOG,
  generateMealSuggestions
};
