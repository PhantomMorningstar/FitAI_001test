const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const overview = fs.readFileSync(
  path.join(__dirname, '..', 'views', 'pages', 'index.ejs'),
  'utf8'
);

test('overview does not present untracked hydration as real user data', () => {
  assert.doesNotMatch(overview, /1\.5\s*L\s*\/\s*2\.5\s*L/i);
  assert.doesNotMatch(overview, /<small>Nước uống<\/small>/);
  assert.doesNotMatch(overview, /fa-droplet/);
});

test('overview does not preload a sample body weight as user data', () => {
  assert.match(overview, /id="dash-current-w">--</);
  assert.doesNotMatch(overview, /id="dash-current-w">68 kg</);
});
