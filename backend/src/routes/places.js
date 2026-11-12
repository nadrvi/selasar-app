import { Hono } from 'hono';
import { query } from '../config/db.js';

export const placesRouter = new Hono();

/**
 * Format database row to be 100% compatible with Selasar React Frontend
 */
export const formatPlaceForClient = (p) => {
  const images = Array.isArray(p.images) ? p.images : [];
  const primaryImg = p.image_url || images.find((img) => img.is_primary)?.url || images[0]?.url || '';

  return {
    // Frontend camelCase properties
    id: p.id,
    name: p.name,
    city: p.city || 'Jakarta',
    category: p.category,
    lat: p.lat ? Number(p.lat) : 0,
    lng: p.lng ? Number(p.lng) : 0,
    address: p.address,
    distance: p.distance_desc || '500 m',
    match: p.match_score || 85,
    image: primaryImg,
    noiseLevel: p.noise_level,
    wifiStatus: p.wifi_description || `${p.wifi_speed_mbps || 30} Mbps`,
    colokanProbability: p.plug_probability_pct ? `${p.plug_probability_pct}%` : '80%',
    visitors: p.current_visitors || 0,
    mood: p.mood,
    overthinkingStatus: p.overthinking_status || 'Aman buat fokus',
    specs: {
      plug: p.plug_availability || 'Tersedia colokan di sudut ruangan',
      wifi: p.wifi_description || 'Cepat & Stabil',
      capacity: p.capacity_desc || '2-4 orang',
    },
    description: p.description || '',

    // Relational & metrics properties
    slug: p.slug,
    avg_rating: p.avg_rating ? Number(p.avg_rating) : 0,
    total_reviews: p.total_reviews || 0,
    total_bookmarks: p.total_bookmarks || 0,
    view_count: p.view_count || 0,
    open_hour: p.open_hour || '08:00',
    close_hour: p.close_hour || '22:00',
    is_open_24h: p.is_open_24h || false,
    images: images,
    tags: Array.isArray(p.tags) ? p.tags : [],
    hours: Array.isArray(p.hours) ? p.hours : [],
  };
};

// GET /api/places - Get places with filter & search
placesRouter.get('/', async (c) => {
  try {
    const { city, category, mood, q, sort, limit = 50, offset = 0 } = c.req.query();

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

    if (q) {
      params.push(`%${q}%`);
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

    params.push(parseInt(limit, 10));
    sql += ` LIMIT $${params.length}`;

    params.push(parseInt(offset, 10));
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
