import { Hono } from 'hono';
import { query } from '../config/db.ts';
import { resolveUser } from '../utils/userResolver.ts';
import { getErrorCode, logServerError } from '../utils/errors.ts';

export const usersRouter = new Hono();

// Firebase identities are linked only through /api/auth/session after token verification.
usersRouter.post('/sync', (c) => c.json({
  success: false,
  message: 'Endpoint sync lama sudah dinonaktifkan. Gunakan login sosial yang terverifikasi.',
}, 410));

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
    logServerError('users.profile.get.error', err);
    return c.json({ success: false, message: 'Gagal memuat profil.' }, 500);
  }
});
// PUT /api/users/:identifier/profile - Update user profile (name, bio, birthday, avatar)
usersRouter.put('/:identifier/profile', async (c) => {
  try {
    const authUser = c.get('authUser');
    if (!authUser) {
      return c.json({ success: false, message: 'Autentikasi diperlukan.' }, 401);
    }

    const identifier = c.req.param('identifier');
    const user = await resolveUser(identifier);

    if (!user) {
      return c.json({ success: false, message: 'User tidak ditemukan' }, 404);
    }
    if (user.id !== authUser.id) {
      return c.json({ success: false, message: 'Akses ditolak.' }, 403);
    }

    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, message: 'Body permintaan tidak valid.' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return c.json({ success: false, message: 'Body permintaan tidak valid.' }, 400);
    }

    const { display_name, bio, birthday, avatar_url } = body;
    const hasField = (field: string) => Object.prototype.hasOwnProperty.call(body, field);
    const isNullableText = (value: unknown, maxLength: number) =>
      value === null || (typeof value === 'string' && value.length <= maxLength);
    const isValidBirthday = (value: unknown) => {
      if (value === null || value === '') return true;
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
    };
    const isValidAvatar = (value: unknown) => {
      if (value === null || value === '') return true;
      if (typeof value !== 'string' || value.length > 2048) return false;
      try {
        return new URL(value).protocol === 'https:';
      } catch {
        return false;
      }
    };

    if (
      (hasField('display_name') && !isNullableText(display_name, 100)) ||
      (hasField('bio') && !isNullableText(bio, 500)) ||
      (hasField('birthday') && !isValidBirthday(birthday)) ||
      (hasField('avatar_url') && !isValidAvatar(avatar_url))
    ) {
      return c.json({ success: false, message: 'Data profil tidak valid.' }, 400);
    }

    const fields = [];
    const values = [];

    if (hasField('display_name')) {
      values.push(typeof display_name === 'string' ? display_name.trim() : null);
      fields.push(`display_name = $${values.length}`);
    }
    if (hasField('bio')) {
      values.push(typeof bio === 'string' ? bio.trim() : null);
      fields.push(`bio = $${values.length}`);
    }
    if (hasField('birthday')) {
      values.push(birthday || null);
      fields.push(`birthday = $${values.length}`);
    }
    if (hasField('avatar_url')) {
      values.push(avatar_url || null);
      fields.push(`avatar_url = $${values.length}`);
    }

    if (fields.length === 0) {
      return c.json({ success: true, message: 'Tidak ada perubahan', data: user });
    }

    values.push(user.id);
    const updateSql = `
      UPDATE users SET
        ${fields.join(', ')},
        updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING id, username, email, display_name, avatar_url, bio, birthday, role, updated_at
    `;

    const res = await query(updateSql, values);

    return c.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: res.rows[0],
    });
  } catch (err) {
    logServerError('users.profile.update.error', err);
    return c.json({ success: false, message: 'Gagal memperbarui profil.' }, 500);
  }
});

// POST /api/users/activity - Record visit / view activity to activity_logs table
usersRouter.post('/activity', async (c) => {
  try {
    const body = await c.req.json();
    const { place_id, event_type = 'visit', metadata } = body || {};
    const user = c.get('authUser');
    if (!user) return c.json({ success: false, message: 'Autentikasi diperlukan.' }, 401);

    if (typeof event_type !== 'string' || event_type.length > 50) {
      return c.json({ success: false, message: 'Jenis aktivitas tidak valid.' }, 400);
    }

    let placeIdNum = null;
    if (place_id != null) {
      const placeIdString = String(place_id);
      const parsedPlaceId = Number(placeIdString);
      if (!/^\d+$/.test(placeIdString) || !Number.isSafeInteger(parsedPlaceId) || parsedPlaceId < 1) {
        return c.json({ success: false, message: 'place_id tidak valid.' }, 400);
      }
      placeIdNum = parsedPlaceId;
    }

    let metaObj = null;
    if (metadata != null) {
      if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        return c.json({ success: false, message: 'Metadata aktivitas tidak valid.' }, 400);
      }
      metaObj = JSON.stringify(metadata);
      if (metaObj.length > 4096) {
        return c.json({ success: false, message: 'Metadata aktivitas terlalu besar.' }, 413);
      }
    }

    const sql = `
      INSERT INTO activity_logs (user_id, place_id, event_type, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING id, user_id, place_id, event_type, created_at
    `;

    const res = await query(sql, [user.id, placeIdNum, event_type, metaObj]);

    return c.json({
      success: true,
      message: 'Aktivitas berhasil dicatat ke database.',
      data: res.rows[0],
    });
  } catch (err) {
    console.error(JSON.stringify({
      event: 'activity_log.error',
      requestId: c.get('requestId') || null,
      code: getErrorCode(err),
    }));
    return c.json({ success: false, message: 'Gagal mencatat aktivitas.' }, 500);
  }
});
