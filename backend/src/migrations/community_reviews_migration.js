import { query } from '../config/db.js';

async function runMigration() {
  console.log('[MIGRATION] Starting Community Reviews schema migration...');
  try {
    const alterTableSql = `
      ALTER TABLE reviews 
        ADD COLUMN IF NOT EXISTS visit_purpose VARCHAR(50),
        ADD COLUMN IF NOT EXISTS noise_level VARCHAR(30),
        ADD COLUMN IF NOT EXISTS plug_score VARCHAR(30),
        ADD COLUMN IF NOT EXISTS wifi_quality VARCHAR(30),
        ADD COLUMN IF NOT EXISTS seat_comfort VARCHAR(30),
        ADD COLUMN IF NOT EXISTS safety_tags TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS secret_tip TEXT,
        ADD COLUMN IF NOT EXISTS visit_time VARCHAR(30),
        ADD COLUMN IF NOT EXISTS spent_per_person VARCHAR(30);
    `;
    await query(alterTableSql);
    console.log('[MIGRATION] Added community review columns to reviews table successfully.');

    // Index for faster queries on place_id and status
    await query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_place_status ON reviews (place_id, status);
      CREATE INDEX IF NOT EXISTS idx_reviews_visit_purpose ON reviews (visit_purpose);
    `);
    console.log('[MIGRATION] Created indexes on reviews table.');

    // Update view v_place_review_summary to incorporate community aggregates
    await query(`
      CREATE OR REPLACE VIEW v_place_review_summary AS
      SELECT 
        place_id,
        count(*) AS total_reviews,
        round(avg(rating), 2) AS avg_overall,
        round(avg(rating_wifi), 2) AS avg_wifi,
        round(avg(rating_ambience), 2) AS avg_ambience,
        round(avg(rating_plug), 2) AS avg_plug,
        round(avg(rating_price), 2) AS avg_price,
        count(*) FILTER (WHERE rating = 5) AS star_5,
        count(*) FILTER (WHERE rating = 4) AS star_4,
        count(*) FILTER (WHERE rating = 3) AS star_3,
        count(*) FILTER (WHERE rating = 2) AS star_2,
        count(*) FILTER (WHERE rating = 1) AS star_1,
        count(*) FILTER (WHERE visit_purpose = 'wfc') AS count_wfc,
        count(*) FILTER (WHERE visit_purpose = 'nugas') AS count_nugas,
        count(*) FILTER (WHERE visit_purpose = 'me_time') AS count_me_time,
        count(*) FILTER (WHERE noise_level = 'quiet') AS count_quiet,
        count(*) FILTER (WHERE plug_score = 'abundant' OR plug_score = 'sufficient') AS count_good_plug,
        count(*) FILTER (WHERE wifi_quality = 'super_fast' OR wifi_quality = 'good') AS count_good_wifi
      FROM reviews r
      WHERE status = 'active'
      GROUP BY place_id;
    `);
    console.log('[MIGRATION] v_place_review_summary view updated successfully.');

    console.log('[MIGRATION] All migrations finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[MIGRATION ERROR]:', err);
    process.exit(1);
  }
}

runMigration();
