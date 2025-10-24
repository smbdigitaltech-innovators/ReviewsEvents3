// backend/server.js — CommonJS
// Starts the Express server, loads environment variables in development only,
// initializes Firebase Admin via config/firebase.js, mounts API routes, and
// serves the frontend build in production.

const express = require('express');
const dotenv = require('dotenv');
const { existsSync } = require('fs');
const path = require('path');
const { db, admin } = require('./config/firebase');
const cors = require('cors');

// Load dotenv in local development only (look for project-root .env)
if (process.env.NODE_ENV !== 'production' && existsSync(path.join(__dirname, '../.env'))) {
    dotenv.config({ path: path.join(__dirname, '../.env') });
}

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const reviewRoutes = require('./routes/reviews');
const recommendationRoutes = require('./routes/recommendations');
const analyticRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(express.json()); // For parsing application/json
// In production, allow the Railway domain and localhost for development
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.RAILWAY_STATIC_URL, 'https://*.railway.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
    const staticPath = path.join(__dirname, '..', 'frontend', 'build');
    if (existsSync(staticPath)) {
        console.log('Serving frontend build from:', staticPath);
        // Serve static files
        app.use(express.static(staticPath));
    } else {
        console.warn('Production build not found at:', staticPath);
    }
}

// Health check endpoint. Returns firebase initialization status and basic info.
app.get('/health', (req, res) => {
    const firebaseInitialized = Boolean(admin && admin.apps && admin.apps.length > 0);
    res.json({
        status: 'ok',
        firebaseInitialized,
        nodeEnv: process.env.NODE_ENV || 'development'
    });
});

// API fallback for when routes aren't matched
app.get('/api', (req, res) => {
    res.send('API is running...');
});

// Serve index.html for any remaining routes (client-side routing)
if (process.env.NODE_ENV === 'production') {
    const staticPath = path.join(__dirname, '..', 'frontend', 'build');
    if (existsSync(staticPath)) {
        // Final catch-all route to serve index.html for client-side routing
        app.use((req, res, next) => {
            // Skip if it's an API route
            if (req.path.startsWith('/api/')) {
                next();
                return;
            }
            res.sendFile(path.join(staticPath, 'index.html'), err => {
                if (err) next(err);
            });
        });
    }
}

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));