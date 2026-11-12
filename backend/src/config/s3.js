import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

export const isS3Configured = Boolean(
  accessKeyId &&
  secretAccessKey &&
  !secretAccessKey.includes('*')
);

export const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId,
    secretAccessKey: isS3Configured ? secretAccessKey : 'mock-key',
  },
  forcePathStyle: true,
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'selasar-assets';

/**
 * Generate a pre-signed URL for direct client-to-S3 upload
 * @param {string} key - File path / name in bucket (e.g. "reviews/photo-123.jpg")
 * @param {string} contentType - e.g. "image/jpeg", "image/png"
 * @param {number} expiresIn - Expiry in seconds (default 15 minutes)
 */
export const getPresignedUploadUrl = async (key, contentType, expiresIn = 900) => {
  if (!isS3Configured) {
    throw new Error('S3 Storage belum dikonfigurasi. Harap isi AWS_SECRET_ACCESS_KEY di .env dengan credential Neon S3 kamu.');
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const fileUrl = `${process.env.AWS_ENDPOINT_URL_S3}/${BUCKET_NAME}/${key}`;

  return { uploadUrl, fileUrl, key };
};

/**
 * Upload a file directly from server buffer
 */
export const uploadFileBuffer = async (key, buffer, contentType) => {
  if (!isS3Configured) {
    throw new Error('S3 Storage belum dikonfigurasi.');
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return `${process.env.AWS_ENDPOINT_URL_S3}/${BUCKET_NAME}/${key}`;
};

/**
 * Delete a file in S3 bucket
 */
export const deleteFile = async (key) => {
  if (!isS3Configured) return;
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(command);
};
