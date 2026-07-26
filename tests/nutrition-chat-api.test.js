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

test('nutrition chat API validates the question', async () => {
  const response = await post({ message: '' });
  const payload = await response.json();
  assert.equal(response.status, 422);
  assert.match(payload.error, /2 ký tự/);
});

test('nutrition chat API blocks dangerous restriction without calling Gemini', async () => {
  const response = await post({ message: 'Tôi muốn nhịn đói để xuống cân thật nhanh', context: { language: 'vi' } });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.needsProfessionalHelp, true);
  assert.ok(payload.caution);
});
