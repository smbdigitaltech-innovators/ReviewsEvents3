const Event = require('../models/eventModel');
const { db } = require('../config/firebase');
const Notification = require('../models/notificationModel');

exports.createEvent = async (req, res) => {
    // The `protect` and `isAdmin` middlewares ensure `req.user` is available and the user is an admin
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }

    let { name, description, category, date, location, imageUrl } = req.body;

    // Basic validation and defaults
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Event name is required' });
    }
    description = typeof description === 'string' ? description : '';
    category = typeof category === 'string' && category.length > 0 ? category : 'General';
    // Accept ISO date strings; if not provided, set to now
    date = date ? date : new Date().toISOString();
    location = typeof location === 'string' && location.length > 0 ? location : 'TBD';
    imageUrl = typeof imageUrl === 'string' ? imageUrl : null;

    try {
        const newEvent = new Event(null, name, description, category, date, location, req.user, imageUrl);
        await newEvent.save();
        res.status(201).json({ message: 'Event created successfully', eventId: newEvent.id });
    } catch (error) {
        console.error('Error in createEvent:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.listEvents = async (req, res) => {
    const { category, date, location } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (date) filters.date = date;
    if (location) filters.location = location;

    try {
        const events = await Event.findAll(filters);
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.listMyEvents = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }
    try {
        const all = await Event.findAll();
        const mine = all.filter(e => String(e.createdBy) === String(req.user));
        res.status(200).json(mine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getEventDetails = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateEvent = async (req, res) => {
    // The `protect` and `isAdmin` middlewares ensure `req.user` is available and the user is an admin
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }

    const { name, description, category, date, location, imageUrl } = req.body;

    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const before = { ...event };
        event.name = name || event.name;
        event.description = description || event.description;
        event.category = category || event.category;
        event.date = date || event.date;
        event.location = location || event.location;
        if (typeof imageUrl === 'string' && imageUrl.length > 0) {
            event.imageUrl = imageUrl;
        }

        await event.save();
        try {
            // Notify users who have this event in attendedEvents
            const snapshot = await db.collection('users').where('attendedEvents', 'array-contains', event.id).get();
            const batch = db.batch();
            // Resolve updater's display name for meta
            const User = require('../models/userModel');
            let updaterName = req.user;
            try {
                const updater = await User.findById(req.user);
                if (updater && updater.name) updaterName = updater.name;
            } catch (e) {
                // ignore - fallback to uid
            }
            snapshot.docs.forEach(doc => {
                const notifRef = db.collection('notifications').doc();
                const changes = [];
                if (before.date !== event.date) changes.push({ field: 'date', detail: `Date updated to ${new Date(event.date).toLocaleDateString()}` });
                if (before.location !== event.location) changes.push({ field: 'location', detail: `Venue updated to ${event.location}` });
                if (before.description !== event.description) changes.push({ field: 'description', detail: 'Description updated' });
                const message = changes.length ? changes.map(c => c.detail).join('; ') : `${event.name} has been updated.`;
                const notif = {
                    id: notifRef.id,
                    userId: doc.id,
                    title: `Event updated: ${event.name}`,
                    message,
                    type: 'event_updated',
                    read: false,
                    timestamp: new Date().toISOString(),
                    meta: { eventId: event.id, eventName: event.name, changes, updatedBy: updaterName }
                };
                batch.set(notifRef, notif);
            });
            await batch.commit();
        } catch (e) {
            console.error('Failed to emit update notifications:', e);
        }
        res.status(200).json({ message: 'Event updated successfully', event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteEvent = async (req, res) => {
    // The `protect` and `isAdmin` middlewares ensure `req.user` is available and the user is an admin
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }

    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        await event.delete();
        try {
            const snapshot = await db.collection('users').where('attendedEvents', 'array-contains', event.id).get();
            const batch = db.batch();
            // Resolve updater's display name for meta
            const User = require('../models/userModel');
            let updaterName = req.user;
            try {
                const updater = await User.findById(req.user);
                if (updater && updater.name) updaterName = updater.name;
            } catch (e) {
                // ignore - fallback to uid
            }
            snapshot.docs.forEach(doc => {
                const notifRef = db.collection('notifications').doc();
                const notif = {
                    id: notifRef.id,
                    userId: doc.id,
                    title: `Event canceled: ${event.name}`,
                    message: `${event.name} has been canceled.`,
                    type: 'event_canceled',
                    read: false,
                    timestamp: new Date().toISOString(),
                    meta: { eventId: event.id, eventName: event.name, updatedBy: updaterName }
                };
                batch.set(notifRef, notif);
            });
            await batch.commit();
        } catch (e) {
            console.error('Failed to emit cancel notifications:', e);
        }
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};