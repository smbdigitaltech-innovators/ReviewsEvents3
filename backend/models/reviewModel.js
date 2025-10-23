const { db } = require('../config/firebase');

class Review {
    constructor(id, userId, eventId, rating, text, timestamp, sentiment = null, summary = null, moderationStatus = 'pending') {
        this.id = id;
        this.userId = userId;
        this.eventId = eventId;
        this.rating = rating;
        this.text = text;
        this.timestamp = timestamp;
        this.sentiment = sentiment;
        this.summary = summary;
        this.moderationStatus = moderationStatus;
    }

    static async findByEventId(eventId, includePending = false) {
        // Temporary fix: Get all reviews and filter in memory to avoid index requirement
        const snapshot = await db.collection('reviews')
            .where('eventId', '==', eventId)
            .get();
        
        // Filter and sort in memory
        let reviews = snapshot.docs.map(doc => {
            const reviewData = doc.data();
            const id = reviewData.id || doc.id;
            const review = new Review(
                id,
                reviewData.userId,
                reviewData.eventId,
                reviewData.rating,
                reviewData.text,
                reviewData.timestamp,
                reviewData.sentiment,
                reviewData.summary,
                reviewData.moderationStatus
            );
            // Attach replies if present in Firestore document
            if (Array.isArray(reviewData.replies)) {
                review.replies = reviewData.replies;
            }
            return review;
        });
        
        // Filter by moderation status if needed
        if (!includePending) {
            reviews = reviews.filter(review => review.moderationStatus === 'approved');
        }
        
        // Sort by timestamp descending
        return reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    static async findByUserId(userId) {
        // Temporary fix: Get all reviews and filter in memory to avoid index requirement
        const snapshot = await db.collection('reviews')
            .where('userId', '==', userId)
            .get();
        
        // Sort by timestamp in descending order in memory
        const reviews = snapshot.docs.map(doc => {
            const reviewData = doc.data();
            const id = reviewData.id || doc.id;
            const review = new Review(
                id,
                reviewData.userId,
                reviewData.eventId,
                reviewData.rating,
                reviewData.text,
                reviewData.timestamp,
                reviewData.sentiment,
                reviewData.summary,
                reviewData.moderationStatus
            );
            if (Array.isArray(reviewData.replies)) {
                review.replies = reviewData.replies;
            }
            return review;
        });
        
        // Sort by timestamp descending
        return reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    async save() {
        if (!this.id) {
            const newReviewRef = db.collection('reviews').doc();
            this.id = newReviewRef.id;
            await newReviewRef.set({ ...this });
            return this.id;
        } else {
            const reviewRef = db.collection('reviews').doc(this.id);
            await reviewRef.update({ ...this });
            return this.id;
        }
    }
}

module.exports = Review;