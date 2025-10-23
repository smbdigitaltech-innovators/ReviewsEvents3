const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { protect } = require('../controllers/authController');

// Get recommendations for a specific user (requires authentication)
router.get('/:userId', protect, recommendationController.getUserRecommendations);

module.exports = router;