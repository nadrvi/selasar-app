import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHmac, generateKeyPairSync, sign as signSignature } from 'node:crypto';
import process from 'node:process';
import test from 'node:test';
import { Hono } from 'hono';

process.env.NODE_ENV = 'test';
process.env.AUTH_TOKEN_SECRET = 'test-only-auth-secret-with-at-least-32-bytes';
process.env.FIREBASE_PROJECT_ID = 'selasar-test-project';

const { issueAuthToken, verifyAuthToken, verifyFirebaseIdToken } =
  await import('../src/utils/authTokens.js');
const { createAuthenticationMiddleware } =
  await import('../src/middleware/authentication.js');

const userId = 'c0a80101-0000-4000-8000-000000000001';

function signAppToken(claims) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const input = `${header}.${payload}`;
  const signature = createHmac('sha256', process.env.AUTH_TOKEN_SECRET)
    .update(input)
    .digest('base64url');
  return `${input}.${signature}`;
}

function createTestApp(query) {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('requestId', 'test-request');
    await next();
  });
  app.use('/api/*', createAuthenticationMiddleware(query));
  app.get('/api/public', (c) => c.json({ success: true }));
  app.post('/api/auth/login', (c) => c.json({ success: true }));
  app.post('/api/auth/session', (c) => c.json({ success: true }));
  app.post('/api/write', (c) => c.json({ userId: c.get('authUser')?.id }));
  app.get('/api/users/:identifier/profile', (c) => c.json({ success: true }));
  return app;
}

test('backend session tokens are signed, scoped, and time limited', () => {
  const token = issueAuthToken(userId);
  assert.equal(verifyAuthToken(token)?.sub, userId);

  const parts = token.split('.');
  parts[1] = Buffer.from(JSON.stringify({
    iss: 'selasar-api',
    aud: 'selasar-client',
    sub: 'c0a80101-0000-4000-8000-000000000002',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
  })).toString('base64url');
  assert.equal(verifyAuthToken(parts.join('.')), null);

  const now = Math.floor(Date.now() / 1000);
  const expired = signAppToken({
    iss: 'selasar-api',
    aud: 'selasar-client',
    sub: userId,
    iat: now - 100,
    exp: now - 1,
  });
  assert.equal(verifyAuthToken(expired), null);
});

test('protected writes reject missing tokens and use the authenticated account', async () => {
  const app = createTestApp(async () => ({ rows: [{ id: userId, is_banned: false }] }));

  const denied = await app.request('/api/write', { method: 'POST' });
  assert.equal(denied.status, 401);

  const invalid = await app.request('/api/write', {
    method: 'POST',
    headers: { Authorization: 'Bearer invalid' },
  });
  assert.equal(invalid.status, 401);

  const authorized = await app.request('/api/write', {
    method: 'POST',
    headers: { Authorization: `Bearer ${issueAuthToken(userId)}` },
  });
  assert.equal(authorized.status, 200);
  assert.deepEqual(await authorized.json(), { userId });
});

test('public reads remain available and authentication routes are rate limited', async () => {
  const app = createTestApp(async () => ({ rows: [] }));
  assert.equal((await app.request('/api/public')).status, 200);
  assert.equal((await app.request('/api/auth/session', { method: 'POST' })).status, 200);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    assert.equal((await app.request('/api/auth/login', { method: 'POST' })).status, 200);
  }
  const limited = await app.request('/api/auth/login', { method: 'POST' });
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.get('retry-after'));
});

test('private profile reads require ownership of the requested identifier', async () => {
  const otherUserId = 'c0a80101-0000-4000-8000-000000000002';
  const app = createTestApp(async (sql) => {
    if (sql.includes('FROM users WHERE id = $1')) {
      return { rows: [{ id: userId, is_banned: false }] };
    }
    return { rows: [{ id: otherUserId }] };
  });

  const response = await app.request(`/api/users/${otherUserId}/profile`, {
    headers: { Authorization: `Bearer ${issueAuthToken(userId)}` },
  });
  assert.equal(response.status, 403);
});

test('Firebase ID tokens require a valid signature and configured project claims', async (t) => {
  const originalFetch = globalThis.fetch;
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', use: 'sig', alg: 'RS256' };
  globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }), {
    status: 200,
    headers: { 'cache-control': 'public, max-age=3600' },
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: process.env.FIREBASE_PROJECT_ID,
    iss: `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`,
    sub: 'firebase-user-123',
    user_id: 'firebase-user-123',
    email: 'user@example.com',
    email_verified: true,
    iat: now - 30,
    exp: now + 3570,
    auth_time: now - 60,
  };
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-key' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const input = `${header}.${payload}`;
  const signature = signSignature('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url');
  const token = `${input}.${signature}`;

  assert.equal((await verifyFirebaseIdToken(token))?.sub, claims.sub);
  assert.equal(await verifyFirebaseIdToken(`${input}.invalid`), null);
});
