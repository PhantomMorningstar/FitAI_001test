const notFound = (req, res) => {
  res.status(404).render('pages/error', {
    title: 'Page not found',
    statusCode: 404,
    message: 'The page you requested does not exist.'
  });
};

// Express recognizes error middleware by its four parameters.
const errorHandler = (err, req, res, next) => {
  console.error(JSON.stringify({
    severity: 'ERROR',
    event: 'server_error',
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    errorName: err.name || 'Error',
    release: process.env.APP_RELEASE || 'development',
    timestamp: new Date().toISOString()
  }));

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).render('pages/error', {
    title: 'Server error',
    statusCode: 500,
    message: `Something went wrong. Reference: ${req.requestId}`
  });
};

module.exports = { notFound, errorHandler };
