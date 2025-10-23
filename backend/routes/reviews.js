const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../controllers/authController');

// User adds a review (requires authentication)
router.post('/add', protect, reviewController.addReview);

// Fetch all reviews for an event (publicly accessible)
router.get('/event/:id', reviewController.getReviewsForEvent);

// Admin reply to a review and delete review
router.post('/reply/:reviewId', protect, reviewController.replyToReview);
router.delete('/delete/:reviewId', protect, reviewController.deleteReview);

// Fetch all reviews by a specific user (requires authentication)
router.get('/user/:userId', protect, reviewController.getReviewsByUser);

module.exports = router;