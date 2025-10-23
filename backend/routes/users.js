const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { protect } = require('../controllers/authController');
const Event = require('../models/eventModel');

// Get user profile by ID
router.get('/:userId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return user profile without sensitive data
        const userProfile = {
            id: user.id,
            name: user.name,
            email: user.email,
            username: `@${user.email.split('@')[0]}`,
            bio: user.bio || '',
            interests: user.interests || [],
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1193d4&color=fff&size=128`,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt
        };
        
        res.status(200).json(userProfile);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/:userId', protect, async (req, res) => {
    try {
        // Check if user is updating their own profile
        if (req.user !== req.params.userId) {
            return res.status(403).json({ message: 'You can only update your own profile' });
        }

        const { name, email, bio, interests } = req.body;
        
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields
        user.name = name || user.name;
        user.email = email || user.email;
        user.bio = bio || user.bio;
        user.interests = interests || user.interests;

        await user.save();

        // Return updated profile
        const updatedProfile = {
            id: user.id,
            name: user.name,
            email: user.email,
            username: `@${user.email.split('@')[0]}`,
            bio: user.bio,
            interests: user.interests,
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1193d4&color=fff&size=128`,
            isAdmin: user.isAdmin,
            updatedAt: new Date()
        };

        res.status(200).json(updatedProfile);
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Manage user's selected (attended) events
router.post('/:userId/events/:eventId', protect, async (req, res) => {
    try {
        if (req.user !== req.params.userId) {
            return res.status(403).json({ message: 'You can only modify your own events' });
        }
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        await user.addAttendedEvent(req.params.eventId);
        res.status(200).json({ message: 'Event added to your events' });
    } catch (error) {
        console.error('Error adding user event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:userId/events/:eventId', protect, async (req, res) => {
    try {
        if (req.user !== req.params.userId) {
            return res.status(403).json({ message: 'You can only modify your own events' });
        }
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.removeAttendedEvent(req.params.eventId);
        res.status(200).json({ message: 'Event removed from your events' });
    } catch (error) {
        console.error('Error removing user event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:userId/events', protect, async (req, res) => {
    try {
        if (req.user !== req.params.userId) {
            return res.status(403).json({ message: 'You can only view your own events' });
        }
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const events = [];
        for (const eventId of (user.attendedEvents || [])) {
            const event = await Event.findById(eventId);
            if (event) events.push(event);
        }
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
 
module.exports = router;