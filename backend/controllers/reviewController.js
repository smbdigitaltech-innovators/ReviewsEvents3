const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const { analyzeSentiment } = require('../services/sentimentService');
const { generateSummary } = require('../services/summaryService');
const { moderateText } = require('../services/moderationService'); // Import moderation service

exports.addReview = async (req, res) => {
    // The `protect` middleware ensures `req.user` is available
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }

    const { eventId, rating, text } = req.body;

    if (!eventId || !rating || !text) {
        return res.status(400).json({ message: 'Please provide eventId, rating, and text for the review.' });
    }

    try {
        // Perform AI analysis for sentiment and summary
        const sentiment = await analyzeSentiment(text);
        const summary = await generateSummary(text);

        // Perform content moderation
        const moderationResult = await moderateText(text);
        let moderationStatus = 'approved';
        if (moderationResult.flagged) {
            moderationStatus = 'pending'; // If flagged, set to pending and do not publish immediately
            // Optionally, you could store moderationResult.categories for admin review
            console.log("Review flagged by moderation, setting status to pending.");
            // For now, we will still save the review but with pending status.
            // If 'do not publish' means truly not save to DB, then we would return here.
            // Given the schema includes moderationStatus, saving as pending seems appropriate.
        }

        const newReview = new Review(
            null,
            req.user,
            eventId,
            rating,
            text,
            new Date().toISOString(),
            sentiment,
            summary,
            moderationStatus // Set moderation status based on API result
        );
        await newReview.save();

        // After successfully adding a review, add the event to the user's attendedEvents
        const user = await User.findById(req.user);
        if (user) {
            await user.addAttendedEvent(eventId);
        }

        res.status(201).json({ message: 'Review added successfully', reviewId: newReview.id, sentiment, summary, moderationStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getReviewsForEvent = async (req, res) => {
    try {
        const reviews = await Review.findByEventId(req.params.id);
        // Only return approved reviews for general viewing
        const publishedReviews = reviews.filter(review => review.moderationStatus === 'approved');
        
        // Fetch user information for each review
        const reviewsWithUserInfo = await Promise.all(
            publishedReviews.map(async (review) => {
                try {
                    const user = await User.findById(review.userId);
                    return {
                        ...review,
                        userName: user ? user.name : 'Anonymous User',
                        userEmail: user ? user.email : '',
                        userAvatar: user ? (user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1193d4&color=fff&size=128`) : null
                    };
                } catch (error) {
                    console.error(`Error fetching user info for review ${review.id}:`, error);
                    return {
                        ...review,
                        userName: 'Anonymous User',
                        userEmail: '',
                        userAvatar: null
                    };
                }
            })
        );
        
        res.status(200).json(reviewsWithUserInfo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getReviewsByUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Check if user is requesting their own reviews or if they're an admin
        if (req.user !== userId) {
            return res.status(403).json({ message: 'You can only view your own reviews' });
        }

        const reviews = await Review.findByUserId(userId);
        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.replyToReview = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }
    const { reviewId } = req.params;
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ message: 'Reply text is required' });
    }
    try {
        const reviewRef = require('../config/firebase').db.collection('reviews').doc(reviewId);
        const snap = await reviewRef.get();
        if (!snap.exists) {
            return res.status(404).json({ message: 'Review not found' });
        }
        const review = snap.data();
        // Only allow admins who own the event to reply; naive check via event.createdBy
        const Event = require('../models/eventModel');
        const event = await Event.findById(review.eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found for review' });
        }
        if (String(event.createdBy) !== String(req.user)) {
            return res.status(403).json({ message: 'Only the event owner can reply to reviews' });
        }
        const reply = {
            id: require('../config/firebase').db.collection('_').doc().id,
            text,
            repliedBy: req.user,
            timestamp: new Date().toISOString(),
        };
        const existingReplies = Array.isArray(review.replies) ? review.replies : [];
        await reviewRef.update({ replies: [...existingReplies, reply] });
        res.status(200).json({ message: 'Reply added', reply });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteReview = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }
    const { reviewId } = req.params;
    try {
        const { db } = require('../config/firebase');
        const reviewRef = db.collection('reviews').doc(reviewId);
        const snap = await reviewRef.get();
        if (!snap.exists) {
            return res.status(404).json({ message: 'Review not found' });
        }
        const review = snap.data();
        const Event = require('../models/eventModel');
        const event = await Event.findById(review.eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found for review' });
        }
        if (String(event.createdBy) !== String(req.user)) {
            return res.status(403).json({ message: 'Only the event owner can delete reviews' });
        }
        await reviewRef.delete();
        res.status(200).json({ message: 'Review deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};