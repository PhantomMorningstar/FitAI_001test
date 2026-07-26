const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('motion layer progressively reveals content and observes reduced-motion preference', () => {
  const source = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'motion.js'), 'utf8');
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /classList\.add\('is-visible'\)/);
});

test('CSS provides reduced-motion fallback without hiding content', () => {
  const css = fs.readFileSync(path.join(root, 'public', 'assets', 'css', 'main.css'), 'utf8');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.motion-ready \.motion-reveal \{ opacity: 1 !important; transform: none !important; \}/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
});
