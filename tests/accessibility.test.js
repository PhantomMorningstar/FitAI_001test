const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ejs = require('ejs');

const pagesDirectory = path.join(__dirname, '..', 'views', 'pages');
const applicationPages = ['index.ejs', 'roadmap.ejs', 'camera.ejs', 'diary.ejs', 'profile.ejs'];

async function render(fileName) {
  return ejs.renderFile(path.join(pagesDirectory, fileName));
}

test('application pages expose language, skip navigation, main content, and an h1', async () => {
  for (const fileName of applicationPages) {
    const html = await render(fileName);
    const skipTarget = html.match(/class="skip-link"[^>]+href="#([^"]+)"/)?.[1];
    assert.match(html, /<html lang="vi">/, `${fileName} language`);
    assert.ok(skipTarget, `${fileName} skip link`);
    assert.match(html, new RegExp(`id="${skipTarget}"`), `${fileName} skip target`);
    assert.match(html, /<h1(?:\s|>)/, `${fileName} primary heading`);
    assert.match(html, /<nav[^>]+aria-label="Điều hướng chính"/, `${fileName} named navigation`);
  }
});

test('interactive icon controls have accessible names', async () => {
  const diary = await render('diary.ejs');
  const index = await render('index.ejs');
  assert.match(diary, /data-days="-1"[^>]+aria-label="Ngày trước"/);
  assert.match(diary, /data-days="1"[^>]+aria-label="Ngày sau"/);
  assert.match(index, /id="settings-toggle-btn"[^>]+aria-label="Mở cài đặt"/);
  assert.doesNotMatch(index, /<div class="allergy-chip"/);
  assert.equal((index.match(/class="allergy-chip"[^>]+aria-pressed="false"/g) || []).length, 6);
});

test('profile data visualizations have text alternatives', async () => {
  const profile = await render('profile.ejs');
  assert.match(profile, /<canvas[^>]+role="img"[^>]+aria-label=/);
  assert.equal((profile.match(/<caption class="visually-hidden">/g) || []).length, 3);
  assert.equal((profile.match(/type="time"[^>]+aria-label=/g) || []).length, 4);
});

test('camera recognition requires an explicit accessible confirmation step', async () => {
  const camera = await render('camera.ejs');
  assert.match(camera, /id="food-upload"[^>]+capture="environment"/);
  assert.match(camera, /id="vision-confidence"[^>]+role="status"/);
  assert.match(camera, /id="confirm-food-candidate-btn"[^>]*>Xác nhận gợi ý này<\/button>/);
});

test('camera barcode scanner has labelled controls and a manual fallback', async () => {
  const camera = await render('camera.ejs');
  assert.match(camera, /id="barcode-video"[^>]+aria-label="Khung hình quét mã vạch"/);
  assert.match(camera, /id="barcode-input"[^>]+inputmode="numeric"/);
  assert.match(camera, /id="barcode-status"[^>]+role="status"/);
  assert.match(camera, /id="lookup-barcode-btn"/);
});

test('branded foods can confirm a missing fiber value from the product label', async () => {
  const camera = await render('camera.ejs');
  assert.match(camera, /id="label-fiber-confirmation"[^>]+hidden/);
  assert.match(camera, /id="confirm-label-fiber-zero"[^>]+type="checkbox"/);
  assert.match(camera, /xác nhận chất xơ là 0 g/);
});

test('health safety screening is visible in the first onboarding step', async () => {
  const index = await render('index.ejs');
  const firstStep = index.match(/class="quiz-step active"[\s\S]*?class="quiz-step"/)?.[0] || '';
  assert.match(firstStep, /Kiểm tra an toàn trước khi tiếp tục/);
  assert.match(firstStep, /aria-describedby="health-screening-help"/);
  assert.equal((index.match(/id="health-pregnant"/g) || []).length, 1);
});
