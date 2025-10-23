const { getEventAnalytics } = require('../services/analyticService');

exports.getAnalyticsData = async (req, res) => {
    // For now, let's make analytics accessible to any authenticated user.
    // If it's meant to be admin-only, we'd add the `isAdmin` middleware here.
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }

    try {
        const analyticsData = await getEventAnalytics();
        res.status(200).json(analyticsData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};
