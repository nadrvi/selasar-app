import { randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { query } from '../config/db.ts';
import {
  firebaseProjectId,
  issueAuthToken,
  verifyAuthToken,
  verifyFirebaseIdToken,
} from '../utils/authTokens.ts';
import type { Context } from 'hono';
import type { FirebaseIdTokenClaims } from '../utils/authTokens.ts';
import { getErrorCode, getErrorConstraint } from '../utils/errors.ts';

export const authRouter = new Hono();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOCIAL_SIGN_IN_PROVIDERS = new Set([
  'google.com',
  'facebook.com',
  'github.com',
]);

function logAuthEvent(c: Context, event: string, details: Record<string, unknown> = {}) {
  console.info(
    JSON.stringify({
      event: `auth.${event}`,
      requestId: c.get('requestId') || null,
      ...details,
    }),
  );
}

function logAuthError(c: Context, route: string, error: unknown) {
  console.error(
    JSON.stringify({
      event: 'auth.error',
      requestId: c.get('requestId') || null,
      route,
      code: getErrorCode(error),
      constraint: getErrorConstraint(error),
    }),
  );
}

async function readBody(c: Context): Promise<Record<string, unknown> | null> {
  try {
    const body = await c.req.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL_PATTERN.test(email);
}

function validDate(value: unknown): value is string | null | undefined {
  if (value == null || value === '') return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function socialProfileValue(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim().slice(0, maxLength)
    : null;
}

function safeAvatarUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

authRouter.post('/register', async (c) => {
  const body = await readBody(c);
  const { id_token: idToken, username, birthday, display_name } = body || {};

  if (
    typeof idToken !== 'string' ||
    idToken.length > 8192 ||
    typeof username !== 'string'
  ) {
    return c.json({
      success: false,
      message: 'Token Firebase atau username tidak valid.',
    }, 400);
  }

  if (!firebaseProjectId) {
    logAuthEvent(c, 'register.unavailable', { reason: 'missing_project_configuration' });
    return c.json({ success: false, message: 'Registrasi sedang tidak tersedia.' }, 503);
  }

  let claims;
  try {
    claims = await verifyFirebaseIdToken(idToken);
  } catch (error) {
    logAuthError(c, '/register/firebase-verification', error);
    return c.json({ success: false, message: 'Verifikasi registrasi sedang tidak tersedia.' }, 503);
  }
  if (
    !claims ||
    claims.firebase?.sign_in_provider !== 'password' ||
    !isValidEmail(claims.email)
  ) {
    logAuthEvent(c, 'register.failed', { reason: 'invalid_firebase_token' });
    return c.json({ success: false, message: 'Token Firebase tidak valid.' }, 401);
  }

  const firebaseUid = claims.sub;
  const cleanEmail = claims.email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
  if (cleanUsername.length < 3 || cleanUsername.length > 24) {
    return c.json({
      success: false,
      message: 'Username harus memiliki panjang antara 3 hingga 24 karakter.',
    }, 400);
  }
  if (!validDate(birthday)) {
    return c.json({ success: false, message: 'Format tanggal lahir tidak valid.' }, 400);
  }
  if (
    display_name != null &&
    (typeof display_name !== 'string' || display_name.trim().length > 100)
  ) {
    return c.json({ success: false, message: 'Nama tampilan tidak valid.' }, 400);
  }

  try {
    const existingRes = await query(
      `SELECT id, firebase_uid, email, is_banned
       FROM users WHERE firebase_uid = $1`,
      [firebaseUid],
    );
    const existing = existingRes.rows[0];
    if (existing?.is_banned) {
      logAuthEvent(c, 'register.failed', { reason: 'banned_user' });
      return c.json({ success: false, message: 'Akun ini sedang ditangguhkan.' }, 403);
    }
    if (existing && existing.email.toLowerCase() !== cleanEmail) {
      logAuthEvent(c, 'register.failed', { reason: 'identity_conflict' });
      return c.json({ success: false, message: 'Akun Firebase tidak dapat ditautkan ke akun ini.' }, 409);
    }

    const result = existing
      ? await query(`
          UPDATE users SET
            username = $1,
            email = $2,
            display_name = $3,
            birthday = $4,
            is_verified = is_verified OR $5,
            updated_at = NOW()
          WHERE firebase_uid = $6
          RETURNING id, username, email, display_name, birthday, role, is_verified, created_at
        `, [
          cleanUsername,
          cleanEmail,
          display_name?.trim() || cleanUsername,
          birthday || null,
          claims.email_verified === true,
          firebaseUid,
        ])
      : await query(`
          INSERT INTO users (
            firebase_uid, username, email, display_name, birthday,
            role, is_verified, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, 'user', $6, NOW(), NOW())
          RETURNING id, username, email, display_name, birthday, role, is_verified, created_at
        `, [
          firebaseUid,
          cleanUsername,
          cleanEmail,
          display_name?.trim() || cleanUsername,
          birthday || null,
          claims.email_verified === true,
        ]);

    logAuthEvent(c, 'register.succeeded', {
      email_verified: claims.email_verified === true,
    });
    return c.json({
      success: true,
      message: 'Registrasi tersimpan. Verifikasi email sebelum masuk.',
      data: result.rows[0],
    }, existing ? 200 : 201);
  } catch (error) {
    if (
      getErrorCode(error) === '23505' &&
      ['idx_users_email_lower', 'users_email_key'].includes(getErrorConstraint(error) || '')
    ) {
      return c.json({
        success: false,
        field: 'email',
        message: 'Email ini sudah terdaftar. Silakan masuk.',
      }, 409);
    }
    if (getErrorCode(error) === '23505' && getErrorConstraint(error) === 'users_firebase_uid_key') {
      logAuthEvent(c, 'register.failed', { reason: 'identity_conflict' });
      return c.json({
        success: false,
        message: 'Akun Firebase sudah terdaftar.',
      }, 409);
    }
    if (
      getErrorCode(error) === '23505' &&
      ['idx_users_username_lower', 'users_username_key'].includes(getErrorConstraint(error) || '')
    ) {
      return c.json({
        success: false,
        field: 'username',
        message: 'Username ini sudah digunakan. Pilih username lain.',
      }, 409);
    }
    logAuthError(c, '/register', error);
    return c.json({ success: false, message: 'Registrasi gagal karena kesalahan server.' }, 500);
  }
});

authRouter.post('/login', async (c) => {
  logAuthEvent(c, 'login.rejected', { reason: 'firebase_auth_required' });
  return c.json({
    success: false,
    message: 'Masuk menggunakan Firebase Auth.',
  }, 410);
});

interface FirebaseSessionOptions {
  allowSocialSignup?: boolean;
  queryFn?: typeof query;
  verifyIdToken?: (token: string) => Promise<Pick<
    FirebaseIdTokenClaims,
    'sub' | 'email' | 'email_verified' | 'name' | 'picture' | 'firebase'
  > | null>;
  issueToken?: (userId: string) => string;
}

export function createFirebaseSessionHandler({
  allowSocialSignup = false,
  queryFn = query,
  verifyIdToken = verifyFirebaseIdToken,
  issueToken = issueAuthToken,
}: FirebaseSessionOptions = {}) {
  return async (c: Context) => {
    const body = await readBody(c);
    const idToken = body?.id_token;
    if (typeof idToken !== 'string' || idToken.length > 8192) {
      return c.json({ success: false, message: 'Token Firebase tidak valid.' }, 401);
    }
    if (!firebaseProjectId) {
      logAuthEvent(c, 'session.unavailable', { reason: 'missing_project_configuration' });
      return c.json({ success: false, message: 'Login sedang tidak tersedia.' }, 503);
    }

    let claims;
    try {
      claims = await verifyIdToken(idToken);
    } catch (error) {
      logAuthError(c, '/session/firebase-verification', error);
      return c.json({ success: false, message: 'Verifikasi login sedang tidak tersedia.' }, 503);
    }
    const email = claims?.email;
    if (!claims || claims.email_verified !== true || !isValidEmail(email)) {
      logAuthEvent(c, 'session.failed', { reason: 'invalid_firebase_token' });
      return c.json({ success: false, message: 'Token Firebase tidak valid.' }, 401);
    }
    const signInProvider = claims.firebase?.sign_in_provider;
    if (
      allowSocialSignup &&
      (typeof signInProvider !== 'string' || !SOCIAL_SIGN_IN_PROVIDERS.has(signInProvider))
    ) {
      logAuthEvent(c, 'social_register.failed', { reason: 'invalid_sign_in_provider' });
      return c.json({ success: false, message: 'Pendaftaran sosial tidak valid.' }, 400);
    }

    const firebaseUid = claims.sub;
    const cleanEmail = email.trim().toLowerCase();
    const displayName = socialProfileValue(claims.name, 100);
    const avatarUrl = safeAvatarUrl(claims.picture);

    try {
      const [uidRes, emailRes] = await Promise.all([
        queryFn(
          `SELECT id, firebase_uid, email, username, display_name, avatar_url,
                  role, is_banned, is_verified, birthday, created_at
           FROM users WHERE firebase_uid = $1`,
          [firebaseUid],
        ),
        queryFn(
          `SELECT id, firebase_uid, email, username, display_name, avatar_url,
                  role, is_banned, is_verified, birthday, created_at
           FROM users WHERE LOWER(email) = $1`,
          [cleanEmail],
        ),
      ]);
      const byUid = uidRes.rows[0];
      const byEmail = emailRes.rows[0];

      if (byUid && byEmail && byUid.id !== byEmail.id) {
        logAuthEvent(c, 'session.failed', { reason: 'identity_conflict' });
        return c.json({ success: false, message: 'Akun tidak dapat ditautkan ke akun ini.' }, 409);
      }

      const existing = byUid || byEmail;
      if (!existing && !allowSocialSignup) {
        logAuthEvent(c, 'session.failed', { reason: 'account_not_found' });
        return c.json({
          success: false,
          message: 'Akun Selasar tidak ditemukan. Silakan daftar terlebih dahulu.',
        }, 403);
      }
      if (existing?.is_banned) {
        logAuthEvent(c, 'session.failed', { reason: 'banned_user' });
        return c.json({ success: false, message: 'Akun ini sedang ditangguhkan.' }, 403);
      }
      if (existing?.firebase_uid && existing.firebase_uid !== firebaseUid) {
        logAuthEvent(c, 'session.failed', { reason: 'identity_conflict' });
        return c.json({ success: false, message: 'Akun tidak dapat ditautkan ke akun ini.' }, 409);
      }

      let user;
      let status: 200 | 201 = 200;
      if (existing) {
        const updateRes = await queryFn(`
          UPDATE users SET
            firebase_uid = $1,
            email = $2,
            password_hash = NULL,
            display_name = COALESCE($3, users.display_name),
            avatar_url = COALESCE(users.avatar_url, $4),
            is_verified = TRUE,
            last_login_at = NOW(),
            updated_at = NOW()
          WHERE id = $5
          RETURNING id, username, email, display_name, avatar_url, role,
                    is_verified, birthday, created_at
        `, [firebaseUid, cleanEmail, displayName, avatarUrl, existing.id]);
        user = updateRes.rows[0];
      } else {
        const base = cleanEmail.split('@')[0]
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 15) || 'user';
        const username = `${base}_${randomBytes(4).toString('hex')}`;
        const insertRes = await queryFn(`
          INSERT INTO users (
            firebase_uid, email, username, display_name, avatar_url,
            is_verified, last_login_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW(), NOW())
          RETURNING id, username, email, display_name, avatar_url, role,
                    is_verified, birthday, created_at
        `, [
          firebaseUid,
          cleanEmail,
          username,
          displayName || username,
          avatarUrl,
        ]);
        user = insertRes.rows[0];
        status = 201;
      }

      const token = issueToken(user.id);
      const tokenClaims = verifyAuthToken(token);
      if (!tokenClaims) {
        throw new Error('Backend session token could not be verified');
      }
      await queryFn(`
        INSERT INTO auth_sessions (jti, user_id, expires_at)
        VALUES ($1, $2, TO_TIMESTAMP($3))
      `, [tokenClaims.jti, user.id, tokenClaims.exp]);
      await queryFn(`
        DELETE FROM auth_sessions
        WHERE expires_at <= NOW()
           OR revoked_at < NOW() - INTERVAL '30 days'
      `);
      logAuthEvent(c, 'session.succeeded');
      return c.json({
        success: true,
        message: 'Login berhasil.',
        token,
        data: user,
      }, status);
    } catch (error) {
      if (getErrorCode(error) === '23505') {
        logAuthEvent(c, 'session.failed', { reason: 'identity_conflict' });
        return c.json({ success: false, message: 'Akun tidak dapat ditautkan ke akun ini.' }, 409);
      }
      logAuthError(c, allowSocialSignup ? '/register/social' : '/session', error);
      return c.json({ success: false, message: 'Login gagal karena kesalahan server.' }, 500);
    }
  };
}

authRouter.post('/session', createFirebaseSessionHandler());
authRouter.post(
  '/register/social',
  createFirebaseSessionHandler({ allowSocialSignup: true }),
);

authRouter.post('/logout', async (c) => {
  const user = c.get('authUser');
  const claims = c.get('authClaims');
  if (!user || !claims) {
    return c.json({ success: false, message: 'Autentikasi diperlukan.' }, 401);
  }

  try {
    await query(
      `UPDATE auth_sessions
       SET revoked_at = NOW()
       WHERE jti = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [claims.jti, user.id],
    );
    return c.json({ success: true, message: 'Sesi berhasil diakhiri.' });
  } catch (error) {
    logAuthError(c, '/logout', error);
    return c.json({ success: false, message: 'Gagal mengakhiri sesi.' }, 500);
  }
});

authRouter.post('/change-password', async (c) => {
  logAuthEvent(c, 'password_change.rejected', { reason: 'firebase_auth_required' });
  return c.json({
    success: false,
    message: 'Perubahan kata sandi dilakukan melalui Firebase Auth.',
  }, 410);
});
