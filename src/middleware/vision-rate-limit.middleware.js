const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;
const clients = new Map();

function visionRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.firebaseUser?.uid;
  if (!key) return res.status(401).json({ error: 'Firebase authentication is required.' });
  const recent = (clients.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many photo analyses. Wait one minute and try again.' });
  }
  recent.push(now);
  clients.set(key, recent);
  return next();
}

module.exports = { visionRateLimit };
