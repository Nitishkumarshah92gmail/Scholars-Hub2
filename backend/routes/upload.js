const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

const SUPABASE_BUCKET = 'studyshare';
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();

// All file types go to Google Drive (with Supabase as fallback)
const ALL_ALLOWED_MIMETYPES = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/webm', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/mp4'
];

// Configure multer (memory storage — files stay in buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024, files: 5 },
    fileFilter: (req, file, cb) => {
        if (ALL_ALLOWED_MIMETYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed: ${file.mimetype}`), false);
        }
    },
});

/**
 * Upload file to Supabase Storage and return public URL
 */
async function uploadToSupabase(buffer, originalName, mimetype, subfolder) {
    const ALLOWED_SUBFOLDERS = ['posts', 'avatars', 'pdfs', 'images', 'chat'];
    if (!ALLOWED_SUBFOLDERS.includes(subfolder)) subfolder = 'posts';

    const ext = path.extname(originalName).replace(/[^a-zA-Z0-9.]/g, '');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = `${subfolder}/${uniqueName}`;

    const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(filePath, buffer, {
            contentType: mimetype,
            upsert: false,
        });

    if (error) {
        throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    return {
        fileId: uniqueName,
        fileName: originalName,
        fileUrl: publicUrl,
        viewLink: publicUrl,
        downloadLink: publicUrl,
        storage: 'supabase',
    };
}



/**
 * GET /api/upload/presigned-url
 * Generate a presigned URL for direct client-to-R2 uploads.
 */
router.get('/presigned-url', auth, async (req, res) => {
    try {
        const { fileName, fileType, subfolder } = req.query;
        if (!fileName || !fileType) {
            return res.status(400).json({ error: 'fileName and fileType are required' });
        }
        
        const ext = fileName.split('.').pop().replace(/[^a-zA-Z0-9]/g, '');
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = `${subfolder || 'images'}/${uniqueName}`;

        // Generate a signed upload URL via Supabase Storage
        const { data, error } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .createSignedUploadUrl(filePath);

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(filePath);

        res.json({
            uploadUrl: data.signedUrl,
            token: data.token,
            path: data.path,
            publicUrl: urlData.publicUrl,
            fileId: uniqueName
        });
    } catch (err) {
        console.error('Presigned URL error:', err);
        res.status(500).json({ error: err.message || 'Failed to generate presigned URL.' });
    }
});

/**
 * POST /api/upload/files
 */
router.post('/files', auth, upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files provided.' });
        }

        const ALLOWED_SUBFOLDERS = ['posts', 'avatars', 'pdfs', 'images', 'chat'];
        const subfolder = ALLOWED_SUBFOLDERS.includes(req.body.subfolder) ? req.body.subfolder : 'posts';
        const results = [];

        for (const file of req.files) {
            const result = await uploadToSupabase(file.buffer, file.originalname, file.mimetype, subfolder);
            results.push(result);
        }

        res.json({ urls: results });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message || 'Failed to upload files.' });
    }
});

/**
 * POST /api/upload/avatar
 */
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No avatar file provided.' });
        }

        // Avatars go directly to Supabase
        const result = await uploadToSupabase(req.file.buffer, req.file.originalname, req.file.mimetype, 'avatars');
        res.json(result);
    } catch (err) {
        console.error('Avatar upload error:', err);
        res.status(500).json({ error: err.message || 'Failed to upload avatar.' });
    }
});

/**
 * DELETE /api/upload/:fileId
 */
router.delete('/:fileId', auth, async (req, res) => {
    try {
        const fileId = path.basename(req.params.fileId);
        // Try deleting from each subfolder in Supabase Storage
        for (const sub of ['posts', 'avatars', 'pdfs', 'images', 'chat']) {
            const { error } = await supabase.storage
                .from(SUPABASE_BUCKET)
                .remove([`${sub}/${fileId}`]);
            if (!error) break;
        }
        res.json({ message: 'File deleted successfully.' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Failed to delete file.' });
    }
});

// Error handling for multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max size is 50MB.' });
        if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files. Max is 5.' });
        return res.status(400).json({ error: err.message });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
});

module.exports = router;
