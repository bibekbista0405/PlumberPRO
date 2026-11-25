const express = require('express');
const { authenticate } = require('../middleware/auth');
const { status, subscribe, unsubscribe } = require('../controllers/push');
const router = express.Router();
router.get('/status', status);
router.post('/subscribe', authenticate, subscribe);
router.post('/unsubscribe', authenticate, unsubscribe);
module.exports = router;
