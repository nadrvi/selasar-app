import assert from 'node:assert/strict';
import test from 'node:test';
import { Hono } from 'hono';
import { reviewsRouter } from '../src/routes/reviews.ts';

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('authUser', {
      id: 'c0a80101-0000-4000-8000-000000000001',
      firebase_uid: null,
      username: 'test',
      role: 'user',
      is_banned: false,
    });
    await next();
  });
  app.route('/api/reviews', reviewsRouter);
  return app;
}

test('review listing rejects invalid and unbounded pagination before querying', async () => {
  const app = createApp();
  for (const search of ['?limit=101', '?offset=-1', '?offset=10001', '?sort=unknown']) {
    const response = await app.request(`/api/reviews/place/1${search}`);
    assert.equal(response.status, 400, search);
  }
});

test('review submissions reject invalid rating, metadata, image URLs, and malformed JSON', async () => {
  const app = createApp();
  const invalidReviews = [
    { place_id: 1, rating: 5.5 },
    { place_id: 1, rating: 5, noise_level: 'unbounded' },
    { place_id: 1, rating: 5, images: ['http://example.com/image.jpg'] },
    { place_id: 1, rating: 5, body: 'x'.repeat(501) },
  ];

  for (const review of invalidReviews) {
    const response = await app.request('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });
    assert.equal(response.status, 400);
  }

  const malformedResponse = await app.request('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(malformedResponse.status, 400);
});
