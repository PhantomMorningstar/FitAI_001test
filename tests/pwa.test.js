const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicDirectory = path.join(__dirname, '..', 'public');

test('web app manifest contains installable FitAI metadata', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.name, 'FitAI - Theo dõi sức khỏe');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some((icon) => icon.purpose.includes('maskable')));
});

test('service worker caches the app shell but excludes APIs and remote requests', () => {
  const source = fs.readFileSync(path.join(publicDirectory, 'service-worker.js'), 'utf8');
  const appShell = source.match(/const APP_SHELL = \[([\s\S]*?)\];/)?.[1] || '';
  assert.match(source, /'\/offline\.html'/);
  assert.match(source, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(source, /url\.origin !== self\.location\.origin/);
  assert.doesNotMatch(appShell, /['"]\/api\//);
});

test('offline fallback and PWA client registration exist', () => {
  const offline = fs.readFileSync(path.join(publicDirectory, 'offline.html'), 'utf8');
  const client = fs.readFileSync(path.join(publicDirectory, 'assets', 'js', 'pwa.js'), 'utf8');
  assert.match(offline, /Bạn đang ngoại tuyến/);
  assert.match(client, /register\('\/service-worker\.js'/);
  assert.match(client, /beforeinstallprompt/);
  assert.match(client, /navigator\.onLine/);
});

test('service worker handles local notification clicks', () => {
  const source = fs.readFileSync(path.join(publicDirectory, 'service-worker.js'), 'utf8');
  assert.match(source, /notificationclick/);
  assert.match(source, /clients\.openWindow/);
  assert.match(source, /event\.notification\.data\?\.url/);
});

test('profile provides a local notification test button and readiness states', () => {
  const profile = fs.readFileSync(path.join(__dirname, '..', 'views', 'pages', 'profile.ejs'), 'utf8');
  const app = fs.readFileSync(path.join(publicDirectory, 'assets', 'js', 'app.js'), 'utf8');
  assert.match(profile, /id="test-browser-notification"/);
  assert.match(profile, /id="notification-secure-status"/);
  assert.match(profile, /id="notification-worker-status"/);
  assert.match(app, /registration\.showNotification/);
  assert.match(app, /window\.isSecureContext/);
  assert.match(app, /FitAI đã bật thông báo/);
});
