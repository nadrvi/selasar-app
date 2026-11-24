import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import { Hono } from 'hono';
import { createAuthenticationMiddleware } from '../src/middleware/authentication.ts';

process.env.SELASAR_WORKER_RUNTIME = 'cloudflare';

test('authentication rate limits distinguish Cloudflare client IPs', async () => {
  const app = new Hono();
  const rateCounts = new Map();
  app.use('/api/*', createAuthenticationMiddleware(async (sql, params) => {
    if (!sql.includes('INSERT INTO api_rate_limits')) return { rows: [] };
    const bucket = params?.[0] as string;
    const count = (rateCounts.get(bucket) || 0) + 1;
    rateCounts.set(bucket, count);
    return { rows: [{ request_count: count, retry_after_seconds: 900 }] };
  }));
  app.post('/api/auth/session', (c) => c.json({ success: true }));

  const request = (ip: string) => app.request('/api/auth/session', {
    method: 'POST',
    headers: { 'CF-Connecting-IP': ip },
  });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    assert.equal((await request('192.0.2.1')).status, 200);
  }
  assert.equal((await request('192.0.2.1')).status, 429);
  assert.equal((await request('192.0.2.2')).status, 200);
});
