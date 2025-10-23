const Notification = require('../models/notificationModel');

class ReminderService {
    static async createEventReminder(userId, event) {
        try {
            const eventDate = new Date(event.date);
            const now = new Date();
            const timeDiff = eventDate.getTime() - now.getTime();
            
            // Create reminder notification based on time until event
            let title, message, reminderType;
            
            if (timeDiff <= 24 * 60 * 60 * 1000 && timeDiff > 0) {
                // Event is tomorrow (within 24 hours)
                title = "Event Tomorrow!";
                message = `Your event "${event.name}" is tomorrow at ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
                reminderType = 'event_tomorrow';
            } else if (timeDiff <= 7 * 24 * 60 * 60 * 1000 && timeDiff > 24 * 60 * 60 * 1000) {
                // Event is this week (within 7 days)
                title = "Event This Week";
                message = `Your event "${event.name}" is coming up this week on ${eventDate.toLocaleDateString()}.`;
                reminderType = 'event_this_week';
            } else if (timeDiff <= 2 * 60 * 60 * 1000 && timeDiff > 0) {
                // Event is in 2 hours
                title = "Event Starting Soon!";
                message = `Your event "${event.name}" starts in 2 hours at ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
                reminderType = 'event_soon';
            } else {
                return null; // No reminder needed
            }
            
            // Check if reminder already exists
            const existingReminders = await Notification.findByUser(userId);
            const alreadyReminded = existingReminders.some(n => 
                n.meta?.eventId === event.id && 
                n.meta?.reminderType === reminderType &&
                new Date(n.timestamp).toDateString() === now.toDateString()
            );
            
            if (alreadyReminded) {
                return null; // Already reminded today
            }
            
            // Create new notification
            const notification = new Notification(
                null, // Auto-generate ID
                userId,
                title,
                message,
                reminderType,
                false,
                new Date().toISOString(),
                {
                    eventId: event.id,
                    eventName: event.name,
                    eventDate: event.date,
                    reminderType: reminderType
                }
            );
            
            const notificationId = await notification.save();
            console.log(`Created ${reminderType} reminder for user ${userId} about event ${event.name}`);
            return notificationId;
            
        } catch (error) {
            console.error('Error creating event reminder:', error);
            throw error;
        }
    }
    
    static async checkAndCreateReminders() {
        try {
            // This would typically be called by a cron job or scheduled task
            // For now, we'll implement the logic that can be called manually
            console.log('Checking for event reminders...');
            
            // In a real implementation, you would:
            // 1. Get all users who have events
            // 2. For each user, check their events
            // 3. Create reminders for upcoming events
            
            return { message: 'Reminder check completed' };
        } catch (error) {
            console.error('Error checking reminders:', error);
            throw error;
        }
    }
    
    static async createReminderForUserEvent(userId, event) {
        return await this.createEventReminder(userId, event);
    }
}

module.exports = ReminderService;
