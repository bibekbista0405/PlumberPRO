// Optional error monitoring: if @sentry/node is installed and SENTRY_DSN is
// set, errors get reported there too. Completely inert otherwise — nothing
// breaks if the package isn't installed or the DSN isn't configured.
let Sentry = null;
if (process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'development' });
  } catch {
    Sentry = null;
  }
}

function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
}

// Structured JSON logs (one line per error) — grep-able, and ready to ship to
// any log aggregator (CloudWatch, Loki, a hosted logging service) without
// changing this code, since it's already just structured stdout.
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const entry = {
    level: 'error',
    time: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    status,
    message: err.message,
    userId: req.user?.id || null,
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  };
  console.error(JSON.stringify(entry));
  if (Sentry && status >= 500) Sentry.captureException(err);
  res.status(status).json({ message: err.message || 'Internal server error.' });
}

module.exports = { notFound, errorHandler };
