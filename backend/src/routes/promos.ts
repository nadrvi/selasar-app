import { Hono } from 'hono';
import { query } from '../config/db.ts';
import { logServerError } from '../utils/errors.ts';

export const promosRouter = new Hono();

// GET /api/promos - Active banners and promos
promosRouter.get('/', async (c) => {
  try {
    const sql = `
      SELECT 
        pr.*,
        p.name AS place_name,
        p.slug AS place_slug
      FROM promos pr
      LEFT JOIN places p ON p.id = pr.place_id
      WHERE pr.is_active = TRUE
        AND pr.valid_from <= NOW()
        AND (pr.valid_until IS NULL OR pr.valid_until > NOW())
      ORDER BY pr.sort_order ASC, pr.created_at DESC
    `;

    const result = await query(sql);

    return c.json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    logServerError('promos.list.error', err);
    return c.json({ success: false, message: 'Gagal memuat promosi.' }, 500);
  }
});
