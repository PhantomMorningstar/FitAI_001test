const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateAge, validateProfile } = require('../src/validators/profile.validator');

const today = new Date('2026-07-22T00:00:00.000Z');
const validProfile = {
  gender: 'Female',
  dob: '1995-07-22',
  height: 165,
  weight: 70,
  activity: 'lightly',
  goal: 'lose',
  targetWeight: 62,
  allergies: ['milk'],
  dietaryPreference: 'vegetarian'
};

test('calculates age without an off-by-one error', () => {
  assert.equal(calculateAge('1995-07-22', today), 31);
  assert.equal(calculateAge('1995-07-23', today), 30);
});

test('accepts and normalizes a valid adult profile', () => {
  const result = validateProfile(validProfile, { today });
  assert.equal(result.valid, true);
  assert.equal(result.data.age, 31);
  assert.equal(result.data.height, 165);
  assert.equal(result.data.dietaryPreference, 'vegetarian');
});

test('rejects underage and implausible measurements', () => {
  const result = validateProfile({
    ...validProfile,
    dob: '2010-01-01',
    height: 80,
    weight: 500
  }, { today });
  assert.equal(result.valid, false);
  assert.ok(result.errors.dob);
  assert.ok(result.errors.height);
  assert.ok(result.errors.weight);
});

test('requires target direction to match the selected goal', () => {
  const result = validateProfile({ ...validProfile, targetWeight: 75 }, { today });
  assert.equal(result.valid, false);
  assert.match(result.errors.targetWeight, /thấp hơn/);
});

test('rejects unknown enum and allergy values', () => {
  const result = validateProfile({
    ...validProfile,
    gender: 'unknown',
    activity: 'extreme',
    dietaryPreference: 'pescatarian',
    allergies: ['unknown-food']
  }, { today });
  assert.equal(result.valid, false);
  assert.ok(result.errors.gender);
  assert.ok(result.errors.activity);
  assert.ok(result.errors.allergies);
  assert.ok(result.errors.dietaryPreference);
});
