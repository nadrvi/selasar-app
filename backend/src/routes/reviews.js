import { Hono } from 'hono';
import { query } from '../config/db.js';

export const reviewsRouter = new Hono();

// Helper to resolve user ID from user_id, firebase_uid, or email
async function resolveUserId({ user_id, firebase_uid, email }) {
  if (user_id) {
    const res = await query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (res.rows.length > 0) return res.rows[0].id;
  }
  if (firebase_uid) {
    const res = await query('SELECT id FROM users WHERE firebase_uid = $1 OR id::text = $1', [firebase_uid]);
    if (res.rows.length > 0) return res.rows[0].id;
  }
  if (email) {
    const res = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (res.rows.length > 0) return res.rows[0].id;
  }
  return null;
}

// GET /api/reviews/place/:placeId - Get all reviews & community metrics for a place
reviewsRouter.get('/place/:placeId', async (c) => {
  try {
    const placeId = c.req.param('placeId');
    const { sort = 'latest', user_id, firebase_uid } = c.req.query();

    let order = 'r.created_at DESC';
    if (sort === 'highest') order = 'r.rating DESC';
    if (sort === 'lowest') order = 'r.rating ASC';
    if (sort === 'helpful') order = 'r.helpful_count DESC';

    const sql = `
      SELECT 
        r.*,
        u.username,
        u.display_name,
        u.avatar_url,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', ri.id, 'url', ri.url)
          ) FILTER (WHERE ri.id IS NOT NULL), '[]'
        ) AS images,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', rep.id, 'body', rep.body, 'created_at', rep.created_at)
          ) FILTER (WHERE rep.id IS NOT NULL), '[]'
        ) AS replies
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN review_images ri ON ri.review_id = r.id
      LEFT JOIN review_replies rep ON rep.review_id = r.id
      WHERE r.place_id = $1 AND r.status = 'active'
      GROUP BY r.id, u.id
      ORDER BY ${order}
    `;

    const [reviewsRes, summaryRes] = await Promise.all([
      query(sql, [placeId]),
      query('SELECT * FROM v_place_review_summary WHERE place_id = $1', [placeId]),
    ]);

    const reviews = reviewsRes.rows || [];
    const totalCount = reviews.length;

    // Check which reviews the requester found helpful
    let helpfulSet = new Set();
    const currentUserId = await resolveUserId({ user_id, firebase_uid });
    if (currentUserId && reviews.length > 0) {
      const helpfulRes = await query(
        'SELECT review_id FROM review_helpful WHERE user_id = $1 AND review_id = ANY($2::uuid[])',
        [currentUserId, reviews.map((r) => r.id)]
      );
      helpfulSet = new Set(helpfulRes.rows.map((row) => row.review_id));
    }

    const formattedReviews = reviews.map((r) => ({
      ...r,
      is_helpful_by_me: helpfulSet.has(r.id),
      safety_tags: Array.isArray(r.safety_tags) ? r.safety_tags : [],
    }));

    // Calculate dynamic Community Insights
    let communityInsights = {
      wfc_score_pct: 0,
      noise_breakdown: { quiet: 0, moderate: 0, lively: 0 },
      plug_breakdown: { abundant: 0, sufficient: 0, limited: 0 },
      wifi_breakdown: { super_fast: 0, good: 0, slow: 0 },
      seat_breakdown: { ergonomic: 0, standard: 0, stool: 0 },
      purpose_breakdown: {},
      top_safety_tags: [],
      featured_secret_tips: [],
    };

    if (totalCount > 0) {
      let wfcPositiveCount = 0;
      const tagCountMap = {};

      formattedReviews.forEach((rev) => {
        // Noise
        if (rev.noise_level && communityInsights.noise_breakdown[rev.noise_level] !== undefined) {
          communityInsights.noise_breakdown[rev.noise_level]++;
        }
        // Plugs
        if (rev.plug_score && communityInsights.plug_breakdown[rev.plug_score] !== undefined) {
          communityInsights.plug_breakdown[rev.plug_score]++;
        }
        // WiFi
        if (rev.wifi_quality && communityInsights.wifi_breakdown[rev.wifi_quality] !== undefined) {
          communityInsights.wifi_breakdown[rev.wifi_quality]++;
        }
        // Seat
        if (rev.seat_comfort && communityInsights.seat_breakdown[rev.seat_comfort] !== undefined) {
          communityInsights.seat_breakdown[rev.seat_comfort]++;
        }
        // Purpose
        if (rev.visit_purpose) {
          communityInsights.purpose_breakdown[rev.visit_purpose] =
            (communityInsights.purpose_breakdown[rev.visit_purpose] || 0) + 1;
        }
        // WFC friendliness score
        if (
          (rev.plug_score === 'abundant' || rev.plug_score === 'sufficient' || Number(rev.rating_plug) >= 4) &&
          (rev.wifi_quality === 'super_fast' || rev.wifi_quality === 'good' || Number(rev.rating_wifi) >= 4)
        ) {
          wfcPositiveCount++;
        }
        // Safety tags
        if (Array.isArray(rev.safety_tags)) {
          rev.safety_tags.forEach((tag) => {
            tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
          });
        }
        // Secret tips
        if (rev.secret_tip && rev.secret_tip.trim().length > 5) {
          communityInsights.featured_secret_tips.push({
            id: rev.id,
            author: rev.display_name || rev.username || 'Selasar Member',
            avatar_url: rev.avatar_url,
            tip: rev.secret_tip.trim(),
            created_at: rev.created_at,
          });
        }
      });

      communityInsights.wfc_score_pct = Math.round((wfcPositiveCount / totalCount) * 100);

      // Convert tag map to sorted array with percentages
      communityInsights.top_safety_tags = Object.entries(tagCountMap)
        .map(([tag, count]) => ({
          tag,
          count,
          percentage: Math.round((count / totalCount) * 100),
        }))
        .sort((a, b) => b.count - a.count);
    }

    return c.json({
      success: true,
      summary: summaryRes.rows[0] || null,
      community_insights: communityInsights,
      total: totalCount,
      data: formattedReviews,
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/reviews - Add or update a community review
reviewsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const {
      place_id,
      user_id,
      firebase_uid,
      email,
      rating,
      rating_wifi,
      rating_ambience,
      rating_plug,
      rating_price,
      body: reviewBody,
      visit_date,
      images = [],
      // Community Review Fields
      visit_purpose,
      noise_level,
      plug_score,
      wifi_quality,
      seat_comfort,
      safety_tags = [],
      secret_tip,
      visit_time,
      spent_per_person,
    } = body;

    const numRating = Number(rating);
    if (!place_id || (!firebase_uid && !user_id && !email) || !numRating || numRating < 1 || numRating > 5) {
      return c.json({ 
        success: false, 
        message: 'place_id, identitas user (user_id/firebase_uid/email), dan rating (1–5) wajib diisi' 
      }, 400);
    }

    // Lookup user by user_id, firebase_uid, or email
    const userId = await resolveUserId({ user_id, firebase_uid, email });
    if (!userId) {
      return c.json({ success: false, message: 'User belum terdaftar di database Selasar' }, 404);
    }

    // Ensure safety_tags is an array of strings
    const sanitizedTags = Array.isArray(safety_tags)
      ? safety_tags.filter((t) => typeof t === 'string' && t.trim().length > 0)
      : [];

    // Insert or update review (UPSERT on place_id, user_id)
    const upsertSql = `
      INSERT INTO reviews (
        place_id, 
        user_id, 
        rating, 
        rating_wifi, 
        rating_ambience, 
        rating_plug, 
        rating_price, 
        body, 
        visit_date, 
        visit_purpose,
        noise_level,
        plug_score,
        wifi_quality,
        seat_comfort,
        safety_tags,
        secret_tip,
        visit_time,
        spent_per_person,
        status,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'active', NOW()
      )
      ON CONFLICT (place_id, user_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        rating_wifi = EXCLUDED.rating_wifi,
        rating_ambience = EXCLUDED.rating_ambience,
        rating_plug = EXCLUDED.rating_plug,
        rating_price = EXCLUDED.rating_price,
        body = EXCLUDED.body,
        visit_date = EXCLUDED.visit_date,
        visit_purpose = EXCLUDED.visit_purpose,
        noise_level = EXCLUDED.noise_level,
        plug_score = EXCLUDED.plug_score,
        wifi_quality = EXCLUDED.wifi_quality,
        seat_comfort = EXCLUDED.seat_comfort,
        safety_tags = EXCLUDED.safety_tags,
        secret_tip = EXCLUDED.secret_tip,
        visit_time = EXCLUDED.visit_time,
        spent_per_person = EXCLUDED.spent_per_person,
        updated_at = NOW()
      RETURNING *
    `;

    const reviewRes = await query(upsertSql, [
      place_id,
      userId,
      numRating,
      rating_wifi ? Math.min(5, Math.max(1, Number(rating_wifi))) : null,
      rating_ambience ? Math.min(5, Math.max(1, Number(rating_ambience))) : null,
      rating_plug ? Math.min(5, Math.max(1, Number(rating_plug))) : null,
      rating_price ? Math.min(5, Math.max(1, Number(rating_price))) : null,
      reviewBody || null,
      visit_date || null,
      visit_purpose || null,
      noise_level || null,
      plug_score || null,
      wifi_quality || null,
      seat_comfort || null,
      sanitizedTags,
      secret_tip || null,
      visit_time || null,
      spent_per_person || null,
    ]);

    const review = reviewRes.rows[0];

    // Handle photos
    if (Array.isArray(images) && images.length > 0) {
      await query('DELETE FROM review_images WHERE review_id = $1', [review.id]);
      for (const imgUrl of images) {
        if (imgUrl && typeof imgUrl === 'string') {
          await query('INSERT INTO review_images (review_id, url) VALUES ($1, $2)', [review.id, imgUrl]);
        }
      }
    }

    // Auto-award badge 'first_review' jika belum punya
    query(`
      INSERT INTO user_badges (user_id, badge_id)
      SELECT $1, id FROM badges WHERE code = 'first_review'
      ON CONFLICT (user_id, badge_id) DO NOTHING
    `, [userId]).catch(() => {});

    return c.json({ 
      success: true, 
      message: 'Ulasan komunitas berhasil disimpan!', 
      data: review 
    }, 201);
  } catch (err) {
    console.error('Error posting review:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/reviews/:id/helpful - Toggle helpful vote
reviewsRouter.post('/:id/helpful', async (c) => {
  try {
    const reviewId = c.req.param('id');
    const { firebase_uid, user_id, email } = await c.req.json();

    const userId = await resolveUserId({ user_id, firebase_uid, email });
    if (!userId) return c.json({ success: false, message: 'User tidak valid atau belum masuk' }, 401);

    const exist = await query('SELECT 1 FROM review_helpful WHERE review_id = $1 AND user_id = $2', [reviewId, userId]);
    
    let isHelpful = false;
    if (exist.rows.length > 0) {
      await query('DELETE FROM review_helpful WHERE review_id = $1 AND user_id = $2', [reviewId, userId]);
      isHelpful = false;
    } else {
      await query('INSERT INTO review_helpful (review_id, user_id) VALUES ($1, $2)', [reviewId, userId]);
      isHelpful = true;
    }

    const countRes = await query('SELECT helpful_count FROM reviews WHERE id = $1', [reviewId]);

    return c.json({ 
      success: true, 
      isHelpful, 
      helpful_count: countRes.rows[0]?.helpful_count || 0 
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
