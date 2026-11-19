import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { randomUUID } from "node:crypto";
import process from "node:process";

import * as db from "./config/db.js";
import { createAuthenticationMiddleware } from "./middleware/authentication.js";
import { authRouter } from "./routes/auth.js";
import { bookmarksRouter } from "./routes/bookmarks.js";
import { checkinsRouter } from "./routes/checkins.js";
import { placesRouter } from "./routes/places.js";
import { promosRouter } from "./routes/promos.js";
import { reviewsRouter } from "./routes/reviews.js";
import { storageRouter } from "./routes/storage.js";
import { usersRouter } from "./routes/users.js";

const { query } = db;

const app = new Hono();
const isProduction = process.env.NODE_ENV === "production";
const GENERIC_ERROR = "Terjadi kesalahan internal pada server";

// Parse comma-separated allowed origins from CLIENT_URL
// (e.g., "https://selasar.app,https://staging.selasar.app").
// Trailing slash dibuang karena header Origin browser tidak pernah pakai slash di belakang.
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// Peringatan konfigurasi saat startup
if (!process.env.NODE_ENV) {
  console.warn(
    "[CONFIG] NODE_ENV belum di-set. Server jalan dalam mode non-production: " +
      "origin localhost diizinkan dan pesan error asli bisa terlihat. " +
      "Set NODE_ENV=production di server deploy."
  );
}
if (isProduction && allowedOrigins.length === 0) {
  console.warn(
    "[CONFIG] CLIENT_URL kosong di production. Semua request dari browser akan ditolak CORS."
  );
}

// Global Middlewares
app.use("*", logger());
app.use("*", async (c, next) => {
  c.set("requestId", randomUUID());
  c.header("X-Request-ID", c.get("requestId"));
  await next();
});

// crossOriginResourcePolicy "cross-origin" supaya gambar/file dari storageRouter
// tetap bisa dimuat lewat <img> oleh frontend yang beda origin.
app.use("*", secureHeaders({ crossOriginResourcePolicy: "cross-origin" }));

// Strict CORS Configuration
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow non-browser clients (e.g., curl, Postman, server-to-server)
      if (!origin) return null;

      if (!isProduction && localhostRegex.test(origin)) {
        return origin;
      }

      if (allowedOrigins.includes(origin)) {
        return origin;
      }

      // Reject unauthorized origins
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.use("/api/auth/*", bodyLimit({ maxSize: 16 * 1024 }));
app.use("/api/*", createAuthenticationMiddleware(query));

// Jaring pengaman: di production, semua balasan JSON berstatus 500 dipaksa pakai
// pesan generik. Ini menutup kebocoran err.message dari router yang masih punya
// try/catch sendiri. Detail aslinya tetap masuk log server.
app.use("*", async (c, next) => {
  await next();

  if (!isProduction || c.res.status !== 500) return;
  if (!c.res.headers.get("content-type")?.includes("application/json")) return;

  const body = await c.res.clone().json().catch(() => null);
  if (!body || body.message === GENERIC_ERROR) return;

  console.error(
    JSON.stringify({
      event: "http.server_error",
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      message: body.message,
    }),
  );
  c.res = c.json({ success: false, message: GENERIC_ERROR }, 500);
});

// Health Check Endpoints
app.get("/", (c) => {
  return c.json({
    success: true,
    status: "online",
    service: "Selasar REST API",
    framework: "Hono.js",
    version: "1.3.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/db", async (c) => {
  const res = await query(
    "SELECT NOW() AS server_time, current_database() AS db_name"
  );
  return c.json({
    success: true,
    status: "connected",
    ...(isProduction
      ? {}
      : {
          database: res.rows[0].db_name,
          time: res.rows[0].server_time,
        }),
  });
});

// Metadata / Lookup Endpoints (errors automatically bubble to app.onError)
app.get("/api/cities", async (c) => {
  const result = await query(
    "SELECT id, name, province, lat, lng FROM cities WHERE is_active = TRUE ORDER BY id ASC"
  );
  return c.json({ success: true, data: result.rows });
});

app.get("/api/tags", async (c) => {
  const result = await query(
    "SELECT id, name, color_hex FROM tags ORDER BY id ASC"
  );
  return c.json({ success: true, data: result.rows });
});

app.get("/api/badges", async (c) => {
  const result = await query(
    "SELECT id, code, name, description, icon_emoji FROM badges ORDER BY id ASC"
  );
  return c.json({ success: true, data: result.rows });
});

// Mount Resource Routes
app.route("/api/auth", authRouter);
app.route("/api/places", placesRouter);
app.route("/api/reviews", reviewsRouter);
app.route("/api/bookmarks", bookmarksRouter);
app.route("/api/checkins", checkinsRouter);
app.route("/api/users", usersRouter);
app.route("/api/storage", storageRouter);
app.route("/api/promos", promosRouter);

// Global 404 Handler
app.notFound((c) => {
  return c.json(
    { success: false, message: `Route ${c.req.path} tidak ditemukan` },
    404
  );
});

// Global Error Handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.message }, err.status);
  }

  console.error("Unhandled server error:", err);

  return c.json(
    {
      success: false,
      message: isProduction
        ? GENERIC_ERROR
        : err.message || "Terjadi kesalahan pada server",
    },
    500
  );
});

// Start Server & Graceful Shutdown
const port = Number(process.env.PORT) || 4000;

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`☕ Selasar Backend is running on http://localhost:${info.port}`);
  }
);

server.on("error", (err) => {
  console.error("Server error:", err.message);
  process.exit(1);
});

let shuttingDown = false;

const shutdown = (signal, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n${signal} received. Shutting down Selasar Backend gracefully...`);

  // Paksa keluar kalau ada koneksi yang menggantung terlalu lama
  setTimeout(() => {
    console.error("Shutdown timeout (10s), forcing exit.");
    process.exit(1);
  }, 10_000).unref();

  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      // Aktif kalau config/db.js meng-export `pool` (export const pool = ...)
      await db.pool?.end?.();
      console.log("Database pool closed.");
    } catch (err) {
      console.error("Failed to close database pool:", err.message);
    }
    process.exit(exitCode);
  });

  server.closeIdleConnections?.();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown("uncaughtException", 1);
});