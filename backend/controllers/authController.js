const { db, admin } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.register = async (req, res) => {
    const { uid, email, name, isAdmin } = req.body; // Receive UID, email, name, AND isAdmin from frontend

    try {
        // Check if user profile already exists in Firestore
        const existingUser = await User.findById(uid);
        if (existingUser) {
            return res.status(400).json({ message: 'User profile already exists.' });
        }

        // Create user profile in Firestore with Firebase Auth UID as document ID and set isAdmin
        await User.createProfileAfterAuth(uid, name, email, isAdmin);

        // Set custom claims in Firebase Auth to match Firestore admin status
        await admin.auth().setCustomUserClaims(uid, { isAdmin: isAdmin });

        res.status(201).json({ message: 'User profile created successfully.', userId: uid });
    } catch (error) {
        console.error("Backend registration error:", error);
        res.status(500).json({ message: 'Server error during profile creation.' });
    }
};

exports.login = async (req, res) => {
    const { email, firebaseIdToken } = req.body; 

    try {
        // Always verify Firebase ID Token on backend
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
            if (!decodedToken.email || decodedToken.email !== email) {
                return res.status(401).json({ message: 'Token email mismatch.' });
            }
        } catch (error) {
            return res.status(401).json({ message: 'Invalid Firebase ID Token.' });
        }

        // Get user from Firestore
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'User profile not found in Firestore. Please register.' });
        }

        // Verify admin status matches in both Firebase Auth and Firestore
        const isAdminInAuth = decodedToken.isAdmin || false;
        if (user.isAdmin !== isAdminInAuth) {
            // Update Firebase Auth claims to match Firestore if they're out of sync
            await admin.auth().setCustomUserClaims(decodedToken.uid, { isAdmin: user.isAdmin });
        }

        // Generate custom JWT with verified admin status
        const token = jwt.sign(
            { id: user.id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
            { expiresIn: '1h' }
        );

        res.status(200).json({ 
            token, 
            isAdmin: user.isAdmin,
            userId: user.id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        console.error("Backend login error:", error);
        res.status(500).json({ message: 'Server error during login process.' });
    }
};

exports.logout = (req, res) => {
    res.status(200).json({ message: 'Logged out successfully from backend perspective.' });
};

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        let decoded;
        try {
            // Try verifying as our backend JWT first
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-change-in-production');
            // Normalize user id field and isAdmin
            req.user = decoded.id;
            req.userId = String(decoded.id);
            req.isAdmin = Boolean(decoded.isAdmin);
        } catch (jwtErr) {
            // If that fails, try verifying as Firebase ID token
            try {
                const decodedFirebase = await admin.auth().verifyIdToken(token);
                // Get user from Firestore to include isAdmin status
                const user = await User.findById(decodedFirebase.uid);
                if (!user) {
                    throw new Error('User not found in database');
                }
                req.user = decodedFirebase.uid;
                req.userId = String(decodedFirebase.uid);
                req.isAdmin = Boolean(user.isAdmin || false);
            } catch (firebaseErr) {
                // If firebase verification also fails, rethrow the original jwtErr for logging
                console.debug('auth.protect: jwt verify failed, firebase verify also failed', { jwtErr: jwtErr.message, firebaseErr: firebaseErr?.message });
                throw firebaseErr || jwtErr;
            }
        }
        return next();
    } catch (error) {
        // Development debug log (avoid printing full tokens)
        console.error('Authentication error in protect():', error?.message || error);
        return res.status(401).json({ message: 'Token is not valid' });
    }
};