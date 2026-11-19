import process from 'node:process';
import { pool, query } from '../config/db.js';

async function clearLegacyPasswordHashes() {
  try {
    const result = await query(`
      UPDATE users
      SET password_hash = NULL,
          updated_at = NOW()
      WHERE password_hash IS NOT NULL
    `);
    console.info(`[MIGRATION] Cleared ${result.rowCount} legacy password hash(es).`);
  } catch (error) {
    console.error(JSON.stringify({
      event: 'migration.clear_legacy_password_hashes.failed',
      code: error.code || 'UNKNOWN',
    }));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await clearLegacyPasswordHashes();
