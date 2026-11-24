import process from 'node:process';
import { pool, query } from '../config/db.ts';
import { getErrorCode } from '../utils/errors.ts';

async function secureSeedAccounts() {
  try {
    const result = await query(`
      UPDATE users
      SET password_hash = NULL,
          role = CASE
            WHEN email = 'admin@selasar.app' THEN 'user'::user_role
            ELSE role
          END,
          updated_at = NOW()
      WHERE (id = $1 AND email = $2)
         OR (id = $3 AND email = $4)
    `, [
      'add45705-9bb1-496b-9737-483012cf3b98',
      'demo@selasar.app',
      '07b22f71-1856-42d2-9073-d1c1ddb2556a',
      'admin@selasar.app',
    ]);
    console.info(`[MIGRATION] Disabled ${result.rowCount} seeded account(s).`);
  } catch (error) {
    console.error(JSON.stringify({
      event: 'migration.secure_seed_accounts.failed',
      code: getErrorCode(error),
    }));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await secureSeedAccounts();
