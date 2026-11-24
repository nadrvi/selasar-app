import assert from 'node:assert/strict';
import test from 'node:test';
import process from 'node:process';
import app from '../src/app.ts';
import { openApiDocument } from '../src/openapi.ts';

test('liveness, readiness, and OpenAPI endpoints are available', async () => {
  process.env.NODE_ENV = 'test';

  const live = await app.request('/live');
  assert.equal(live.status, 200);
  assert.equal((await live.json()).status, 'live');

  const openapi = await app.request('/api/openapi.json');
  assert.equal(openapi.status, 200);
  assert.ok((openapi.headers.get('x-request-id')?.length || 0) > 0);
  assert.equal((await openapi.json()).openapi, '3.1.0');
  assert.ok(openApiDocument.paths['/reviews/{id}/helpful']);
});

test('request IDs are echoed and validate traceparent continuity', async () => {
  const response = await app.request('/api/openapi.json', {
    headers: {
      'X-Request-ID': 'test-request-123',
      traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
    },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), 'test-request-123');
  assert.equal(
    response.headers.get('traceparent'),
    '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
  );
});

test('protected canonical routes reject missing authentication', async () => {
  const cases = [
    ['/api/users/me', 'GET'],
    ['/api/users/me', 'PATCH'],
    ['/api/users/me', 'DELETE'],
    ['/api/bookmarks/1', 'PUT'],
    ['/api/bookmarks/1', 'DELETE'],
    ['/api/checkins/current', 'DELETE'],
    ['/api/reviews/00000000-0000-4000-8000-000000000001', 'DELETE'],
  ] as const;

  for (const [path, method] of cases) {
    const response = await app.request(path, { method });
    assert.equal(response.status, 401, `${method} ${path}`);
  }
});

test('health metrics exposes structured counters', async () => {
  await app.request('/');
  const response = await app.request('/health/metrics');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(typeof body.data.http_requests_total, 'number');
});
