import { Hono } from 'hono';
import { query } from '../config/db.js';
import { resolveUser } from '../utils/userResolver.js';

export const checkinsRouter = new Hono();

// GET /api/checkins/user/:identifier - Get user's current active checkin
checkinsRouter.get('/user/:identifier', async (c) => {
  try {
    const identifier = c.req.param('identifier');
    const user = await resolveUser(identifier);

    if (!user) {
      return c.json({ success: true, active_checkin: null });
    }

    const sql = `
      SELECT
        ch.id,
        ch.place_id,
        ch.note,
        ch.checked_in_at,
        p.name AS place_name,
        p.slug AS place_slug
      FROM checkins ch
      JOIN places p ON p.id = ch.place_id
      WHERE ch.user_id = $1 AND ch.status = 'active'
      ORDER BY ch.checked_in_at DESC
      LIMIT 1
    `;

    const result = await query(sql, [user.id]);

    return c.json({
      success: true,
      active_checkin: result.rows[0] || null,
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/checkins/place/:placeId - Get active visitors in a place
checkinsRouter.get('/place/:placeId', async (c) => {
  try {
    const placeId = c.req.param('placeId');

    const sql = `
      SELECT 
        ch.id,
        ch.note,
        ch.checked_in_at,
        u.username,
        u.display_name,
        u.avatar_url
      FROM checkins ch
      JOIN users u ON u.id = ch.user_id
      WHERE ch.place_id = $1 AND ch.status = 'active'
      ORDER BY ch.checked_in_at DESC
    `;

    const result = await query(sql, [placeId]);

    return c.json({
      success: true,
      active_visitors: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/checkins/in - User check-in
checkinsRouter.post('/in', async (c) => {
  try {
    const { place_id, note } = await c.req.json();
    const user = c.get('authUser');

    if (!user || !Number.isInteger(Number(place_id)) || Number(place_id) < 1) {
      return c.json({ success: false, message: 'place_id valid wajib disertakan.' }, 400);
    }
    const userId = user.id;

    const placeRes = await query('SELECT id, name FROM places WHERE id = $1', [place_id]);
    if (placeRes.rows.length === 0) return c.json({ success: false, message: 'Spot nugas tidak ditemukan' }, 404);

    // Auto checkout previous active checkin anywhere
    await query(`
      UPDATE checkins 
      SET status = 'ended', checked_out_at = NOW(),
          duration_min = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - checked_in_at)) / 60))
      WHERE user_id = $1 AND status = 'active'
    `, [userId]);

    const insertSql = `
      INSERT INTO checkins (user_id, place_id, note, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING *
    `;

    const result = await query(insertSql, [userId, place_id, note || null]);

    // Auto-award badge 'checkin_first' jika belum punya
    query(`
      INSERT INTO user_badges (user_id, badge_id)
      SELECT $1, id FROM badges WHERE code = 'checkin_first'
      ON CONFLICT (user_id, badge_id) DO NOTHING
    `, [userId]).catch(() => {});

    const visitorsRes = await query('SELECT current_visitors FROM places WHERE id = $1', [place_id]);

    return c.json({
      success: true,
      message: `Check-in berhasil di ${placeRes.rows[0].name}! Selamat nugas.`,
      data: result.rows[0],
      current_visitors: visitorsRes.rows[0]?.current_visitors || 0,
    }, 201);
  } catch (err) {
    console.error('Error during check-in:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/checkins/out - User check-out
checkinsRouter.post('/out', async (c) => {
  try {
    const { place_id } = await c.req.json();
    const user = c.get('authUser');

    if (!user || !Number.isInteger(Number(place_id)) || Number(place_id) < 1) {
      return c.json({ success: false, message: 'place_id valid wajib disertakan.' }, 400);
    }
    const userId = user.id;

    const result = await query(`
      UPDATE checkins 
      SET status = 'ended', checked_out_at = NOW(),
          duration_min = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - checked_in_at)) / 60))
      WHERE user_id = $1 AND place_id = $2 AND status = 'active'
      RETURNING *
    `, [userId, place_id]);

    const visitorsRes = await query('SELECT current_visitors FROM places WHERE id = $1', [place_id]);

    return c.json({
      success: true,
      message: 'Check-out berhasil. Terima kasih sudah nugas di sini!',
      data: result.rows[0] || null,
      current_visitors: visitorsRes.rows[0]?.current_visitors || 0,
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
