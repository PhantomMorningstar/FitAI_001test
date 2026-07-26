const KCAL_PER_KG_ESTIMATE = 7700;

const roundToNearest = (value, increment) => Math.round(value / increment) * increment;

const getDeficitRate = (bmiCategory) => {
  if (bmiCategory === 'healthy' || bmiCategory === 'underweight') return 0.1;
  if (bmiCategory === 'overweight') return 0.15;
  return 0.2;
};

const calculateWeightPlan = (profile, metrics) => {
  const tdee = metrics.tdee;
  let energyAdjustment = 0;
  let adjustmentRate = 0;

  if (profile.goal === 'lose') {
    adjustmentRate = getDeficitRate(metrics.bmiCategory);
    energyAdjustment = -Math.min(Math.round(tdee * adjustmentRate), 750);
  } else if (profile.goal === 'gain') {
    adjustmentRate = 0.1;
    energyAdjustment = Math.min(Math.round(tdee * adjustmentRate), 400);
  }

  const targetCalories = roundToNearest(tdee + energyAdjustment, 10);
  const dailyEnergyDifference = profile.goal === 'maintain' ? 0 : targetCalories - tdee;
  const estimatedWeeklyChangeKg = Math.abs((dailyEnergyDifference * 7) / KCAL_PER_KG_ESTIMATE);
  const weightDifferenceKg = Math.abs(profile.targetWeight - profile.weight);
  const estimatedWeeks = profile.goal !== 'maintain' && estimatedWeeklyChangeKg > 0
    ? Math.ceil(weightDifferenceKg / estimatedWeeklyChangeKg)
    : null;

  return {
    goal: profile.goal,
    maintenanceCalories: tdee,
    targetCalories,
    adjustmentCalories: dailyEnergyDifference,
    adjustmentRate,
    estimatedWeeklyChangeKg: Math.round(estimatedWeeklyChangeKg * 100) / 100,
    estimatedWeeks,
    estimatedDays: estimatedWeeks === null ? null : estimatedWeeks * 7,
    model: 'TDEE percentage adjustment',
    assumptions: {
      kcalPerKg: KCAL_PER_KG_ESTIMATE,
      activityRemainsStable: true,
      estimateIsLinear: true
    }
  };
};

module.exports = { calculateWeightPlan, getDeficitRate, KCAL_PER_KG_ESTIMATE };
