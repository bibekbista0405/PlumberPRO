const express = require('express');
const rateLimit = require('express-rate-limit');
const { createMessage } = require('../controllers/contact');
const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
router.post('/', limiter, createMessage);
module.exports = router;
