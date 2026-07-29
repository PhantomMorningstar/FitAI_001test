const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 8;
const clients = new Map();

function chatRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.firebaseUser?.uid;
  if (!key) return res.status(401).json({ error: 'Sign in to use the AI assistant.' });
  const recent = (clients.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many AI questions. Wait one minute and try again.'
    });
  }
  recent.push(now);
  clients.set(key, recent);
  return next();
}

module.exports = { chatRateLimit };
