import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pastikan membaca file .env dari folder backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fallback juga ke .env di root jika ada
dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[PostgreSQL Warning]: DATABASE_URL belum di-set di backend/.env');
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon / Cloud Postgres
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

/**
 * Execute an SQL query safely with timing & logging
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      const summary = text.trim().replace(/\s+/g, ' ').slice(0, 80);
      console.log(`[SQL ${duration}ms]: ${summary}...`);
    }
    return res;
  } catch (error) {
    console.error('[SQL Execution Error]:', error.message);
    throw error;
  }
};
