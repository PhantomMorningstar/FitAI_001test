const ACTIVITY_FACTORS = Object.freeze({
  sedentary: 1.2,
  lightly: 1.375,
  moderately: 1.55
});

const round = (value, decimals = 0) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const classifyBmi = (bmi) => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'healthy';
  if (bmi < 30) return 'overweight';
  if (bmi < 35) return 'obesity-class-1';
  if (bmi < 40) return 'obesity-class-2';
  return 'obesity-class-3';
};

const calculateBmi = (weightKg, heightCm) => {
  const heightMeters = heightCm / 100;
  return round(weightKg / (heightMeters ** 2), 1);
};

const calculateBmr = ({ gender, weight, height, age }) => {
  const sexConstant = gender === 'Male' ? 5 : -161;
  return Math.round((10 * weight) + (6.25 * height) - (5 * age) + sexConstant);
};

const calculateEnergyMetrics = (profile) => {
  const activityFactor = ACTIVITY_FACTORS[profile.activity];
  if (!activityFactor) throw new TypeError('Unsupported activity level.');

  const bmi = calculateBmi(profile.weight, profile.height);
  const targetBmi = calculateBmi(profile.targetWeight, profile.height);
  const bmr = calculateBmr(profile);

  return {
    age: profile.age,
    bmi,
    bmiCategory: classifyBmi(bmi),
    targetBmi,
    targetBmiCategory: classifyBmi(targetBmi),
    bmr,
    activityFactor,
    tdee: Math.round(bmr * activityFactor),
    units: {
      bmi: 'kg/m2',
      energy: 'kcal/day'
    },
    methodology: {
      bmr: 'Mifflin-St Jeor',
      tdee: 'BMR multiplied by activity factor'
    }
  };
};

module.exports = {
  ACTIVITY_FACTORS,
  calculateBmi,
  calculateBmr,
  calculateEnergyMetrics,
  classifyBmi
};
