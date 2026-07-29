const test = require('node:test');
const assert = require('node:assert/strict');
const {
  bearerToken,
  createFirebaseAuthMiddleware
} = require('../src/middleware/firebase-auth.middleware');
const { visionRateLimit } = require('../src/middleware/vision-rate-limit.middleware');

function responseRecorder() {
  return {
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
}

test('bearerToken only accepts a Bearer token', () => {
  assert.equal(bearerToken('Bearer header.payload.signature'), 'header.payload.signature');
  assert.equal(bearerToken('Basic header.payload.signature'), '');
  assert.equal(bearerToken('Bearer'), '');
});

test('Firebase middleware rejects requests without an ID token', async () => {
  let verificationCalled = false;
  const middleware = createFirebaseAuthMiddleware({
    verifyToken: async () => {
      verificationCalled = true;
      return { uid: 'unexpected' };
    }
  });
  const req = { get: () => undefined };
  const res = responseRecorder();

  await middleware(req, res, () => assert.fail('next must not run'));

  assert.equal(res.statusCode, 401);
  assert.equal(verificationCalled, false);
});

test('Firebase middleware attaches the verified UID to the request', async () => {
  const middleware = createFirebaseAuthMiddleware({
    verifyToken: async (token) => {
      assert.equal(token, 'header.payload.signature');
      return { uid: 'user-a', email_verified: true };
    }
  });
  const req = { get: () => 'Bearer header.payload.signature' };
  const res = responseRecorder();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.firebaseUser, { uid: 'user-a', emailVerified: true });
});

test('Firebase middleware rejects an invalid or expired token', async () => {
  const middleware = createFirebaseAuthMiddleware({
    verifyToken: async () => {
      throw new Error('expired');
    }
  });
  const req = { get: () => 'Bearer header.payload.signature' };
  const res = responseRecorder();

  await middleware(req, res, () => assert.fail('next must not run'));

  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /expired/);
});

test('Gemini photo limits are isolated by Firebase UID', () => {
  const unique = `${process.pid}-${Date.now()}`;
  const resA = responseRecorder();
  const reqA = { firebaseUser: { uid: `user-a-${unique}` } };
  for (let index = 0; index < 5; index += 1) {
    assert.equal(visionRateLimit(reqA, resA, () => 'allowed'), 'allowed');
  }
  visionRateLimit(reqA, resA, () => assert.fail('sixth request must be blocked'));
  assert.equal(resA.statusCode, 429);

  const resB = responseRecorder();
  const reqB = { firebaseUser: { uid: `user-b-${unique}` } };
  assert.equal(visionRateLimit(reqB, resB, () => 'allowed'), 'allowed');
});
