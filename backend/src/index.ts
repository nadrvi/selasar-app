import "dotenv/config";

import { serve } from "@hono/node-server";
import process from "node:process";
import app from "./app.ts";
import * as db from "./config/db.ts";
import { logServerError } from "./utils/errors.ts";

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
  logServerError("http.server.error", err);
  process.exit(1);
});

let shuttingDown = false;

const shutdown = (signal: string, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n${signal} received. Shutting down Selasar Backend gracefully...`);

  setTimeout(() => {
    console.error("Shutdown timeout (10s), forcing exit.");
    process.exit(1);
  }, 10_000).unref();

  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      await db.pool?.end?.();
      console.log("Database pool closed.");
    } catch (err) {
      logServerError("db.pool.close_error", err);
    }
    process.exit(exitCode);
  });

  if ("closeIdleConnections" in server && typeof server.closeIdleConnections === "function") {
    server.closeIdleConnections();
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logServerError("process.unhandled_rejection", reason);
});

process.on("uncaughtException", (err) => {
  logServerError("process.uncaught_exception", err);
  shutdown("uncaughtException", 1);
});
