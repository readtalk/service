import { Hono } from "hono";
import { createRequestHandler } from "react-router";

// Import auth
import authHandler from "./auth";

const app = new Hono();

// IMPORTANT: OpenAuth harus di atas
app.route("/auth", authHandler);

// React Router sebagai fallback
app.all("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
