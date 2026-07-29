const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');

test('Firestore rules deny unmatched collections by default', () => {
  assert.match(rules, /match \/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false;/);
});

test('profile rules bind document ID and ownerId to authenticated UID', () => {
  assert.match(rules, /match \/profiles\/\{userId\}/);
  assert.match(rules, /function validProfileDocument\(data, userId\)/);
  assert.match(rules, /data\.keys\(\)\.hasOnly/);
  assert.match(rules, /request\.auth\.uid == userId/);
  assert.match(rules, /data\.ownerId == request\.auth\.uid/);
  assert.match(rules, /data\.height >= 120/);
  assert.match(rules, /data\.height <= 230/);
  assert.match(rules, /data\.weight >= 35/);
  assert.match(rules, /data\.weight <= 300/);
  assert.match(rules, /data\.allergies\.hasOnly/);
  assert.match(rules, /function validReminders\(data\)/);
});

test('food diary rules validate ownership, nutrients, portion, and allowed fields', () => {
  assert.match(rules, /match \/foodDiaries\/\{entryId\}/);
  assert.match(rules, /function validFoodDiaryEntry\(\)/);
  assert.match(rules, /data\.keys\(\)\.hasOnly/);
  assert.match(rules, /validNutrient\(data\.calories, 20000\)/);
  assert.match(rules, /validNutrient\(data\.protein, 2000\)/);
  assert.match(rules, /data\.servingGrams >= 1/);
  assert.match(rules, /data\.servingGrams <= 2000/);
  assert.match(rules, /data\.timestamp is timestamp/);
});

test('legacy migration is restricted to the matching authenticated UID', () => {
  assert.match(rules, /!resource\.data\.keys\(\)\.hasAny\(\['ownerId'\]\)/);
  assert.match(rules, /resource\.data\.keys\(\)\.hasAll\(\['userId'\]\)/);
  assert.match(rules, /resource\.data\.userId == request\.auth\.uid/);
});

test('completed diary days are owner-scoped and bound to UID plus date', () => {
  assert.match(rules, /match \/diaryDayStatuses\/\{entryId\}/);
  assert.match(rules, /function validDiaryDayStatus\(\)/);
  assert.match(rules, /request\.resource\.data\.completed == true/);
  assert.match(rules, /entryId == request\.auth\.uid \+ "_" \+ request\.resource\.data\.dateKey/);
  assert.match(rules, /request\.resource\.data\.completedAt is timestamp/);
});

test('weight history is owner-scoped and validates measurement fields', () => {
  assert.match(rules, /match \/weightEntries\/\{entryId\}/);
  assert.match(rules, /entryId == request\.auth\.uid \+ "_" \+ request\.resource\.data\.dateKey/);
  assert.match(rules, /request\.resource\.data\.weightKg >= 30/);
  assert.match(rules, /request\.resource\.data\.weightKg <= 350/);
  assert.match(rules, /request\.resource\.data\.measuredAt is timestamp/);
});

test('activity history is owner-scoped and validates steps and minutes', () => {
  assert.match(rules, /match \/activityEntries\/\{entryId\}/);
  assert.match(rules, /request\.resource\.data\.steps <= 100000/);
  assert.match(rules, /request\.resource\.data\.activeMinutes <= 1440/);
  assert.match(rules, /entryId == request\.auth\.uid \+ "_" \+ request\.resource\.data\.dateKey/);
});

test('wellness history is owner-scoped and validates sleep and stress', () => {
  assert.equal((rules.match(/match \/wellnessEntries\/\{entryId\}/g) || []).length, 1);
  assert.match(rules, /match \/wellnessEntries\/\{entryId\}/);
  assert.match(rules, /request\.resource\.data\.sleepHours <= 24/);
  assert.match(rules, /request\.resource\.data\.stressLevel >= 1/);
  assert.match(rules, /request\.resource\.data\.stressLevel <= 5/);
});
