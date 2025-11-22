const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Create review
router.post(
  '/',
  authMiddleware,
  [
    body('ride_id').isInt(),
    body('reviewee_id').isInt(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('review_text').optional().trim(),
    validate
  ],
  reviewController.createReview
);

// Get user reviews
router.get('/user/:id', reviewController.getUserReviews);

// Get current user reviews
router.get('/me', authMiddleware, reviewController.getUserReviews);

// Get user stats
router.get('/stats/:id', reviewController.getUserStats);
router.get('/stats/me', authMiddleware, reviewController.getUserStats);

module.exports = router;
