require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Serve local uploads as static files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Scholars Hub API is running' });
});

// --- Serve frontend static build ---
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
    console.log(`StudyShare server running on port ${PORT} (Supabase + Google Drive)`);

    // --- Keep-alive self-ping (prevents Render free-tier cold starts) ---
    // Render spins down free services after 15 min of inactivity.
    // This pings our own health endpoint every 14 minutes to stay awake.
    const KEEP_ALIVE_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL; // Render sets this automatically
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
