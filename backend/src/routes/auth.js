import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export const authRouter = new Hono();

// POST /api/auth/register - Pendaftaran akun baru langsung ke PostgreSQL database
authRouter.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, username, password, birthday, display_name } = body;

    // 1. Validasi input
    if (!email || !password || !username) {
      return c.json({
        success: false,
        message: 'Email, username, dan kata sandi wajib diisi.',
      }, 400);
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');

    if (cleanUsername.length < 3 || cleanUsername.length > 24) {
      return c.json({
        success: false,
        message: 'Username harus memiliki panjang antara 3 hingga 24 karakter.',
      }, 400);
    }

    if (password.length < 6) {
      return c.json({
        success: false,
        message: 'Password minimal 6 karakter.',
      }, 400);
    }

    // 2. Cek apakah email sudah terdaftar di database
    const emailExist = await query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [cleanEmail]
    );
    if (emailExist.rows.length > 0) {
      return c.json({
        success: false,
        field: 'email',
        message: 'Email ini sudah terdaftar di sistem Selasar. Silakan langsung masuk.',
      }, 409);
    }

    // 3. Cek apakah username sudah dipakai
    const usernameExist = await query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [cleanUsername]
    );
    if (usernameExist.rows.length > 0) {
      return c.json({
        success: false,
        field: 'username',
        message: 'Username ini sudah digunakan oleh pengguna lain. Pilih username lain.',
      }, 409);
    }

    // 4. Hash password dengan bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Simpan langsung ke PostgreSQL selasar-db
    const insertSql = `
      INSERT INTO users (
        username,
        email,
        password_hash,
        display_name,
        birthday,
        role,
        is_verified,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'user', FALSE, NOW(), NOW())
      RETURNING id, username, email, display_name, birthday, role, is_verified, created_at
    `;

    const result = await query(insertSql, [
      cleanUsername,
      cleanEmail,
      passwordHash,
      display_name || cleanUsername,
      birthday || null,
    ]);

    const newUser = result.rows[0];

    console.log(`[AUTH] User baru berhasil terdaftar di database selasar-db: ${newUser.username} (${newUser.email})`);

    return c.json({
      success: true,
      message: 'Registrasi berhasil! Akun kamu sudah tersimpan di database Selasar.',
      data: newUser,
    }, 201);
  } catch (err) {
    console.error('[AUTH ERROR /register]:', err);
    return c.json({
      success: false,
      message: err.message || 'Terjadi kesalahan saat menyimpan pendaftaran ke database.',
    }, 500);
  }
});

// POST /api/auth/login - Autentikasi pengguna langsung dari database PostgreSQL
authRouter.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({
        success: false,
        message: 'Email dan password wajib diisi.',
      }, 400);
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Cari user di database PostgreSQL selasar-db
    const userRes = await query(
      `SELECT id, username, email, password_hash, display_name, avatar_url, role, is_banned, birthday, created_at 
       FROM users 
       WHERE LOWER(email) = LOWER($1)`,
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return c.json({
        success: false,
        message: 'Email atau kata sandi tidak cocok. Akun belum terdaftar.',
      }, 401);
    }

    const user = userRes.rows[0];

    if (user.is_banned) {
      return c.json({
        success: false,
        message: 'Akun ini sedang ditangguhkan. Hubungi admin Selasar.',
      }, 403);
    }

    // 2. Verifikasi kata sandi
    if (!user.password_hash) {
      // User mungkin mendaftar via Social login
      return c.json({
        success: false,
        message: 'Akun ini terdaftar melalui akun Google/Sosial. Silakan masuk dengan tombol Google.',
      }, 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return c.json({
        success: false,
        message: 'Email atau kata sandi tidak cocok.',
      }, 401);
    }

    // 3. Update last_login_at di database
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    console.log(`[AUTH] Login berhasil dari database selasar-db: ${user.username} (${user.email})`);

    // Jangan kirim password_hash ke client
    delete user.password_hash;

    return c.json({
      success: true,
      message: 'Login berhasil! Selamat datang kembali.',
      data: user,
    });
  } catch (err) {
    console.error('[AUTH ERROR /login]:', err);
    return c.json({
      success: false,
      message: err.message || 'Terjadi kesalahan saat memverifikasi akun di database.',
    }, 500);
  }
});

// POST /api/auth/social - Simpan atau sinkronkan akun login sosial (Google/GitHub/Facebook) ke database
authRouter.post('/social', async (c) => {
  try {
    const { firebase_uid, email, display_name, avatar_url } = await c.req.json();

    if (!email) {
      return c.json({ success: false, message: 'Email dari akun sosial wajib ada.' }, 400);
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Cek apakah user sudah terdaftar di database (berdasarkan email atau firebase_uid)
    const existRes = await query(
      'SELECT id, username, email FROM users WHERE LOWER(email) = LOWER($1) OR (firebase_uid IS NOT NULL AND firebase_uid = $2)',
      [cleanEmail, firebase_uid || '']
    );

    if (existRes.rows.length > 0) {
      // User sudah ada -> Link/Update profil sosial & last_login_at
      const existing = existRes.rows[0];
      const updateSql = `
        UPDATE users SET
          firebase_uid = COALESCE($1, users.firebase_uid),
          display_name = COALESCE($2, users.display_name),
          avatar_url = COALESCE($3, users.avatar_url),
          last_login_at = NOW(),
          updated_at = NOW()
        WHERE id = $4
        RETURNING id, username, email, display_name, avatar_url, role, birthday, created_at
      `;

      const result = await query(updateSql, [
        firebase_uid || null,
        display_name || null,
        avatar_url || null,
        existing.id,
      ]);

      console.log(`[AUTH] Akun sosial berhasil disinkronkan ke user ID ${existing.id}: ${cleanEmail}`);

      return c.json({
        success: true,
        message: 'Akun sosial berhasil disinkronkan ke database.',
        data: result.rows[0],
      });
    }

    // 2. User baru -> Generate unique username aman
    let base = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 20);
    if (base.length < 3) base = `user_${base}`;

    let candidateUsername = base;
    const clash = await query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [candidateUsername]);
    if (clash.rows.length > 0) {
      candidateUsername = `${base.slice(0, 15)}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const insertSql = `
      INSERT INTO users (
        firebase_uid,
        email,
        username,
        display_name,
        avatar_url,
        last_login_at,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
      RETURNING id, username, email, display_name, avatar_url, role, birthday, created_at
    `;

    const result = await query(insertSql, [
      firebase_uid || null,
      cleanEmail,
      candidateUsername,
      display_name || candidateUsername,
      avatar_url || null,
    ]);

    console.log(`[AUTH] Akun sosial baru berhasil didaftarkan: ${cleanEmail}`);

    return c.json({
      success: true,
      message: 'Pendaftaran akun sosial berhasil tersimpan di database.',
      data: result.rows[0],
    }, 201);
  } catch (err) {
    console.error('[AUTH ERROR /social]:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});
