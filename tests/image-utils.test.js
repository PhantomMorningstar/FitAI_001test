const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateContainSize,
  MAX_SOURCE_BYTES,
  validateImageFile
} = require('../public/assets/js/image-utils');

test('large photos are resized within 1600 pixels without changing aspect ratio', () => {
  assert.deepEqual(calculateContainSize(4000, 3000), { width: 1600, height: 1200 });
  assert.deepEqual(calculateContainSize(900, 1200), { width: 900, height: 1200 });
});

test('image upload validates MIME type and a practical source-size limit', () => {
  assert.equal(validateImageFile({ type: 'image/jpeg', size: 5_000_000 }).valid, true);
  assert.equal(validateImageFile({ type: 'text/html', size: 100 }).valid, false);
  assert.equal(validateImageFile({ type: 'image/png', size: MAX_SOURCE_BYTES + 1 }).valid, false);
});
