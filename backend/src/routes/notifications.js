const express = require('express');
const { authenticate } = require('../middleware/auth');
const { myNotifications, markRead, markAllRead } = require('../controllers/notifications');
const router = express.Router();
router.use(authenticate);
router.get('/', myNotifications);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);
module.exports = router;
