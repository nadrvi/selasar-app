# Selasar Backend REST API ☕

Backend server modern untuk **Selasar App** dibangun menggunakan **Hono.js**, terhubung langsung ke **PostgreSQL (`selasar-db` di Neon DB)** dan **Neon S3 Storage**.

---

## 📁 Struktur Direktori

```
selasar-backend/
├── .env                  # Environment variables & credentials
├── .env.example          # Template konfigurasi
├── package.json          # Dependencies & scripts
├── tsconfig.json         # Konfigurasi pemeriksaan tipe TypeScript
└── src/
    ├── index.ts          # Entry point server Hono & routing
    ├── config/
    │   ├── db.ts         # Connection pool PostgreSQL (Neon DB)
    │   └── s3.ts         # Client & presigned URL S3 (Neon Storage)
    ├── middleware/
    │   └── authentication.ts
    └── routes/
        ├── places.ts     # Endpoint spot nugas (katalog, search, filter, popular)
        ├── reviews.ts    # Endpoint rating & ulasan (sub-rating, helpful, photo)
        ├── bookmarks.ts  # Endpoint simpan / toggle favorit spot
        ├── checkins.ts   # Endpoint realtime check-in & checkout
        ├── users.ts      # Sync akun Firebase ke Postgres & profile stats
        ├── storage.ts    # Direct presigned URL upload ke Neon S3
        └── promos.ts     # Banner promo & event
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
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
AWS_REGION="ap-southeast-1"
S3_BUCKET_NAME="selasar-assets"

CLIENT_URL="http://localhost:5173"

# Authentication
# Generate a persistent secret with:
# node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
AUTH_TOKEN_SECRET=""
FIREBASE_PROJECT_ID="loginprojectregister"
```

> **Catatan:** Ganti `YOUR_PASSWORD` dan hostname Neon di `DATABASE_URL` dengan credential connection string Neon DB kamu.

`AUTH_TOKEN_SECRET` wajib diisi dengan secret acak minimal 32 byte di production.
Firebase Auth adalah sumber kebenaran untuk login email/password, verifikasi,
reset, dan perubahan kata sandi. Backend tidak memeriksa atau menyimpan password;
registrasi meminta Firebase ID token dan login menukarkan token terverifikasi
melalui `POST /api/auth/session`. Endpoint sesi hanya menerima user yang sudah
terdaftar di PostgreSQL; pendaftaran sosial dilakukan secara eksplisit melalui
`POST /api/auth/register/social`, sehingga login tidak membuat ulang user yang
telah dihapus dari database. Token sesi API berlaku 8 jam.
Semua endpoint yang mengubah data serta endpoint profil/bookmark/check-in pribadi
membutuhkan `Authorization: Bearer <token>`; identitas perubahan diambil dari token,
bukan dari ID user yang dikirim client.

Sebelum deploy, jalankan `npm run migrate:secure-seed-accounts` pada database yang
sudah pernah memakai seed lama. Migrasi ini menonaktifkan hanya akun seed yang
terdaftar dengan ID/email seed lama; file SQL seed baru juga tidak membuat akun
demo/admin yang dapat login. Jalankan juga `npm run migrate:clear-legacy-password-hashes`
untuk menghapus hash password PostgreSQL lama yang tidak lagi dipakai.

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

Backend menggunakan TypeScript dengan mode ketat. Jalankan `npm run typecheck`
untuk memeriksa tipe dan `npm test` untuk menjalankan tes. Runtime dan skrip
migrasi dijalankan melalui `tsx`.

Server Hono yang sama juga diekspor dari `src/app.ts` untuk entry point
Cloudflare Worker. Konfigurasi deploy full-stack dan langkah Hyperdrive berada
di bagian **Deploy to Cloudflare** pada README root.

---

## 📡 Daftar Endpoint REST API

### 1. Health & Status
- `GET /` — Cek status server API
- `GET /health/db` — Tes koneksi ke database `selasar-db`

### 2. Authentication
- `POST /api/auth/register` — Simpan profil setelah Firebase membuat akun
- `POST /api/auth/register/social` — Daftarkan akun Google/Facebook/GitHub
- `POST /api/auth/session` — Tukar Firebase ID token terverifikasi dengan token API
- `POST /api/auth/logout` — Cabut sesi API aktif; logout client tetap menghapus sesi lokal jika server gagal
- `POST /api/auth/login` — Endpoint lama; login password backend sudah dinonaktifkan
- `POST /api/auth/change-password` — Endpoint lama; perubahan password dilakukan di Firebase

### 3. Places (Spot Nugas)
- `GET /api/places` — Ambil semua spot (support query: `?city=Jakarta&category=Cafe&mood=Fokus&q=nalar&sort=rating`)
- `GET /api/places/popular` — Top spot populer berdasarkan skor gabungan
- `GET /api/places/:id` — Detail spot (berdasarkan ID atau Slug)

### 4. Reviews & Ratings
- `GET /api/reviews/place/:placeId` — Ambil halaman ulasan & ringkasan; mendukung `sort`, `limit` (maks. 100), dan `offset` (maks. 10000)
- `POST /api/reviews` — Tambah / edit ulasan dengan sub-rating (WiFi, suasana, colokan, harga)
- `POST /api/reviews/:id/helpful` — Toggle voting "Ulasan ini membantu"

### 5. Bookmarks (Favorit)
- `GET /api/bookmarks/:firebaseUid` — Ambil daftar spot yang disimpan oleh user
- `POST /api/bookmarks/toggle` — Simpan atau hapus spot favorit

### 6. Check-ins Realtime
- `GET /api/checkins/place/:placeId` — Daftar pengunjung yang sedang aktif nugas
- `POST /api/checkins/in` — Check-in ke spot
- `POST /api/checkins/out` — Check-out dari spot

### 7. Users & Gamification
- `POST /api/users/sync` — Endpoint lama; sinkronisasi akun langsung dinonaktifkan
- `GET /api/users/:firebaseUid/profile` — Profil lengkap, statistik & badge yang diraih

### 8. File Storage (Neon S3)
- `POST /api/storage/presigned-url` — Request URL upload langsung client-ke-S3 untuk foto ulasan atau avatar
  - Upload menggunakan `POST` multipart/form-data ke URL yang dikembalikan, sertakan seluruh `fields` respons dan file.
  - Maksimum 5 MiB; hanya JPEG, PNG, WebP, dan GIF; folder hanya `reviews` atau `avatars`.

## Upgrade backend hardening

Sebelum deploy versi ini pada database yang sudah berisi data, buat backup lalu jalankan
migrasi satu kali dari folder `backend` dengan `DATABASE_URL` yang menunjuk ke database target:

```sh
npm run migrate:harden-backend
```

Migrasi menyiapkan tabel sesi/rate-limit dan memastikan hanya ada satu check-in aktif per
pengguna. Deploy backend setelah migrasi berhasil. Token API lama tidak memiliki entri
sesi server-side dan mengharuskan pengguna login kembali. Jangan jalankan
`selasar_database.sql` pada database yang sudah terisi; file tersebut hanya untuk
bootstrap database baru.

### 9. Promos
- `GET /api/promos` — Banner promo dan event aktif
