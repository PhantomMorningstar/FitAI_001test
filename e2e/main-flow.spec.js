const { test, expect } = require('@playwright/test');
const path = require('node:path');
const app = require('../src/app');

let server;

test.beforeAll(async () => {
  server = app.listen(3107, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
});

test.afterAll(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('guest completes onboarding and opens every primary page without a browser crash', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const firebaseFiles = {
    'firebase-app-compat.js': 'firebase-app-compat.js',
    'firebase-firestore-compat.js': 'firebase-firestore-compat.js',
    'firebase-auth-compat.js': 'firebase-auth-compat.js'
  };
  await page.route('https://www.gstatic.com/firebasejs/10.8.0/*', async (route) => {
    const fileName = new URL(route.request().url()).pathname.split('/').pop();
    const localFile = firebaseFiles[fileName];
    if (!localFile) return route.abort();
    return route.fulfill({
      path: path.join(__dirname, '../node_modules/firebase', localFile),
      contentType: 'application/javascript'
    });
  });
  await page.route('https://cdnjs.cloudflare.com/**', (route) => route.abort());

  await page.goto('/');
  await expect(page.locator('#onboarding-screen')).toBeVisible();

  await page.locator('#quiz-dob').fill('2000-01-01');
  await page.locator('#quiz-height').fill('170');
  await page.locator('#quiz-weight').fill('68');
  await page.locator('#next-btn').click();

  await expect(page.locator('.quiz-step[data-step="2"]')).toHaveClass(/active/);
  await page.locator('#work-activity').selectOption('lightly');
  await page.locator('#next-btn').click();

  await expect(page.locator('.quiz-step[data-step="3"]')).toHaveClass(/active/);
  await page.locator('#weight-goal').selectOption('lose');
  await page.locator('#target-weight').fill('62');
  await page.locator('#next-btn').click();

  await expect(page.locator('.quiz-step[data-step="4"]')).toHaveClass(/active/);
  await expect(page.locator('#rep-cal')).not.toHaveText('--');
  await expect(page.locator('.summary-report-box .metric-disclaimer')).toContainText('ước tính thô');
  await page.locator('#next-btn').click();

  await expect(page.locator('#main-app-screen')).toBeVisible();
  await expect(page.locator('#dash-goal-cal')).not.toHaveText('--');

  const primaryPages = [
    ['/', /Tổng quan|Overview/],
    ['/roadmap', /Lộ trình|Roadmap/],
    ['/camera', /Nhận diện món ăn|Food recognition/],
    ['/diary', /Nhật ký thực phẩm|Food diary/],
    ['/profile', /Hồ sơ|Profile/]
  ];
  for (const [path, heading] of primaryPages) {
    await page.goto(path);
    await expect(page.locator('main h1')).toHaveText(heading);
  }

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});
