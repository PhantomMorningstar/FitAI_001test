const ALLOWED_GENDERS = new Set(['Male', 'Female']);
const ALLOWED_ACTIVITIES = new Set(['sedentary', 'lightly', 'moderately']);
const ALLOWED_GOALS = new Set(['lose', 'maintain', 'gain']);
const ALLOWED_ALLERGIES = new Set(['seafood', 'peanuts', 'milk', 'eggs', 'gluten', 'soy']);
const ALLOWED_DIETARY_PREFERENCES = new Set(['omnivore', 'vegetarian']);

const toFiniteNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const calculateAge = (dateOfBirth, today = new Date()) => {
  if (typeof dateOfBirth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;

  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const birthDate = new Date(Date.UTC(year, month - 1, day));
  if (
    birthDate.getUTCFullYear() !== year ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) return null;

  let age = today.getUTCFullYear() - year;
  const birthdayHasPassed =
    today.getUTCMonth() > month - 1 ||
    (today.getUTCMonth() === month - 1 && today.getUTCDate() >= day);
  if (!birthdayHasPassed) age -= 1;
  return age;
};

const validateProfile = (input, options = {}) => {
  const profile = input && typeof input === 'object' ? input : {};
  const errors = {};
  const height = toFiniteNumber(profile.height);
  const weight = toFiniteNumber(profile.weight);
  const targetWeight = toFiniteNumber(profile.targetWeight);
  const age = calculateAge(profile.dob, options.today || new Date());

  if (!ALLOWED_GENDERS.has(profile.gender)) errors.gender = 'Hãy chọn giới tính hợp lệ.';
  if (age === null) errors.dob = 'Hãy nhập ngày sinh hợp lệ.';
  else if (age < 18) errors.dob = 'FitAI hiện chỉ hỗ trợ người từ 18 tuổi trở lên.';
  else if (age > 100) errors.dob = 'Hãy kiểm tra lại ngày sinh.';

  if (height === null || height < 120 || height > 230) {
    errors.height = 'Chiều cao phải nằm trong khoảng 120–230 cm.';
  }
  if (weight === null || weight < 35 || weight > 300) {
    errors.weight = 'Cân nặng hiện tại phải nằm trong khoảng 35–300 kg.';
  }
  if (!ALLOWED_ACTIVITIES.has(profile.activity)) errors.activity = 'Hãy chọn mức vận động hợp lệ.';
  if (!ALLOWED_GOALS.has(profile.goal)) errors.goal = 'Hãy chọn mục tiêu cân nặng hợp lệ.';
  if (targetWeight === null || targetWeight < 35 || targetWeight > 300) {
    errors.targetWeight = 'Cân nặng mục tiêu phải nằm trong khoảng 35–300 kg.';
  }

  if (!errors.weight && !errors.targetWeight && !errors.goal) {
    if (profile.goal === 'lose' && targetWeight >= weight) {
      errors.targetWeight = 'Mục tiêu giảm cân phải thấp hơn cân nặng hiện tại.';
    } else if (profile.goal === 'gain' && targetWeight <= weight) {
      errors.targetWeight = 'Mục tiêu tăng cân phải cao hơn cân nặng hiện tại.';
    } else if (profile.goal === 'maintain' && Math.abs(targetWeight - weight) > 2) {
      errors.targetWeight = 'Mục tiêu duy trì phải nằm trong khoảng ±2 kg so với cân nặng hiện tại.';
    }
  }

  const allergies = Array.isArray(profile.allergies) ? profile.allergies : [];
  if (allergies.some((allergy) => !ALLOWED_ALLERGIES.has(allergy))) {
    errors.allergies = 'Một hoặc nhiều lựa chọn dị ứng không hợp lệ.';
  }
  const dietaryPreference = profile.dietaryPreference || 'omnivore';
  if (!ALLOWED_DIETARY_PREFERENCES.has(dietaryPreference)) {
    errors.dietaryPreference = 'Lựa chọn chế độ ăn không hợp lệ.';
  }
  const healthContext = {
    pregnant: profile.healthContext?.pregnant === true,
    breastfeeding: profile.healthContext?.breastfeeding === true,
    eatingDisorderHistory: profile.healthContext?.eatingDisorderHistory === true,
    clinicianSupervised: profile.healthContext?.clinicianSupervised === true
  };

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      gender: profile.gender,
      dob: profile.dob,
      age,
      height,
      weight,
      activity: profile.activity,
      goal: profile.goal,
      targetWeight,
      allergies: [...new Set(allergies)],
      dietaryPreference,
      healthContext
    }
  };
};

module.exports = { calculateAge, validateProfile };
