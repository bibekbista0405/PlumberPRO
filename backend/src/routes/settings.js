const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getPublicSettings, updateSettings } = require('../controllers/settings');
const router = express.Router();
router.get('/public', getPublicSettings);
router.patch('/', authenticate, authorize('admin'), updateSettings);
module.exports = router;
