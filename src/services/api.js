/**
 * Selasar API Client Service
 * Menghubungkan Frontend React ke Backend Hono.js & PostgreSQL (selasar-db)
 */
import { placesData } from '../data/place.js';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Helper fetch wrapper dengan timeout & JSON parsing
 */
async function fetchAPI(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ============================================================
//  PLACES API
// ============================================================

/**
 * Mengambil daftar tempat dari backend dengan filter & search
 * Fallback otomatis ke placesData lokal jika backend belum berjalan
 */
export async function fetchPlaces(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.city && filters.city !== 'Show Everything') {
      params.append('city', filters.city);
    }
    if (filters.category) params.append('category', filters.category);
    if (filters.mood) params.append('mood', filters.mood);
    if (filters.q) params.append('q', filters.q);
    if (filters.sort) params.append('sort', filters.sort);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchAPI(`/api/places${queryString}`);

    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    return placesData;
  } catch (err) {
    console.warn('[Selasar API] Backend offline/unreachable, menggunakan data lokal:', err.message);
    // Graceful fallback to static placesData
    let data = [...placesData];
    if (filters.city && filters.city !== 'Show Everything') {
      data = data.filter((p) => p.city.toLowerCase() === filters.city.toLowerCase());
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }
    return data;
  }
}

/**
 * Detail satu tempat
 */
export async function fetchPlaceById(id) {
  try {
    const res = await fetchAPI(`/api/places/${id}`);
    if (res.success && res.data) return res.data;
  } catch (err) {
    console.warn('[Selasar API] Fallback ke data lokal:', err.message);
  }
  return placesData.find((p) => String(p.id) === String(id)) || null;
}

/**
 * Top tempat populer
 */
export async function fetchPopularPlaces() {
  try {
    const res = await fetchAPI('/api/places/popular');
    if (res.success && res.data) return res.data;
  } catch {
    return placesData.slice(0, 5);
  }
}

// ============================================================
//  DATABASE AUTHENTICATION API (POSTGRESQL selasar-db)
// ============================================================

/**
 * Pendaftaran akun baru langsung ke database PostgreSQL (selasar-db)
 */
export async function apiRegister({ email, username, password, birthday, display_name }) {
  return await fetchAPI('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password, birthday, display_name }),
  });
}

/**
 * Masuk/Login langsung memvalidasi ke database PostgreSQL (selasar-db)
 */
export async function apiLogin({ email, password }) {
  return await fetchAPI('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Simpan / sinkronkan akun Google/Sosial ke database PostgreSQL (selasar-db)
 */
export async function apiSocialLogin({ firebase_uid, email, display_name, avatar_url }) {
  return await fetchAPI('/api/auth/social', {
    method: 'POST',
    body: JSON.stringify({ firebase_uid, email, display_name, avatar_url }),
  });
}

// ============================================================
//  USERS & AUTH SYNC API
// ============================================================

/**
 * Sinkronisasi akun Firebase ke database Postgres (users table)
 */
export async function syncUserProfile({
  firebase_uid,
  email,
  username,
  display_name,
  avatar_url,
  birthday,
}) {
  if (!firebase_uid || !email) return null;
  try {
    const res = await fetchAPI('/api/users/sync', {
      method: 'POST',
      body: JSON.stringify({
        firebase_uid,
        email,
        username,
        display_name,
        avatar_url,
        birthday,
      }),
    });
    return res.data;
  } catch (err) {
    console.warn('[Selasar API] User sync background warning:', err.message);
    return null;
  }
}

/**
 * Mengambil profil user lengkap (termasuk badges dan counter)
 */
export async function fetchUserProfile(firebaseUid) {
  try {
    const res = await fetchAPI(`/api/users/${firebaseUid}/profile`);
    return res.data || null;
  } catch {
    return null;
  }
}

// ============================================================
//  BOOKMARKS / FAVORITES API
// ============================================================

export async function fetchUserBookmarks(firebaseUid) {
  try {
    const res = await fetchAPI(`/api/bookmarks/${firebaseUid}`);
    return res.data || [];
  } catch {
    return [];
  }
}

export async function toggleBookmarkAPI(firebaseUid, placeId, note = null) {
  try {
    const res = await fetchAPI('/api/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({
        firebase_uid: firebaseUid,
        place_id: placeId,
        note,
      }),
    });
    return res;
  } catch (err) {
    console.warn('[Selasar API] Toggle bookmark error:', err.message);
    return null;
  }
}

// ============================================================
//  REVIEWS API (COMMUNITY REVIEWS)
// ============================================================

export async function fetchPlaceReviews(placeId, sort = 'latest', userIdOrUid = null) {
  try {
    let queryParam = `?sort=${sort}`;
    if (userIdOrUid) {
      queryParam += `&user_id=${encodeURIComponent(userIdOrUid)}&firebase_uid=${encodeURIComponent(userIdOrUid)}`;
    }
    const res = await fetchAPI(`/api/reviews/place/${placeId}${queryParam}`);
    return res;
  } catch (err) {
    return { success: false, data: [], summary: null, community_insights: null };
  }
}

export async function submitPlaceReview(reviewData) {
  return await fetchAPI('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
}

export async function toggleReviewHelpfulAPI(reviewId, userIdOrUid) {
  return await fetchAPI(`/api/reviews/${reviewId}/helpful`, {
    method: 'POST',
    body: JSON.stringify({ 
      user_id: userIdOrUid,
      firebase_uid: userIdOrUid 
    }),
  });
}

// ============================================================
//  CHECK-INS API
// ============================================================

export async function fetchActiveCheckins(placeId) {
  try {
    const res = await fetchAPI(`/api/checkins/place/${placeId}`);
    return res;
  } catch {
    return { success: false, active_visitors: 0, data: [] };
  }
}

export async function checkinToPlace(firebaseUid, placeId, note = '') {
  return await fetchAPI('/api/checkins/in', {
    method: 'POST',
    body: JSON.stringify({
      firebase_uid: firebaseUid,
      place_id: placeId,
      note,
    }),
  });
}

export async function checkoutFromPlace(firebaseUid, placeId) {
  return await fetchAPI('/api/checkins/out', {
    method: 'POST',
    body: JSON.stringify({
      firebase_uid: firebaseUid,
      place_id: placeId,
    }),
  });
}

// ============================================================
//  PROMOS API
// ============================================================

export async function fetchPromos() {
  try {
    const res = await fetchAPI('/api/promos');
    return res.data || [];
  } catch {
    return [];
  }
}

// ============================================================
//  STORAGE (S3 UPLOAD) API
// ============================================================

export async function getPresignedUploadUrl(filename, contentType = 'image/jpeg', folder = 'reviews') {
  return await fetchAPI('/api/storage/presigned-url', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType, folder }),
  });
}
