const { getRecommendations } = require('../services/recommendationService');

exports.getUserRecommendations = async (req, res) => {
    // The `protect` middleware ensures `req.user` is available if it was applied. 
    // However, the prompt specifies `/api/recommendations/:userId`, which implies fetching for a specific user ID.
    // We will use req.params.userId for the target user, but require `protect` to ensure the requester is authenticated.
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }

    const targetUserId = req.params.userId;

    // Optional: Add a check if the `req.user` (logged-in user) is allowed to fetch recommendations for `targetUserId`
    // For now, let's assume any logged-in user can fetch recommendations for any user ID.

    try {
        const recommendations = await getRecommendations(targetUserId);
        res.status(200).json(recommendations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};