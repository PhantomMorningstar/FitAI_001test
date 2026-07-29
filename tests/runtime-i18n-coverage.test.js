const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translateText } = require('../public/assets/js/i18n');

const VIETNAMESE_CHARACTER = /[\u00C0-\u1EF9\u0110\u0111]/u;

function runtimeVietnameseStrings(source) {
  const strings = new Set();
  const literalPatterns = [
    /'([^'\r\n]*)'/g,
    /"([^"\r\n]*)"/g,
    /`([^`\r\n]*)`/g
  ];

  literalPatterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) {
      const literal = match[1];
      if (literal.includes('${')) continue;
      const candidates = literal.includes('<')
        ? literal.replace(/<[^>]+>/g, '\n').split(/\n+/)
        : [literal];
      candidates
        .map((value) => value.trim())
        .filter((value) => value && VIETNAMESE_CHARACTER.test(value))
        .forEach((value) => strings.add(value));
    }
  });
  return [...strings];
}

test('every static Vietnamese runtime UI string has an English translation', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../public/assets/js/app.js'),
    'utf8'
  );
  const missing = runtimeVietnameseStrings(source)
    .filter((value) => translateText(value, 'en') === value);

  assert.deepEqual(
    missing,
    [],
    `Add new runtime strings to VI_TO_EN:\n${missing.join('\n')}`
  );
});
