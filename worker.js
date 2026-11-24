import process from "node:process";

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const isApiRequest =
      pathname === "/api" ||
      pathname.startsWith("/api/") ||
      pathname === "/health/db";

    if (!isApiRequest) {
      return env.ASSETS.fetch(request);
    }

    if (!env.HYPERDRIVE?.connectionString) {
      return Response.json(
        { success: false, message: "Database binding is not configured." },
        { status: 503 },
      );
    }

    process.env.DATABASE_URL = env.HYPERDRIVE.connectionString;
    process.env.SELASAR_WORKER_RUNTIME = "cloudflare";
    const { default: app } = await import("./backend/src/app.ts");
    return app.fetch(request, env, ctx);
  },
};
