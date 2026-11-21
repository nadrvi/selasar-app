import { Hono } from 'hono';
import {
  getPresignedUploadUrl,
  isS3Configured,
} from '../config/s3.js';
import { randomUUID } from 'node:crypto';

export const storageRouter = new Hono();

const ALLOWED_FOLDERS = new Set(['reviews', 'avatars']);
const ALLOWED_CONTENT_TYPES = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
  ['gif', 'image/gif'],
]);

export function validateUploadRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const filename = typeof body.filename === 'string' ? body.filename.trim() : '';
  const folder = body.folder ?? 'reviews';
  const extension = filename.split('.').pop()?.toLowerCase();
  const expectedContentType = ALLOWED_CONTENT_TYPES.get(extension);
  const contentType = body.contentType ?? 'image/jpeg';

  if (
    filename.length === 0 ||
    filename.length > 255 ||
    /[\\/]/.test(filename) ||
    !expectedContentType ||
    typeof folder !== 'string' ||
    !ALLOWED_FOLDERS.has(folder) ||
    contentType !== expectedContentType
  ) {
    return null;
  }

  return { filename, folder, extension, contentType };
}

// POST /api/storage/presigned-url - Get direct upload URL to Neon S3
storageRouter.post('/presigned-url', async (c) => {
  try {
    if (!isS3Configured) {
      return c.json({
        success: false,
        message: 'Neon S3 Storage belum dikonfigurasi. Lengkapi AWS_SECRET_ACCESS_KEY di file .env backend.',
      }, 503);
    }

    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, message: 'Body permintaan tidak valid.' }, 400);
    }
    const upload = validateUploadRequest(body);
    if (!upload) {
      return c.json({
        success: false,
        message: 'Folder, nama file, atau tipe file tidak diizinkan.',
      }, 400);
    }

    const key = `${upload.folder}/${Date.now()}-${randomUUID()}.${upload.extension}`;

    const uploadDetails = await getPresignedUploadUrl(
      key,
      upload.contentType,
      900,
    );

    return c.json({
      success: true,
      data: uploadDetails,
    });
  } catch (err) {
    console.error('Error generating presigned url:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});
