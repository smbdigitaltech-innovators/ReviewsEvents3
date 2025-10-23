const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect } = require('../controllers/authController');
const { isAdmin } = require('../middleware/adminAuth'); // Import isAdmin middleware

// Admin only routes (requires authentication and admin privileges)
router.post('/create', protect, isAdmin, eventController.createEvent);
router.put('/update/:id', protect, isAdmin, eventController.updateEvent);
router.delete('/delete/:id', protect, isAdmin, eventController.deleteEvent);

// Authenticated user's own events (allow admins to view their own events too)
router.get('/mine', protect, eventController.listMyEvents);

// Public routes (no authentication required for list and details)
router.get('/list', eventController.listEvents);
router.get('/:id', eventController.getEventDetails);
// Alias to fetch a user's events (proxy to users route)
router.get('/user/:userId', protect, async (req, res) => {
  try {
    if (req.user !== req.params.userId) return res.status(403).json({ message: 'Forbidden' });
    const userRoutes = require('./users');
    // Fallback: directly fetch via users model to avoid circular route handler
    const User = require('../models/userModel');
    const Event = require('../models/eventModel');
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const events = [];
    for (const eventId of (user.attendedEvents || [])) {
      const event = await Event.findById(eventId);
      if (event) events.push(event);
    }
    res.status(200).json(events);
  } catch (e) {
    console.error('Error fetching user events alias:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;