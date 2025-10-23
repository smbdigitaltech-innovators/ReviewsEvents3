const { db } = require('../config/firebase');
const Event = require('../models/eventModel');
const User = require('../models/userModel');

exports.getRecommendations = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user || user.attendedEvents.length === 0) {
            // If user has no history or doesn't exist, recommend trending events
            console.log(`User ${userId} has no attended events. Recommending trending events.`);
            // For simplicity, trending events will be the 5 most recently created events.
            const trendingEventsSnapshot = await db.collection('events').orderBy('date', 'desc').limit(5).get();
                return trendingEventsSnapshot.docs.map(doc => {
                const eventData = doc.data();
                return new Event(eventData.id, eventData.name, eventData.description, eventData.category, eventData.date, eventData.location, eventData.createdBy, eventData.imageUrl);
            });
        } else {
            // If user has attended events, recommend similar events by category
            console.log(`User ${userId} has attended events. Recommending similar events by category.`);

            const attendedEventCategories = new Set();
            for (const eventId of user.attendedEvents) {
                const event = await Event.findById(eventId);
                if (event) {
                    attendedEventCategories.add(event.category);
                }
            }

            if (attendedEventCategories.size === 0) {
                 // Fallback if attended events have no categories or couldn't be fetched
                const trendingEventsSnapshot = await db.collection('events').orderBy('date', 'desc').limit(5).get();
                return trendingEventsSnapshot.docs.map(doc => {
                    const eventData = doc.data();
                    return new Event(eventData.id, eventData.name, eventData.description, eventData.category, eventData.date, eventData.location, eventData.createdBy, eventData.imageUrl);
                });
            }

            // Find events in the same categories that the user hasn't attended
            let recommendedEvents = [];
            for (const category of Array.from(attendedEventCategories)) {
                const categoryEventsSnapshot = await db.collection('events')
                    .where('category', '==', category)
                    .limit(10) // Limit to a reasonable number per category
                    .get();
                
                categoryEventsSnapshot.docs.forEach(doc => {
                    const eventData = doc.data();
                    // Ensure we don't recommend events the user has already attended
                        if (!user.attendedEvents.includes(eventData.id)) {
                        recommendedEvents.push(new Event(eventData.id, eventData.name, eventData.description, eventData.category, eventData.date, eventData.location, eventData.createdBy, eventData.imageUrl));
                    }
                });
            }
            
            // Remove duplicates and limit the number of recommendations
            const uniqueRecommendedEvents = Array.from(new Set(recommendedEvents.map(e => e.id)))
                                            .map(id => recommendedEvents.find(e => e.id === id));

            return uniqueRecommendedEvents.slice(0, 5); // Return top 5 unique recommendations
        }
    } catch (error) {
        console.error("Error getting recommendations:", error);
        return [];
    }
};
