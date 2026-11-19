import { verifyAuthToken } from '../utils/authTokens.js';
import { getConnInfo } from '@hono/node-server/conninfo';

const PRIVATE_READ_PATTERNS = [
  /^\/api\/users\/([^/]+)\/profile$/,
  /^\/api\/bookmarks\/([^/]+)(?:\/check\/[^/]+)?$/,
  /^\/api\/checkins\/user\/([^/]+)$/,
];
const AUTH_RATE_LIMITS = new Map([
  ['/api/auth/register', 10],
  ['/api/auth/login', 20],
  ['/api/auth/session', 30],
  ['/api/auth/change-password', 10],
]);
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_RATE_BUCKETS = 10000;
const rateBuckets = new Map();
let rateChecks = 0;

function isRateLimited(c, path, now = Date.now()) {
  const limit = AUTH_RATE_LIMITS.get(path);
  if (!limit) return 0;

  let address = 'unknown';
  try {
    address = getConnInfo(c).remote.address || address;
  } catch {
    // Framework-level tests may not have a Node socket.
  }
  const key = `${path}:${address}`;
  let bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.expiresAt) {
    if (rateBuckets.size >= MAX_RATE_BUCKETS) {
      for (const [bucketKey, value] of rateBuckets) {
        if (now >= value.expiresAt) rateBuckets.delete(bucketKey);
      }
    }
    if (rateBuckets.size >= MAX_RATE_BUCKETS) return RATE_WINDOW_MS;
    bucket = { count: 0, expiresAt: now + RATE_WINDOW_MS };
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);

  rateChecks += 1;
  if (rateChecks % 256 === 0) {
    for (const [bucketKey, value] of rateBuckets) {
      if (now >= value.expiresAt) rateBuckets.delete(bucketKey);
    }
  }

  return bucket.count > limit ? Math.ceil((bucket.expiresAt - now) / 1000) : 0;
}

export function createAuthenticationMiddleware(query) {
  return async (c, next) => {
    const path = c.req.path;
    const method = c.req.method.toUpperCase();
    const isPublicAuthEndpoint =
      method === 'POST' &&
      ['/api/auth/register', '/api/auth/login', '/api/auth/session'].includes(path);

    if (method === 'POST' && AUTH_RATE_LIMITS.has(path)) {
      const retryAfter = isRateLimited(c, path);
      if (retryAfter > 0) {
        console.warn(JSON.stringify({
          event: 'auth.rate_limited',
          requestId: c.get('requestId') || null,
          path,
        }));
        c.header('Retry-After', String(retryAfter));
        return c.json({ success: false, message: 'Terlalu banyak percobaan. Coba lagi nanti.' }, 429);
      }
    }

    if (isPublicAuthEndpoint) return next();

    const privateReadMatch =
      ['GET', 'HEAD'].includes(method) &&
      PRIVATE_READ_PATTERNS.map((pattern) => path.match(pattern)).find(Boolean);
    const requiresAuthentication =
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ||
      Boolean(privateReadMatch);
    if (!requiresAuthentication) return next();

    const authorization = c.req.header('Authorization');
    const match = authorization?.match(/^Bearer ([^\s]+)$/i);
    const claims = match ? verifyAuthToken(match[1]) : null;
    if (!claims) {
      console.warn(JSON.stringify({
        event: 'auth.denied',
        requestId: c.get('requestId') || null,
        path,
        reason: authorization ? 'invalid_token' : 'missing_token',
      }));
      return c.json({ success: false, message: 'Autentikasi diperlukan.' }, 401);
    }

    const userRes = await query(
      `SELECT id, firebase_uid, username, role, is_banned
       FROM users WHERE id = $1`,
      [claims.sub],
    );
    const user = userRes.rows[0];
    if (!user || user.is_banned) {
      console.warn(JSON.stringify({
        event: 'auth.denied',
        requestId: c.get('requestId') || null,
        path,
        reason: user ? 'banned_user' : 'unknown_user',
      }));
      return c.json({ success: false, message: 'Sesi tidak valid.' }, 401);
    }
    c.set('authUser', user);

    if (privateReadMatch) {
      let requestedIdentifier;
      try {
        requestedIdentifier = decodeURIComponent(privateReadMatch[1]);
      } catch {
        return c.json({ success: false, message: 'Identitas user tidak valid.' }, 400);
      }

      const ownerRes = await query(
        'SELECT id FROM users WHERE id::text = $1 OR firebase_uid = $1',
        [requestedIdentifier],
      );
      if (ownerRes.rows[0]?.id !== user.id) {
        return c.json({ success: false, message: 'Akses ditolak.' }, 403);
      }
    }

    await next();
  };
}
