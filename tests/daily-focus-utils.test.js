const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDailyFocus } = require('../public/assets/js/daily-focus-utils');

test('daily focus shows at most three incomplete priorities first', () => {
  const tasks = buildDailyFocus({ meal: true, activity: false, wellness: false, weight: false });
  assert.equal(tasks.length, 3);
  assert.deepEqual(tasks.map(({ type }) => type), ['activity', 'wellness', 'weight']);
  assert.ok(tasks.every(({ completed }) => !completed));
});

test('daily focus keeps completion state when all habits are done', () => {
  const tasks = buildDailyFocus({ meal: true, activity: true, wellness: true, weight: true });
  assert.equal(tasks.length, 3);
  assert.ok(tasks.every(({ completed }) => completed));
});
