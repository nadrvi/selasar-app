import { Hono } from 'hono';
import { query } from '../config/db.js';
import { resolveUser, sanitizeUser } from '../utils/userResolver.js';

export const usersRouter = new Hono();

// POST /api/users/sync - Sync or register user profile from Firebase/Social Auth
usersRouter.post('/sync', async (c) => {
  try {
    const { firebase_uid, email, username, display_name, avatar_url, birthday } = await c.req.json();

    if (!firebase_uid && !email) {
      return c.json({ success: false, message: 'firebase_uid atau email wajib disertakan' }, 400);
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;

    // Cek apakah user sudah ada berdasarkan email atau firebase_uid
    let existingUser = null;
    if (firebase_uid) {
      const byFb = await query('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);
      if (byFb.rows.length > 0) existingUser = byFb.rows[0];
    }
    if (!existingUser && cleanEmail) {
      const byEmail = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
      if (byEmail.rows.length > 0) existingUser = byEmail.rows[0];
    }

    if (existingUser) {
      // Update record yang sudah ada
      const updateRes = await query(`
        UPDATE users SET
          firebase_uid = COALESCE($1, users.firebase_uid),
          display_name = COALESCE($2, users.display_name),
          avatar_url = COALESCE($3, users.avatar_url),
          birthday = COALESCE($4, users.birthday),
          last_login_at = NOW(),
          updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `, [
        firebase_uid || null,
        display_name || null,
        avatar_url || null,
        birthday || null,
        existingUser.id,
      ]);

      return c.json({
        success: true,
        message: 'Profil user berhasil disinkronkan',
        data: sanitizeUser(updateRes.rows[0]),
      });
    }

    // User baru: buat candidate username aman
    let base = (username || cleanEmail?.split('@')[0] || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);

    if (base.length < 3) base = `user_${base}`;

    let finalUsername = base;
    const clash = await query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [finalUsername]);
    if (clash.rows.length > 0) {
      finalUsername = `${base.slice(0, 15)}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const insertSql = `
      INSERT INTO users (
        firebase_uid, email, username, display_name, avatar_url, birthday, last_login_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
      RETURNING *
    `;

    const result = await query(insertSql, [
      firebase_uid || null,
      cleanEmail,
      finalUsername,
      display_name || finalUsername,
      avatar_url || null,
      birthday || null,
    ]);

    return c.json({
      success: true,
      message: 'User sync berhasil didaftarkan',
      data: sanitizeUser(result.rows[0]),
    }, 201);
  } catch (err) {
    console.error('Error syncing user:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/users/:identifier/profile - Get user profile + badges + stats (supports firebase_uid OR UUID)
usersRouter.get('/:identifier/profile', async (c) => {
  try {
    const identifier = c.req.param('identifier');
    const user = await resolveUser(identifier);

    if (!user) {
      return c.json({ success: false, message: 'User tidak ditemukan' }, 404);
    }

    const sql = `
      SELECT 
        u.id,
        u.firebase_uid,
        u.username,
        u.email,
        u.display_name,
        u.avatar_url,
        u.bio,
        u.birthday,
        u.role,
        u.is_verified,
        u.total_reviews,
        u.total_checkins,
        u.total_bookmarks,
        u.last_login_at,
        u.created_at,
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
      WHERE u.id = $1
      GROUP BY u.id
    `;

    const result = await query(sql, [user.id]);

    return c.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// PUT /api/users/:identifier/profile - Update user profile (name, bio, birthday, avatar)
usersRouter.put('/:identifier/profile', async (c) => {
  try {
    const identifier = c.req.param('identifier');
    const user = await resolveUser(identifier);

    if (!user) {
      return c.json({ success: false, message: 'User tidak ditemukan' }, 404);
    }

    const { display_name, bio, birthday, avatar_url } = await c.req.json();

    const updateSql = `
      UPDATE users SET
        display_name = COALESCE($1, display_name),
        bio = COALESCE($2, bio),
        birthday = COALESCE($3, birthday),
        avatar_url = COALESCE($4, avatar_url),
        updated_at = NOW()
      WHERE id = $5
      RETURNING id, username, email, display_name, avatar_url, bio, birthday, role, updated_at
    `;

    const res = await query(updateSql, [
      display_name || null,
      bio || null,
      birthday || null,
      avatar_url || null,
      user.id,
    ]);

    return c.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: res.rows[0],
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
