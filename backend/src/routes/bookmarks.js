import { Hono } from 'hono';
import { query } from '../config/db.js';
import { resolveUser } from '../utils/userResolver.js';

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
    console.error('[BOOKMARK GET ERROR]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});


bookmarksRouter.post('/toggle', async (c) => {
  try {
    const body = await c.req.json();
    const { place_id, note } = body || {};
    const user = c.get('authUser');

    if (!user || !Number.isInteger(Number(place_id)) || Number(place_id) < 1) {
      return c.json({
        success: false,
        message: 'place_id valid wajib disertakan.',
      }, 400);
    }

    const userId = user.id;
    const placeIdNum = Number(place_id);

    const exist = await query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND place_id = $2',
      [userId, placeIdNum]
    );

    let bookmarked = false;

    if (exist.rows.length > 0) {
      // ── UNBOOKMARK ──
      await query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND place_id = $2',
        [userId, placeIdNum]
      );
      // Update counter di tabel places
      await query(
        'UPDATE places SET total_bookmarks = GREATEST(0, total_bookmarks - 1), updated_at = NOW() WHERE id = $1',
        [placeIdNum]
      );
      bookmarked = false;
    } else {
      // ── BOOKMARK ──
      await query(
        'INSERT INTO bookmarks (user_id, place_id, note) VALUES ($1, $2, $3)',
        [userId, placeIdNum, note || null]
      );
      // Update counter di tabel places
      await query(
        'UPDATE places SET total_bookmarks = total_bookmarks + 1, updated_at = NOW() WHERE id = $1',
        [placeIdNum]
      );
      bookmarked = true;

      // Cek badge 'bookworm' (10 bookmarks) — async, tidak block response
      query(`
        INSERT INTO user_badges (user_id, badge_id)
        SELECT $1, id FROM badges 
        WHERE code = 'bookworm' 
          AND (SELECT COUNT(*) FROM bookmarks WHERE user_id = $1) >= 10
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]).catch(() => {});
    }

    // Ambil total terkini dari DB
    const countRes = await query(
      'SELECT total_bookmarks FROM places WHERE id = $1',
      [placeIdNum]
    );

    console.log(
      `[BOOKMARK] user=${userId} place=${placeIdNum} → ${bookmarked ? 'SAVED' : 'REMOVED'}`
    );

    return c.json({
      success: true,
      bookmarked,
      total_bookmarks: countRes.rows[0]?.total_bookmarks || 0,
    });
  } catch (err) {
    console.error('[BOOKMARK TOGGLE ERROR]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
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
    return c.json({ success: false, bookmarked: false, message: err.message }, 500);
  }
});
