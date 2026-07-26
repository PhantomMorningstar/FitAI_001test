const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  isSecureRequest,
  productionSecurity
} = require('../src/middleware/production-security.middleware');

test('proxy HTTPS is recognized and production HTTP redirects safely', () => {
  assert.equal(isSecureRequest({
    secure: false,
    get: (name) => name === 'x-forwarded-proto' ? 'https' : ''
  }), true);

  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const headers = {};
  const req = {
    secure: false,
    originalUrl: '/profile?tab=security',
    get: (name) => name === 'host' ? 'fitai.example' : ''
  };
  const res = {
    setHeader: (name, value) => { headers[name] = value; },
    redirect: (status, location) => ({ status, location })
  };
  const result = productionSecurity(req, res, () => 'next');
  process.env.NODE_ENV = previous;

  assert.equal(result.status, 308);
  assert.equal(result.location, 'https://fitai.example/profile?tab=security');
  assert.ok(headers['X-Request-Id']);
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
});

test('client monitoring source excludes sensitive error content', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../public/assets/js/error-monitor.js'),
    'utf8'
  );
  const serverMonitor = fs.readFileSync(
    path.join(__dirname, '../src/middleware/client-error-monitor.middleware.js'),
    'utf8'
  );

  assert.match(source, /unhandledrejection/);
  assert.doesNotMatch(source, /event\.message|event\.error\.stack/);
  assert.match(serverMonitor, /Do not log error messages/);
  assert.doesNotMatch(serverMonitor, /req\.body\?\.message|req\.body\?\.stack/);
});

test('Cloud Run container and health monitoring configuration are present', () => {
  const dockerfile = fs.readFileSync(path.join(__dirname, '../Dockerfile'), 'utf8');
  const appSource = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
  assert.match(dockerfile, /ENV NODE_ENV=production/);
  assert.match(dockerfile, /USER node/);
  assert.match(appSource, /app\.get\('\/healthz'/);
  assert.match(appSource, /productionSecurity/);
});
