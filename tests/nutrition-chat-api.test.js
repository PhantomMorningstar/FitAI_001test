const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

function post(body) {
  return fetch(`${baseUrl}/api/nutrition/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

test('nutrition chat API rejects a request without a Firebase ID token', async () => {
  const response = await post({ message: '' });
  const payload = await response.json();
  assert.equal(response.status, 401);
  assert.match(payload.error, /Sign in/);
});

test('food vision API rejects a request without a Firebase ID token', async () => {
  const response = await fetch(`${baseUrl}/api/vision/recognize-food`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageBase64: 'not-used-without-authentication' })
  });
  const payload = await response.json();
  assert.equal(response.status, 401);
  assert.match(payload.error, /Sign in/);
});
