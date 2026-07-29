const adultDob = () => {
  const today = new Date();
  const year = today.getUTCFullYear() - 31;
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const validProfile = (overrides = {}) => ({
  gender: 'Female',
  dob: adultDob(),
  height: 165,
  weight: 70,
  activity: 'lightly',
  goal: 'lose',
  targetWeight: 64,
  allergies: [],
  dietaryPreference: 'omnivore',
  healthContext: {},
  ...overrides
});

module.exports = { validProfile };
