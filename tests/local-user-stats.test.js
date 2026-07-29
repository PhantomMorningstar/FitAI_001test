const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const overview = fs.readFileSync(
  path.join(__dirname, '..', 'views', 'pages', 'index.ejs'),
  'utf8'
);
const appSource = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'assets', 'js', 'app.js'),
  'utf8'
);

test('onboarding does not present local counters as Firebase user statistics', () => {
  assert.doesNotMatch(overview, /id="stat-completed"/);
  assert.doesNotMatch(overview, /id="stat-guests"/);
  assert.doesNotMatch(overview, /<h3>Quản lý người dùng<\/h3>/);
  assert.doesNotMatch(appSource, /fitai_completed_onboarding_users/);
  assert.doesNotMatch(appSource, /fitai_guest_sessions/);
  assert.doesNotMatch(appSource, /function updateOnboardingStats/);
});

test('guest entry point explains local-only storage instead of showing fake totals', () => {
  assert.match(overview, /Khám phá ở chế độ khách/);
  assert.match(overview, /không được đồng bộ lên Firebase/);
  assert.match(overview, /Tiếp tục ở chế độ khách/);
});
