import pg from 'pg';
import dotenv from 'dotenv';
import process from 'node:process';
import path from 'path';
import { fileURLToPath } from 'url';
import type { PoolClient, QueryResultRow } from 'pg';
import { getErrorCode, logServerError } from '../utils/errors.ts';

export type QueryFunction = (
  text: string,
  params?: unknown[],
) => Promise<{ rows: QueryResultRow[]; rowCount?: number | null }>;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pastikan membaca file .env dari folder backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fallback juga ke .env di root jika ada
dotenv.config();

const { Client, Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL must be configured in production');
  }
  console.warn('[PostgreSQL Warning]: DATABASE_URL belum di-set di backend/.env');
}

const databaseSsl = {
  rejectUnauthorized: process.env.NODE_ENV === 'production',
};

export const pool = new Pool({
  connectionString,
  ssl: databaseSsl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error(JSON.stringify({
    event: 'db.pool.error',
    code: getErrorCode(err),
    errorType: err.name || 'Error',
  }));
});

async function runTransaction<T>(
  client: PoolClient | InstanceType<typeof Client>,
  callback: (query: QueryFunction) => Promise<T>,
): Promise<T> {
  let transactionStarted = false;
  try {
    await client.query('BEGIN');
    transactionStarted = true;
    const result = await callback((text, params) =>
      client.query<QueryResultRow, unknown[]>(text, params),
    );
    await client.query('COMMIT');
    return result;
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        logServerError('db.transaction.rollback_error', rollbackError);
      }
    }
    throw error;
  }
}

export async function withTransaction<T>(
  callback: (query: QueryFunction) => Promise<T>,
): Promise<T> {
  if (process.env.SELASAR_WORKER_RUNTIME === 'cloudflare') {
    const client = new Client({
      connectionString,
      ssl: databaseSsl,
    });
    await client.connect();
    try {
      return await runTransaction(client, callback);
    } finally {
      await client.end();
    }
  }

  const client = await pool.connect();
  try {
    return await runTransaction(client, callback);
  } finally {
    client.release();
  }
}

/**
 * Execute an SQL query safely with timing & logging
 */
export const query: QueryFunction = async (text, params) => {
  const start = Date.now();
  try {
    let res;
    if (process.env.SELASAR_WORKER_RUNTIME === 'cloudflare') {
      const client = new Client({
        connectionString,
        ssl: databaseSsl,
      });
      try {
        await client.connect();
        res = await client.query<QueryResultRow, unknown[]>(text, params);
      } finally {
        await client.end();
      }
    } else {
      res = await pool.query<QueryResultRow, unknown[]>(text, params);
    }

    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      const summary = text.trim().replace(/\s+/g, ' ').slice(0, 80);
      console.log(`[SQL ${duration}ms]: ${summary}...`);
    }
    return res;
  } catch (error) {
    logServerError('db.query.error', error);
    throw error;
  }
};
