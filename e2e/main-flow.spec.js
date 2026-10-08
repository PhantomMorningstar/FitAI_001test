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

test.describe('Responsive layout checks', () => {
  test.use({ serviceWorkers: 'block' });

  test('primary pages fit narrow, breakpoint, and landscape desktop-emulated viewports', async ({ page }) => {
    test.setTimeout(90_000);
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

    const viewports = [
      { width: 320, height: 720 },
      { width: 375, height: 812 },
      { width: 760, height: 900 },
      { width: 844, height: 390 }
    ];
    const primaryPages = ['/', '/roadmap', '/camera', '/diary', '/profile'];

    for (const routePath of primaryPages) {
      await page.setViewportSize(viewports[0]);
      await page.goto(routePath);
      if (routePath === '/') {
        await expect(page.locator('#onboarding-screen')).toBeVisible();
      } else {
        await expect(page.locator('main h1')).toBeVisible();
      }

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await expect.poll(() => page.evaluate(() => document.documentElement.clientWidth))
          .toBe(viewport.width);
        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          mainRight: document.querySelector('main')?.getBoundingClientRect().right
        }));
        expect(
          metrics.scrollWidth,
          `${routePath} has page-level horizontal overflow at ${viewport.width}px: ${JSON.stringify(metrics)}`
        ).toBeLessThanOrEqual(viewport.width + 1);
        if (routePath !== '/') {
          expect(
            metrics.mainRight,
            `${routePath} main content exceeds ${viewport.width}px viewport: ${JSON.stringify(metrics)}`
          ).toBeLessThanOrEqual(viewport.width + 1);
        }
      }
    }
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
    if (path === '/camera') {
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        canvas.getContext('2d').fillRect(0, 0, 8, 8);
        return canvas.toDataURL('image/png');
      });
      await page.locator('#food-upload').setInputFiles({
        name: 'guest-meal.png',
        mimeType: 'image/png',
        buffer: Buffer.from(imageDataUrl.split(',')[1], 'base64')
      });
      await page.locator('#analyze-photo-btn').click();
      await expect(page.locator('#vision-signin-link')).toBeVisible();
    }
  }

  await page.locator('#language-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main h1')).toHaveText('Profile');
  await expect(page.locator('#export-account-data-btn')).toHaveText('Download my data');
  await expect(page.locator('#language-toggle')).toHaveAttribute('aria-label', 'Switch to Vietnamese');
  await page.locator('#delete-account-password').evaluate((input) => {
    input.setAttribute('placeholder', 'Mật khẩu hiện tại');
  });
  await expect(page.locator('#delete-account-password')).toHaveAttribute('placeholder', 'Current password');
  await page.locator('#language-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.locator('main h1')).toHaveText('Hồ sơ');
  await expect(page.locator('#language-toggle')).toHaveAttribute('aria-label', 'Chuyển sang tiếng Anh');
  await expect(page.locator('#delete-account-password')).toHaveAttribute('placeholder', 'Mật khẩu hiện tại');

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});

test.describe('Firebase emulator integration', () => {
test.use({ serviceWorkers: 'block' });

test('registered account keeps its profile and health records after sign-out and sign-in', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.stack || error.message));
  page.on('dialog', (dialog) => dialog.accept());

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
  await page.route('**/assets/js/app.js*', async (route) => {
    const response = await route.fetch();
    let source = await response.text();
    source = `window.FitAIWebConfig = {
      apiKey: 'demo-fitai-key',
      authDomain: 'localhost',
      projectId: 'demo-fitai',
      appId: 'demo-fitai'
    };\n${source}`;
    const authInitialization = 'const auth = firebase.auth();';
    if (!source.includes(authInitialization)) {
      throw new Error('Could not prepare the app for Firebase emulator E2E.');
    }
    source = source.replace(
      authInitialization,
      `${authInitialization}\n    window.__fitaiE2eAuth = auth;\n    db.useEmulator('127.0.0.1', 8080);\n    auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true });`
    );
    return route.fulfill({ response, body: source });
  });
  await page.route('**/api/nutrition/search?*', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      foods: [{ fdcId: 123456, name: 'Oatmeal', dataType: 'Foundation' }]
    })
  }));
  await page.route('**/api/nutrition/barcode/*', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      foods: [{ fdcId: 765432, name: 'Branded Oatmeal', brandName: 'Fit Foods' }]
    })
  }));
  await page.route('**/api/vision/recognize-food', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      isFood: true,
      candidates: [{ name: 'Oatmeal', confidence: 0.92 }],
      confidenceLevel: 'high',
      note: 'Đã nhận diện món ăn.'
    })
  }));
  await page.route('**/api/nutrition/foods/*', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      food: {
        fdcId: 123456,
        name: 'Oatmeal',
        dataType: 'Foundation',
        grams: 100,
        calories: 68,
        protein: 2.4,
        carbs: 12,
        fat: 1.4,
        fiber: 1.7,
        missingNutrients: [],
        nutritionComplete: true,
        source: 'USDA FoodData Central'
      },
      portions: []
    })
  }));

  await page.goto('/profile');
  await page.locator('#auth-email').fill('journey@example.test');
  await page.locator('#auth-password').fill('test-pass-123');
  await page.locator('#btn-signup').click();
  await expect(page.locator('#profile-reset-status')).toContainText('Đăng ký thành công');

  await page.goto('/');
  await expect(page.locator('#onboarding-screen')).toBeVisible();

  await page.locator('#quiz-dob').fill('2000-01-01');
  await page.locator('#quiz-height').fill('170');
  await page.locator('#quiz-weight').fill('68');
  await page.locator('#next-btn').click();
  await page.locator('#work-activity').selectOption('lightly');
  await page.locator('#next-btn').click();
  await page.locator('#weight-goal').selectOption('lose');
  await page.locator('#target-weight').fill('62');
  await page.locator('#next-btn').click();
  await expect(page.locator('#rep-cal')).not.toHaveText('--');
  await page.locator('#next-btn').click();
  await expect(page.locator('#main-app-screen')).toBeVisible();

  await page.goto('/camera');
  await page.waitForFunction(() => window.__fitaiE2eAuth?.currentUser?.uid);
  const imageDataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    canvas.getContext('2d').fillRect(0, 0, 8, 8);
    return canvas.toDataURL('image/png');
  });
  await page.locator('#food-upload').setInputFiles({
    name: 'meal.png',
    mimeType: 'image/png',
    buffer: Buffer.from(imageDataUrl.split(',')[1], 'base64')
  });
  await expect(page.locator('#food-preview')).toBeVisible();
  await expect(page.locator('#analyze-photo-btn')).toBeEnabled();
  await page.locator('#food-upload').setInputFiles([]);
  await expect(page.locator('#food-preview')).toBeVisible();
  const visionRequest = page.waitForRequest((request) => request.url().endsWith('/api/vision/recognize-food'));
  await page.locator('#analyze-photo-btn').click();
  const visionRequestBody = (await visionRequest).postDataJSON();
  expect(visionRequestBody.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
  expect(visionRequestBody.imageDataUrl.length).toBeLessThan(5 * 1024 * 1024);
  await expect(page.locator('#vision-food-candidates')).toBeVisible();
  await page.locator('#confirm-food-candidate-btn').click();
  await expect(page.locator('#food-search-query')).toHaveValue('Oatmeal');
  await page.locator('#recognize-food-btn').click();
  await expect(page.locator('#analysis-food-name')).toHaveText('Oatmeal');
  await page.locator('#add-food-btn').click();
  await expect(page.locator('#food-search-status')).toContainText('Đã thêm Oatmeal');
  const barcodeRequest = page.waitForRequest((request) => request.url().includes('/api/nutrition/barcode/'));
  await page.locator('#barcode-input').fill('049000050103');
  await page.locator('#lookup-barcode-btn').click();
  const barcodeRequestDetails = await barcodeRequest;
  expect(barcodeRequestDetails.url()).toContain('/049000050103?grams=100');
  await expect(page.locator('#barcode-status')).toContainText('Đã tìm thấy 1 sản phẩm');

  await page.goto('/profile');
  await page.locator('#weight-entry-kg').fill('67.5');
  await page.locator('#weight-entry-form').locator('button[type="submit"]').click();
  await expect(page.locator('#weight-entry-status')).toContainText('Đã lưu 67.5 kg');
  await page.locator('#activity-entry-steps').fill('6500');
  await page.locator('#activity-entry-minutes').fill('35');
  await page.locator('#activity-entry-form').locator('button[type="submit"]').click();
  await expect(page.locator('#activity-entry-status')).toContainText('Đã lưu 6.500 bước');

  await expect(page.locator('#settings-panel')).toBeVisible();
  await page.locator('#btn-logout').click();
  await expect(page.locator('#auth-container')).toBeVisible();
  await page.reload();
  await page.locator('#auth-email').fill('journey@example.test');
  await page.locator('#auth-password').fill('test-pass-123');
  await page.locator('#btn-login').click();
  await expect(page.locator('#authenticated-profile-container')).toBeVisible();
  await expect(page.locator('#prof-height')).toHaveText('170');
  await expect(page.locator('#prof-weight')).toHaveText('68');

  await expect(page.locator('#weight-history-list')).toContainText('67.5 kg');
  await expect(page.locator('#activity-history-list')).toContainText('6,500');
  await page.goto('/diary');
  await expect(page.locator('#diary-list')).toContainText('Oatmeal');
  await expect(page.locator('#diary-total-calories')).toHaveText('68');

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});
});
