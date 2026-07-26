const crypto = require('crypto');

function isSecureRequest(req) {
  return req.secure || req.get('x-forwarded-proto') === 'https';
}

function productionSecurity(req, res, next) {
  req.requestId = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(), microphone=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  if (process.env.NODE_ENV === 'production') {
    if (!isSecureRequest(req)) {
      return res.redirect(308, `https://${req.get('host')}${req.originalUrl}`);
    }
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return next();
}

module.exports = { isSecureRequest, productionSecurity };
