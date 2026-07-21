import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import authHandler from "./auth-handler";

const app = new Hono();

// OpenAuth Routes
app.route("/auth", authHandler);

// React Router frontend
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
