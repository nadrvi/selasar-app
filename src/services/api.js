/**
 * Selasar API Client Service
 * Menghubungkan Frontend React ke Backend Hono.js & PostgreSQL (selasar-db)
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Helper fetch wrapper dengan timeout & JSON parsing
 */
async function fetchAPI(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
  let res;

  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('REQUEST_TIMEOUT: Backend tidak merespons dalam 6 detik', { cause: err });
    }
    throw new Error(`NETWORK_ERROR: ${err.message}`, { cause: err });
  }

  clearTimeout(timeoutId);

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(`HTTP_${res.status}: ${errBody?.message || res.statusText}`);
  }

  try {
    return await res.json();
  } catch (err) {
    throw new Error(
      'INVALID_RESPONSE: Backend mengirim respons JSON yang tidak valid',
      { cause: err },
    );
  }
}

// ============================================================
//  PLACES API
// ============================================================

/**
 * Mengambil daftar tempat dari backend dengan filter & search
 */
export async function fetchPlaces(filters = {}) {
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
  if (!res.success) {
    throw new Error(`API_ERROR: ${res.message || 'Gagal memuat tempat'}`);
  }
  if (!Array.isArray(res.data)) {
    throw new Error('INVALID_RESPONSE: Data tempat dari backend tidak valid');
  }
  return res.data;
}

/**
 * Detail satu tempat
 */
export async function fetchPlaceById(id) {
  const res = await fetchAPI(`/api/places/${id}`);
  if (!res.success) {
    throw new Error(`API_ERROR: ${res.message || 'Gagal memuat detail tempat'}`);
  }
  if (!res.data) {
    throw new Error('INVALID_RESPONSE: Detail tempat dari backend kosong');
  }
  return res.data;
}

/**
 * Top tempat populer
 */
export async function fetchPopularPlaces() {
  const res = await fetchAPI('/api/places/popular');
  if (!res.success) {
    throw new Error(`API_ERROR: ${res.message || 'Gagal memuat tempat populer'}`);
  }
  if (!Array.isArray(res.data)) {
    throw new Error('INVALID_RESPONSE: Data tempat populer dari backend tidak valid');
  }
  return res.data;
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
  const res = await fetchAPI(`/api/users/${firebaseUid}/profile`);
  if (!res.success) {
    throw new Error(`API_ERROR: ${res.message || 'Gagal memuat profil user'}`);
  }
  return res.data;
}

// ============================================================
//  BOOKMARKS / FAVORITES API
// ============================================================

/**
 * Ambil semua bookmark user dari database.
 * uid bisa berupa firebase_uid (Google/sosial) atau DB UUID (email/password).
 */
export async function fetchUserBookmarks(uid) {
  if (!uid) return [];
  const res = await fetchAPI(`/api/bookmarks/${uid}`);
  if (!res.success) {
    throw new Error(`API_ERROR: ${res.message || 'Gagal memuat bookmark'}`);
  }
  if (!Array.isArray(res.data)) {
    throw new Error('INVALID_RESPONSE: Data bookmark dari backend tidak valid');
  }
  return res.data;
}

/**
 * Toggle bookmark on/off untuk sebuah tempat.
 * uid: bisa firebase_uid (Google) ATAU DB UUID (email/password login).
 * Backend sekarang mendukung kedua tipe uid.
 */
export async function toggleBookmarkAPI(uid, placeId, note = null) {
  if (!uid || !placeId) {
    console.warn('[Selasar API] toggleBookmarkAPI: uid dan placeId wajib diisi');
    return null;
  }
  try {
    const res = await fetchAPI('/api/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({
        uid,          // field universal, backend mendeteksi firebase_uid vs UUID
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

/**
 * Cek apakah satu tempat sudah di-bookmark oleh user tertentu.
 */
export async function checkBookmarkAPI(uid, placeId) {
  if (!uid || !placeId) return false;
  const res = await fetchAPI(`/api/bookmarks/${uid}/check/${placeId}`);
  if (typeof res.bookmarked !== 'boolean') {
    throw new Error('INVALID_RESPONSE: Status bookmark dari backend tidak valid');
  }
  return res.bookmarked;
}

// ============================================================
//  REVIEWS API (COMMUNITY REVIEWS)
// ============================================================

export async function fetchPlaceReviews(placeId, sort = 'latest', userIdOrUid = null) {
  let queryParam = `?sort=${sort}`;
  if (userIdOrUid) {
    queryParam += `&user_id=${encodeURIComponent(userIdOrUid)}&firebase_uid=${encodeURIComponent(userIdOrUid)}`;
  }
  const res = await fetchAPI(`/api/reviews/place/${placeId}${queryParam}`);
  if (!res.success) {
    throw new Error(`API_ERROR: ${res.message || 'Gagal memuat ulasan'}`);
  }
  if (!Array.isArray(res.data)) {
    throw new Error('INVALID_RESPONSE: Data ulasan dari backend tidak valid');
  }
  return res;
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
  const res = await fetchAPI(`/api/checkins/place/${placeId}`);
  if (!res.success) {
    throw new Error(`API_ERROR: ${res.message || 'Gagal memuat check-in aktif'}`);
  }
  return res;
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
  const res = await fetchAPI('/api/promos');
  if (!res.success) {
    throw new Error(`API_ERROR: ${res.message || 'Gagal memuat promo'}`);
  }
  if (!Array.isArray(res.data)) {
    throw new Error('INVALID_RESPONSE: Data promo dari backend tidak valid');
  }
  return res.data;
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
