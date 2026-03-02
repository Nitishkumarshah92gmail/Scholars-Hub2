const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const stream = require('stream');

let driveClient = null;

/**
 * Initialize Google Drive client using Service Account credentials.
 * Supports two modes:
 *   1. Environment variables: GOOGLE_DRIVE_CLIENT_EMAIL + GOOGLE_DRIVE_PRIVATE_KEY (recommended for Render/cloud)
 *   2. JSON key file: service-account.json (local development)
 */
function getDriveClient() {
    if (driveClient) return driveClient;

    let auth;

    // Option 1: Base64-encoded service account JSON (most reliable for cloud hosts)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
        try {
            const json = JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
            auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: json.client_email,
                    private_key: json.private_key,
                },
                scopes: ['https://www.googleapis.com/auth/drive.file'],
            });
            console.log('✅ Google Drive client initialized (base64 service account)');
            console.log('   Client email:', json.client_email);
            console.log('   Folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID || 'not set');
        } catch (e) {
            console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT_BASE64:', e.message);
            return null;
        }
    }
    // Option 2: Individual env vars
    else if (process.env.GOOGLE_DRIVE_CLIENT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
        let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
        // Handle escaped \n from env vars
        privateKey = privateKey.replace(/\\n/g, '\n');
        auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        console.log('✅ Google Drive client initialized (env credentials)');
        console.log('   Client email:', process.env.GOOGLE_DRIVE_CLIENT_EMAIL);
        console.log('   Folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID || 'not set');
    }
    // Option 3: JSON key file (local development)
    else {
        const keyPath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './service-account.json');

        if (!fs.existsSync(keyPath)) {
            console.warn('⚠️  Google Drive credentials not found.');
            console.warn('   Set GOOGLE_SERVICE_ACCOUNT_BASE64 env var (recommended),');
            console.warn('   or GOOGLE_DRIVE_CLIENT_EMAIL & GOOGLE_DRIVE_PRIVATE_KEY,');
            console.warn('   or place a service-account.json file at:', keyPath);
            return null;
        }

        auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        console.log('✅ Google Drive client initialized (key file)');
    }

    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
}

/**
 * Get or create the StudyShare folder in Google Drive.
 * If GOOGLE_DRIVE_FOLDER_ID is set in .env, uses that folder.
 * Otherwise creates a "StudyShare Uploads" folder.
 */
async function getOrCreateFolder(drive, folderName = 'StudyShare Uploads') {
    // Use configured folder ID if available
    if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
        return process.env.GOOGLE_DRIVE_FOLDER_ID;
    }

    // Search for existing folder
    const res = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    if (res.data.files.length > 0) {
        return res.data.files[0].id;
    }

    // Create new folder
    const folder = await drive.files.create({
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
    });

    // Make folder publicly readable so files can be viewed
    await drive.permissions.create({
        fileId: folder.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    console.log(`📁 Created Google Drive folder: ${folderName} (${folder.data.id})`);
    return folder.data.id;
}

/**
 * Get or create a subfolder inside the main StudyShare folder.
 */
async function getOrCreateSubfolder(drive, parentFolderId, subfolderName) {
    // Sanitize subfolder name to prevent query injection
    subfolderName = subfolderName.replace(/[^a-zA-Z0-9_-]/g, '');
    const res = await drive.files.list({
        q: `name='${subfolderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    if (res.data.files.length > 0) {
        return res.data.files[0].id;
    }

    const folder = await drive.files.create({
        requestBody: {
            name: subfolderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
        },
        fields: 'id',
    });

    return folder.data.id;
}

/**
 * Upload a file buffer to Google Drive.
 * @param {Buffer} fileBuffer - The file data
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of the file
 * @param {string} subfolder - Subfolder name (e.g., 'posts', 'avatars')
 * @returns {string} Public URL of the uploaded file
 */
async function uploadFile(fileBuffer, fileName, mimeType, subfolder = 'posts') {
    const drive = getDriveClient();
    if (!drive) {
        throw new Error('Google Drive is not configured. Please add service-account.json file.');
    }

    // Get or create main folder and subfolder
    const mainFolderId = await getOrCreateFolder(drive);
    const subFolderId = await getOrCreateSubfolder(drive, mainFolderId, subfolder);

    // Create a readable stream from the buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    // Upload file
    const timestamp = Date.now();
    const uniqueName = `${timestamp}_${fileName}`;

    const file = await drive.files.create({
        requestBody: {
            name: uniqueName,
            parents: [subFolderId],
        },
        media: {
            mimeType: mimeType,
            body: bufferStream,
        },
        fields: 'id, name, webViewLink, webContentLink',
    });

    // Make file publicly readable
    await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    // Return a direct access URL
    const fileUrl = `https://drive.google.com/uc?export=view&id=${file.data.id}`;
    return {
        fileId: file.data.id,
        fileName: uniqueName,
        fileUrl,
        viewLink: file.data.webViewLink,
        downloadLink: `https://drive.google.com/uc?export=download&id=${file.data.id}`,
    };
}

/**
 * Delete a file from Google Drive by file ID.
 */
async function deleteFile(fileId) {
    const drive = getDriveClient();
    if (!drive) return;

    try {
        await drive.files.delete({ fileId });
    } catch (err) {
        console.error('Failed to delete file from Google Drive:', err.message);
    }
}

module.exports = {
    getDriveClient,
    uploadFile,
    deleteFile,
    resetClient: () => { driveClient = null; },
};
