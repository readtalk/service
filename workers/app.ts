// workers/app.ts
import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import authHandler from "./auth";     // ← import auth

const app = new Hono();

// OpenAuth routes
app.route("/auth", authHandler);

// Semua route lainnya ditangani React Router
app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
