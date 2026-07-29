const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('diary explains that completeness is self-confirmed and not independently verified', () => {
  const view = fs.readFileSync(
    path.join(__dirname, '../views/pages/diary.ejs'),
    'utf8'
  );
  assert.match(view, /do người dùng tự xác nhận/);
  assert.match(view, /FitAI không tự kiểm chứng món ăn, khẩu phần/);
  assert.match(view, /id="diary-verification-label"/);
});

test('confirmed diary state remains explicitly labelled as user-confirmed', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../public/assets/js/app.js'),
    'utf8'
  );
  assert.match(source, /Người dùng tự xác nhận/);
  assert.match(source, /Người dùng đã tự xác nhận ngày này được ghi đầy đủ/);
});
