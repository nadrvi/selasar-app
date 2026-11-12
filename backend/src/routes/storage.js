import { Hono } from 'hono';
import { getPresignedUploadUrl, isS3Configured } from '../config/s3.js';
import { randomUUID } from 'crypto';

export const storageRouter = new Hono();

// POST /api/storage/presigned-url - Get direct upload URL to Neon S3
storageRouter.post('/presigned-url', async (c) => {
  try {
    if (!isS3Configured) {
      return c.json({
        success: false,
        message: 'Neon S3 Storage belum dikonfigurasi. Lengkapi AWS_SECRET_ACCESS_KEY di file .env backend.',
      }, 503);
    }

    const { folder = 'general', filename, contentType = 'image/jpeg' } = await c.req.json();

    if (!filename) {
      return c.json({ success: false, message: 'filename wajib disertakan' }, 400);
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowedExts.includes(ext)) {
      return c.json({ success: false, message: `Ekstensi .${ext} tidak diizinkan. Gunakan JPG, PNG, atau WEBP.` }, 400);
    }

    const key = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

    const { uploadUrl, fileUrl } = await getPresignedUploadUrl(key, contentType, 900);

    return c.json({
      success: true,
      data: {
        uploadUrl,
        fileUrl,
        key,
      },
    });
  } catch (err) {
    console.error('Error generating presigned url:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});
