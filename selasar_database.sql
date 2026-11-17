-- ============================================================
--  SELASAR DATABASE SCHEMA & INITIAL SEED SCRIPT
--  Platform : PostgreSQL 15+ / Neon Cloud PostgreSQL
--  Database : selasar-db
--  Version  : 1.3.0 (Production Ready - Hybrid Auth & Full Relations)
--
--  CARA PENGGUNAAN:
--  1. Buka pgAdmin 4 atau terminal psql.
--  2. Pastikan terhubung ke database `selasar-db`.
--  3. Buka Query Tool, lalu jalankan (Execute / F5) script ini.
--  4. Seluruh tabel, relasi, trigger, view, dan sample data
--     akan terbuat secara otomatis dan siap dipakai frontend & backend.
-- ============================================================

SET search_path TO public;

-- ============================================================
--  1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
--  2. DROP EXISTING OBJECTS (Idempotent: aman dijalankan berulang)
-- ============================================================

-- Views
DROP VIEW IF EXISTS v_popular_places       CASCADE;
DROP VIEW IF EXISTS v_user_stats           CASCADE;
DROP VIEW IF EXISTS v_place_review_summary CASCADE;

-- Tables
DROP TABLE IF EXISTS search_logs      CASCADE;
DROP TABLE IF EXISTS activity_logs    CASCADE;
DROP TABLE IF EXISTS reports          CASCADE;
DROP TABLE IF EXISTS user_badges      CASCADE;
DROP TABLE IF EXISTS badges           CASCADE;
DROP TABLE IF EXISTS notifications    CASCADE;
DROP TABLE IF EXISTS promos           CASCADE;
DROP TABLE IF EXISTS review_helpful   CASCADE;
DROP TABLE IF EXISTS review_replies   CASCADE;
DROP TABLE IF EXISTS review_images    CASCADE;
DROP TABLE IF EXISTS reviews          CASCADE;
DROP TABLE IF EXISTS checkins         CASCADE;
DROP TABLE IF EXISTS bookmarks        CASCADE;
DROP TABLE IF EXISTS place_hours      CASCADE;
DROP TABLE IF EXISTS place_tags       CASCADE;
DROP TABLE IF EXISTS tags             CASCADE;
DROP TABLE IF EXISTS place_images     CASCADE;
DROP TABLE IF EXISTS places           CASCADE;
DROP TABLE IF EXISTS cities           CASCADE;
DROP TABLE IF EXISTS users            CASCADE;

-- Enum Types
DROP TYPE IF EXISTS place_category CASCADE;
DROP TYPE IF EXISTS noise_level    CASCADE;
DROP TYPE IF EXISTS mood_type      CASCADE;
DROP TYPE IF EXISTS user_role      CASCADE;
DROP TYPE IF EXISTS review_status  CASCADE;
DROP TYPE IF EXISTS checkin_status CASCADE;
DROP TYPE IF EXISTS report_reason  CASCADE;
DROP TYPE IF EXISTS notif_type     CASCADE;
DROP TYPE IF EXISTS promo_type     CASCADE;

-- ============================================================
--  3. ENUM TYPES
-- ============================================================
CREATE TYPE place_category AS ENUM (
  'Cafe', 'Coworking', 'Perpustakaan', 'Alam', 'Restoran', 'Hotel'
);

CREATE TYPE noise_level AS ENUM (
  'Sunyi', 'Sepi', 'Tenang', 'Sedang', 'Lumayan ramai', 'Ramai'
);

CREATE TYPE mood_type AS ENUM (
  'Fokus', 'Santai', 'Deadline mode', 'Healing', 'Meeting', 'Brainstorming'
);

CREATE TYPE user_role AS ENUM (
  'user', 'owner', 'admin'
);

CREATE TYPE review_status AS ENUM (
  'active', 'hidden', 'flagged'
);

CREATE TYPE checkin_status AS ENUM (
  'active', 'ended'
);

CREATE TYPE report_reason AS ENUM (
  'spam', 'tidak_relevan', 'konten_tidak_pantas', 'informasi_salah', 'lainnya'
);

CREATE TYPE notif_type AS ENUM (
  'promo', 'checkin', 'review_reply', 'badge', 'sistem', 'spot_baru'
);

CREATE TYPE promo_type AS ENUM (
  'diskon', 'cashback', 'event', 'spot_baru', 'info'
);

-- ============================================================
--  4. TABLE: users
--  Mendukung login Email/Password (bcrypt) & Google/Sosial (hybrid)
-- ============================================================
CREATE TABLE users (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid     VARCHAR(128) UNIQUE,           -- Nullable untuk direct database auth
  username         VARCHAR(32)  NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    VARCHAR(255),                  -- Bcrypt hash kata sandi
  display_name     VARCHAR(100),
  avatar_url       TEXT,
  bio              TEXT,
  birthday         DATE,
  role             user_role    NOT NULL DEFAULT 'user',
  is_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
  is_banned        BOOLEAN      NOT NULL DEFAULT FALSE,
  total_reviews    INT          NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  total_checkins   INT          NOT NULL DEFAULT 0 CHECK (total_checkins >= 0),
  total_bookmarks  INT          NOT NULL DEFAULT 0 CHECK (total_bookmarks >= 0),
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index case-insensitive unik untuk username & email
CREATE UNIQUE INDEX idx_users_username_lower ON users (LOWER(username));
CREATE UNIQUE INDEX idx_users_email_lower    ON users (LOWER(email));
CREATE INDEX idx_users_firebase_uid          ON users (firebase_uid) WHERE firebase_uid IS NOT NULL;
CREATE INDEX idx_users_role                  ON users (role);

-- ============================================================
--  5. TABLE: cities (Kota cakupan Selasar)
-- ============================================================
CREATE TABLE cities (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(100) UNIQUE NOT NULL,
  province   VARCHAR(100),
  lat        DECIMAL(9,6),
  lng        DECIMAL(9,6),
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  6. TABLE: places (Spot Nugas / Kafe / Coworking)
-- ============================================================
CREATE TABLE places (
  id                   SERIAL         PRIMARY KEY,
  owner_id             UUID           REFERENCES users(id) ON DELETE SET NULL,
  city_id              INT            REFERENCES cities(id) ON DELETE SET NULL,
  name                 VARCHAR(150)   NOT NULL,
  slug                 VARCHAR(180)   UNIQUE NOT NULL,
  category             place_category NOT NULL,
  address              TEXT           NOT NULL,
  lat                  DECIMAL(9,6)   NOT NULL,
  lng                  DECIMAL(9,6)   NOT NULL,
  distance_desc        VARCHAR(50),   -- e.g. "450 m", "1.1 km"
  image_url            TEXT,          -- Foto utama (thumbnail)
  description          TEXT,
  noise_level          noise_level    NOT NULL DEFAULT 'Sedang',
  wifi_speed_mbps      INT            CHECK (wifi_speed_mbps IS NULL OR wifi_speed_mbps >= 0),
  wifi_description     VARCHAR(100),  -- e.g. "Bagus (55 Mbps)"
  plug_availability    VARCHAR(150),  -- e.g. "Tersedia di tiap meja sudut"
  plug_probability_pct INT            CHECK (plug_probability_pct BETWEEN 0 AND 100),
  capacity_desc        VARCHAR(100),  -- e.g. "2-4 orang"
  mood                 mood_type      NOT NULL DEFAULT 'Santai',
  overthinking_status  VARCHAR(100),  -- e.g. "Aman buat fokus", "Cocok cari inspirasi"
  price_min            INT            NOT NULL DEFAULT 0 CHECK (price_min >= 0),
  price_max            INT            CHECK (price_max IS NULL OR price_max >= 0),
  open_hour            TIME,
  close_hour           TIME,
  is_open_24h          BOOLEAN        NOT NULL DEFAULT FALSE,
  is_verified          BOOLEAN        NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN        NOT NULL DEFAULT TRUE,
  match_score          INT            NOT NULL DEFAULT 80 CHECK (match_score BETWEEN 0 AND 100),
  avg_rating           DECIMAL(3,2)   NOT NULL DEFAULT 0.00 CHECK (avg_rating BETWEEN 0 AND 5),
  total_reviews        INT            NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  total_bookmarks      INT            NOT NULL DEFAULT 0 CHECK (total_bookmarks >= 0),
  current_visitors     INT            NOT NULL DEFAULT 0 CHECK (current_visitors >= 0),
  view_count           INT            NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_places_city       ON places(city_id);
CREATE INDEX idx_places_category   ON places(category);
CREATE INDEX idx_places_mood       ON places(mood);
CREATE INDEX idx_places_avg_rating ON places(avg_rating DESC);
CREATE INDEX idx_places_lat_lng    ON places(lat, lng);
CREATE INDEX idx_places_slug       ON places(slug);
CREATE INDEX idx_places_active     ON places(is_active) WHERE is_active = TRUE;

-- ============================================================
--  7. TABLE: place_images (Galeri foto tiap spot)
-- ============================================================
CREATE TABLE place_images (
  id          SERIAL       PRIMARY KEY,
  place_id    INT          NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  url         TEXT         NOT NULL,
  caption     VARCHAR(200),
  is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order  INT          NOT NULL DEFAULT 0,
  uploaded_by UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_place_images_place ON place_images(place_id, sort_order);

-- ============================================================
--  8. TABLE: tags & place_tags (Fasilitas & Karakteristik)
-- ============================================================
CREATE TABLE tags (
  id         SERIAL      PRIMARY KEY,
  name       VARCHAR(50) UNIQUE NOT NULL,
  color_hex  CHAR(7)     NOT NULL DEFAULT '#8B6B4F',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE place_tags (
  place_id   INT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  tag_id     INT NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
  PRIMARY KEY (place_id, tag_id)
);

-- ============================================================
--  9. TABLE: place_hours (Jadwal Buka/Tutup per Hari)
-- ============================================================
CREATE TABLE place_hours (
  id           SERIAL   PRIMARY KEY,
  place_id     INT      NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Minggu, 1=Senin, ..., 6=Sabtu
  open_time    TIME,
  close_time   TIME,
  is_closed    BOOLEAN  NOT NULL DEFAULT FALSE,
  UNIQUE (place_id, day_of_week)
);

-- ============================================================
--  10. TABLE: reviews (Komunitas Ulasan Nugas)
-- ============================================================
CREATE TABLE reviews (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id          INT           NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id           UUID          NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  rating            SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  rating_wifi       SMALLINT      CHECK (rating_wifi     BETWEEN 1 AND 5),
  rating_ambience   SMALLINT      CHECK (rating_ambience BETWEEN 1 AND 5),
  rating_plug       SMALLINT      CHECK (rating_plug     BETWEEN 1 AND 5),
  rating_price      SMALLINT      CHECK (rating_price    BETWEEN 1 AND 5),
  body              TEXT,
  visit_date        DATE,
  is_verified_visit BOOLEAN       NOT NULL DEFAULT FALSE,
  helpful_count     INT           NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  -- Community Review Fields
  visit_purpose     VARCHAR(50),  -- e.g. 'wfc', 'nugas', 'me_time', 'meeting'
  noise_level       VARCHAR(30),  -- e.g. 'quiet', 'moderate', 'lively'
  plug_score        VARCHAR(30),  -- e.g. 'abundant', 'sufficient', 'limited'
  wifi_quality      VARCHAR(30),  -- e.g. 'super_fast', 'good', 'slow'
  seat_comfort      VARCHAR(30),  -- e.g. 'ergonomic', 'standard', 'stool'
  safety_tags       TEXT[]        DEFAULT '{}',
  secret_tip        TEXT,
  visit_time        VARCHAR(30),  -- e.g. 'pagi', 'siang', 'sore', 'malam'
  spent_per_person  VARCHAR(30),  -- e.g. '< 50rb', '50-100rb', '> 100rb'
  status            review_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (place_id, user_id)
);

CREATE INDEX idx_reviews_place   ON reviews(place_id);
CREATE INDEX idx_reviews_user    ON reviews(user_id);
CREATE INDEX idx_reviews_status  ON reviews(status);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

CREATE TABLE review_images (
  id         SERIAL      PRIMARY KEY,
  review_id  UUID        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_images_review ON review_images(review_id);

CREATE TABLE review_replies (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id  UUID        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_helpful (
  review_id  UUID        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (review_id, user_id)
);

-- ============================================================
--  11. TABLE: bookmarks (Tempat Favorit yang Disimpan)
-- ============================================================
CREATE TABLE bookmarks (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  place_id   INT         NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, place_id)
);

CREATE INDEX idx_bookmarks_user  ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_place ON bookmarks(place_id);

-- ============================================================
--  12. TABLE: checkins (Check-in Real-time Nugas)
-- ============================================================
CREATE TABLE checkins (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID           NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  place_id        INT            NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  status          checkin_status NOT NULL DEFAULT 'active',
  note            TEXT,
  duration_min    INT            CHECK (duration_min IS NULL OR duration_min > 0),
  checked_in_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  checked_out_at  TIMESTAMPTZ,
  CHECK (checked_out_at IS NULL OR checked_out_at >= checked_in_at)
);

CREATE UNIQUE INDEX idx_checkins_one_active
  ON checkins(user_id, place_id)
  WHERE status = 'active';

CREATE INDEX idx_checkins_place_active ON checkins(place_id, status);
CREATE INDEX idx_checkins_user         ON checkins(user_id, checked_in_at DESC);

-- ============================================================
--  13. TABLE: activity_logs & search_logs
-- ============================================================
CREATE TABLE activity_logs (
  id         BIGSERIAL    PRIMARY KEY,
  user_id    UUID         REFERENCES users(id)  ON DELETE SET NULL,
  place_id   INT          REFERENCES places(id) ON DELETE SET NULL,
  event_type VARCHAR(50)  NOT NULL,
  metadata   JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user  ON activity_logs(user_id,  created_at DESC);
CREATE INDEX idx_activity_logs_place ON activity_logs(place_id, created_at DESC);

CREATE TABLE search_logs (
  id               BIGSERIAL   PRIMARY KEY,
  user_id          UUID        REFERENCES users(id)  ON DELETE SET NULL,
  query            TEXT        NOT NULL,
  city_filter      VARCHAR(100),
  mood_filter      mood_type,
  results_count    INT         CHECK (results_count >= 0),
  clicked_place_id INT         REFERENCES places(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_logs_user ON search_logs(user_id, created_at DESC);

-- ============================================================
--  14. TABLE: promos (Banner Promo Beranda & Penawaran Spesial)
-- ============================================================
CREATE TABLE promos (
  id           SERIAL       PRIMARY KEY,
  place_id     INT          REFERENCES places(id) ON DELETE SET NULL,
  promo_type   promo_type   NOT NULL DEFAULT 'info',
  title        VARCHAR(150) NOT NULL,
  subtitle     VARCHAR(255),
  detail       TEXT,
  image_url    TEXT,
  brand_name   VARCHAR(100),
  promo_code   VARCHAR(50),
  discount_pct INT          CHECK (discount_pct BETWEEN 0 AND 100),
  valid_from   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  valid_until  TIMESTAMPTZ,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  view_count   INT          NOT NULL DEFAULT 0 CHECK (view_count  >= 0),
  click_count  INT          NOT NULL DEFAULT 0 CHECK (click_count >= 0),
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX idx_promos_active ON promos(is_active, valid_from DESC);

-- ============================================================
--  15. TABLE: notifications (Notifikasi User)
-- ============================================================
CREATE TABLE notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  type       notif_type  NOT NULL DEFAULT 'sistem',
  title      VARCHAR(150) NOT NULL,
  body       TEXT,
  deep_link  TEXT,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  place_id   INT         REFERENCES places(id) ON DELETE SET NULL,
  promo_id   INT         REFERENCES promos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
--  16. TABLE: badges & user_badges (Prestasi / Gamifikasi)
-- ============================================================
CREATE TABLE badges (
  id          SERIAL       PRIMARY KEY,
  code        VARCHAR(50)  UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  icon_emoji  VARCHAR(10),
  icon_url    TEXT,
  criteria    JSONB,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE user_badges (
  user_id    UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  badge_id   INT  NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- ============================================================
--  17. TABLE: reports (Laporan Konten)
-- ============================================================
CREATE TABLE reports (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id    UUID          REFERENCES reviews(id) ON DELETE CASCADE,
  place_id     INT           REFERENCES places(id)  ON DELETE CASCADE,
  reason       report_reason NOT NULL DEFAULT 'lainnya',
  note         TEXT,
  is_resolved  BOOLEAN       NOT NULL DEFAULT FALSE,
  resolved_by  UUID          REFERENCES users(id) ON DELETE SET NULL,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CHECK (review_id IS NOT NULL OR place_id IS NOT NULL),
  CHECK (is_resolved = TRUE OR resolved_at IS NULL)
);

-- ============================================================
--  18. DATABASE TRIGGERS & AUTOMATION FUNCTIONS
-- ============================================================

-- A. Auto-update kolom `updated_at`
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_places_updated_at  BEFORE UPDATE ON places  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_promos_updated_at  BEFORE UPDATE ON promos  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- B. Auto-sync `avg_rating` & `total_reviews` di tabel places saat ada review baru/diubah/dihapus
CREATE OR REPLACE FUNCTION fn_sync_place_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_place_id INT;
BEGIN
  v_place_id := COALESCE(NEW.place_id, OLD.place_id);

  UPDATE places SET
    avg_rating    = COALESCE((
                      SELECT ROUND(AVG(rating)::NUMERIC, 2)
                      FROM reviews
                      WHERE place_id = v_place_id AND status = 'active'
                    ), 0.00),
    total_reviews = (
                      SELECT COUNT(*)
                      FROM reviews
                      WHERE place_id = v_place_id AND status = 'active'
                    ),
    updated_at    = NOW()
  WHERE id = v_place_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_place_rating
  AFTER INSERT OR UPDATE OF rating, status OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_sync_place_rating();

-- C. Auto-sync `total_bookmarks` di tabel places saat bookmark di-insert/dihapus
CREATE OR REPLACE FUNCTION fn_sync_place_bookmarks()
RETURNS TRIGGER AS $$
DECLARE
  v_place_id INT;
BEGIN
  v_place_id := COALESCE(NEW.place_id, OLD.place_id);

  UPDATE places SET
    total_bookmarks = (SELECT COUNT(*) FROM bookmarks WHERE place_id = v_place_id),
    updated_at      = NOW()
  WHERE id = v_place_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_place_bookmarks
  AFTER INSERT OR DELETE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION fn_sync_place_bookmarks();

-- D. Auto-sync `current_visitors` di tabel places berdasarkan checkin aktif
CREATE OR REPLACE FUNCTION fn_sync_place_visitors()
RETURNS TRIGGER AS $$
DECLARE
  v_place_id INT;
BEGIN
  v_place_id := COALESCE(NEW.place_id, OLD.place_id);

  UPDATE places SET
    current_visitors = (
                         SELECT COUNT(*)
                         FROM checkins
                         WHERE place_id = v_place_id AND status = 'active'
                       ),
    updated_at       = NOW()
  WHERE id = v_place_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_place_visitors
  AFTER INSERT OR UPDATE OF status OR DELETE ON checkins
  FOR EACH ROW EXECUTE FUNCTION fn_sync_place_visitors();

-- E. Auto-sync counter di profil users (total_reviews, total_checkins, total_bookmarks)
CREATE OR REPLACE FUNCTION fn_sync_user_counters()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  UPDATE users SET
    total_reviews   = (SELECT COUNT(*) FROM reviews   WHERE user_id = v_user_id AND status = 'active'),
    total_checkins  = (SELECT COUNT(*) FROM checkins  WHERE user_id = v_user_id),
    total_bookmarks = (SELECT COUNT(*) FROM bookmarks WHERE user_id = v_user_id)
  WHERE id = v_user_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_user_reviews   AFTER INSERT OR UPDATE OF status OR DELETE ON reviews   FOR EACH ROW EXECUTE FUNCTION fn_sync_user_counters();
CREATE TRIGGER trg_sync_user_checkins  AFTER INSERT OR DELETE ON checkins  FOR EACH ROW EXECUTE FUNCTION fn_sync_user_counters();
CREATE TRIGGER trg_sync_user_bookmarks AFTER INSERT OR DELETE ON bookmarks FOR EACH ROW EXECUTE FUNCTION fn_sync_user_counters();

-- F. Auto-sync `helpful_count` pada tabel reviews
CREATE OR REPLACE FUNCTION fn_sync_review_helpful()
RETURNS TRIGGER AS $$
DECLARE
  v_review_id UUID;
BEGIN
  v_review_id := COALESCE(NEW.review_id, OLD.review_id);
  UPDATE reviews SET
    helpful_count = (SELECT COUNT(*) FROM review_helpful WHERE review_id = v_review_id)
  WHERE id = v_review_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_review_helpful
  AFTER INSERT OR DELETE ON review_helpful
  FOR EACH ROW EXECUTE FUNCTION fn_sync_review_helpful();

-- ============================================================
--  19. VIEWS (Laporan & Agregasi Data Cepat)
-- ============================================================

-- View: Rekomendasi Spot Populer berdasarkan skor gabungan
CREATE OR REPLACE VIEW v_popular_places AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.category,
  c.name AS city,
  p.image_url AS image,
  p.avg_rating,
  p.total_reviews,
  p.total_bookmarks,
  p.current_visitors,
  p.noise_level,
  p.mood,
  p.wifi_speed_mbps,
  p.plug_probability_pct,
  ROUND(
    (p.avg_rating * 20)
    + (p.total_reviews    *  2)
    + (p.total_bookmarks  *  3)
    + (p.current_visitors *  5)
  ) AS popularity_score
FROM places p
LEFT JOIN cities c ON c.id = p.city_id
WHERE p.is_active = TRUE
ORDER BY popularity_score DESC;

-- View: Statistik & Gamifikasi Pengguna
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
  u.id,
  u.username,
  u.display_name,
  u.email,
  u.role,
  u.total_reviews,
  u.total_checkins,
  u.total_bookmarks,
  COUNT(DISTINCT ub.badge_id) AS total_badges,
  u.is_verified,
  u.is_banned,
  u.created_at
FROM users u
LEFT JOIN user_badges ub ON ub.user_id = u.id
GROUP BY u.id;

-- View: Rangkuman Ulasan & Distribusi Bintang per Tempat
CREATE OR REPLACE VIEW v_place_review_summary AS
SELECT
  r.place_id,
  COUNT(*)                                   AS total_reviews,
  ROUND(AVG(r.rating)::NUMERIC,       2)     AS avg_overall,
  ROUND(AVG(r.rating_wifi)::NUMERIC,  2)     AS avg_wifi,
  ROUND(AVG(r.rating_ambience)::NUMERIC, 2)  AS avg_ambience,
  ROUND(AVG(r.rating_plug)::NUMERIC,  2)     AS avg_plug,
  ROUND(AVG(r.rating_price)::NUMERIC, 2)     AS avg_price,
  COUNT(*) FILTER (WHERE r.rating = 5)       AS star_5,
  COUNT(*) FILTER (WHERE r.rating = 4)       AS star_4,
  COUNT(*) FILTER (WHERE r.rating = 3)       AS star_3,
  COUNT(*) FILTER (WHERE r.rating = 2)       AS star_2,
  COUNT(*) FILTER (WHERE r.rating = 1)       AS star_1,
  COUNT(*) FILTER (WHERE r.visit_purpose = 'wfc') AS count_wfc,
  COUNT(*) FILTER (WHERE r.visit_purpose = 'nugas') AS count_nugas,
  COUNT(*) FILTER (WHERE r.visit_purpose = 'me_time') AS count_me_time,
  COUNT(*) FILTER (WHERE r.noise_level = 'quiet') AS count_quiet,
  COUNT(*) FILTER (WHERE r.plug_score = 'abundant' OR r.plug_score = 'sufficient') AS count_good_plug,
  COUNT(*) FILTER (WHERE r.wifi_quality = 'super_fast' OR r.wifi_quality = 'good') AS count_good_wifi
FROM reviews r
WHERE r.status = 'active'
GROUP BY r.place_id;

-- ============================================================
--  20. INITIAL SEED DATA
-- ============================================================

-- A. Kota
INSERT INTO cities (id, name, province, lat, lng) VALUES
  (1,  'Jakarta',    'DKI Jakarta',     -6.2088,  106.8456),
  (2,  'Bandung',    'Jawa Barat',      -6.9175,  107.6191),
  (3,  'Bogor',      'Jawa Barat',      -6.5944,  106.7892),
  (4,  'Depok',      'Jawa Barat',      -6.4025,  106.7942),
  (5,  'Tangerang',  'Banten',          -6.1783,  106.6319),
  (6,  'Bekasi',     'Jawa Barat',      -6.2383,  106.9756),
  (7,  'Surabaya',   'Jawa Timur',      -7.2575,  112.7521),
  (8,  'Yogyakarta', 'DI Yogyakarta',   -7.7956,  110.3695),
  (9,  'Malang',     'Jawa Timur',      -7.9666,  112.6326),
  (10, 'Bali',       'Bali',            -8.4095,  115.1889);
SELECT setval('cities_id_seq', (SELECT MAX(id) FROM cities));

-- B. Pengguna Default (Demo User & Admin)
-- Password demo  : Demo1234!
-- Password admin : Admin1234!
INSERT INTO users (id, username, email, password_hash, display_name, role, is_verified) VALUES
  (
    'add45705-9bb1-496b-9737-483012cf3b98',
    'demouser',
    'demo@selasar.app',
    '$2b$10$sxyBPI9ERbBvpX8/AzqxX.1VzejuoEvoHzJs/NXqTWqwdNzs/4RDO',
    'Demo User Selasar',
    'user',
    TRUE
  ),
  (
    '07b22f71-1856-42d2-9073-d1c1ddb2556a',
    'admin',
    'admin@selasar.app',
    '$2b$10$PdvGeVV3VSekpPbg4KOCAOR9w/9Xez6bbNr4K3m53p8omZcC4Lh/m',
    'Administrator Selasar',
    'admin',
    TRUE
  );

-- C. Tags Fasilitas
INSERT INTO tags (id, name, color_hex) VALUES
  (1,  'Colokan Banyak',    '#8B6B4F'),
  (2,  'WiFi Ngebut',       '#2E7D32'),
  (3,  'AC Sejuk',          '#0288D1'),
  (4,  'Outdoor',           '#E65100'),
  (5,  'Indoor',            '#594A42'),
  (6,  'Parkir Luas',       '#546E7A'),
  (7,  'Pet Friendly',      '#8E24AA'),
  (8,  'No Minimum Order',  '#43A047'),
  (9,  'Quiet Zone',        '#3949AB'),
  (10, 'Standing Desk',     '#00897B'),
  (11, 'Meeting Room',      '#37474F'),
  (12, 'Printer',           '#6D4C41'),
  (13, 'Smoking Area',      '#78909C'),
  (14, 'Musik Live',        '#D81B60'),
  (15, 'View Bagus',        '#00ACC1'),
  (16, 'Harga Terjangkau',  '#7CB342');
SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags));

-- D. 9 Spot Selasar (Sesuai Komponen Frontend)
INSERT INTO places
  (id, city_id, name, slug, category, address, lat, lng, distance_desc, image_url,
   description, noise_level, wifi_speed_mbps, wifi_description,
   plug_availability, plug_probability_pct, capacity_desc,
   mood, overthinking_status, match_score, current_visitors, open_hour, close_hour)
VALUES
  (1, 1,
   'Kopi Nalar', 'kopi-nalar-jakarta', 'Cafe',
   'Jl. Prof. Joko Sutono SH No. 7, Melawai, Jakarta Selatan',
   -6.2415, 106.8124, '450 m',
   'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
   'Suasana kalem dengan jarak meja yang lapang, colokan gampang dicari di tiap sudut. Pilihan tepat buat kamu yang butuh fokus nugas tanpa distraksi.',
   'Tenang', 55, 'Bagus (55 Mbps)',
   'Tersedia di tiap meja sudut', 85, '2-4 orang',
   'Fokus', 'Aman buat fokus', 95, 12, '07:00', '22:00'),

  (2, 1,
   'Ruang Seduh', 'ruang-seduh-jakarta', 'Coworking',
   'Jl. Kemang Raya No. 8B, Bangka, Jakarta Selatan',
   -6.2758, 106.8166, '1.1 km',
   'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
   'Spot paling sepi dan profesional, WiFi kenceng stabil, kursi ergonomis, dan colokan selalu ready. Juara untuk sprint skripsi atau meeting online.',
   'Sunyi', 100, 'Sangat Bagus (100 Mbps)',
   'Stopkontak di semua meja', 95, '1-2 orang / Individual',
   'Deadline mode', 'Aman buat fokus', 98, 6, '08:00', '23:00'),

  (3, 1,
   'Taman Literasi Blok M', 'taman-literasi-blok-m', 'Perpustakaan',
   'Jl. Sisingamangaraja, Melawai, Blok M, Jakarta Selatan',
   -6.2442, 106.7978, '800 m',
   'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80',
   'Ruang baca komunitas terbuka dengan perpustakaan modern di tengah taman rindang. Nyaman untuk membaca buku, mencari ide, atau tugas ringan.',
   'Tenang', 20, 'Standar (20 Mbps)',
   'Terbatas di area indoor', 55, 'Individual / Terbuka',
   'Santai', 'Cocok cari inspirasi', 91, 22, '09:00', '20:00'),

  (4, 2,
   'Titik Koma Coffee', 'titik-koma-coffee-bandung', 'Cafe',
   'Jl. Ir. H. Juanda No. 112, Dago, Bandung',
   -6.8995, 107.6138, '650 m',
   'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80',
   'Vibe Dago yang sejuk dan ramai obrolan santai. Enak buat nugas bareng kelompok kerja atau brainstorming santai sambil ngopi susu.',
   'Lumayan ramai', 35, 'Sedang (35 Mbps)',
   'Tersedia di area indoor', 50, 'Tim (4-6 orang)',
   'Santai', 'Cocok nongkrong', 88, 32, '08:00', '23:59'),

  (5, 2,
   'Kisah Manis Coffee', 'kisah-manis-coffee-bandung', 'Cafe',
   'Jl. Sunda No. 65, Kebon Pisang, Bandung',
   -6.9048, 107.6205, '1.4 km',
   'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
   'Suasana aesthetic bernuansa warm wood dan tanaman. Pencahayaan lembut, playlist akustik chill, dan colokan memadai untuk kerja sore.',
   'Sedang', 50, 'Bagus (50 Mbps)',
   'Banyak di lantai 2', 70, '2-4 orang',
   'Santai', 'Aman buat fokus santai', 90, 18, '09:00', '22:00'),

  (6, 2,
   'CoWork Diponegoro', 'cowork-diponegoro-bandung', 'Coworking',
   'Jl. Diponegoro No. 10, Citarum, Bandung',
   -6.9012, 107.6180, '950 m',
   'https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=800&q=80',
   'Coworking space modern dekat Gedung Sate dengan koneksi berkecepatan tinggi, ruang meeting privat, dan fasilitas lengkap pendukung deadline.',
   'Sepi', 120, 'Super Cepat (120 Mbps)',
   'Colokan di tiap meja', 95, 'Meeting / Meja Tim',
   'Fokus', 'Aman buat fokus', 96, 9, '08:00', '21:00'),

  (7, 3,
   'Bilik Kopi Pajajaran', 'bilik-kopi-pajajaran-bogor', 'Cafe',
   'Jl. Pajajaran Indah V No. 12, Baranangsiang, Bogor',
   -6.5862, 106.8045, '500 m',
   'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=800&q=80',
   'Cafe hits di pusat kota Bogor dengan udara segar semi-outdoor. Menyenangkan untuk rehat kopi sore, walau colokan agak rebutan saat weekend.',
   'Ramai', 40, 'Bagus (40 Mbps)',
   'Hanya di meja dinding', 45, '2-4 orang',
   'Healing', 'Banyak distraksi', 86, 38, '08:00', '22:00'),

  (8, 3,
   'Kopi Daong & Pine Park', 'kopi-daong-pine-park-bogor', 'Alam',
   'Pancawati, Kec. Caringin, Kabupaten Bogor',
   -6.6912, 106.8795, '3.2 km',
   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
   'Dikelilingi rindangnya pohon pinus dengan hawa sejuk khas pegunungan Bogor. Sempurna untuk healing dan menjernihkan pikiran di akhir pekan.',
   'Ramai', 25, 'Sedang (25 Mbps)',
   'Sangat terbatas', 25, 'Outdoor luas',
   'Healing', 'Cocok cari angin', 83, 65, '08:00', '18:00'),

  (9, 3,
   'Kebon Raya Study Corner', 'kebon-raya-study-corner-bogor', 'Alam',
   'Jl. Otto Iskandardinata No. 13, Bogor Tengah',
   -6.5985, 106.7972, '750 m',
   'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=800&q=80',
   'Sudut tenang di sekeliling area Kebun Raya Bogor. Menawarkan udara sejuk dan ketenangan alami untuk membaca buku atau mengetik tugas ringan.',
   'Sunyi', 15, 'Standar (15 Mbps)',
   'Area gazebo tertentu', 15, 'Individual',
   'Fokus', 'Aman buat fokus', 81, 14, '08:00', '17:00');

SELECT setval('places_id_seq', (SELECT MAX(id) FROM places));

-- E. Foto Galeri Tempat (place_images)
INSERT INTO place_images (place_id, url, caption, is_primary, sort_order)
SELECT id, image_url, name || ' - Foto Utama', TRUE, 0 FROM places;

INSERT INTO place_images (place_id, url, caption, is_primary, sort_order) VALUES
  (1, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80', 'Area Meja Sudut Kopi Nalar', FALSE, 1),
  (2, 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', 'Private Meeting Pod Ruang Seduh', FALSE, 1),
  (3, 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80', 'Area Baca Terbuka Blok M', FALSE, 1),
  (4, 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80', 'Area Outdoor Titik Koma Dago', FALSE, 1),
  (6, 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80', 'Ergonomic Desk CoWork Diponegoro', FALSE, 1);

-- F. Relasi Tag Fasilitas per Spot (place_tags)
INSERT INTO place_tags (place_id, tag_id) VALUES
  (1, 1), (1, 2), (1, 5), (1, 9),             -- Kopi Nalar
  (2, 1), (2, 2), (2, 9), (2, 10), (2, 11),   -- Ruang Seduh
  (3, 3), (3, 4), (3, 8), (3, 16),            -- Taman Literasi
  (4, 1), (4, 4), (4, 5), (4, 14),            -- Titik Koma
  (5, 1), (5, 2), (5, 3), (5, 15),            -- Kisah Manis
  (6, 1), (6, 2), (6, 9), (6, 10), (6, 11),   -- CoWork Diponegoro
  (7, 4), (7, 6), (7, 13),                    -- Bilik Kopi Pajajaran
  (8, 4), (8, 6), (8, 15),                    -- Kopi Daong
  (9, 4), (9, 8), (9, 9), (9, 15);            -- Kebon Raya

-- G. Badges Prestasi
INSERT INTO badges (id, code, name, description, icon_emoji, criteria) VALUES
  (1,  'first_review',   'Kritikus Perdana',    'Tulis ulasan pertamamu',                '⭐', '{"reviews": 1}'),
  (2,  'explorer_5',     'Penjelajah',          'Kunjungi 5 spot berbeda',               '🗺️', '{"visits": 5}'),
  (3,  'explorer_20',    'Petualang Sejati',    'Kunjungi 20 spot berbeda',              '🧭', '{"visits": 20}'),
  (4,  'bookworm',       'Kolektor Spot',       'Simpan 10 spot ke favorit',             '🔖', '{"bookmarks": 10}'),
  (5,  'checkin_first',  'Check-in Perdana',    'Check-in pertama kali di sebuah spot',  '📍', '{"checkins": 1}'),
  (6,  'checkin_10',     'Nugas Warrior',       'Check-in 10 kali',                      '💪', '{"checkins": 10}'),
  (7,  'checkin_50',     'Legenda Nugas',       'Check-in 50 kali',                      '🏆', '{"checkins": 50}'),
  (8,  'reviewer_10',    'Ahli Ulasan',         'Tulis 10 ulasan',                       '✍️', '{"reviews": 10}'),
  (9,  'helpful_hero',   'Pahlawan Komunitas',  'Ulasanmu membantu 50 orang',            '🦸', '{"helpful_received": 50}'),
  (10, 'early_bird',     'Early Bird',          'Check-in sebelum jam 08:00',            '🌅', '{"early_checkin": true}'),
  (11, 'night_owl',      'Night Owl',           'Check-in setelah jam 22:00',            '🦉', '{"late_checkin": true}'),
  (12, 'all_city',       'Traveler Jabodetabek','Nugas di Jakarta, Bogor & Bandung',     '🌆', '{"cities": ["Jakarta","Bogor","Bandung"]}');
SELECT setval('badges_id_seq', (SELECT MAX(id) FROM badges));

-- H. Banner Promo Beranda
INSERT INTO promos (place_id, promo_type, title, subtitle, detail, brand_name, promo_code, discount_pct, image_url, valid_until, sort_order)
VALUES
  (
    2, 'diskon', 'Promo Nugas Mahasiswa 🎓',
    'Diskon 30% all item di Ruang Seduh.',
    'Tunjukin Kartu Tanda Mahasiswa (KTM) kamu ke kasir buat nikmatin diskon 30% untuk semua varian kopi. Cocok banget buat nemenin skripsian sampai pagi! Maksimal diskon Rp 50.000.',
    'Ruang Seduh', NULL, 30,
    'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1000&q=80',
    NOW() + INTERVAL '30 days', 1
  ),
  (
    8, 'spot_baru', 'Spot Baru di Bogor 🌲',
    'Healing sambil nugas di Kopi Daong.',
    'Udah suntuk di kamar? Kopi Daong ngasih kamu view hutan pinus yang bikin otak fresh lagi. Free WiFi ngebut khusus pembelian paket Nugas Hemat.',
    'Kopi Daong', NULL, NULL,
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80',
    NOW() + INTERVAL '60 days', 2
  ),
  (
    4, 'event', 'Coworking 24 Jam 🦉',
    'Titik Koma Coffee sekarang buka 24 jam.',
    'Khusus weekend (Jumat–Minggu), Titik Koma buka 24 jam full. Free refill infused water dan colokan di setiap meja dijamin aman.',
    'Titik Koma Coffee', NULL, NULL,
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1000&q=80',
    NOW() + INTERVAL '90 days', 3
  ),
  (
    1, 'cashback', 'Cashback Gopay 50% 💸',
    'Nugas hemat di Kopi Nalar.',
    'Pakai kode voucher SELASAR50 di aplikasi Gopay saat bayar di Kopi Nalar Jakarta. Cashback instan 50% tanpa minimum pembelian!',
    'Kopi Nalar', 'SELASAR50', 50,
    'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1000&q=80',
    NOW() + INTERVAL '14 days', 4
  ),
  (
    5, 'event', 'Live Acoustic Weekend 🎸',
    'Beresin tugas sambil chill di Kisah Manis.',
    'Nugas nggak harus tegang! Mulai jam 7 malam tiap Sabtu, Kisah Manis Bandung ngadain Live Acoustic. Beli 2 minuman gratis 1 porsi dimsum.',
    'Kisah Manis Coffee', NULL, NULL,
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1000&q=80',
    NOW() + INTERVAL '45 days', 5
  ),
  (
    7, 'diskon', 'Paket Skripsian Unlimited ☕',
    'Gratis refill kopi hitam seharian.',
    'Beli Paket Skripsian seharga Rp 45.000, kamu udah dapet 1 pastry dan bebas refill kopi hitam sepuasnya dari buka sampai tutup.',
    'Bilik Kopi Pajajaran', 'SKRIPSIAN45', NULL,
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80',
    NOW() + INTERVAL '30 days', 6
  );

-- I. Sample Ulasan Perdana (Otomatis mentrigger sync rating & ulasan tempat)
INSERT INTO reviews (place_id, user_id, rating, rating_wifi, rating_ambience, rating_plug, rating_price, body, visit_date, is_verified_visit)
VALUES
  (
    1,
    'add45705-9bb1-496b-9737-483012cf3b98',
    5, 5, 5, 5, 4,
    'Spot favorit kalau butuh fokus ngerjain tugas akhir! WiFi-nya stabil dan colokannya melimpah di setiap sudut.',
    CURRENT_DATE - INTERVAL '2 days',
    TRUE
  ),
  (
    2,
    'add45705-9bb1-496b-9737-483012cf3b98',
    5, 5, 5, 5, 4,
    'Super hening dan kursinya ergonomis banget. Cocok buat zoom meeting berjam-jam tanpa sakit pinggang.',
    CURRENT_DATE - INTERVAL '5 days',
    TRUE
  );

-- ============================================================
--  SELESAI!
--  Database `selasar-db` siap digunakan 100%
-- ============================================================
