import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

const subjects = createSubjects({
  user: object({ id: string() }),
});

const app = new Hono();

// 1. OpenAuth server (handle /auth/*)
app.route("/auth", issuer({
  storage: CloudflareStorage({ namespace: env.AUTH_STORAGE }),
  subjects,
  providers: { password: PasswordProvider() },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      const userId = await getOrCreateUser(env, value.email);
      return ctx.subject("user", { id: userId });
    }
    throw new Error("Invalid provider");
  }
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

// 3. Fungsi getOrCreateUser (tetap sama)
async function getOrCreateUser(env: Env, email: string): Promise<string> {
  const result = await env.AUTH_DB.prepare(
    `INSERT INTO user (email) VALUES (?) ON CONFLICT (email) DO UPDATE SET email = email RETURNING id;`
  )
    .bind(email)
    .first<{ id: string }>();
  if (!result) throw new Error(`Unable to process user: ${email}`);
  return result.id;
}

interface Env {
  AUTH_STORAGE: KVNamespace;
  AUTH_DB: D1Database;
}
