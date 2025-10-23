const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const Notification = require('../models/notificationModel');
const ReminderService = require('../services/reminderService');

// Get current user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifs = await Notification.findByUser(req.user, 100);
    res.status(200).json(notifs);
  } catch (e) {
    console.error('Error fetching notifications:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all as read
router.post('/read', protect, async (req, res) => {
  try {
    await Notification.markAllRead(req.user);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (e) {
    console.error('Error marking notifications read:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE: admin or server triggers a batch create
// body: { eventId, message, userIds: [..], title?, type? }
router.post('/create', protect, async (req, res) => {
  try {
    const { eventId, message, userIds = [], title = 'Event update', type = 'event_updated' } = req.body || {};
    if (!eventId || !message || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'eventId, message and userIds are required' });
    }
    const { db } = require('../config/firebase');
    const batch = db.batch();
    userIds.forEach(userId => {
      const ref = db.collection('notifications').doc();
      batch.set(ref, {
        id: ref.id,
        userId,
        eventId,
        title,
        message,
        type,
        read: false,
        timestamp: new Date().toISOString(),
        meta: { eventId }
      });
    });
    await batch.commit();
    res.status(201).json({ message: 'Notifications created' });
  } catch (e) {
    console.error('Error creating notifications:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// LIST for current authenticated user (alias used by frontend)
router.get('/list/me', protect, async (req, res) => {
  try {
    const notifs = await Notification.findByUser(req.user, 100);
    res.status(200).json(notifs);
  } catch (e) {
    console.error('Error listing notifications for current user:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// LIST by userId
router.get('/list/:userId', protect, async (req, res) => {
  try {
    if (req.user !== req.params.userId) return res.status(403).json({ message: 'Forbidden' });
    const notifs = await Notification.findByUser(req.params.userId, 100);
    res.status(200).json(notifs);
  } catch (e) {
    console.error('Error listing notifications:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// READ single
router.post('/read/:id', protect, async (req, res) => {
  try {
    const { db } = require('../config/firebase');
    const ref = db.collection('notifications').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ message: 'Not found' });
    const notif = snap.data();
    if (notif.userId !== req.user) return res.status(403).json({ message: 'Forbidden' });
    await ref.update({ read: true });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (e) {
    console.error('Error marking notification read:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE: event reminder for user
router.post('/reminder', protect, async (req, res) => {
  try {
    const { eventId, eventName, eventDate } = req.body;
    if (!eventId || !eventName || !eventDate) {
      return res.status(400).json({ message: 'eventId, eventName, and eventDate are required' });
    }
    
    const event = {
      id: eventId,
      name: eventName,
      date: eventDate
    };
    
    const reminderId = await ReminderService.createReminderForUserEvent(req.user, event);
    if (reminderId) {
      res.status(201).json({ message: 'Reminder created', reminderId });
    } else {
      res.status(200).json({ message: 'No reminder needed at this time' });
    }
  } catch (e) {
    console.error('Error creating reminder:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


