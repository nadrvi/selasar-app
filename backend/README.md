# Selasar Backend REST API ☕

Backend server modern untuk **Selasar App** dibangun menggunakan **Hono.js**, terhubung langsung ke **PostgreSQL (`selasar-db` di Neon DB)** dan **Neon S3 Storage**.

---

## 📁 Struktur Direktori

```
selasar-backend/
├── .env                  # Environment variables & credentials
├── .env.example          # Template konfigurasi
├── package.json          # Dependencies & scripts
└── src/
    ├── index.js          # Entry point server Hono & routing
    ├── config/
    │   ├── db.js         # Connection pool PostgreSQL (Neon DB)
    │   └── s3.js         # Client & presigned URL S3 (Neon Storage)
    └── routes/
        ├── places.js     # Endpoint spot nugas (katalog, search, filter, popular)
        ├── reviews.js    # Endpoint rating & ulasan (sub-rating, helpful, photo)
        ├── bookmarks.js  # Endpoint simpan / toggle favorit spot
        ├── checkins.js   # Endpoint realtime check-in & checkout
        ├── users.js      # Sync akun Firebase ke Postgres & profile stats
        ├── storage.js    # Direct presigned URL upload ke Neon S3
        └── promos.js     # Banner promo & event
```

---

## ⚙️ Konfigurasi `.env`

File `.env` sudah disiapkan di folder `selasar-backend/.env` dengan parameter:

```env
PORT=4000
NODE_ENV=development

# Masukkan password database Neon DB kamu pada DATABASE_URL
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-selasar.ap-southeast-1.aws.neon.tech/selasar-db?sslmode=require"

# Neon S3 Storage
AWS_ENDPOINT_URL_S3="https://br-falling-fog-b3nc922j.storage.c-4.ap-southeast-1.aws.neon.tech"
AWS_ACCESS_KEY_ID="nak_live_0b34bfa910f04651ab999b164c94ee2a"
AWS_SECRET_ACCESS_KEY="*************"
AWS_REGION="ap-southeast-1"
S3_BUCKET_NAME="selasar-assets"

CLIENT_URL="http://localhost:5173"
```

> **Catatan:** Ganti `YOUR_PASSWORD` dan hostname Neon di `DATABASE_URL` dengan credential connection string Neon DB kamu.

---

## 🚀 Cara Menjalankan Server

1. Masuk ke folder backend:
   ```bash
   cd selasar-backend
   ```
2. Jalankan mode development:
   ```bash
   npm run dev
   ```
3. Server akan aktif di `http://localhost:4000`

---

## 📡 Daftar Endpoint REST API

### 1. Health & Status
- `GET /` — Cek status server API
- `GET /health/db` — Tes koneksi ke database `selasar-db`

### 2. Places (Spot Nugas)
- `GET /api/places` — Ambil semua spot (support query: `?city=Jakarta&category=Cafe&mood=Fokus&q=nalar&sort=rating`)
- `GET /api/places/popular` — Top spot populer berdasarkan skor gabungan
- `GET /api/places/:id` — Detail spot (berdasarkan ID atau Slug)

### 3. Reviews & Ratings
- `GET /api/reviews/place/:placeId` — Ambil seluruh ulasan & ringkasan bintang
- `POST /api/reviews` — Tambah / edit ulasan dengan sub-rating (WiFi, suasana, colokan, harga)
- `POST /api/reviews/:id/helpful` — Toggle voting "Ulasan ini membantu"

### 4. Bookmarks (Favorit)
- `GET /api/bookmarks/:firebaseUid` — Ambil daftar spot yang disimpan oleh user
- `POST /api/bookmarks/toggle` — Simpan atau hapus spot favorit

### 5. Check-ins Realtime
- `GET /api/checkins/place/:placeId` — Daftar pengunjung yang sedang aktif nugas
- `POST /api/checkins/in` — Check-in ke spot
- `POST /api/checkins/out` — Check-out dari spot

### 6. Users & Gamification
- `POST /api/users/sync` — Sinkronisasi akun saat user login/register di frontend
- `GET /api/users/:firebaseUid/profile` — Profil lengkap, statistik & badge yang diraih

### 7. File Storage (Neon S3)
- `POST /api/storage/presigned-url` — Request URL upload langsung client-ke-S3 untuk foto ulasan atau avatar

### 8. Promos
- `GET /api/promos` — Banner promo dan event aktif
