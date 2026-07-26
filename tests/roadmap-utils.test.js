const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPersonalizedRoadmap } = require('../public/assets/js/roadmap-utils');
const weightUtils = require('../public/assets/js/weight-utils');

const profile = {
  goal: 'lose',
  targetWeight: 70,
  plan: { targetCalories: 1800, estimatedWeeklyChangeKg: 0.5 },
  macros: { protein: 120, carbs: 190, fat: 55, fiber: 25 }
};

test('roadmap keeps baseline active until enough real history exists', () => {
  const roadmap = buildPersonalizedRoadmap(profile, [
    { dateKey: '2026-07-01', weightKg: 80 }
  ], [{ dateKey: '2026-07-01' }], weightUtils);

  assert.equal(roadmap.phases[0].status, 'completed');
  assert.equal(roadmap.phases[1].status, 'active');
  assert.equal(roadmap.phases[2].status, 'upcoming');
});

test('roadmap activates weight-loss phase from sufficient weight and diary history', () => {
  const roadmap = buildPersonalizedRoadmap(profile, [
    { dateKey: '2026-07-01', weightKg: 80 },
    { dateKey: '2026-07-05', weightKg: 79.5 },
    { dateKey: '2026-07-10', weightKg: 79 }
  ], [
    { dateKey: '2026-07-01' },
    { dateKey: '2026-07-03' },
    { dateKey: '2026-07-08' }
  ], weightUtils);

  assert.equal(roadmap.phases[1].status, 'completed');
  assert.equal(roadmap.phases[2].status, 'active');
  assert.equal(roadmap.progressPercent, 10);
  assert.equal(roadmap.estimatedWeeksRemaining, 12);
});

test('roadmap starts maintenance after the target is reached', () => {
  const roadmap = buildPersonalizedRoadmap(profile, [
    { dateKey: '2026-07-01', weightKg: 80 },
    { dateKey: '2026-07-08', weightKg: 74 },
    { dateKey: '2026-07-15', weightKg: 69.8 }
  ], [
    { dateKey: '2026-07-01' },
    { dateKey: '2026-07-08' },
    { dateKey: '2026-07-15' }
  ], weightUtils);

  assert.equal(roadmap.phases[2].status, 'completed');
  assert.equal(roadmap.phases[3].status, 'active');
});

test('roadmap does not invent targets when profile engine data is missing', () => {
  const roadmap = buildPersonalizedRoadmap({}, [], [], weightUtils);
  assert.equal(roadmap.ready, false);
  assert.equal(roadmap.phases[0].status, 'active');
  assert.equal(roadmap.progressPercent, null);
});
