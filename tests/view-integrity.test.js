const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagesDirectory = path.join(__dirname, '..', 'views', 'pages');

test('each EJS page uses unique HTML ids', () => {
  for (const fileName of fs.readdirSync(pagesDirectory).filter((name) => name.endsWith('.ejs'))) {
    const source = fs.readFileSync(path.join(pagesDirectory, fileName), 'utf8');
    const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual([...new Set(duplicates)], [], `${fileName} contains duplicate HTML ids`);
  }
});

test('each EJS page loads each local script once', () => {
  for (const fileName of fs.readdirSync(pagesDirectory).filter((name) => name.endsWith('.ejs'))) {
    const source = fs.readFileSync(path.join(pagesDirectory, fileName), 'utf8');
    const scripts = [...source.matchAll(/<script[^>]+src="(\/assets\/js\/[^"]+)"/g)].map((match) => match[1]);
    const duplicates = scripts.filter((script, index) => scripts.indexOf(script) !== index);
    assert.deepEqual([...new Set(duplicates)], [], `${fileName} loads a local script more than once`);
  }
});

test('onboarding display mode preserves centered grid layout', () => {
  const appScript = fs.readFileSync(path.join(__dirname, '..', 'public', 'assets', 'js', 'app.js'), 'utf8');
  assert.match(appScript, /onboardingScreen\.style\.display = 'grid'/);
  assert.doesNotMatch(appScript, /onboardingScreen\.style\.display = 'flex'/);
});
