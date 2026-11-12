import { Hono } from 'hono';
import { query } from '../config/db.js';

export const reviewsRouter = new Hono();

// GET /api/reviews/place/:placeId - Get all reviews for a place
reviewsRouter.get('/place/:placeId', async (c) => {
  try {
    const placeId = c.req.param('placeId');
    const { sort = 'latest' } = c.req.query();

    let order = 'r.created_at DESC';
    if (sort === 'highest') order = 'r.rating DESC';
    if (sort === 'lowest') order = 'r.rating ASC';
    if (sort === 'helpful') order = 'r.helpful_count DESC';

    const sql = `
      SELECT 
        r.*,
        u.username,
        u.display_name,
        u.avatar_url,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', ri.id, 'url', ri.url)
          ) FILTER (WHERE ri.id IS NOT NULL), '[]'
        ) AS images,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', rep.id, 'body', rep.body, 'created_at', rep.created_at)
          ) FILTER (WHERE rep.id IS NOT NULL), '[]'
        ) AS replies
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN review_images ri ON ri.review_id = r.id
      LEFT JOIN review_replies rep ON rep.review_id = r.id
      WHERE r.place_id = $1 AND r.status = 'active'
      GROUP BY r.id, u.id
      ORDER BY ${order}
    `;

    const [reviewsRes, summaryRes] = await Promise.all([
      query(sql, [placeId]),
      query('SELECT * FROM v_place_review_summary WHERE place_id = $1', [placeId]),
    ]);

    return c.json({
      success: true,
      summary: summaryRes.rows[0] || null,
      total: reviewsRes.rowCount,
      data: reviewsRes.rows,
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/reviews - Add or update a review
reviewsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const {
      place_id,
      firebase_uid,
      rating,
      rating_wifi,
      rating_ambience,
      rating_plug,
      rating_price,
      body: reviewBody,
      visit_date,
      images = [],
    } = body;

    const numRating = Number(rating);
    if (!place_id || !firebase_uid || !numRating || numRating < 1 || numRating > 5) {
      return c.json({ success: false, message: 'place_id, firebase_uid, dan rating valid (1–5) wajib diisi' }, 400);
    }

    // Lookup user by firebase_uid
    const userRes = await query('SELECT id FROM users WHERE firebase_uid = $1', [firebase_uid]);
    if (userRes.rows.length === 0) {
      return c.json({ success: false, message: 'User belum terdaftar di database' }, 404);
    }
    const userId = userRes.rows[0].id;

    // Insert or update review (UPSERT)
    const upsertSql = `
      INSERT INTO reviews (
        place_id, user_id, rating, rating_wifi, rating_ambience, rating_plug, rating_price, body, visit_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      ON CONFLICT (place_id, user_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        rating_wifi = EXCLUDED.rating_wifi,
        rating_ambience = EXCLUDED.rating_ambience,
        rating_plug = EXCLUDED.rating_plug,
        rating_price = EXCLUDED.rating_price,
        body = EXCLUDED.body,
        visit_date = EXCLUDED.visit_date,
        updated_at = NOW()
      RETURNING *
    `;

    const reviewRes = await query(upsertSql, [
      place_id,
      userId,
      numRating,
      rating_wifi ? Math.min(5, Math.max(1, Number(rating_wifi))) : null,
      rating_ambience ? Math.min(5, Math.max(1, Number(rating_ambience))) : null,
      rating_plug ? Math.min(5, Math.max(1, Number(rating_plug))) : null,
      rating_price ? Math.min(5, Math.max(1, Number(rating_price))) : null,
      reviewBody || null,
      visit_date || null,
    ]);

    const review = reviewRes.rows[0];

    // Jika gambar disertakan, timpa gambar lama untuk mencegah duplikasi
    if (Array.isArray(images) && images.length > 0) {
      await query('DELETE FROM review_images WHERE review_id = $1', [review.id]);
      for (const imgUrl of images) {
        if (imgUrl && typeof imgUrl === 'string') {
          await query('INSERT INTO review_images (review_id, url) VALUES ($1, $2)', [review.id, imgUrl]);
        }
      }
    }

    // Auto-award badge 'first_review' jika belum punya
    query(`
      INSERT INTO user_badges (user_id, badge_id)
      SELECT $1, id FROM badges WHERE code = 'first_review'
      ON CONFLICT (user_id, badge_id) DO NOTHING
    `, [userId]).catch(() => {});

    return c.json({ success: true, message: 'Ulasan berhasil disimpan', data: review }, 201);
  } catch (err) {
    console.error('Error posting review:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/reviews/:id/helpful - Toggle helpful vote
reviewsRouter.post('/:id/helpful', async (c) => {
  try {
    const reviewId = c.req.param('id');
    const { firebase_uid } = await c.req.json();

    const userRes = await query('SELECT id FROM users WHERE firebase_uid = $1', [firebase_uid]);
    if (userRes.rows.length === 0) return c.json({ success: false, message: 'User tidak valid' }, 401);
    const userId = userRes.rows[0].id;

    const exist = await query('SELECT 1 FROM review_helpful WHERE review_id = $1 AND user_id = $2', [reviewId, userId]);
    
    let isHelpful = false;
    if (exist.rows.length > 0) {
      await query('DELETE FROM review_helpful WHERE review_id = $1 AND user_id = $2', [reviewId, userId]);
      isHelpful = false;
    } else {
      await query('INSERT INTO review_helpful (review_id, user_id) VALUES ($1, $2)', [reviewId, userId]);
      isHelpful = true;
    }

    const countRes = await query('SELECT helpful_count FROM reviews WHERE id = $1', [reviewId]);

    return c.json({ success: true, isHelpful, helpful_count: countRes.rows[0]?.helpful_count || 0 });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
