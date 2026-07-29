const { getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const config = require('../config');

const ADMIN_APP_NAME = 'fitai-token-verifier';
let adminAuth = null;

function getAdminAuth() {
  if (adminAuth) return adminAuth;
  if (!config.firebaseProjectId) {
    const error = new Error('FIREBASE_PROJECT_ID is not configured.');
    error.code = 'firebase/project-id-missing';
    throw error;
  }
  const app = getApps().find(({ name }) => name === ADMIN_APP_NAME)
    || initializeApp({ projectId: config.firebaseProjectId }, ADMIN_APP_NAME);
  adminAuth = getAuth(app);
  return adminAuth;
}

function bearerToken(headerValue) {
  if (typeof headerValue !== 'string') return '';
  const match = headerValue.match(/^Bearer ([A-Za-z0-9\-._~+/]+=*)$/);
  return match ? match[1] : '';
}

function createFirebaseAuthMiddleware({ verifyToken } = {}) {
  return async function requireFirebaseUser(req, res, next) {
    const token = bearerToken(req.get('authorization'));
    if (!token) {
      return res.status(401).json({ error: 'Sign in to use AI features.' });
    }

    try {
      const decoded = await (verifyToken
        ? verifyToken(token)
        : getAdminAuth().verifyIdToken(token));
      if (!decoded?.uid) throw new Error('Token has no UID.');
      req.firebaseUser = {
        uid: decoded.uid,
        emailVerified: decoded.email_verified === true
      };
      return next();
    } catch (error) {
      if (error.code === 'firebase/project-id-missing') {
        return res.status(503).json({
          error: 'The server has not configured FIREBASE_PROJECT_ID.'
        });
      }
      return res.status(401).json({
        error: 'Your sign-in session is invalid or expired. Sign in again.'
      });
    }
  };
}

const requireFirebaseUser = createFirebaseAuthMiddleware();

module.exports = {
  bearerToken,
  createFirebaseAuthMiddleware,
  requireFirebaseUser
};
