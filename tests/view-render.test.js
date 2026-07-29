const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ejs = require('ejs');

const pagesDirectory = path.join(__dirname, '..', 'views', 'pages');
const applicationPages = [
  ['index.ejs', 'Tổng quan'],
  ['roadmap.ejs', 'Lộ trình'],
  ['camera.ejs', 'Máy ảnh'],
  ['diary.ejs', 'Nhật ký'],
  ['profile.ejs', 'Hồ sơ']
];

async function render(fileName, locals = {}) {
  return ejs.renderFile(path.join(pagesDirectory, fileName), locals);
}

test('application pages render the shared shell exactly once', async () => {
  for (const [fileName, activeLabel] of applicationPages) {
    const html = await render(fileName);
    assert.equal((html.match(/class="app-top-bar"/g) || []).length, 1, `${fileName} header`);
    assert.equal((html.match(/class="bottom-nav"/g) || []).length, 1, `${fileName} navigation`);
    assert.equal((html.match(/firebase-app-compat\.js/g) || []).length, 1, `${fileName} Firebase SDK`);
    assert.equal((html.match(/src="\/assets\/js\/date-utils\.js"/g) || []).length, 1, `${fileName} date utils`);
    assert.equal((html.match(/src="\/assets\/js\/daily-focus-utils\.js"/g) || []).length, 1, `${fileName} daily focus utils`);
    assert.equal((html.match(/src="\/assets\/js\/dietary-utils\.js\?v=\d+"/g) || []).length, 1, `${fileName} dietary utils`);
    assert.equal((html.match(/src="\/assets\/js\/pwa\.js"/g) || []).length, 1, `${fileName} PWA client`);
    assert.equal((html.match(/src="\/assets\/js\/motion\.js"/g) || []).length, 1, `${fileName} motion client`);
    assert.equal((html.match(/src="\/assets\/js\/i18n\.js\?v=\d+"/g) || []).length, 1, `${fileName} i18n`);
    assert.equal((html.match(/src="\/assets\/js\/app\.js\?v=\d+"/g) || []).length, 1, `${fileName} app script`);
    assert.equal((html.match(/id="language-toggle"/g) || []).length, 1, `${fileName} language toggle`);
    assert.equal((html.match(/id="install-app-btn"/g) || []).length, 1, `${fileName} install button`);
    assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
    assert.match(html, new RegExp(`class="nav-item[^"]* active"[^>]*aria-current="page"[^>]*>[\\s\\S]*?<span>${activeLabel}</span>`));
  }
});

test('page-specific scripts remain attached to their pages', async () => {
  const camera = await render('camera.ejs');
  const diary = await render('diary.ejs');
  const roadmap = await render('roadmap.ejs');
  const profile = await render('profile.ejs');
  assert.match(diary, /food-entry-utils\.js/);
  assert.match(camera, /image-utils\.js/);
  assert.match(camera, /id="analysis-data-quality"[^>]*hidden/);
  assert.match(roadmap, /weight-utils\.js[\s\S]*roadmap-utils\.js/);
  assert.match(profile, /activity-utils\.js[\s\S]*wellness-utils\.js[\s\S]*reminder-utils\.js[\s\S]*weight-utils\.js/);
  assert.match(profile, /TDEE tham khảo từ vận động/);
  assert.match(profile, /không tự động thay đổi mục tiêu calorie hoặc kế hoạch/);
  assert.doesNotMatch(profile, />TDEE quan sát</);
});

test('error page uses the shared head without loading application SDKs', async () => {
  const html = await render('error.ejs', { title: 'Not Found', statusCode: 404, message: 'Missing' });
  assert.match(html, /<title>Not Found \| FitAI<\/title>/);
  assert.doesNotMatch(html, /firebase-app-compat\.js|font-awesome/);
});

test('overview renders the profile-based meal suggestion region', async () => {
  const html = await render('index.ejs');
  assert.match(html, /id="meal-suggestions-title"/);
  assert.match(html, /Ý tưởng món ăn theo mục tiêu của bạn/);
  assert.match(html, /ngân sách cho cả bữa/);
  assert.match(html, /id="meal-allergy-warning"[^>]*hidden/);
  assert.match(html, /nước sốt, công thức thực tế hoặc nhiễm chéo/);
  assert.match(html, /id="meal-suggestions-list"[^>]*aria-live="polite"/);
  assert.match(html, /id="meal-dietary-status"[^>]*hidden/);
  assert.match(html, /id="meal-suggestions-status"[^>]*role="status"/);
  assert.match(html, /mục tiêu calorie, protein, mức vận động và dị ứng/);
});

test('rendered pages declare Vietnamese and contain no mojibake markers', async () => {
  const suspicious = /Ã|Â|â€|ðŸ|Ä‘|Æ°|áº|á»/;
  for (const [fileName] of applicationPages) {
    const html = await render(fileName);
    assert.match(html, /<html lang="vi">/);
    assert.doesNotMatch(html, suspicious, `${fileName} contains broken UTF-8 text`);
  }
});
