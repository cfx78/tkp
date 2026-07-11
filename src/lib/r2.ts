import 'server-only';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const SIGNED_URL_TTL_SECONDS = 15 * 60;

function requiredEnv(name: 'R2_ACCOUNT_ID' | 'R2_ACCESS_KEY_ID' | 'R2_SECRET_ACCESS_KEY' | 'R2_BUCKET_NAME') {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

function createR2Client() {
  const accountId = requiredEnv('R2_ACCOUNT_ID');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY')
    }
  });
}

export function isValidBeatObjectKey(key: string) {
  if (!key || key.length > 1024) return false;
  if (key.includes('\\') || key.includes('://') || /[\u0000-\u001f\u007f]/.test(key)) return false;
  const segments = key.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

export async function createSignedBeatUrl(objectKey: string) {
  if (!isValidBeatObjectKey(objectKey)) throw new Error('Invalid beat audio object key.');

  const command = new GetObjectCommand({
    Bucket: requiredEnv('R2_BUCKET_NAME'),
    Key: objectKey
  });
  const url = await getSignedUrl(createR2Client(), command, { expiresIn: SIGNED_URL_TTL_SECONDS });

  return {
    url,
    expiresIn: SIGNED_URL_TTL_SECONDS,
    expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString()
  };
}
