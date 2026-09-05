const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const { listMessages, sendMessage, unreadCount, listConversations } = require('../controllers/messages');
const router = express.Router();

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Sending messages too quickly. Please slow down.' },
});

router.use(authenticate);
router.get('/', listConversations);
router.get('/unread-count', unreadCount);
router.get('/:bookingId', listMessages);
router.post('/:bookingId', sendLimiter, sendMessage);
module.exports = router;
