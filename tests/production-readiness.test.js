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
    FDC_API_KEY: 'configured-private-key'
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
  assert.ok(value.startsWith('your_'));
  assert.equal(value, 'your_data_gov_fooddata_central_key');
});
