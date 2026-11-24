import { Hono } from 'hono';
import {
  getPresignedUploadUrl,
  isS3Configured,
} from '../config/s3.ts';
import { randomUUID } from 'node:crypto';
import { logServerError } from '../utils/errors.ts';

export const storageRouter = new Hono();

const ALLOWED_FOLDERS = new Set(['reviews', 'avatars']);
const ALLOWED_CONTENT_TYPES = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
  ['gif', 'image/gif'],
]);

export interface UploadRequest {
  filename: string;
  folder: string;
  extension: string;
  contentType: string;
}

export function validateUploadRequest(body: unknown): UploadRequest | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const request = body as Record<string, unknown>;
  const filename = typeof request.filename === 'string' ? request.filename.trim() : '';
  const folder = request.folder ?? 'reviews';
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  const expectedContentType = ALLOWED_CONTENT_TYPES.get(extension);
  const contentType = request.contentType ?? 'image/jpeg';

  if (
    filename.length === 0 ||
    filename.length > 255 ||
    /[\\/]/.test(filename) ||
    !expectedContentType ||
    typeof folder !== 'string' ||
    !ALLOWED_FOLDERS.has(folder) ||
    typeof contentType !== 'string' ||
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
    logServerError('storage.presigned_url.error', err);
    return c.json({ success: false, message: 'Gagal menyiapkan unggahan.' }, 500);
  }
});
