const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const roots = ['public', 'views', 'src'];
const textExtensions = new Set(['.js', '.ejs', '.css']);
const suspicious = /Ã|Â|â€|ðŸ|Ä‘|Æ°|áº|á»/;

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(target);
    return textExtensions.has(path.extname(entry.name)) ? [target] : [];
  });
}

test('source files are valid UTF-8 without common mojibake sequences', () => {
  for (const root of roots) {
    for (const file of collectFiles(path.join(__dirname, '..', root))) {
      const source = fs.readFileSync(file, 'utf8');
      assert.equal(source.includes('\uFFFD'), false, `${file} contains a replacement character`);
      assert.doesNotMatch(source, suspicious, `${file} contains likely mojibake`);
    }
  }
});
