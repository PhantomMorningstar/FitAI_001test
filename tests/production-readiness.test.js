const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRateLimit } = require('../src/middleware/api-rate-limit.middleware');
const { validateProductionConfig } = require('../src/config');

test('production rejects missing, demo, and placeholder USDA keys', () => {
  assert.ok(validateProductionConfig({ NODE_ENV: 'production' }).length);
  assert.ok(validateProductionConfig({ NODE_ENV: 'production', FDC_API_KEY: 'DEMO_KEY' }).length);
  assert.ok(validateProductionConfig({
    NODE_ENV: 'production',
    FDC_API_KEY: 'your_data_gov_key'
  }).length);
  assert.deepEqual(validateProductionConfig({
    NODE_ENV: 'production',
    FDC_API_KEY: 'configured-private-key',
    FIREBASE_PROJECT_ID: 'fitai-production',
    FIREBASE_API_KEY: 'firebase-browser-api-key',
    FIREBASE_AUTH_DOMAIN: 'fitai-production.firebaseapp.com',
    FIREBASE_STORAGE_BUCKET: 'fitai-production.firebasestorage.app',
    FIREBASE_MESSAGING_SENDER_ID: '123456',
    FIREBASE_APP_ID: '1:123456:web:abcdef'
  }), []);
  assert.deepEqual(validateProductionConfig({ NODE_ENV: 'development' }), []);
});

test('standard API limiter returns 429 after its configured allowance', () => {
  const middleware = createRateLimit({ windowMs: 60_000, max: 2 });
  const req = { ip: 'test-client' };
  const headers = {};
  const res = {
    setHeader: (name, value) => { headers[name] = value; },
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  assert.equal(middleware(req, res, () => 'first'), 'first');
  assert.equal(middleware(req, res, () => 'second'), 'second');
  middleware(req, res, () => 'unexpected');
  assert.equal(res.statusCode, 429);
  assert.equal(headers['RateLimit-Remaining'], '0');
});

test('API routes use a smaller default JSON limit and a dedicated photo limit', () => {
  const routes = fs.readFileSync(
    path.join(__dirname, '../src/routes/api.routes.js'),
    'utf8'
  );
  assert.match(routes, /recognize-food[\s\S]+express\.json\(\{ limit: '8mb' \}\)/);
  assert.match(routes, /router\.use\(express\.json\(\{ limit: '256kb' \}\)\)/);
  assert.match(routes, /nutrition\/search', standardApiRateLimit/);
});

test('example environment does not contain a concrete USDA key', () => {
  const example = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8');
  const value = example.match(/^FDC_API_KEY=(.+)$/m)?.[1] || '';
  assert.equal(value, 'your_data_gov_fooddata_central_key');
});

test('production requires Firebase web-app config to match the server project setup', () => {
  const errors = validateProductionConfig({
    NODE_ENV: 'production',
    FDC_API_KEY: 'configured-private-key',
    FIREBASE_PROJECT_ID: 'fitai-production'
  });

  assert.equal(errors.length, 5);
  assert.ok(errors.every((message) => message.includes('Firebase web app')));
});

test('production rejects placeholder Firebase web app values', () => {
  const errors = validateProductionConfig({
    NODE_ENV: 'production',
    FDC_API_KEY: 'configured-private-key',
    FIREBASE_PROJECT_ID: 'fitai-production',
    FIREBASE_API_KEY: 'your_firebase_web_api_key',
    FIREBASE_AUTH_DOMAIN: 'your_firebase_auth_domain',
    FIREBASE_STORAGE_BUCKET: 'your_firebase_storage_bucket',
    FIREBASE_MESSAGING_SENDER_ID: 'your_firebase_messaging_sender_id',
    FIREBASE_APP_ID: 'your_firebase_app_id'
  });

  assert.equal(errors.length, 5);
});

test('production rejects a placeholder Firebase project ID', () => {
  const errors = validateProductionConfig({
    NODE_ENV: 'production',
    FDC_API_KEY: 'configured-private-key',
    FIREBASE_PROJECT_ID: 'your_firebase_project_id',
    FIREBASE_API_KEY: 'firebase-browser-api-key',
    FIREBASE_AUTH_DOMAIN: 'fitai-production.firebaseapp.com',
    FIREBASE_STORAGE_BUCKET: 'fitai-production.firebasestorage.app',
    FIREBASE_MESSAGING_SENDER_ID: '123456',
    FIREBASE_APP_ID: '1:123456:web:abcdef'
  });

  assert.ok(errors.some((message) => message.includes('FIREBASE_PROJECT_ID')));
});
