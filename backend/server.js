require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');

const app = express();

// --- Security Middleware ---

// CORS: only allow requests from our own frontend
app.use(cors({
  origin: [
    'https://scholars-hub2.onrender.com',
    'https://scholarshub.social',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
}));

// Global rate limiter: 100 requests per minute per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// Stricter rate limiter for auth-sensitive routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});

// Body parsing — 1MB is plenty for JSON metadata (files use presigned URLs)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- Routes ---
app.use('/api/auth/forgot-password', authLimiter); // strict limit on password reset
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Scholars Hub API is running' });
});

// --- Serve frontend static build ---
const path = require('path');
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  // SPA fallback – serve index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Export for Vercel serverless
module.exports = app;

// Start server only when run directly (not imported as a module)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Scholars Hub server running on port ${PORT}`);

    // --- Keep-alive self-ping (prevents Render free-tier cold starts) ---
    const KEEP_ALIVE_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
    if (RENDER_URL) {
      setInterval(() => {
        const https = require('https');
        https.get(`${RENDER_URL}/api/health`, (res) => {
          console.log(`🏓 Keep-alive ping: ${res.statusCode}`);
        }).on('error', (err) => {
          console.error('🏓 Keep-alive ping failed:', err.message);
        });
      }, KEEP_ALIVE_INTERVAL_MS);
      console.log('🏓 Keep-alive self-ping enabled (every 14 min)');
    } else {
      console.log('🏓 Keep-alive skipped (no RENDER_EXTERNAL_URL – running locally?)');
    }
  });
}

