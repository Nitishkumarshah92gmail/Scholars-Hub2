const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'scholars-hub-media';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev

let s3Client = null;

if (R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ENDPOINT) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  console.log('[Cloudflare R2] S3 Client Initialized');
} else {
  console.warn('[Cloudflare R2] Missing credentials. Presigned URLs will fail.');
}

/**
 * Generates a presigned URL for direct client upload
 * @param {string} fileName - The name of the file to upload
 * @param {string} fileType - The MIME type of the file
 * @param {string} subfolder - The folder to place the file in (e.g. 'images', 'avatars')
 * @returns {Promise<{ uploadUrl: string, publicUrl: string, fileId: string }>}
 */
async function generatePresignedUrl(fileName, fileType, subfolder = 'images') {
  if (!s3Client) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  // Generate a unique filename
  const ext = fileName.split('.').pop().replace(/[^a-zA-Z0-9]/g, '');
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `${subfolder}/${uniqueName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: filePath,
    ContentType: fileType,
  });

  // URL expires in 15 minutes (900 seconds)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  
  // Clean up R2_PUBLIC_URL to prevent double slashes
  const baseUrl = R2_PUBLIC_URL ? R2_PUBLIC_URL.replace(/\/$/, '') : '';
  const publicUrl = `${baseUrl}/${filePath}`;

  return {
    uploadUrl,
    publicUrl,
    fileId: uniqueName
  };
}

module.exports = {
  s3Client,
  generatePresignedUrl,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL
};
