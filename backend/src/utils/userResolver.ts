import { query } from '../config/db.ts';
import type { AuthenticatedUser } from '../types.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve user dari berbagai identifier (uid, firebase_uid, user_id UUID, atau email).
 * Mendukung hybrid authentication (Email/Password & Google/Social).
 *
 * @param {string|object} identifier - String id/uid/email ATAU object { user_id, firebase_uid, email, uid }
 * @returns {Promise<object|null>} Objek user (id, username, email, display_name, avatar_url, role)
 */
export interface UserIdentifier {
  uid?: string;
  user_id?: string;
  firebase_uid?: string;
  email?: string;
}

export async function resolveUser(identifier: string | UserIdentifier | null | undefined): Promise<AuthenticatedUser | null> {
  if (!identifier) return null;

  const uid = typeof identifier === 'object'
    ? identifier.uid || identifier.user_id || identifier.firebase_uid || null
    : String(identifier).trim();
  const email = typeof identifier === 'object' ? identifier.email || null : null;

  // 1. Coba lookup via firebase_uid (untuk akun Google / Sosial)
  if (uid) {
    const byFirebase = await query(
      `SELECT id, username, email, display_name, avatar_url, role, is_banned 
       FROM users WHERE firebase_uid = $1`,
      [uid]
    );
    if (byFirebase.rows.length > 0) return byFirebase.rows[0] as AuthenticatedUser;

    // 2. Coba lookup via UUID langsung (untuk akun Email/Password, uid = DB UUID)
    if (UUID_REGEX.test(uid)) {
      const byId = await query(
        `SELECT id, username, email, display_name, avatar_url, role, is_banned 
         FROM users WHERE id = $1`,
        [uid]
      );
      if (byId.rows.length > 0) return byId.rows[0] as AuthenticatedUser;
    }
  }

  // 3. Fallback: Coba lookup via email
  const emailToLookup = email || (uid && uid.includes('@') ? uid : null);
  if (emailToLookup) {
    const byEmail = await query(
      `SELECT id, username, email, display_name, avatar_url, role, is_banned 
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [emailToLookup.trim()]
    );
    if (byEmail.rows.length > 0) return byEmail.rows[0] as AuthenticatedUser;
  }

  return null;
}

/**
 * Hapus data sensitif (password_hash) dari objek user sebelum dikirim ke response client
 */
export function sanitizeUser<T extends Record<string, unknown> | null | undefined>(user: T): T {
  if (!user || typeof user !== 'object') return user;
  const sanitized = { ...user };
  delete sanitized.password_hash;
  return sanitized;
}
