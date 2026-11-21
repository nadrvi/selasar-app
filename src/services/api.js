/**
 * Selasar API Client Service
 * Menghubungkan Frontend React ke Backend Hono.js & PostgreSQL (selasar-db)
 */

export const API_BASE_URL =
  import.meta.env.DEV ? import.meta.env.VITE_API_URL || '' : '';

/**
 * Helper fetch wrapper dengan timeout & JSON parsing
 */
async function fetchAPI(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
  let res;
  const savedToken = localStorage.getItem('authToken');
  const authToken =
    savedToken && savedToken !== 'undefined' && savedToken !== 'null'
      ? savedToken
      : null;

  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
    if (
      res.status === 401 ||
      (
        res.status === 403 &&
        ['/api/auth/session', '/api/auth/register/social'].includes(endpoint)
      )
    ) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('selasarUser');
    }
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
//  FIREBASE AUTHENTICATION API
// ============================================================

/**
 * Simpan profil akun Firebase baru ke PostgreSQL.
 */
export async function apiRegister({ id_token, username, birthday, display_name }) {
  return await fetchAPI('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ id_token, username, birthday, display_name }),
  });
}

/**
 * Tukarkan Firebase ID token terverifikasi dengan sesi API Selasar.
 */
export async function apiFirebaseSession({ id_token }) {
  return await fetchAPI('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({ id_token }),
  });
}

/**
 * Daftarkan akun sosial baru atau buat sesi untuk akun sosial yang sudah ada.
 */
export async function apiFirebaseSocialRegister({ id_token }) {
  return await fetchAPI('/api/auth/register/social', {
    method: 'POST',
    body: JSON.stringify({ id_token }),
  });
}


/**
 * Mengambil profil user lengkap (termasuk badges dan counter)
 */
export async function fetchUserProfile(identifier) {
  if (!identifier) return null;
  const res = await fetchAPI(`/api/users/${identifier}/profile`);
  if (!res.success) {
    throw new Error(`API_ERROR: ${res.message || 'Gagal memuat profil user'}`);
  }
  return res.data;
}

/**
 * Memperbarui profil user (display_name, bio, birthday, avatar_url) langsung ke PostgreSQL
 */
export async function updateUserProfile(identifier, profileData) {
  if (!identifier) return null;
  return await fetchAPI(`/api/users/${identifier}/profile`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

/**
 * Mencatat aktivitas (misal melihat tempat, pencarian) ke tabel activity_logs database
 */
export async function logActivityAPI({ place_id, event_type = 'visit', metadata = {} }) {
  if (!localStorage.getItem('authToken')) return null;
  try {
    return await fetchAPI('/api/users/activity', {
      method: 'POST',
      body: JSON.stringify({ place_id, event_type, metadata }),
    });
  } catch (err) {
    console.warn('[Selasar API] logActivityAPI warning:', err.message);
    return null;
  }
}


// ============================================================
//  BOOKMARKS / FAVORITES API
// ============================================================

/**
 * Ambil bookmark milik akun yang sedang terautentikasi.
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
 * Toggle bookmark on/off untuk sebuah tempat milik akun yang terautentikasi.
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
 * Cek apakah tempat sudah di-bookmark oleh akun yang terautentikasi.
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

export async function fetchPlaceReviews(placeId, sort = 'latest', limit = 50, offset = 0) {
  const queryParam = `?sort=${encodeURIComponent(sort)}&limit=${limit}&offset=${offset}`;
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
  const review = { ...reviewData };
  for (const identityField of ['user_id', 'firebase_uid', 'email', 'uid']) {
    delete review[identityField];
  }
  return await fetchAPI('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(review),
  });
}

export async function toggleReviewHelpfulAPI(reviewId) {
  return await fetchAPI(`/api/reviews/${reviewId}/helpful`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function logoutAuthSession() {
  const res = await fetchAPI('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!res.success) {
    throw new Error(res.message || 'Gagal mengakhiri sesi di server.');
  }
  return res;
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

export async function fetchUserActiveCheckin(identifier) {
  if (!identifier) return null;
  const res = await fetchAPI(`/api/checkins/user/${identifier}`);
  if (!res.success) {
    return null;
  }
  return res.active_checkin;
}

export async function checkinToPlace(identifier, placeId, note = '') {
  return await fetchAPI('/api/checkins/in', {
    method: 'POST',
    body: JSON.stringify({
      place_id: placeId,
      note,
    }),
  });
}

export async function checkoutFromPlace(identifier, placeId) {
  return await fetchAPI('/api/checkins/out', {
    method: 'POST',
    body: JSON.stringify({
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
