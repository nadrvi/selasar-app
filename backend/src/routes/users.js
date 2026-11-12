import { Hono } from 'hono';
import { query } from '../config/db.js';

export const usersRouter = new Hono();

// POST /api/users/sync - Sync or register user profile from Firebase
usersRouter.post('/sync', async (c) => {
  try {
    const { firebase_uid, email, username, display_name, avatar_url, birthday } = await c.req.json();

    if (!firebase_uid || !email) {
      return c.json({ success: false, message: 'firebase_uid dan email wajib disertakan' }, 400);
    }

    // Cek apakah user sudah ada berdasarkan firebase_uid
    const existing = await query('SELECT id, username FROM users WHERE firebase_uid = $1', [firebase_uid]);
    
    let finalUsername = existing.rows[0]?.username;

    if (!finalUsername) {
      // Buat candidate username aman
      let base = (username || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20);

      if (base.length < 3) base = `user_${base}`;

      // Cek apakah ada bentrok di database
      let candidate = base;
      const clash = await query('SELECT id FROM users WHERE username = $1', [candidate]);
      if (clash.rows.length > 0) {
        candidate = `${base.slice(0, 16)}_${Math.floor(1000 + Math.random() * 9000)}`;
      }
      finalUsername = candidate;
    }

    const upsertSql = `
      INSERT INTO users (
        firebase_uid, email, username, display_name, avatar_url, birthday, last_login_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (firebase_uid) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(EXCLUDED.display_name, users.display_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        birthday = COALESCE(EXCLUDED.birthday, users.birthday),
        last_login_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;

    const result = await query(upsertSql, [
      firebase_uid,
      email,
      finalUsername,
      display_name || finalUsername,
      avatar_url || null,
      birthday || null,
    ]);

    return c.json({
      success: true,
      message: 'User sync berhasil',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error syncing user:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/users/:firebaseUid/profile - Get user profile + badges + stats
usersRouter.get('/:firebaseUid/profile', async (c) => {
  try {
    const firebaseUid = c.req.param('firebaseUid');

    const sql = `
      SELECT 
        u.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'code', b.code, 'name', b.name, 'emoji', b.icon_emoji, 'description', b.description, 'awarded_at', ub.awarded_at
            )
          ) FILTER (WHERE b.id IS NOT NULL), '[]'
        ) AS badges
      FROM users u
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      LEFT JOIN badges b ON b.id = ub.badge_id
      WHERE u.firebase_uid = $1
      GROUP BY u.id
    `;

    const result = await query(sql, [firebaseUid]);

    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'User tidak ditemukan' }, 404);
    }

    return c.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
