import { Hono } from 'hono';
import { query, withTransaction } from '../config/db.js';

export const reviewsRouter = new Hono();

// GET /api/reviews/place/:placeId - Get all reviews & community metrics for a place
reviewsRouter.get('/place/:placeId', async (c) => {
  try {
    const placeId = Number(c.req.param('placeId'));
    const { sort = 'latest', limit = '50', offset = '0' } = c.req.query();
    const pageSize = Number(limit);
    const pageOffset = Number(offset);

    if (!Number.isSafeInteger(placeId) || placeId < 1) {
      return c.json({ success: false, message: 'ID tempat tidak valid.' }, 400);
    }
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
    if (!['latest', 'highest', 'lowest', 'helpful'].includes(sort)) {
      return c.json({ success: false, message: 'Urutan ulasan tidak valid.' }, 400);
    }

    let order = 'r.created_at DESC, r.id DESC';
    if (sort === 'highest') order = 'r.rating DESC, r.created_at DESC, r.id DESC';
    if (sort === 'lowest') order = 'r.rating ASC, r.created_at DESC, r.id DESC';
    if (sort === 'helpful') order = 'r.helpful_count DESC, r.created_at DESC, r.id DESC';

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
      LIMIT $2 OFFSET $3
    `;

    const [reviewsRes, summaryRes, insightsRes, tagsRes, tipsRes] = await Promise.all([
      query(sql, [placeId, pageSize, pageOffset]),
      query('SELECT * FROM v_place_review_summary WHERE place_id = $1', [placeId]),
      query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE
            (plug_score IN ('abundant', 'sufficient') OR COALESCE(rating_plug, 0) >= 4)
            AND (wifi_quality IN ('super_fast', 'good') OR COALESCE(rating_wifi, 0) >= 4)
          ) AS wfc_positive_count,
          COUNT(*) FILTER (WHERE noise_level = 'quiet') AS noise_quiet,
          COUNT(*) FILTER (WHERE noise_level = 'moderate') AS noise_moderate,
          COUNT(*) FILTER (WHERE noise_level = 'lively') AS noise_lively,
          COUNT(*) FILTER (WHERE plug_score = 'abundant') AS plug_abundant,
          COUNT(*) FILTER (WHERE plug_score = 'sufficient') AS plug_sufficient,
          COUNT(*) FILTER (WHERE plug_score = 'limited') AS plug_limited,
          COUNT(*) FILTER (WHERE wifi_quality = 'super_fast') AS wifi_super_fast,
          COUNT(*) FILTER (WHERE wifi_quality = 'good') AS wifi_good,
          COUNT(*) FILTER (WHERE wifi_quality = 'slow') AS wifi_slow,
          COUNT(*) FILTER (WHERE seat_comfort = 'ergonomic') AS seat_ergonomic,
          COUNT(*) FILTER (WHERE seat_comfort = 'standard') AS seat_standard,
          COUNT(*) FILTER (WHERE seat_comfort = 'stool') AS seat_stool,
          COALESCE((
            SELECT jsonb_object_agg(visit_purpose, purpose_count)
            FROM (
              SELECT visit_purpose, COUNT(*) AS purpose_count
              FROM reviews
              WHERE place_id = $1 AND status = 'active' AND visit_purpose IS NOT NULL
              GROUP BY visit_purpose
            ) purposes
          ), '{}'::jsonb) AS purpose_breakdown
        FROM reviews
        WHERE place_id = $1 AND status = 'active'
      `, [placeId]),
      query(`
        SELECT tags.tag, COUNT(*) AS count
        FROM reviews r
        CROSS JOIN LATERAL unnest(r.safety_tags) AS tags(tag)
        WHERE r.place_id = $1 AND r.status = 'active'
        GROUP BY tags.tag
        ORDER BY count DESC
        LIMIT 10
      `, [placeId]),
      query(`
        SELECT r.id, COALESCE(u.display_name, u.username, 'Selasar Member') AS author,
               u.avatar_url, r.secret_tip AS tip, r.created_at
        FROM reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.place_id = $1 AND r.status = 'active'
          AND r.secret_tip IS NOT NULL AND LENGTH(BTRIM(r.secret_tip)) > 5
        ORDER BY r.created_at DESC
        LIMIT 5
      `, [placeId]),
    ]);

    const reviews = reviewsRes.rows || [];
    const totalCount = Number(summaryRes.rows[0]?.total_reviews || 0);

    // Check which reviews the requester found helpful
    let helpfulSet = new Set();
    const currentUser = c.get('authUser');
    if (currentUser && reviews.length > 0) {
      const helpfulRes = await query(
        'SELECT review_id FROM review_helpful WHERE user_id = $1 AND review_id = ANY($2::uuid[])',
        [currentUser.id, reviews.map((r) => r.id)]
      );
      helpfulSet = new Set(helpfulRes.rows.map((row) => row.review_id));
    }

    const formattedReviews = reviews.map((r) => ({
      ...r,
      is_helpful_by_me: helpfulSet.has(r.id),
      safety_tags: Array.isArray(r.safety_tags) ? r.safety_tags : [],
    }));

    // Keep aggregate insights independent of the current review page.
    const insightRow = insightsRes.rows[0] || {};
    let communityInsights = {
      wfc_score_pct: Number(insightRow.total)
        ? Math.round((Number(insightRow.wfc_positive_count) / Number(insightRow.total)) * 100)
        : 0,
      noise_breakdown: {
        quiet: Number(insightRow.noise_quiet || 0),
        moderate: Number(insightRow.noise_moderate || 0),
        lively: Number(insightRow.noise_lively || 0),
      },
      plug_breakdown: {
        abundant: Number(insightRow.plug_abundant || 0),
        sufficient: Number(insightRow.plug_sufficient || 0),
        limited: Number(insightRow.plug_limited || 0),
      },
      wifi_breakdown: {
        super_fast: Number(insightRow.wifi_super_fast || 0),
        good: Number(insightRow.wifi_good || 0),
        slow: Number(insightRow.wifi_slow || 0),
      },
      seat_breakdown: {
        ergonomic: Number(insightRow.seat_ergonomic || 0),
        standard: Number(insightRow.seat_standard || 0),
        stool: Number(insightRow.seat_stool || 0),
      },
      purpose_breakdown: insightRow.purpose_breakdown || {},
      top_safety_tags: tagsRes.rows.map((row) => ({
        tag: row.tag,
        count: Number(row.count),
        percentage: Number(insightRow.total)
          ? Math.round((Number(row.count) / Number(insightRow.total)) * 100)
          : 0,
      })),
      featured_secret_tips: tipsRes.rows,
    };

    return c.json({
      success: true,
      summary: summaryRes.rows[0] || null,
      community_insights: communityInsights,
      total: totalCount,
      limit: pageSize,
      offset: pageOffset,
      has_more: pageOffset + reviews.length < totalCount,
      data: formattedReviews,
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return c.json({ success: false, message: 'Gagal memuat ulasan.' }, 500);
  }
});

// POST /api/reviews - Add or update a community review
reviewsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return c.json({ success: false, message: 'Data ulasan tidak valid.' }, 400);
    }

    const {
      place_id: rawPlaceId,
      rating: rawRating,
      rating_wifi,
      rating_ambience,
      rating_plug,
      rating_price,
      body: rawReviewBody,
      visit_date,
      images,
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

    const placeId = Number(rawPlaceId);
    const numRating = Number(rawRating);
    const user = c.get('authUser');
    if (!Number.isSafeInteger(placeId) || placeId < 1 || placeId > 2147483647 || !user) {
      return c.json({ success: false, message: 'Tempat atau pengguna tidak valid.' }, 400);
    }
    const userId = user.id;

    const optionalRatings = [rating_wifi, rating_ambience, rating_plug, rating_price].map((value) => {
      if (value === undefined || value === null || value === '') return null;
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : NaN;
    });
    const [ratingWifi, ratingAmbience, ratingPlug, ratingPrice] = optionalRatings;
    const textFieldsAreValid =
      (rawReviewBody === undefined || rawReviewBody === null || typeof rawReviewBody === 'string') &&
      (secret_tip === undefined || secret_tip === null || typeof secret_tip === 'string');
    const reviewBody = typeof rawReviewBody === 'string' ? rawReviewBody.trim() : null;
    const secretTip = typeof secret_tip === 'string' ? secret_tip.trim() : null;
    const enumValues = {
      visit_purpose: ['wfc', 'nugas', 'me_time', 'meeting', 'hangout'],
      noise_level: ['quiet', 'moderate', 'lively'],
      plug_score: ['abundant', 'sufficient', 'limited'],
      wifi_quality: ['super_fast', 'good', 'slow'],
      seat_comfort: ['ergonomic', 'standard', 'stool'],
      visit_time: ['morning', 'afternoon', 'evening', 'night'],
      spent_per_person: ['<25k', '25k-50k', '50k-100k', '>100k'],
    };
    const submittedEnums = { visit_purpose, noise_level, plug_score, wifi_quality, seat_comfort, visit_time, spent_per_person };
    const enumsAreValid = Object.entries(submittedEnums).every(([field, value]) =>
      value === undefined || value === null || value === '' || enumValues[field].includes(value)
    );
    const allowedTags = [
      'zoom_friendly', 'solo_friendly', 'clean_restroom', 'musholla_ready',
      'indoor_ac_smokefree', 'safe_parking', 'bright_lighting', 'power_backup',
    ];
    const tagsAreValid =
      Array.isArray(safety_tags) &&
      safety_tags.length <= allowedTags.length &&
      safety_tags.every((tag) => typeof tag === 'string' && allowedTags.includes(tag));
    const imagesAreValid =
      images === undefined ||
      (Array.isArray(images) &&
        images.length <= 8 &&
        images.every((image) => {
          if (typeof image !== 'string' || image.length > 2048) return false;
          try {
            return new URL(image).protocol === 'https:';
          } catch {
            return false;
          }
        }));
    const visitDateIsValid =
      visit_date === undefined ||
      visit_date === null ||
      visit_date === '' ||
      (typeof visit_date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(visit_date) &&
        !Number.isNaN(Date.parse(`${visit_date}T00:00:00Z`)) &&
        new Date(`${visit_date}T00:00:00Z`).toISOString().slice(0, 10) === visit_date);

    if (
      !Number.isInteger(numRating) ||
      numRating < 1 ||
      numRating > 5 ||
      optionalRatings.some(Number.isNaN) ||
      !textFieldsAreValid ||
      (reviewBody && reviewBody.length > 500) ||
      (secretTip && secretTip.length > 160) ||
      !enumsAreValid ||
      !tagsAreValid ||
      !imagesAreValid ||
      !visitDateIsValid
    ) {
      return c.json({ success: false, message: 'Data ulasan tidak valid atau melebihi batas.' }, 400);
    }

    const sanitizedTags = [...new Set(safety_tags)];

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

    const result = await withTransaction(async (tx) => {
      const placeRes = await tx('SELECT id FROM places WHERE id = $1', [placeId]);
      if (placeRes.rows.length === 0) return { placeMissing: true };

      const reviewRes = await tx(upsertSql, [
        placeId,
        userId,
        numRating,
        ratingWifi,
        ratingAmbience,
        ratingPlug,
        ratingPrice,
        reviewBody || null,
        visit_date || null,
        visit_purpose || null,
        noise_level || null,
        plug_score || null,
        wifi_quality || null,
        seat_comfort || null,
        sanitizedTags,
        secretTip || null,
        visit_time || null,
        spent_per_person || null,
      ]);
      const review = reviewRes.rows[0];

      if (images !== undefined) {
        await tx('DELETE FROM review_images WHERE review_id = $1', [review.id]);
        for (const imageUrl of images) {
          await tx('INSERT INTO review_images (review_id, url) VALUES ($1, $2)', [review.id, imageUrl]);
        }
      }

      await tx(`
        INSERT INTO user_badges (user_id, badge_id)
        SELECT $1, id FROM badges WHERE code = 'first_review'
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]);

      return { review };
    });

    if (result.placeMissing) {
      return c.json({ success: false, message: 'Tempat tidak ditemukan.' }, 404);
    }

    return c.json({ 
      success: true, 
      message: 'Ulasan komunitas berhasil disimpan!', 
      data: result.review
    }, 201);
  } catch (err) {
    console.error('Error posting review:', err);
    return c.json({ success: false, message: 'Gagal menyimpan ulasan.' }, 500);
  }
});

// POST /api/reviews/:id/helpful - Toggle helpful vote
reviewsRouter.post('/:id/helpful', async (c) => {
  try {
    const reviewId = c.req.param('id');
    const user = c.get('authUser');
    if (!user) return c.json({ success: false, message: 'Autentikasi diperlukan.' }, 401);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewId)) {
      return c.json({ success: false, message: 'ID ulasan tidak valid.' }, 400);
    }

    const result = await withTransaction(async (tx) => {
      const reviewRes = await tx(
        "SELECT id FROM reviews WHERE id = $1 AND status = 'active' FOR UPDATE",
        [reviewId]
      );
      if (reviewRes.rows.length === 0) return { reviewMissing: true };

      const existingVote = await tx(
        'SELECT 1 FROM review_helpful WHERE review_id = $1 AND user_id = $2',
        [reviewId, user.id]
      );
      const isHelpful = existingVote.rows.length === 0;
      if (isHelpful) {
        await tx('INSERT INTO review_helpful (review_id, user_id) VALUES ($1, $2)', [reviewId, user.id]);
      } else {
        await tx('DELETE FROM review_helpful WHERE review_id = $1 AND user_id = $2', [reviewId, user.id]);
      }

      const countRes = await tx('SELECT helpful_count FROM reviews WHERE id = $1', [reviewId]);
      return { isHelpful, helpfulCount: countRes.rows[0]?.helpful_count || 0 };
    });

    if (result.reviewMissing) {
      return c.json({ success: false, message: 'Ulasan tidak ditemukan.' }, 404);
    }

    return c.json({ 
      success: true,
      isHelpful: result.isHelpful,
      helpful_count: result.helpfulCount,
    });
  } catch (err) {
    console.error('Error toggling review helpful vote:', err);
    return c.json({ success: false, message: 'Gagal memperbarui ulasan.' }, 500);
  }
});
