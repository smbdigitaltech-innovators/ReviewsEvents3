const { db } = require('../config/firebase');

// Middleware to allow only admin users
exports.isAdmin = async (req, res, next) => {
    // This middleware assumes `req.user` has been set by the `protect` middleware
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    try {
        const userDoc = await db.collection('users').doc(req.user).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = userDoc.data();

        if (user.isAdmin === true) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: You do not have admin privileges.' });
        }
    } catch (error) {
        console.error("Error in isAdmin middleware:", error);
        res.status(500).json({ message: 'Server error during authorization.' });
    }
};

// Middleware to allow only normal (non-admin) users
exports.isUser = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    try {
        const userDoc = await db.collection('users').doc(req.user).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const user = userDoc.data();

        // If user is admin, forbid access to normal-user-only routes
        if (user.isAdmin === true) {
            return res.status(403).json({ message: 'Admins are not allowed to access this route.' });
        }

        // otherwise continue
        next();
    } catch (error) {
        console.error("Error in isUser middleware:", error);
        res.status(500).json({ message: 'Server error during authorization.' });
    }
};