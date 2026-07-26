const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'assets', 'js', 'app.js'),
  'utf8'
);

function functionSource(name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  const endMarker = nextName.startsWith('document.')
    ? nextName
    : `function ${nextName}(`;
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, `${name} must exist`);
  assert.notEqual(end, -1, `${nextName} must exist after ${name}`);
  return source.slice(start, end);
}

test('diary item renderer references its item argument and not unrelated profile data', () => {
  const renderer = functionSource('createFoodDiaryItemElement', 'loadDiaryFromFirebase');
  assert.doesNotMatch(renderer, /\bdata\.healthContext/);
  assert.match(renderer, /item\.foodName/);
  assert.match(renderer, /FitAIFoodEntryUtils\.scaleFoodEntry\(item/);
});

test('health-context hydration remains inside the profile renderer', () => {
  const renderer = functionSource('updateProfileUI', 'document.addEventListener("DOMContentLoaded"');
  assert.match(renderer, /data\.healthContext\?\.pregnant/);
  assert.match(renderer, /data\.healthContext\?\.clinicianSupervised/);
});
