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

test('every Vietnamese runtime UI string has an English translation', () => {
  const sourceFiles = [
    '../public/assets/js/app.js',
    '../public/assets/js/daily-focus-utils.js',
    '../public/assets/js/image-utils.js',
    '../public/assets/js/pwa.js',
    '../public/assets/js/roadmap-utils.js',
    '../src/controllers/nutrition-chat.controller.js',
    '../src/controllers/nutrition.controller.js',
    '../src/controllers/profile.controller.js',
    '../src/middleware/api-rate-limit.middleware.js',
    '../src/services/meal-suggestion.service.js',
    '../src/services/nutrition-chat.service.js'
  ];
  const missing = [];

  sourceFiles.forEach((relativePath) => {
    const source = fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
    runtimeVietnameseStrings(source)
      .filter((value) => !value.includes('<') && translateText(value, 'en') === value)
      .forEach((value) => missing.push(`${relativePath}: ${value}`));
  });

  assert.deepEqual(
    missing,
    [],
    `Add new runtime strings to VI_TO_EN:\n${missing.join('\n')}`
  );
});
