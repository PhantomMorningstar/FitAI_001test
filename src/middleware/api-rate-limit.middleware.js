function createRateLimit({ windowMs = 60_000, max = 60 } = {}) {
  const buckets = new Map();

  return function apiRateLimit(req, res, next) {
    const key = req.ip || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now - bucket.startedAt >= windowMs) {
      bucket = { startedAt: now, count: 0 };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(max - bucket.count, 0);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil((bucket.startedAt + windowMs) / 1000)));

    if (bucket.count > max) {
      return res.status(429).json({
        error: 'Bạn gửi quá nhiều yêu cầu. Hãy chờ một phút rồi thử lại.'
      });
    }
    return next();
  };
}

module.exports = { createRateLimit };
