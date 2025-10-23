const express = require('express');
const router = express.Router();
const analyticController = require('../controllers/analyticController');
const { protect } = require('../controllers/authController');

// Get analytics data (requires authentication)
router.get('/', protect, analyticController.getAnalyticsData);

module.exports = router;