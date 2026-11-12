import { Hono } from 'hono';
import { query } from '../config/db.js';

export const bookmarksRouter = new Hono();

// GET /api/bookmarks/:firebaseUid - Get all bookmarked places by a user
bookmarksRouter.get('/:firebaseUid', async (c) => {
  try {
    const firebaseUid = c.req.param('firebaseUid');

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
        c.name AS city,
        COALESCE(
          (SELECT url FROM place_images WHERE place_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1),
          p.image_url,
          ''
        ) AS image
      FROM bookmarks b
      JOIN users u ON u.id = b.user_id
      JOIN places p ON p.id = b.place_id
      LEFT JOIN cities c ON c.id = p.city_id
      WHERE u.firebase_uid = $1
      ORDER BY b.created_at DESC
    `;

    const result = await query(sql, [firebaseUid]);

    return c.json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/bookmarks/toggle - Toggle bookmark
bookmarksRouter.post('/toggle', async (c) => {
  try {
    const { firebase_uid, place_id, note } = await c.req.json();

    if (!firebase_uid || !place_id) {
      return c.json({ success: false, message: 'firebase_uid dan place_id wajib disertakan' }, 400);
    }

    const userRes = await query('SELECT id FROM users WHERE firebase_uid = $1', [firebase_uid]);
    if (userRes.rows.length === 0) {
      return c.json({ success: false, message: 'User tidak ditemukan' }, 404);
    }
    const userId = userRes.rows[0].id;

    const exist = await query('SELECT id FROM bookmarks WHERE user_id = $1 AND place_id = $2', [userId, place_id]);

    let bookmarked = false;
    if (exist.rows.length > 0) {
      await query('DELETE FROM bookmarks WHERE user_id = $1 AND place_id = $2', [userId, place_id]);
      bookmarked = false;
    } else {
      await query('INSERT INTO bookmarks (user_id, place_id, note) VALUES ($1, $2, $3)', [userId, place_id, note || null]);
      bookmarked = true;

      // Cek apakah mencapai 10 bookmarks untuk badge 'bookworm'
      query(`
        INSERT INTO user_badges (user_id, badge_id)
        SELECT $1, id FROM badges 
        WHERE code = 'bookworm' 
          AND (SELECT COUNT(*) FROM bookmarks WHERE user_id = $1) >= 10
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]).catch(() => {});
    }

    const countRes = await query('SELECT total_bookmarks FROM places WHERE id = $1', [place_id]);

    return c.json({
      success: true,
      bookmarked,
      total_bookmarks: countRes.rows[0]?.total_bookmarks || 0,
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
