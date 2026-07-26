const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { validProfile } = require('./helpers/profile.fixture');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const postProfile = (profile) => fetch(`${baseUrl}/api/profile/validate`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(profile)
});

test('API returns normalized profile, metrics, plan, macros, and safety result', async () => {
  const response = await postProfile(validProfile());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.valid, true);
  assert.equal(body.data.age, 31);
  assert.equal(body.metrics.bmi, 25.7);
  assert.equal(body.metrics.tdee, 1946);
  assert.equal(body.plan.targetCalories, 1650);
  assert.equal(body.macros.protein, 102);
  assert.equal(body.macros.carbs, 207);
  assert.equal(body.macros.fat, 46);
  assert.equal(body.macros.fiber, 23);
  assert.equal(body.safety.allowed, true);
  assert.equal(body.safety.status, 'ok');
});

test('API rejects malformed profile fields before calculating metrics', async () => {
  const response = await postProfile(validProfile({ height: 80, activity: 'extreme' }));
  const body = await response.json();
  assert.equal(response.status, 422);
  assert.equal(body.valid, false);
  assert.ok(body.errors.height);
  assert.ok(body.errors.activity);
  assert.equal(body.metrics, undefined);
});

test('API distinguishes a valid profile from an unsafe plan', async () => {
  const response = await postProfile(validProfile({ targetWeight: 45 }));
  const body = await response.json();
  assert.equal(response.status, 422);
  assert.equal(body.valid, true);
  assert.equal(body.safety.allowed, false);
  assert.ok(body.safety.blockers.some(({ code }) => code === 'TARGET_BMI_UNDERWEIGHT'));
});

test('API returns warnings without blocking a large but otherwise valid goal', async () => {
  const response = await postProfile(validProfile({ targetWeight: 62 }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.safety.status, 'warning');
  assert.ok(body.safety.warnings.some(({ code }) => code === 'LARGE_INITIAL_GOAL'));
});
