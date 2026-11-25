require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { testConnection } = require('./config/db');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const reviewRoutes = require('./routes/reviews');
const plumberRoutes = require('./routes/plumbers');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const messageRoutes = require('./routes/messages');
const pushRoutes = require('./routes/push');
const feedbackRoutes = require('./routes/feedback');
const { notFound, errorHandler } = require('./middleware/error');
const { uploadRoot } = require('./middleware/upload');

const app = express();

// The app is typically deployed behind exactly one proxy hop — a reverse
// proxy like nginx, a platform load balancer, or a tunnel like ngrok — which
// sets X-Forwarded-For. Trusting exactly one hop lets express-rate-limit and
// req.ip identify real clients correctly without trusting arbitrary spoofed
// headers from further upstream. Override with TRUST_PROXY in .env if your
// deployment sits behind a different number of hops (e.g. 2 behind Cloudflare
// + a load balancer), or set it to 'false' if there is no proxy at all.
const trustProxySetting = process.env.TRUST_PROXY;
app.set('trust proxy', trustProxySetting === undefined ? 1 : (trustProxySetting === 'false' ? false : Number(trustProxySetting) || trustProxySetting));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'https://nominatim.openstreetmap.org'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
}));
// Normalize configured frontend origins (URL.origin removes trailing slashes
// and paths) so a value such as https://plumberproo.vercel.app/ still matches
// the browser's Origin header exactly. CORS middleware runs before rate
// limiting and routes so OPTIONS preflight requests are answered directly.
const frontendOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)
  .map(value => {
    try { return new URL(value).origin; }
    catch { return value.replace(/\/+$/, ''); }
  });

const corsOptions = {
  origin: frontendOrigins.length ? frontendOrigins : true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// The dashboards poll in the background (bookings, notifications, messages)
// so a single logged-in user can easily fire well over a hundred requests in
// 15 minutes across a normal session — and every one of those requests used
// to be counted against a single shared bucket per IP address. That meant:
//   1) Everyone behind the same IP (an office, a campus, a carrier NAT, or
//      several people testing from the same router) shared one 300-request
//      budget and could rate-limit each other out.
//   2) Opening the app in several tabs (exactly the "multiple tabs for
//      testing" scenario) multiplies the polling calls from the same
//      person, so the shared per-IP budget got exhausted even faster.
// Fixing this properly means keying the limiter by the logged-in user
// (falling back to IP only for anonymous requests) and raising the ceiling
// to something that comfortably covers real background polling instead of
// only a couple of page loads. jwt.decode() here is deliberately
// unverified — it's only used to build a stable per-user bucket key, not to
// authenticate the request (routes still verify tokens via `authenticate`).
function rateLimitKey(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.id) return `user:${decoded.id}`;
    } catch { /* fall through to IP-based keying below */ }
  }
  return req.ip;
}

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
  message: { message: 'Too many requests. Please wait a minute and try again.' },
}));
app.use('/uploads', express.static(uploadRoot, { maxAge: '7d' }));

// A lightweight root response makes the backend URL useful to verify in a browser.
// Vercel deploys this as an API service; the React frontend is deployed separately.
app.get('/', (req, res) => res.json({
  ok: true,
  service: 'PlumbPro API',
  health: '/api/health',
}));

// Do not let a database outage prevent Vercel from loading the Express function.
// Report database connectivity separately so deployment/runtime and DB failures
// can be distinguished from one another.
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    return res.json({ ok: true, service: 'PlumbPro API', database: 'connected' });
  } catch (err) {
    console.error('Health check database connection failed:', err.message);
    return res.status(503).json({ ok: false, service: 'PlumbPro API', database: 'unavailable' });
  }
});

// The backend is deployed separately from the React frontend on Vercel.
// Return an empty response for the browser's automatic favicon request.
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/plumbers', plumberRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/feedback', feedbackRoutes);

// In local/combined deployments, optionally serve the React build from this
// Express server (useful for a single local tunnel). On Vercel the frontend is
// deployed separately, and the backend function must not try to read that build.
if (!process.env.VERCEL) {
  const frontendBuildPath = path.resolve(__dirname, '../../build');
  app.use(express.static(frontendBuildPath, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(frontendBuildPath, 'index.html'), err => {
      if (err) next(err);
    });
  });
}

app.use(notFound);
app.use(errorHandler);

// Export the Express app for Vercel's serverless runtime. Only start a
// standalone HTTP listener when this file is run directly for local hosting.
if (require.main === module) {
  const port = Number(process.env.PORT || 5000);
  testConnection()
    .then(() => app.listen(port, () => console.log(`PlumbPro API running on http://localhost:${port}`)))
    .catch(err => {
      console.error('Database connection failed:', err.message);
      process.exitCode = 1;
    });
}

module.exports = app;
