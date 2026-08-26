const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { searchPlumbers, getMyProfile, updateMyProfile } = require('../controllers/plumbers');
const router = express.Router();
router.get('/search', searchPlumbers);
router.get('/me', authenticate, authorize('plumber'), getMyProfile);
router.patch('/me', authenticate, authorize('plumber'), updateMyProfile);
module.exports = router;
