const { db } = require('../config/firebase');
const Review = require('../models/reviewModel');

exports.getEventAnalytics = async () => {
    try {
        // Totals
        const usersSnapshot = await db.collection('users').get();
        const eventsSnapshot = await db.collection('events').get();
        const totalUsers = usersSnapshot.size;
        const totalEvents = eventsSnapshot.size;

        const reviewsSnapshot = await db.collection('reviews').orderBy('timestamp', 'asc').get();
        const allReviews = reviewsSnapshot.docs.map(doc => new Review(
            doc.id,
            doc.data().userId,
            doc.data().eventId,
            doc.data().rating,
            doc.data().text,
            doc.data().timestamp,
            doc.data().sentiment,
            doc.data().summary,
            doc.data().moderationStatus
        ));

        const totalReviews = allReviews.length;

        const eventPopularity = {}; // { eventId: { 'YYYY-MM-DD': count, ... } }
        const dailySatisfaction = {}; // { 'YYYY-MM-DD': { sum: 0, count: 0 } }

        allReviews.forEach(review => {
            const reviewDate = new Date(review.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD

            // Calculate Event Popularity Trends (reviews per event per day)
            if (!eventPopularity[review.eventId]) {
                eventPopularity[review.eventId] = {};
            }
            eventPopularity[review.eventId][reviewDate] = (eventPopularity[review.eventId][reviewDate] || 0) + 1;

            // Calculate Average Satisfaction Scores over time (average rating per day)
            if (!dailySatisfaction[reviewDate]) {
                dailySatisfaction[reviewDate] = { sum: 0, count: 0 };
            }
            dailySatisfaction[reviewDate].sum += review.rating;
            dailySatisfaction[reviewDate].count += 1;
        });

        // Format daily satisfaction for output
        const sortedDates = Object.keys(dailySatisfaction).sort();
        const averageSatisfactionScores = sortedDates.map(date => ({
            date: date,
            average_rating: (dailySatisfaction[date].sum / dailySatisfaction[date].count).toFixed(2)
        }));

        // Simple linear regression (OLS) helper
        const fitLinearRegression = (xs, ys) => {
            const n = xs.length;
            if (n === 0) return { m: 0, b: 0 };
            const sumX = xs.reduce((a, v) => a + v, 0);
            const sumY = ys.reduce((a, v) => a + v, 0);
            const sumXY = xs.reduce((a, v, i) => a + v * ys[i], 0);
            const sumX2 = xs.reduce((a, v) => a + v * v, 0);
            const denom = (n * sumX2 - sumX * sumX) || 1;
            const m = (n * sumXY - sumX * sumY) / denom;
            const b = (sumY - m * sumX) / n;
            return { m, b };
        };

        // Forecast average satisfaction next 7 days using linear regression on time index
        const avgForecast = (() => {
            if (averageSatisfactionScores.length === 0) return [];
            const ys = averageSatisfactionScores.map(p => parseFloat(p.average_rating));
            const xs = ys.map((_, i) => i);
            const { m, b } = fitLinearRegression(xs, ys);
            const startIdx = xs.length; // next day index
            return Array.from({ length: 7 }).map((_, i) => ({
                day_offset: i + 1,
                predicted_average_rating: Math.max(0, Math.min(5, m * (startIdx + i) + b)).toFixed(2)
            }));
        })();

        // Format event popularity for output and forecast next 7 days per event using linear regression
        const eventPopularityTrends = Object.keys(eventPopularity).map(eventId => {
            const dates = Object.keys(eventPopularity[eventId]).sort();
            const data = dates.map(date => ({
                date: date,
                review_count: eventPopularity[eventId][date]
            }));
            // Forecast counts
            const ys = data.map(p => p.review_count);
            const xs = ys.map((_, i) => i);
            const { m, b } = fitLinearRegression(xs, ys);
            const startIdx = xs.length;
            const forecast = Array.from({ length: 7 }).map((_, i) => ({
                day_offset: i + 1,
                predicted_review_count: Math.max(0, Math.round(m * (startIdx + i) + b))
            }));
            return { eventId: eventId, trend: data, forecast };
        });

        return {
            totals: {
                users: totalUsers,
                events: totalEvents,
                reviews: totalReviews
            },
            eventPopularityTrends,
            averageSatisfactionScores,
            averageSatisfactionForecast: avgForecast
        };

    } catch (error) {
        console.error("Error fetching analytics data:", error);
        throw new Error("Failed to retrieve analytics.");
    }
};
