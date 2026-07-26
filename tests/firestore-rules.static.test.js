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
  assert.match(rules, /request\.auth\.uid == userId/);
  assert.match(rules, /request\.resource\.data\.ownerId == request\.auth\.uid/);
});

test('food diary rules require ownerId on create', () => {
  assert.match(rules, /match \/foodDiaries\/\{entryId\}/);
  assert.match(rules, /request\.resource\.data\.ownerId == request\.auth\.uid/);
  assert.match(rules, /request\.resource\.data\.timestamp is timestamp/);
});

test('legacy migration is restricted to the matching authenticated UID', () => {
  assert.match(rules, /!resource\.data\.keys\(\)\.hasAny\(\['ownerId'\]\)/);
  assert.match(rules, /resource\.data\.keys\(\)\.hasAll\(\['userId'\]\)/);
  assert.match(rules, /resource\.data\.userId == request\.auth\.uid/);
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
