import process from 'node:process';
import { pool } from '../config/db.js';

async function hardenBackend() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        jti CHAR(32) PRIMARY KEY CHECK (jti ~ '^[0-9a-f]{32}$'),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active
      ON auth_sessions(user_id, expires_at) WHERE revoked_at IS NULL
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_rate_limits (
        bucket_key TEXT PRIMARY KEY,
        window_started_at TIMESTAMPTZ NOT NULL,
        request_count INT NOT NULL CHECK (request_count > 0),
        expires_at TIMESTAMPTZ NOT NULL
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_api_rate_limits_expires_at
      ON api_rate_limits(expires_at)
    `);

    await client.query('LOCK TABLE checkins IN ACCESS EXCLUSIVE MODE');
    await client.query(`
      WITH ranked_active_checkins AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY user_id
                 ORDER BY checked_in_at DESC, id DESC
               ) AS position
        FROM checkins
        WHERE status = 'active'
      )
      UPDATE checkins AS ch
      SET status = 'ended',
          checked_out_at = GREATEST(NOW(), ch.checked_in_at),
          duration_min = GREATEST(
            1,
            CEIL(EXTRACT(EPOCH FROM (
              GREATEST(NOW(), ch.checked_in_at) - ch.checked_in_at
            )) / 60)::integer
          )
      FROM ranked_active_checkins AS ranked
      WHERE ch.id = ranked.id AND ranked.position > 1
    `);
    await client.query('DROP INDEX IF EXISTS idx_checkins_one_active');
    await client.query(`
      CREATE UNIQUE INDEX idx_checkins_one_active
      ON checkins(user_id) WHERE status = 'active'
    `);

    await client.query('COMMIT');
    console.info('[MIGRATION] Backend hardening schema applied.');
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackError) => {
      console.error(JSON.stringify({
        event: 'migration.harden_backend.rollback_failed',
        code: rollbackError.code || 'UNKNOWN',
      }));
    });
    console.error(JSON.stringify({
      event: 'migration.harden_backend.failed',
      code: error.code || 'UNKNOWN',
    }));
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

await hardenBackend();
