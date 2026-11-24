import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { randomUUID } from "node:crypto";
import process from "node:process";

import * as db from "./config/db.ts";
import { logServerError } from "./utils/errors.ts";
import { createAuthenticationMiddleware } from "./middleware/authentication.ts";
import { authRouter } from "./routes/auth.ts";
import { bookmarksRouter } from "./routes/bookmarks.ts";
import { checkinsRouter } from "./routes/checkins.ts";
import { placesRouter } from "./routes/places.ts";
import { promosRouter } from "./routes/promos.ts";
import { reviewsRouter } from "./routes/reviews.ts";
import { storageRouter } from "./routes/storage.ts";
import { usersRouter } from "./routes/users.ts";

const { query } = db;

const app = new Hono();
const isProduction = process.env.NODE_ENV === "production";
const GENERIC_ERROR = "Terjadi kesalahan internal pada server";

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

if (!process.env.NODE_ENV) {
  console.warn(
    "[CONFIG] NODE_ENV belum di-set. Server jalan dalam mode non-production: " +
      "origin localhost diizinkan dan pesan error asli bisa terlihat. " +
      "Set NODE_ENV=production di server deploy."
  );
}
if (isProduction && allowedOrigins.length === 0) {
  console.warn(
    "[CONFIG] CLIENT_URL kosong di production. Request lintas-origin ditolak CORS."
  );
}

app.use("*", logger());
app.use("*", async (c, next) => {
  c.set("requestId", randomUUID());
  c.header("X-Request-ID", c.get("requestId"));
  await next();
});

app.use("*", secureHeaders({ crossOriginResourcePolicy: "cross-origin" }));

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return null;

      if (!isProduction && localhostRegex.test(origin)) {
        return origin;
      }

      if (allowedOrigins.includes(origin)) {
        return origin;
      }

      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.use("/api/*", bodyLimit({ maxSize: 64 * 1024 }));
app.use("/api/*", createAuthenticationMiddleware(query));

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

app.get("/api/health", (c) => {
  return c.json({
    success: true,
    status: "online",
    service: "Selasar REST API",
    framework: "Hono.js",
    version: "1.3.0",
    timestamp: new Date().toISOString(),
  });
});

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

app.route("/api/auth", authRouter);
app.route("/api/places", placesRouter);
app.route("/api/reviews", reviewsRouter);
app.route("/api/bookmarks", bookmarksRouter);
app.route("/api/checkins", checkinsRouter);
app.route("/api/users", usersRouter);
app.route("/api/storage", storageRouter);
app.route("/api/promos", promosRouter);

app.notFound((c) => {
  return c.json(
    { success: false, message: `Route ${c.req.path} tidak ditemukan` },
    404
  );
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.message }, err.status);
  }

  logServerError("http.unhandled_error", err);

  return c.json(
    {
      success: false,
      message: GENERIC_ERROR,
    },
    500
  );
});

export default app;
