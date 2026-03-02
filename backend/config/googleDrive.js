const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const stream = require('stream');

let driveClient = null;

/**
 * Initialize Google Drive client using OAuth2 credentials.
 * Uses your personal Google account via OAuth2 refresh token.
 * 
 * Required env vars:
 *   GOOGLE_DRIVE_CLIENT_ID     - OAuth2 client ID
 *   GOOGLE_DRIVE_CLIENT_SECRET - OAuth2 client secret
 *   GOOGLE_DRIVE_REFRESH_TOKEN - OAuth2 refresh token (from OAuth Playground)
 *   GOOGLE_DRIVE_FOLDER_ID     - Target folder ID in your Drive
 */
function getDriveClient() {
    if (driveClient) return driveClient;

    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        console.warn('⚠️  Google Drive OAuth2 credentials not found.');
        console.warn('   Required env vars: GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN');
        console.warn('   Has Client ID:', !!clientId);
        console.warn('   Has Client Secret:', !!clientSecret);
        console.warn('   Has Refresh Token:', !!refreshToken);
        return null;
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    console.log('✅ Google Drive client initialized (OAuth2)');
    console.log('   Folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID || 'not set');
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

    // Return a direct access URL - use lh3 for reliable image embedding
    const fileUrl = `https://lh3.googleusercontent.com/d/${file.data.id}=s1600`;
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
