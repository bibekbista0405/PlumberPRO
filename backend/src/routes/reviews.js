const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { createReview, listReviews } = require('../controllers/reviews');
const router = express.Router();
router.get('/', listReviews);
router.post('/', authenticate, authorize('customer'), createReview);
module.exports = router;
