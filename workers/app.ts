import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";

const app = new Hono();

// 1. OpenAuth server
app.route("/auth", issuer({
  storage: CloudflareStorage({ namespace: env.AUTH_STORAGE }),
  subjects,
  providers: { password: PasswordProvider() },
  success: async (ctx, value) => { ... }
}));

// 2. React Router (handle semua request lain)
app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );
  return requestHandler(c.req.raw, { cloudflare: { env: c.env, ctx: c.executionCtx } });
});

export default app;
