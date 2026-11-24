import process from 'node:process';
import { verifyAuthToken } from '../utils/authTokens.ts';
import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context, MiddlewareHandler } from 'hono';
import type { QueryFunction } from '../config/db.ts';
import type { AuthenticatedUser } from '../types.ts';

type PoolUser = AuthenticatedUser;

const PRIVATE_READ_PATTERNS = [
  /^\/api\/users\/([^/]+)\/profile$/,
  /^\/api\/bookmarks\/([^/]+)(?:\/check\/[^/]+)?$/,
  /^\/api\/checkins\/user\/([^/]+)$/,
];
const RATE_LIMITS = new Map([
  ['POST /api/auth/register', 10],
  ['POST /api/auth/register/social', 10],
  ['POST /api/auth/login', 20],
  ['POST /api/auth/session', 30],
  ['POST /api/auth/logout', 30],
  ['POST /api/auth/change-password', 10],
  ['POST /api/storage/presigned-url', 20],
  ['GET /api/places', 300],
  ['GET /api/reviews/place', 300],
]);
const RATE_WINDOW_MS = 15 * 60 * 1000;
let rateChecks = 0;

function getRateLimitKey(method: string, path: string): string | null {
  if (method === 'GET' && /^\/api\/reviews\/place\/[^/]+$/.test(path)) {
    return 'GET /api/reviews/place';
  }
  const key = `${method} ${path}`;
  return RATE_LIMITS.has(key) ? key : null;
}

async function isRateLimited(
  c: Context,
  key: string,
  query: QueryFunction,
): Promise<number> {
  const limit = RATE_LIMITS.get(key);
  if (!limit) return 0;

  let address = 'unknown';
  try {
    address = getConnInfo(c).remote.address || address;
  } catch {
    // Framework-level tests may not have a Node socket.
  }
  if (
    address === 'unknown' &&
    process.env.SELASAR_WORKER_RUNTIME === 'cloudflare'
  ) {
    address = c.req.header('CF-Connecting-IP') || address;
  }
  const bucketKey = `${key}:${address}`;
  const result = await query(`
    INSERT INTO api_rate_limits (bucket_key, window_started_at, request_count, expires_at)
    VALUES ($1, NOW(), 1, NOW() + ($2 * INTERVAL '1 millisecond'))
    ON CONFLICT (bucket_key) DO UPDATE SET
      window_started_at = CASE
        WHEN api_rate_limits.expires_at <= NOW() THEN NOW()
        ELSE api_rate_limits.window_started_at
      END,
      request_count = CASE
        WHEN api_rate_limits.expires_at <= NOW() THEN 1
        ELSE api_rate_limits.request_count + 1
      END,
      expires_at = CASE
        WHEN api_rate_limits.expires_at <= NOW()
          THEN NOW() + ($2 * INTERVAL '1 millisecond')
        ELSE api_rate_limits.expires_at
      END
    RETURNING request_count,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (expires_at - NOW()))))::integer
        AS retry_after_seconds
  `, [bucketKey, RATE_WINDOW_MS]);

  rateChecks += 1;
  if (rateChecks % 512 === 0) {
    await query('DELETE FROM api_rate_limits WHERE expires_at < NOW()');
  }

  const row = result.rows[0];
  return row?.request_count > limit
    ? Number(row.retry_after_seconds) || 1
    : 0;
}

export function createAuthenticationMiddleware(
  query: QueryFunction,
): MiddlewareHandler {
  return async (c, next) => {
    const path = c.req.path;
    const method = c.req.method.toUpperCase();
    const rateLimitKey = getRateLimitKey(method, path);
    const isPublicAuthEndpoint =
      method === 'POST' &&
      [
        '/api/auth/register',
        '/api/auth/register/social',
        '/api/auth/login',
        '/api/auth/session',
      ].includes(path);

    if (rateLimitKey) {
      const retryAfter = await isRateLimited(c, rateLimitKey, query);
      if (retryAfter > 0) {
        console.warn(JSON.stringify({
          event: 'auth.rate_limited',
          requestId: c.get('requestId') || null,
          path: rateLimitKey,
        }));
        c.header('Retry-After', String(retryAfter));
        return c.json({ success: false, message: 'Terlalu banyak percobaan. Coba lagi nanti.' }, 429);
      }
    }

    if (isPublicAuthEndpoint) return next();

    const privateReadMatch =
      ['GET', 'HEAD'].includes(method) &&
      PRIVATE_READ_PATTERNS.map((pattern) => path.match(pattern)).find(Boolean);
    const privateProfileWriteMatch =
      ['PUT', 'PATCH', 'DELETE'].includes(method) &&
      path.match(PRIVATE_READ_PATTERNS[0]);
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
      `SELECT u.id, u.firebase_uid, u.username, u.role, u.is_banned
       FROM users u
       JOIN auth_sessions s ON s.user_id = u.id
       WHERE u.id = $1
         AND s.jti = $2
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()`,
      [claims.sub, claims.jti],
    );
    const user = userRes.rows[0] as PoolUser | undefined;
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
    c.set('authClaims', claims);

    const privateResourceMatch = privateReadMatch || privateProfileWriteMatch;
    if (privateResourceMatch) {
      let requestedIdentifier;
      try {
        requestedIdentifier = decodeURIComponent(privateResourceMatch[1]);
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
