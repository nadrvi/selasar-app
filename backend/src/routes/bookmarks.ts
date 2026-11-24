import { Hono } from 'hono';
import { query, withTransaction } from '../config/db.ts';
import { resolveUser } from '../utils/userResolver.ts';
import { logServerError } from '../utils/errors.ts';

export const bookmarksRouter = new Hono();

// ─────────────────────────────────────────────────────────────
// GET /api/bookmarks/:uid
// Mengambil semua bookmark user. uid bisa firebase_uid atau DB UUID.
// ─────────────────────────────────────────────────────────────
bookmarksRouter.get('/:uid', async (c) => {
  try {
    const uid = c.req.param('uid');
    const user = await resolveUser(uid);

    if (!user) {
      return c.json({ success: true, total: 0, data: [] });
    }

    const sql = `
      SELECT 
        b.id AS bookmark_id,
        b.note,
        b.created_at AS bookmarked_at,
        p.id,
        p.name,
        p.slug,
        p.category,
        p.address,
        p.mood,
        p.avg_rating,
        p.total_reviews,
        p.noise_level AS "noiseLevel",
        CONCAT(COALESCE(p.plug_probability_pct, 80), '%') AS "colokanProbability",
        p.current_visitors AS "visitors",
        p.match_score AS "match",
        p.distance_desc AS distance,
        c.name AS city,
        COALESCE(
          (SELECT url FROM place_images WHERE place_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1),
          p.image_url,
          ''
        ) AS image
      FROM bookmarks b
      JOIN places p ON p.id = b.place_id
      LEFT JOIN cities c ON c.id = p.city_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `;

    const result = await query(sql, [user.id]);

    return c.json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    logServerError('bookmarks.get.error', err);
    return c.json({ success: false, message: 'Gagal memuat bookmark.' }, 500);
  }
});


bookmarksRouter.post('/toggle', async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, message: 'Body permintaan tidak valid.' }, 400);
    }
    const { place_id, note } = body || {};
    const user = c.get('authUser');
    const placeIdNum = Number(place_id);

    if (!user || !Number.isSafeInteger(placeIdNum) || placeIdNum < 1) {
      return c.json({
        success: false,
        message: 'place_id valid wajib disertakan.',
      }, 400);
    }
    if (note != null && (typeof note !== 'string' || note.length > 500)) {
      return c.json({ success: false, message: 'Catatan bookmark tidak valid.' }, 400);
    }

    const outcome = await withTransaction(async (tx) => {
      const placeRes = await tx(
        'SELECT id FROM places WHERE id = $1 FOR UPDATE',
        [placeIdNum],
      );
      if (placeRes.rows.length === 0) return { notFound: true };

      const exist = await tx(
        'SELECT id FROM bookmarks WHERE user_id = $1 AND place_id = $2',
        [user.id, placeIdNum],
      );
      const bookmarked = exist.rows.length === 0;

      if (bookmarked) {
        await tx(
          'INSERT INTO bookmarks (user_id, place_id, note) VALUES ($1, $2, $3)',
          [user.id, placeIdNum, typeof note === 'string' ? note.trim() || null : null],
        );
        await tx(`
          INSERT INTO user_badges (user_id, badge_id)
          SELECT $1, id FROM badges
          WHERE code = 'bookworm'
            AND (SELECT COUNT(*) FROM bookmarks WHERE user_id = $1) >= 10
          ON CONFLICT (user_id, badge_id) DO NOTHING
        `, [user.id]);
      } else {
        await tx(
          'DELETE FROM bookmarks WHERE user_id = $1 AND place_id = $2',
          [user.id, placeIdNum],
        );
      }

      const countRes = await tx(
        'SELECT total_bookmarks FROM places WHERE id = $1',
        [placeIdNum],
      );
      return {
        bookmarked,
        totalBookmarks: countRes.rows[0]?.total_bookmarks || 0,
      };
    });

    if (outcome.notFound) {
      return c.json({ success: false, message: 'Spot nugas tidak ditemukan.' }, 404);
    }

    console.log(
      `[BOOKMARK] user=${user.id} place=${placeIdNum} → ${outcome.bookmarked ? 'SAVED' : 'REMOVED'}`
    );

    return c.json({
      success: true,
      bookmarked: outcome.bookmarked,
      total_bookmarks: outcome.totalBookmarks,
    });
  } catch (err) {
    logServerError('bookmarks.toggle.error', err);
    return c.json({ success: false, message: 'Gagal memperbarui bookmark.' }, 500);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/bookmarks/:uid/check/:placeId
// Cek apakah tempat tertentu sudah di-bookmark oleh user ini
// ─────────────────────────────────────────────────────────────
bookmarksRouter.get('/:uid/check/:placeId', async (c) => {
  try {
    const uid = c.req.param('uid');
    const placeId = Number(c.req.param('placeId'));

    const user = await resolveUser(uid);
    if (!user) return c.json({ success: true, bookmarked: false });

    const res = await query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND place_id = $2',
      [user.id, placeId]
    );

    return c.json({ success: true, bookmarked: res.rows.length > 0 });
  } catch (err) {
    logServerError('bookmarks.check.error', err);
    return c.json({ success: false, bookmarked: false, message: 'Gagal memeriksa bookmark.' }, 500);
  }
});
