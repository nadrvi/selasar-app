import { query, pool } from '../config/db.ts';

async function seedPlaceHours() {
  try {
    const places = await query('SELECT id, open_hour, close_hour FROM places');
    for (const p of places.rows) {
      for (let day = 0; day <= 6; day++) {
        const sql = `
          INSERT INTO place_hours (place_id, day_of_week, open_time, close_time, is_closed)
          VALUES ($1, $2, $3, $4, FALSE)
          ON CONFLICT (place_id, day_of_week) DO UPDATE 
          SET open_time = EXCLUDED.open_time, close_time = EXCLUDED.close_time
        `;
        await query(sql, [p.id, day, p.open_hour || '08:00:00', p.close_hour || '22:00:00']);
      }
    }
    const count = await query('SELECT count(*) FROM place_hours');
    console.log('[SEED] place_hours count successfully updated to:', count.rows[0].count);
    process.exit(0);
  } catch (err) {
    console.error('[SEED ERROR]:', err);
    process.exit(1);
  }
}

seedPlaceHours();
