const { validateProfile } = require('../validators/profile.validator');
const { calculateEnergyMetrics } = require('../services/energy.service');
const { calculateWeightPlan } = require('../services/weight-plan.service');
const { calculateMacroTargets } = require('../services/macro.service');
const { evaluatePlanSafety } = require('../services/safety.service');

const validate = (req, res) => {
  const result = validateProfile(req.body);
  if (!result.valid) return res.status(422).json(result);

  const metrics = calculateEnergyMetrics(result.data);
  const plan = calculateWeightPlan(result.data, metrics);
  const macros = calculateMacroTargets(result.data, plan);
  const safety = evaluatePlanSafety(result.data, metrics, plan);
  const healthContextBlocked = safety.blockers.some(({ code }) => code.startsWith('HEALTH_CONTEXT_'));
  return res.status(safety.allowed ? 200 : 422).json({
    ...result,
    metrics,
    plan: healthContextBlocked ? null : plan,
    macros: healthContextBlocked ? null : macros,
    safety
  });
};

module.exports = { validate };
