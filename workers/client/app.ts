import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import authApp from "./server/app";

const app = new Hono();

app.route("/authorize", authApp);

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
