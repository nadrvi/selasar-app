function getUserKey() {
  try {
    const user = JSON.parse(localStorage.getItem("selasarUser"));
    return user?.email ? user.email.toLowerCase() : "guest";
  } catch {
    return "guest";
  }
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage penuh/disabled, diamkan */
  }
}

const MAX_ACTIVITY = 20;

function notify() {
  window.dispatchEvent(new Event("selasar-activity-updated"));
}

export function logVisit({ source, id, name, image, subtitle, match }) {
  const key = `selasar_activity_${getUserKey()}`;
  const list = readJSON(key, []);
  const entryId = `${source}:${id}`;
  const filtered = list.filter((item) => item.entryId !== entryId);
  filtered.unshift({
    entryId,
    source,
    id,
    name: name ?? "Tanpa nama",
    image: image ?? "",
    subtitle: subtitle ?? "",
    match: typeof match === "number" ? match : null,
    visitedAt: Date.now(),
  });
  const trimmed = filtered.slice(0, MAX_ACTIVITY);
  writeJSON(key, trimmed);
  notify();
  return trimmed;
}

export function getVisits() {
  return readJSON(`selasar_activity_${getUserKey()}`, []);
}

// ===== FAVORIT =====
export function getFavorites() {
  return readJSON(`selasar_favorites_${getUserKey()}`, []);
}

export function isFavorite(source, id) {
  return getFavorites().some(
    (f) => f.source === source && String(f.id) === String(id),
  );
}

// Mengembalikan `true` kalau setelah toggle jadi tersimpan (favorit),
// `false` kalau setelah toggle jadi terhapus.
export function toggleFavorite({ source, id, name, image, match }) {
  const key = `selasar_favorites_${getUserKey()}`;
  const list = readJSON(key, []);
  const exists = list.some(
    (f) => f.source === source && String(f.id) === String(id),
  );
  const next = exists
    ? list.filter((f) => !(f.source === source && String(f.id) === String(id)))
    : [
        ...list,
        {
          source,
          id,
          name: name ?? "Tanpa nama",
          image: image ?? "",
          match: typeof match === "number" ? match : null,
          savedAt: Date.now(),
        },
      ];
  writeJSON(key, next);
  notify();
  return !exists;
}

// ===== STATS UNTUK PROFILE =====
export function getStats() {
  const visits = getVisits();
  const favorites = getFavorites();
  const matches = visits
    .map((v) => v.match)
    .filter((m) => typeof m === "number");
  const avgMatch = matches.length
    ? Math.round(matches.reduce((a, b) => a + b, 0) / matches.length)
    : null;
  return {
    visitedCount: visits.length,
    favoriteCount: favorites.length,
    avgMatch,
  };
}