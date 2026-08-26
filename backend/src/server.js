require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/db');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const reviewRoutes = require('./routes/reviews');
const plumberRoutes = require('./routes/plumbers');
const notificationRoutes = require('./routes/notifications');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(v => v.trim())
    : true
}));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', async (req, res) => res.json({ ok: true, service: 'PlumbPro API', database: 'mysql' }));
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/plumbers', plumberRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve the React frontend from the same server so one ngrok tunnel on port 5000
// exposes both the frontend and backend API.
const frontendBuildPath = path.resolve(__dirname, '../../build');
app.use(express.static(frontendBuildPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendBuildPath, 'index.html'), err => {
    if (err) next(err);
  });
});

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
testConnection()
  .then(() => app.listen(port, () => console.log(`PlumbPro API running on http://localhost:${port}`)))
  .catch(err => { console.error('Database connection failed:', err.message); process.exit(1); });
