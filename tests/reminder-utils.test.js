const test = require('node:test');
const assert = require('node:assert/strict');
const { getDueReminders, normalizeSettings } = require('../public/assets/js/reminder-utils');

const settings = {
  enabled: true,
  items: {
    meal: { enabled: true, time: '20:00' },
    weight: { enabled: true, time: '08:00' },
    activity: { enabled: false, time: '20:30' },
    wellness: { enabled: true, time: '21:00' }
  }
};

test('reminders wait until their configured time', () => {
  const due = getDueReminders(settings, {}, {}, new Date(2026, 6, 23, 19, 59));
  assert.deepEqual(due.map(({ type }) => type), ['weight']);
});

test('completed habits and reminders already sent today are skipped', () => {
  const due = getDueReminders(
    settings,
    { weight: true },
    { meal: '2026-07-23' },
    new Date(2026, 6, 23, 22, 0)
  );
  assert.deepEqual(due.map(({ type }) => type), ['wellness']);
});

test('disabled reminder system returns no work', () => {
  assert.deepEqual(getDueReminders({ ...settings, enabled: false }, {}, {}, new Date(2026, 6, 23, 23, 0)), []);
});

test('invalid times fall back to a safe default', () => {
  assert.equal(normalizeSettings({
    enabled: true,
    items: { meal: { enabled: true, time: '99:99' } }
  }).items.meal.time, '20:00');
});
