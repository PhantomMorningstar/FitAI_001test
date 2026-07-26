const WINDOW_MS = 60_000;
const MAX_REPORTS_PER_WINDOW = 10;
const buckets = new Map();

function cleanText(value, maxLength) {
  return typeof value === 'string'
    ? value.replace(/[\r\n\t]/g, ' ').slice(0, maxLength)
    : '';
}

function clientErrorRateLimit(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > MAX_REPORTS_PER_WINDOW) return res.status(204).end();
  return next();
}

function reportClientError(req, res) {
  const report = {
    severity: 'ERROR',
    event: 'client_error',
    requestId: req.requestId,
    errorType: cleanText(req.body?.errorType, 80),
    source: cleanText(req.body?.source, 160),
    line: Number.isInteger(req.body?.line) ? req.body.line : null,
    column: Number.isInteger(req.body?.column) ? req.body.column : null,
    release: cleanText(process.env.APP_RELEASE || 'development', 80),
    timestamp: new Date().toISOString()
  };

  // Do not log error messages, form values, email addresses, food names, or health data.
  console.error(JSON.stringify(report));
  return res.status(204).end();
}

module.exports = { clientErrorRateLimit, reportClientError };
