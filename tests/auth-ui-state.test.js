const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'assets', 'js', 'app.js'),
  'utf8'
);
const scriptsPartialSource = fs.readFileSync(
  path.join(__dirname, '..', 'views', 'partials', 'app-scripts.ejs'),
  'utf8'
);

test('signed-out and legacy anonymous users remain local-only guests', () => {
  const authObserver = appSource.slice(appSource.indexOf('auth.onAuthStateChanged'));
  const signedOutBranch = authObserver.match(/if \(!user \|\| user\.isAnonymous\) \{([\s\S]*?)return;/)?.[1] || '';
  assert.match(signedOutBranch, /setProfileAuthState\(null\)/);
  assert.match(signedOutBranch, /setOverviewAuthState\(null\)/);
  assert.doesNotMatch(appSource, /signInAnonymously/);
});

test('successful sign-in updates the current page without a refresh', () => {
  assert.match(appSource, /function setProfileAuthState\(user\)/);
  assert.match(
    appSource,
    /const credential = await auth\.signInWithEmailAndPassword\(email, pass\);\s*setProfileAuthState\(credential\.user\);\s*setOverviewAuthState\(credential\.user\);/
  );
  assert.match(scriptsPartialSource, /\/assets\/js\/app\.js\?v=\d+/);
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

test('onboarding state is namespaced by authenticated UID', () => {
  assert.match(appSource, /return user && !user\.isAnonymous \? `user_\$\{user\.uid\}` : 'guest'/);
  assert.match(appSource, /scopedLocalStorageKey\(LOCAL_STATE_KEYS\.onboardingCompleted, user\)/);
  assert.match(appSource, /scopedLocalStorageKey\(LOCAL_STATE_KEYS\.onboardingDraft, user\)/);
  assert.doesNotMatch(appSource, /localStorage\.setItem\('fitai_onboarding_completed'/);
  assert.doesNotMatch(appSource, /localStorage\.setItem\('fitai_onboarding_draft'/);
});

test('changing auth identity clears runtime profile and ignores stale profile reads', () => {
  assert.match(appSource, /if \(authScopeChanged\) resetRuntimeUserState\(\)/);
  assert.match(appSource, /globalProfileData = \{\}/);
  assert.match(appSource, /if \(activeAuthScope !== requestedScope\) return/);
  assert.match(appSource, /if \(doc\.exists\) \{[\s\S]*?\} else \{[\s\S]*?resetRuntimeUserState\(\)[\s\S]*?showOnboardingScreen\(\)/);
});

test('sign out clears rendered calorie, macro, diary, and suggestion data without refresh', () => {
  const resetFunction = appSource.match(/function resetRuntimeUserState\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(resetFunction, /goalCalories = 0/);
  assert.match(resetFunction, /macroTargets = null/);
  assert.match(resetFunction, /updateCalorieUI\(\)/);
  assert.match(resetFunction, /updateDiarySummary\(\)/);
  assert.match(resetFunction, /renderMealSuggestions\(/);
  assert.match(resetFunction, /'dash-goal-cal': '--'/);
  assert.match(resetFunction, /diaryList\.innerHTML/);
});

test('clearing runtime state does not format a missing weight change', () => {
  assert.match(appSource, /Number\.isFinite\(progress\.changeTowardGoalKg\)/);
  assert.doesNotMatch(appSource, /progress\.changeTowardGoalKg\.toFixed/);
});
