import { Hono } from 'hono';
import { query } from '../config/db.js';

export const checkinsRouter = new Hono();

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
    const { firebase_uid, place_id, note } = await c.req.json();

    if (!firebase_uid || !place_id) {
      return c.json({ success: false, message: 'firebase_uid dan place_id wajib disertakan' }, 400);
    }

    const userRes = await query('SELECT id FROM users WHERE firebase_uid = $1', [firebase_uid]);
    if (userRes.rows.length === 0) return c.json({ success: false, message: 'User tidak ditemukan' }, 404);
    const userId = userRes.rows[0].id;

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
    const { firebase_uid, place_id } = await c.req.json();

    if (!firebase_uid || !place_id) {
      return c.json({ success: false, message: 'firebase_uid dan place_id wajib disertakan' }, 400);
    }

    const userRes = await query('SELECT id FROM users WHERE firebase_uid = $1', [firebase_uid]);
    if (userRes.rows.length === 0) return c.json({ success: false, message: 'User tidak ditemukan' }, 404);
    const userId = userRes.rows[0].id;

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
