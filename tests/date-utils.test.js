const test = require('node:test');
const assert = require('node:assert/strict');
const {
  belongsToLocalDay,
  getLocalDayRange,
  parseDateKey,
  shiftDateKey,
  toDateKey
} = require('../public/assets/js/date-utils');

test('local diary day starts at local midnight and ends at next local midnight', () => {
  const { start, end } = getLocalDayRange('2026-07-23');
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(toDateKey(start), '2026-07-23');
  assert.equal(toDateKey(end), '2026-07-24');
});

test('diary range includes start and excludes the next midnight', () => {
  const { start, end } = getLocalDayRange('2026-07-23');
  assert.equal(belongsToLocalDay(start, '2026-07-23'), true);
  assert.equal(belongsToLocalDay(new Date(end.getTime() - 1), '2026-07-23'), true);
  assert.equal(belongsToLocalDay(end, '2026-07-23'), false);
});

test('date navigation handles month and year boundaries', () => {
  assert.equal(shiftDateKey('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDateKey('2026-12-31', 1), '2027-01-01');
});

test('invalid calendar dates are rejected', () => {
  assert.throws(() => parseDateKey('2026-02-30'), /Invalid calendar date/);
  assert.throws(() => parseDateKey('23-07-2026'), /Invalid date key/);
});
