import "dotenv/config";

import { serve } from "@hono/node-server";
import process from "node:process";
import app from "./app.js";
import * as db from "./config/db.js";

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
