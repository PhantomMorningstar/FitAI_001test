const { validateProfile } = require('../validators/profile.validator');
const { calculateEnergyMetrics } = require('../services/energy.service');
const { calculateWeightPlan } = require('../services/weight-plan.service');
const { calculateMacroTargets } = require('../services/macro.service');
const {
  evaluateCalorieTargetSafety,
  evaluatePlanSafety
} = require('../services/safety.service');
const { generateMealSuggestions } = require('../services/meal-suggestion.service');

const validate = (req, res) => {
  const result = validateProfile(req.body);
  if (!result.valid) return res.status(422).json(result);

  const metrics = calculateEnergyMetrics(result.data);
  const plan = calculateWeightPlan(result.data, metrics);
  const macros = calculateMacroTargets(result.data, plan);
  const safety = evaluatePlanSafety(result.data, metrics, plan);
  const mealSuggestions = generateMealSuggestions(result.data, plan, macros, safety);
  const healthContextBlocked = safety.blockers.some(({ code }) => code.startsWith('HEALTH_CONTEXT_'));
  return res.status(safety.allowed ? 200 : 422).json({
    ...result,
    metrics,
    plan: healthContextBlocked ? null : plan,
    macros: healthContextBlocked ? null : macros,
    mealSuggestions,
    safety
  });
};

const validateCalibrationTarget = (req, res) => {
  const result = validateProfile(req.body?.profile);
  if (!result.valid) return res.status(422).json(result);

  const proposedTargetCalories = Number(req.body?.proposedTargetCalories);
  if (!Number.isInteger(proposedTargetCalories)
    || proposedTargetCalories < 800
    || proposedTargetCalories > 6000) {
    return res.status(422).json({
      valid: false,
      errors: {
        proposedTargetCalories: 'Mục tiêu calorie đề xuất phải là số nguyên từ 800–6.000 kcal/ngày.'
      }
    });
  }

  const metrics = calculateEnergyMetrics(result.data);
  const plan = calculateWeightPlan(result.data, metrics);
  const evaluation = evaluateCalorieTargetSafety(
    result.data,
    metrics,
    plan,
    proposedTargetCalories
  );
  return res.status(evaluation.safety.allowed ? 200 : 422).json({
    valid: true,
    ...evaluation
  });
};

module.exports = { validate, validateCalibrationTarget };
