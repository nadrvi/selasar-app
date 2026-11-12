import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import dotenv from 'dotenv';

import { placesRouter } from './routes/places.js';
import { reviewsRouter } from './routes/reviews.js';
import { bookmarksRouter } from './routes/bookmarks.js';
import { checkinsRouter } from './routes/checkins.js';
import { usersRouter } from './routes/users.js';
import { storageRouter } from './routes/storage.js';
import { promosRouter } from './routes/promos.js';
import { authRouter } from './routes/auth.js';
import { query } from './config/db.js';

dotenv.config();

const app = new Hono();

// Middlewares
app.use('*', logger());

// Robust CORS Configuration (No wildcard origin when credentials are enabled)
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Izinkan localhost port berapapun (5173, 3000, dll.) atau client URL dari env
      if (!origin) return 'http://localhost:5173';
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return origin;
      }
      return process.env.CLIENT_URL || origin;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'online',
    service: 'Selasar REST API',
    framework: 'Hono.js',
    database: 'selasar-db (PostgreSQL / Neon)',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
  });
});

// DB Ping check
app.get('/health/db', async (c) => {
  try {
    const res = await query('SELECT NOW() AS server_time, current_database() AS db_name');
    return c.json({
      status: 'connected',
      database: res.rows[0].db_name,
      time: res.rows[0].server_time,
    });
  } catch (err) {
    return c.json({
      status: 'error',
      message: err.message,
      hint: 'Periksa DATABASE_URL di file selasar-backend/.env',
    }, 500);
  }
});

// GET /api/cities - List all active cities
app.get('/api/cities', async (c) => {
  try {
    const result = await query('SELECT id, name, province, lat, lng FROM cities WHERE is_active = TRUE ORDER BY id ASC');
    return c.json({ success: true, data: result.rows });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/tags - List all available tags
app.get('/api/tags', async (c) => {
  try {
    const result = await query('SELECT id, name, color_hex FROM tags ORDER BY id ASC');
    return c.json({ success: true, data: result.rows });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/badges - List all achievements
app.get('/api/badges', async (c) => {
  try {
    const result = await query('SELECT id, code, name, description, icon_emoji FROM badges ORDER BY id ASC');
    return c.json({ success: true, data: result.rows });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Mount Resource Routes
app.route('/api/auth', authRouter);
app.route('/api/places', placesRouter);
app.route('/api/reviews', reviewsRouter);
app.route('/api/bookmarks', bookmarksRouter);
app.route('/api/checkins', checkinsRouter);
app.route('/api/users', usersRouter);
app.route('/api/storage', storageRouter);
app.route('/api/promos', promosRouter);

// Global 404 Handler
app.notFound((c) => {
  return c.json({ success: false, message: `Route ${c.req.path} tidak ditemukan` }, 404);
});

// Global Error Handler
app.onError((err, c) => {
  console.error('Unhandled server error:', err);
  return c.json({ success: false, message: err.message || 'Terjadi kesalahan pada server' }, 500);
});

const port = Number(process.env.PORT) || 4000;

console.log(`☕ Selasar Backend is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
