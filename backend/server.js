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

// Google Drive diagnostic endpoint
app.get('/api/drive-test', async (req, res) => {
  try {
    const googleDrive = require('./config/googleDrive');
    // Reset cached client to pick up scope changes
    const drive = googleDrive.getDriveClient();
    if (!drive) {
      return res.json({
        status: 'error',
        message: 'Google Drive client not initialized',
        hasBase64: !!process.env.GOOGLE_SERVICE_ACCOUNT_BASE64,
        hasClientEmail: !!process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_DRIVE_PRIVATE_KEY,
        hasFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
        base64Length: (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 || '').length,
      });
    }
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Step 1: Try to list files
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 5,
    });

    // Step 2: Try to WRITE a test file to verify write access
    const { PassThrough } = require('stream');
    const testStream = new PassThrough();
    testStream.end('Google Drive write test - ' + new Date().toISOString());

    const testFile = await drive.files.create({
      requestBody: {
        name: '_drive_test_' + Date.now() + '.txt',
        parents: [folderId],
      },
      media: {
        mimeType: 'text/plain',
        body: testStream,
      },
      fields: 'id, name',
    });

    // Clean up test file
    await drive.files.delete({ fileId: testFile.data.id });

    res.json({
      status: 'ok',
      message: 'Google Drive READ + WRITE working!',
      folderId,
      filesInFolder: listRes.data.files.length,
      sampleFiles: listRes.data.files.map(f => f.name),
      writeTest: 'PASSED - created and deleted test file',
    });
  } catch (err) {
    res.json({
      status: 'error',
      message: err.message,
      errorCode: err.code,
      errors: err.errors,
      stack: err.stack?.split('\n').slice(0, 5),
    });
  }
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`StudyShare server running on port ${PORT} (Supabase + Google Drive)`);

  // Test Google Drive on startup
  try {
    const googleDrive = require('./config/googleDrive');
    const drive = googleDrive.getDriveClient();
    if (drive) {
      console.log('🚀 Google Drive client ready at startup');
      // Verify access to target folder
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (folderId) {
        drive.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          fields: 'files(id, name)',
          pageSize: 1,
        }).then(res => {
          console.log(`✅ Google Drive folder ${folderId} accessible - ${res.data.files.length} file(s) found`);
        }).catch(err => {
          console.error('❌ Google Drive folder access FAILED:', err.message);
        });
      }
    } else {
      console.warn('⚠️ Google Drive client NOT initialized - uploads will use Supabase only');
    }
  } catch (err) {
    console.error('❌ Google Drive startup check failed:', err.message);
  }
});
