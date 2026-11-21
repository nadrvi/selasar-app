import { Hono } from 'hono';
import { query } from '../config/db.js';

export const placesRouter = new Hono();

export const DEFAULT_PLACE_IMAGE = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80';

/**
 * Format database row to be 100% compatible with Selasar React Frontend
 */
export const formatPlaceForClient = (p) => {
  const images = Array.isArray(p.images) ? p.images : [];
  const primaryImg = p.image_url || images.find((img) => img.is_primary)?.url || images[0]?.url || DEFAULT_PLACE_IMAGE;

  return {
    // Frontend camelCase properties
    id: p.id,
    name: p.name,
    city: p.city,
    category: p.category,
    lat: p.lat == null ? null : Number(p.lat),
    lng: p.lng == null ? null : Number(p.lng),
    address: p.address,
    distance: p.distance_desc,
    match: p.match_score == null ? null : Number(p.match_score),
    image: primaryImg,
    noiseLevel: p.noise_level,
    wifiStatus: p.wifi_description || (p.wifi_speed_mbps == null ? null : `${p.wifi_speed_mbps} Mbps`),
    colokanProbability: p.plug_probability_pct == null ? null : `${p.plug_probability_pct}%`,
    visitors: p.current_visitors == null ? null : Number(p.current_visitors),
    mood: p.mood,
    overthinkingStatus: p.overthinking_status,
    specs: {
      plug: p.plug_availability,
      wifi: p.wifi_description,
      capacity: p.capacity_desc,
    },
    description: p.description,

    // Relational & metrics properties
    slug: p.slug,
    avg_rating: p.avg_rating == null ? null : Number(p.avg_rating),
    price_min: p.price_min,
    price_max: p.price_max,
    total_reviews: p.total_reviews ?? null,
    total_bookmarks: p.total_bookmarks ?? null,
    view_count: p.view_count ?? null,
    open_hour: p.open_hour == null ? null : String(p.open_hour).slice(0, 5),
    close_hour: p.close_hour == null ? null : String(p.close_hour).slice(0, 5),
    is_open_24h: p.is_open_24h ?? null,
    images: images,
    tags: Array.isArray(p.tags) ? p.tags : [],
    hours: Array.isArray(p.hours) ? p.hours : [],
  };
};

// GET /api/places - Get places with filter & search
placesRouter.get('/', async (c) => {
  try {
    const { city, category, mood, q, sort, limit = 50, offset = 0 } = c.req.query();
    const pageSize = Number(limit);
    const pageOffset = Number(offset);

    if (
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100 ||
      !Number.isSafeInteger(pageOffset) ||
      pageOffset < 0 ||
      pageOffset > 10000
    ) {
      return c.json({ success: false, message: 'Parameter pagination tidak valid.' }, 400);
    }
    if (q && q.length > 120) {
      return c.json({ success: false, message: 'Kata pencarian terlalu panjang.' }, 400);
    }

    let sql = `
      SELECT 
        p.*,
        c.name AS city,
        c.province,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', pi.id, 'url', pi.url, 'is_primary', pi.is_primary, 'caption', pi.caption)
          ) FILTER (WHERE pi.id IS NOT NULL), '[]'
        ) AS images,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color_hex)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM places p
      LEFT JOIN cities c ON c.id = p.city_id
      LEFT JOIN place_images pi ON pi.place_id = p.id
      LEFT JOIN place_tags pt ON pt.place_id = p.id
      LEFT JOIN tags t ON t.id = pt.tag_id
      WHERE p.is_active = TRUE
    `;

    const params = [];

    if (city && city !== 'Show Everything') {
      params.push(city);
      sql += ` AND c.name ILIKE $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND p.category = $${params.length}::place_category`;
    }

    if (mood) {
      params.push(mood);
      sql += ` AND p.mood = $${params.length}::mood_type`;
    }

    if (q?.trim()) {
      params.push(`%${q.trim()}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.address ILIKE $${params.length})`;
    }

    sql += ` GROUP BY p.id, c.name, c.province`;

    // Sorting
    if (sort === 'rating') {
      sql += ` ORDER BY p.avg_rating DESC, p.total_reviews DESC`;
    } else if (sort === 'popular') {
      sql += ` ORDER BY p.current_visitors DESC, p.total_bookmarks DESC`;
    } else if (sort === 'match') {
      sql += ` ORDER BY p.match_score DESC`;
    } else {
      sql += ` ORDER BY p.id ASC`;
    }

    params.push(pageSize);
    sql += ` LIMIT $${params.length}`;

    params.push(pageOffset);
    sql += ` OFFSET $${params.length}`;

    const result = await query(sql, params);

    const places = result.rows.map(formatPlaceForClient);

    return c.json({
      success: true,
      total: places.length,
      data: places,
    });
  } catch (err) {
    console.error('Error fetching places:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/places/popular - Get top popular places from view
placesRouter.get('/popular', async (c) => {
  try {
    const result = await query('SELECT * FROM v_popular_places LIMIT 10');
    return c.json({ success: true, data: result.rows });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/places/:id - Detail of a single place
placesRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const isNum = !isNaN(Number(id));

    const sql = `
      SELECT 
        p.*,
        c.name AS city,
        c.province,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', pi.id, 'url', pi.url, 'caption', pi.caption, 'is_primary', pi.is_primary)
          ) FILTER (WHERE pi.id IS NOT NULL), '[]'
        ) AS images,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color_hex)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('day', ph.day_of_week, 'open', ph.open_time, 'close', ph.close_time, 'closed', ph.is_closed)
          ) FILTER (WHERE ph.id IS NOT NULL), '[]'
        ) AS hours
      FROM places p
      LEFT JOIN cities c ON c.id = p.city_id
      LEFT JOIN place_images pi ON pi.place_id = p.id
      LEFT JOIN place_tags pt ON pt.place_id = p.id
      LEFT JOIN tags t ON t.id = pt.tag_id
      LEFT JOIN place_hours ph ON ph.place_id = p.id
      WHERE ${isNum ? 'p.id = $1' : 'p.slug = $1'}
      GROUP BY p.id, c.name, c.province
    `;

    const result = await query(sql, [isNum ? Number(id) : id]);

    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'Spot tidak ditemukan' }, 404);
    }

    // Increment view counter async
    query('UPDATE places SET view_count = view_count + 1 WHERE id = $1', [result.rows[0].id]).catch(() => {});

    const formatted = formatPlaceForClient(result.rows[0]);

    return c.json({ success: true, data: formatted });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
