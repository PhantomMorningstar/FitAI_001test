const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'assets', 'js', 'app.js'),
  'utf8'
);

test('signed-out and legacy anonymous users remain local-only guests', () => {
  const authObserver = appSource.slice(appSource.indexOf('auth.onAuthStateChanged'));
  const signedOutBranch = authObserver.match(/if \(!user \|\| user\.isAnonymous\) \{([\s\S]*?)return;/)?.[1] || '';
  assert.match(signedOutBranch, /authBox\.style\.display = 'block'/);
  assert.match(signedOutBranch, /profileBox\.style\.display = 'none'/);
  assert.match(signedOutBranch, /setOverviewAuthState\(null\)/);
  assert.doesNotMatch(appSource, /signInAnonymously/);
});

test('logout buttons prevent duplicate requests and handle failures', () => {
  assert.match(appSource, /overviewLogoutBtn\.disabled = true/);
  assert.match(appSource, /btnLogout\.disabled = true/);
  assert.match(appSource, /alert\(getAuthErrorMessage\(error\)\)/);
});

test('successful sign out does not fail when anonymous Firebase auth is unavailable', () => {
  const signOutFunction = appSource.match(/async function signOutToPrivateGuest\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(signOutFunction, /await auth\.signOut\(\)/);
  assert.doesNotMatch(signOutFunction, /ensureAuthenticatedUser/);
  assert.match(appSource, /Chế độ khách/);
});

test('email sign up works without requiring anonymous Firebase auth', () => {
  const signUpFunction = appSource.match(/async function createOrUpgradeAccount\(email, password\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(signUpFunction, /auth\.currentUser/);
  assert.match(signUpFunction, /currentUser\?\.isAnonymous/);
  assert.match(signUpFunction, /createUserWithEmailAndPassword/);
  assert.doesNotMatch(signUpFunction, /ensureAuthenticatedUser/);
});

test('Firebase auth errors are translated to actionable Vietnamese messages', () => {
  assert.match(appSource, /auth\/email-already-in-use/);
  assert.match(appSource, /auth\/invalid-credential/);
  assert.match(appSource, /auth\/network-request-failed/);
  assert.match(appSource, /getAuthErrorMessage\(error\)/);
});

test('guest onboarding stays usable without writing to Firestore', () => {
  assert.match(appSource, /if \(auth\.currentUser && !auth\.currentUser\.isAnonymous\) \{/);
  assert.match(appSource, /Hãy đăng nhập để lưu và đồng bộ dữ liệu này\./);
});

test('account verification is visible and can be resent', () => {
  assert.match(appSource, /user\.emailVerified/);
  assert.match(appSource, /resend-verification-btn/);
  assert.match(appSource, /sendEmailVerification\(\)/);
});
