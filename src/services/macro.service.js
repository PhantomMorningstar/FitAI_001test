const KCAL_PER_GRAM = Object.freeze({
  protein: 4,
  carbs: 4,
  fat: 9
});

const PROTEIN_GRAMS_PER_KG = Object.freeze({
  sedentary: 1.2,
  lightly: 1.4,
  moderately: 1.6
});

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const calculateMacroTargets = (profile, plan) => {
  if (!profile || !plan || !Number.isFinite(plan.targetCalories) || plan.targetCalories <= 0) {
    throw new TypeError('A valid profile and positive calorie target are required.');
  }

  const targetCalories = plan.targetCalories;
  const referenceWeightKg = profile.goal === 'lose' ? profile.targetWeight : profile.weight;
  const activityProtein = PROTEIN_GRAMS_PER_KG[profile.activity];
  if (!activityProtein) throw new TypeError('Unsupported activity level.');

  const proteinGramsPerKg = profile.goal === 'maintain'
    ? activityProtein
    : Math.max(activityProtein, 1.6);
  const desiredProteinCalories = referenceWeightKg * proteinGramsPerKg * KCAL_PER_GRAM.protein;
  const proteinCalories = clamp(desiredProteinCalories, targetCalories * 0.1, targetCalories * 0.3);
  const fatCalories = targetCalories * 0.25;
  const carbsCalories = targetCalories - proteinCalories - fatCalories;

  const protein = Math.round(proteinCalories / KCAL_PER_GRAM.protein);
  const fat = Math.round(fatCalories / KCAL_PER_GRAM.fat);
  const carbs = Math.round(carbsCalories / KCAL_PER_GRAM.carbs);
  const fiber = Math.round((targetCalories / 1000) * 14);

  return {
    targetCalories,
    protein,
    carbs,
    fat,
    fiber,
    units: {
      macros: 'g/day',
      energy: 'kcal/day'
    },
    distribution: {
      proteinPercent: Math.round((proteinCalories / targetCalories) * 100),
      carbsPercent: Math.round((carbsCalories / targetCalories) * 100),
      fatPercent: 25
    },
    methodology: {
      proteinGramsPerKg,
      referenceWeightKg,
      fiberGramsPer1000Kcal: 14,
      energyPerGram: KCAL_PER_GRAM
    }
  };
};

module.exports = {
  calculateMacroTargets,
  KCAL_PER_GRAM,
  PROTEIN_GRAMS_PER_KG
};
