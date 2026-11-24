import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import dotenv from 'dotenv';
import process from 'node:process';
import type { Readable } from 'node:stream';

dotenv.config();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
const endpoint = process.env.AWS_ENDPOINT_URL_S3 || '';
export const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const isPlaceholderCredential = (value: string) =>
  !value || /^(?:\*+|YOUR_|CHANGE_ME|REPLACE_ME)/i.test(value);

export const isS3Configured = Boolean(
  !isPlaceholderCredential(accessKeyId) &&
  !isPlaceholderCredential(secretAccessKey) &&
  endpoint &&
  BUCKET_NAME
);

export const s3Client = new S3Client({
  endpoint: endpoint || undefined,
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId,
    secretAccessKey: isS3Configured ? secretAccessKey : 'mock-key',
  },
  forcePathStyle: true,
});

/**
 * Generate a pre-signed POST policy for bounded direct client-to-S3 upload
 * @param {string} key - File path / name in bucket (e.g. "reviews/photo-123.jpg")
 * @param {string} contentType - e.g. "image/jpeg", "image/png"
 * @param {number} expiresIn - Expiry in seconds (default 15 minutes)
 */
export const getPresignedUploadUrl = async (key: string, contentType: string, expiresIn = 900) => {
  if (!isS3Configured) {
    throw new Error('S3 Storage belum dikonfigurasi. Harap isi AWS_SECRET_ACCESS_KEY di .env dengan credential Neon S3 kamu.');
  }

  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
    Fields: {
      'Content-Type': contentType,
      key,
    },
    Conditions: [
      ['content-length-range', 1, MAX_UPLOAD_BYTES],
      ['eq', '$Content-Type', contentType],
      ['eq', '$key', key],
    ],
  });
  const fileUrl = `${endpoint.replace(/\/+$/, '')}/${BUCKET_NAME}/${key}`;

  return {
    uploadUrl: url,
    uploadMethod: 'POST',
    fields,
    fileUrl,
    key,
    maxFileSize: MAX_UPLOAD_BYTES,
  };
};

/**
 * Upload a file directly from server buffer
 */
export const uploadFileBuffer = async (key: string, buffer: Buffer | Uint8Array | Readable, contentType: string) => {
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
export const deleteFile = async (key: string) => {
  if (!isS3Configured) return;
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(command);
};
