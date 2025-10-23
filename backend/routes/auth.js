const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Development-only helper: mint backend JWTs for testing
// Enabled only when ENABLE_DEV_TOKENS=true in environment
// Dev helpers removed for production safety

module.exports = router;