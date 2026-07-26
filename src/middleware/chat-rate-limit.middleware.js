const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 8;
const clients = new Map();

function chatRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const recent = (clients.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Bạn gửi câu hỏi quá nhanh. Hãy chờ một phút rồi thử lại.' });
  }
  recent.push(now);
  clients.set(key, recent);
  return next();
}

module.exports = { chatRateLimit };
