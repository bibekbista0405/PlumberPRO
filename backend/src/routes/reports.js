const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, authorize } = require('../middleware/auth');
const { createReport, listReports, updateReport } = require('../controllers/reports');
const router = express.Router();

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reports submitted recently. Please try again later.' },
});

router.post('/', authenticate, authorize('customer'), reportLimiter, createReport);
router.get('/', authenticate, authorize('admin'), listReports);
router.patch('/:id', authenticate, authorize('admin'), updateReport);
module.exports = router;
