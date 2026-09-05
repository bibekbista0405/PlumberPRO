const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { createReview, listReviews, findReviewableBooking } = require('../controllers/reviews');
const router = express.Router();
router.get('/', listReviews);
router.get('/reviewable/:plumberId', authenticate, authorize('customer'), findReviewableBooking);
router.post('/', authenticate, authorize('customer'), createReview);
module.exports = router;
