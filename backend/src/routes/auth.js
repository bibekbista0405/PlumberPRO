const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Login: only failed attempts count against the limit, so legitimate repeat
// logins (multiple tabs/devices) are never blocked — only credential guessing is.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts. Please wait a few minutes and try again.' },
});

// Registration: a tighter cap per IP per hour to slow down mass fake-account creation.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this network recently. Please try again later.' },
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', authenticate, me);
module.exports = router;
