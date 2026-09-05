const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, authorize } = require('../middleware/auth');
const { submitFeedback, myFeedback, listFeedback, updateFeedback, publicFeedback } = require('../controllers/feedback');
const router = express.Router();

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many feedback submissions recently. Please try again later.' },
});

router.get('/public', publicFeedback);
router.get('/mine', authenticate, myFeedback);
router.post('/', authenticate, feedbackLimiter, submitFeedback);
router.get('/', authenticate, authorize('admin'), listFeedback);
router.patch('/:id', authenticate, authorize('admin'), updateFeedback);
module.exports = router;
