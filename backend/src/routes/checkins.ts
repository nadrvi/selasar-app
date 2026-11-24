import { Hono } from 'hono';
import { query, withTransaction } from '../config/db.ts';
import { resolveUser } from '../utils/userResolver.ts';
import { logServerError } from '../utils/errors.ts';

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
    logServerError('checkins.user.error', err);
    return c.json({ success: false, message: 'Gagal memuat check-in.' }, 500);
  }
});

// GET /api/checkins/place/:placeId - Get active visitors in a place
checkinsRouter.get('/place/:placeId', async (c) => {
  try {
    const placeId = c.req.param('placeId');
    if (!/^\\d+$/.test(placeId) || Number(placeId) < 1) {
      return c.json({ success: false, message: 'ID tempat tidak valid.' }, 400);
    }
    const result = await query(
      `SELECT COUNT(*)::integer AS active_visitors
       FROM checkins
       WHERE place_id = $1 AND status = 'active'`,
      [placeId],
    );

    return c.json({
      success: true,
      active_visitors: result.rows[0]?.active_visitors || 0,
      data: [],
    });
  } catch (err) {
    logServerError('checkins.place.error', err);
    return c.json({ success: false, message: 'Gagal memuat pengunjung.' }, 500);
  }
});

// POST /api/checkins/in - User check-in
checkinsRouter.post('/in', async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, message: 'Body permintaan tidak valid.' }, 400);
    }
    const { place_id, note } = body || {};
    const user = c.get('authUser');
    const placeId = Number(place_id);

    if (!user || !Number.isSafeInteger(placeId) || placeId < 1) {
      return c.json({ success: false, message: 'place_id valid wajib disertakan.' }, 400);
    }
    if (note != null && (typeof note !== 'string' || note.length > 500)) {
      return c.json({ success: false, message: 'Catatan check-in tidak valid.' }, 400);
    }

    const outcome = await withTransaction(async (tx) => {
      await tx('SELECT id FROM users WHERE id = $1 FOR UPDATE', [user.id]);
      const placeRes = await tx('SELECT id, name FROM places WHERE id = $1', [placeId]);
      if (placeRes.rows.length === 0) return { notFound: true };

      await tx(`
        UPDATE checkins
        SET status = 'ended', checked_out_at = NOW(),
            duration_min = GREATEST(
              1,
              ROUND(EXTRACT(EPOCH FROM (NOW() - checked_in_at)) / 60)::integer
            )
        WHERE user_id = $1 AND status = 'active'
      `, [user.id]);

      const result = await tx(`
        INSERT INTO checkins (user_id, place_id, note, status)
        VALUES ($1, $2, $3, 'active')
        RETURNING *
      `, [user.id, placeId, typeof note === 'string' ? note.trim() || null : null]);

      await tx(`
        INSERT INTO user_badges (user_id, badge_id)
        SELECT $1, id FROM badges WHERE code = 'checkin_first'
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [user.id]);

      const visitorsRes = await tx(
        'SELECT current_visitors FROM places WHERE id = $1',
        [placeId],
      );
      return {
        placeName: placeRes.rows[0].name,
        data: result.rows[0],
        currentVisitors: visitorsRes.rows[0]?.current_visitors || 0,
      };
    });

    if (outcome.notFound) {
      return c.json({ success: false, message: 'Spot nugas tidak ditemukan.' }, 404);
    }

    return c.json({
      success: true,
      message: `Check-in berhasil di ${outcome.placeName}! Selamat nugas.`,
      data: outcome.data,
      current_visitors: outcome.currentVisitors,
    }, 201);
  } catch (err) {
    logServerError('checkins.create.error', err);
    return c.json({ success: false, message: 'Gagal melakukan check-in.' }, 500);
  }
});

// POST /api/checkins/out - User check-out
checkinsRouter.post('/out', async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, message: 'Body permintaan tidak valid.' }, 400);
    }
    const { place_id } = body || {};
    const user = c.get('authUser');
    const placeId = Number(place_id);

    if (!user || !Number.isSafeInteger(placeId) || placeId < 1) {
      return c.json({ success: false, message: 'place_id valid wajib disertakan.' }, 400);
    }

    const outcome = await withTransaction(async (tx) => {
      await tx('SELECT id FROM users WHERE id = $1 FOR UPDATE', [user.id]);
      const result = await tx(`
        UPDATE checkins
        SET status = 'ended', checked_out_at = NOW(),
            duration_min = GREATEST(
              1,
              ROUND(EXTRACT(EPOCH FROM (NOW() - checked_in_at)) / 60)::integer
            )
        WHERE user_id = $1 AND place_id = $2 AND status = 'active'
        RETURNING *
      `, [user.id, placeId]);
      const visitorsRes = await tx(
        'SELECT current_visitors FROM places WHERE id = $1',
        [placeId],
      );
      return {
        data: result.rows[0] || null,
        currentVisitors: visitorsRes.rows[0]?.current_visitors || 0,
      };
    });

    return c.json({
      success: true,
      message: 'Check-out berhasil. Terima kasih sudah nugas di sini!',
      data: outcome.data,
      current_visitors: outcome.currentVisitors,
    });
  } catch (err) {
    logServerError('checkins.end.error', err);
    return c.json({ success: false, message: 'Gagal melakukan check-out.' }, 500);
  }
});

checkinsRouter.delete('/current', async (c) => {
  const user = c.get('authUser');
  try {
    const outcome = await withTransaction(async (tx) => {
      await tx('SELECT id FROM users WHERE id = $1 FOR UPDATE', [user.id]);
      const result = await tx(`
        UPDATE checkins
        SET status = 'ended', checked_out_at = NOW(),
            duration_min = GREATEST(
              1,
              ROUND(EXTRACT(EPOCH FROM (NOW() - checked_in_at)) / 60)::integer
            )
        WHERE user_id = $1 AND status = 'active'
        RETURNING place_id
      `, [user.id]);
      return { ended: result.rows.length > 0 };
    });
    if (!outcome.ended) {
      return c.json({ success: false, message: 'Tidak ada check-in aktif.' }, 404);
    }
    return c.json({ success: true, message: 'Check-out berhasil.' });
  } catch (err) {
    logServerError('checkins.current.delete.error', err);
    return c.json({ success: false, message: 'Gagal mengakhiri check-in.' }, 500);
  }
});
