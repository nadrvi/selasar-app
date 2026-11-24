import { Buffer } from 'node:buffer';
import {
  createHmac,
  createPublicKey,
  randomBytes,
  timingSafeEqual,
  verify as verifySignature,
} from 'node:crypto';
import process from 'node:process';
import type { JsonWebKey } from 'node:crypto';

const TOKEN_ISSUER = 'selasar-api';
const TOKEN_AUDIENCE = 'selasar-client';
const TOKEN_TTL_SECONDS = 8 * 60 * 60;
const MAX_TOKEN_LENGTH = 8192;
const FIREBASE_CERT_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
export const firebaseProjectId =
  process.env.FIREBASE_PROJECT_ID ||
  (process.env.NODE_ENV === 'production' ? null : 'loginprojectregister');

const configuredSecret = process.env.AUTH_TOKEN_SECRET;
if (process.env.NODE_ENV === 'production' && !configuredSecret) {
  throw new Error('AUTH_TOKEN_SECRET must be configured in production');
}
if (process.env.NODE_ENV === 'production' && !firebaseProjectId) {
  throw new Error('FIREBASE_PROJECT_ID must be configured in production');
}
if (configuredSecret && Buffer.byteLength(configuredSecret) < 32) {
  throw new Error('AUTH_TOKEN_SECRET must contain at least 32 bytes');
}
if (!configuredSecret) {
  console.warn(
    '[CONFIG] AUTH_TOKEN_SECRET is unset; using a temporary development-only signing key. Sessions expire when the server restarts.',
  );
}
const tokenSecret = configuredSecret || randomBytes(32).toString('base64url');

let firebaseKeys = new Map<string, ReturnType<typeof createPublicKey>>();
let firebaseKeysExpireAt = 0;

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    return Buffer.from(value, 'base64url');
  } catch {
    return null;
  }
}

function parseJsonSegment(segment: string): Record<string, unknown> | null {
  const decoded = decodeBase64Url(segment);
  if (!decoded) return null;
  try {
    const value = JSON.parse(decoded.toString('utf8'));
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function signHmac(data: string) {
  return createHmac('sha256', tokenSecret).update(data).digest();
}

export interface AuthTokenClaims {
  iss: string;
  aud: string;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface FirebaseIdTokenClaims {
  aud: string;
  iss: string;
  sub: string;
  user_id: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iat: number;
  exp: number;
  auth_time: number;
  firebase?: { sign_in_provider?: string };
  [claim: string]: unknown;
}

function isAuthTokenClaims(
  claims: Record<string, unknown>,
): claims is Record<string, unknown> & AuthTokenClaims {
  return (
    claims.iss === TOKEN_ISSUER &&
    claims.aud === TOKEN_AUDIENCE &&
    typeof claims.sub === 'string' &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(claims.sub) &&
    typeof claims.jti === 'string' &&
    /^[0-9a-f]{32}$/.test(claims.jti) &&
    typeof claims.iat === 'number' &&
    Number.isInteger(claims.iat) &&
    typeof claims.exp === 'number' &&
    Number.isInteger(claims.exp)
  );
}

function isFirebaseIdTokenClaims(
  claims: Record<string, unknown>,
): claims is Record<string, unknown> & FirebaseIdTokenClaims {
  return (
    typeof claims.aud === 'string' &&
    typeof claims.iss === 'string' &&
    typeof claims.sub === 'string' &&
    typeof claims.user_id === 'string' &&
    typeof claims.iat === 'number' &&
    Number.isInteger(claims.iat) &&
    typeof claims.exp === 'number' &&
    Number.isInteger(claims.exp) &&
    typeof claims.auth_time === 'number' &&
    Number.isInteger(claims.auth_time) &&
    (claims.email === undefined || typeof claims.email === 'string') &&
    (claims.email_verified === undefined || typeof claims.email_verified === 'boolean') &&
    (claims.name === undefined || typeof claims.name === 'string') &&
    (claims.picture === undefined || typeof claims.picture === 'string')
  );
}

interface FirebaseJwk extends JsonWebKey {
  kid?: string;
  kty?: string;
  use?: string;
}

export function issueAuthToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url',
  );
  const payload = Buffer.from(
    JSON.stringify({
      iss: TOKEN_ISSUER,
      aud: TOKEN_AUDIENCE,
      sub: userId,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
      jti: randomBytes(16).toString('hex'),
    }),
  ).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const signature = signHmac(signingInput).toString('base64url');
  return `${signingInput}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenClaims | null {
  if (typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const header = parseJsonSegment(parts[0]);
  const claims = parseJsonSegment(parts[1]);
  const providedSignature = decodeBase64Url(parts[2]);
  if (
    !header ||
    header.alg !== 'HS256' ||
    header.typ !== 'JWT' ||
    !claims ||
    !providedSignature
  ) {
    return null;
  }

  const expectedSignature = signHmac(`${parts[0]}.${parts[1]}`);
  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    !isAuthTokenClaims(claims) ||
    claims.iat > now + 60 ||
    claims.exp <= now ||
    claims.exp - claims.iat > TOKEN_TTL_SECONDS
  ) {
    return null;
  }

  return claims;
}

async function getFirebaseKeys(forceRefresh = false): Promise<Map<string, ReturnType<typeof createPublicKey>>> {
  if (!forceRefresh && firebaseKeys.size > 0 && Date.now() < firebaseKeysExpireAt) {
    return firebaseKeys;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let response;
  try {
    response = await fetch(FIREBASE_CERT_URL, { signal: controller.signal });
  } catch (error) {
    throw new Error('Firebase signing keys could not be fetched', { cause: error });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Firebase signing keys returned HTTP ${response.status}`);
  }

  let body: { keys?: FirebaseJwk[] };
  try {
    body = await response.json();
  } catch (error) {
    throw new Error('Firebase signing keys returned invalid JSON', { cause: error });
  }
  if (!Array.isArray(body.keys)) {
    throw new Error('Firebase signing keys response is missing keys');
  }

  const nextKeys = new Map(
    body.keys
      .filter((key) => key && key.kid && key.kty === 'RSA' && key.use === 'sig')
        .map((key) => [key.kid as string, createPublicKey({ key, format: 'jwk' })]),
  );
  if (nextKeys.size === 0) {
    throw new Error('Firebase signing keys response contains no usable keys');
  }

  const maxAge = Number(
    response.headers.get('cache-control')?.match(/max-age=(\d+)/i)?.[1],
  );
  const cacheSeconds = Number.isFinite(maxAge)
    ? Math.max(60, Math.min(maxAge, 6 * 60 * 60))
    : 60 * 60;
  firebaseKeys = nextKeys;
  firebaseKeysExpireAt = Date.now() + cacheSeconds * 1000;
  return firebaseKeys;
}

export async function verifyFirebaseIdToken(token: string): Promise<FirebaseIdTokenClaims | null> {
  if (
    typeof token !== 'string' ||
    token.length > MAX_TOKEN_LENGTH ||
    !firebaseProjectId
  ) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const header = parseJsonSegment(parts[0]);
  const claims = parseJsonSegment(parts[1]);
  const signature = decodeBase64Url(parts[2]);
  if (
    !header ||
    header.alg !== 'RS256' ||
    typeof header.kid !== 'string' ||
    !claims ||
    !signature
  ) {
    return null;
  }

  let keys = await getFirebaseKeys();
  let publicKey = keys.get(header.kid);
  if (!publicKey) {
    keys = await getFirebaseKeys(true);
    publicKey = keys.get(header.kid);
  }
  if (!publicKey) return null;

  const signingInput = `${parts[0]}.${parts[1]}`;
  if (!verifySignature('RSA-SHA256', Buffer.from(signingInput), publicKey, signature)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const projectId = firebaseProjectId;
  if (
    !isFirebaseIdTokenClaims(claims) ||
    claims.aud !== projectId ||
    claims.iss !== `https://securetoken.google.com/${projectId}` ||
    claims.sub.length < 1 ||
    claims.sub.length > 128 ||
    claims.user_id !== claims.sub ||
    claims.iat > now + 60 ||
    claims.exp <= now ||
    claims.exp - claims.iat > 60 * 60 ||
    claims.auth_time > now + 60 ||
    claims.auth_time > claims.iat
  ) {
    return null;
  }

  return claims;
}
