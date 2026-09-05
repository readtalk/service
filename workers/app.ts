import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

const app = new Hono();
const subjects = createSubjects({ user: object({ id: string() }) });

// ==================== OPENAUTH HANDLER (DI DALAM ROUTE) ====================
app.get("/auth/*", async (c) => {
  const authHandler = issuer({
    storage: CloudflareStorage({ namespace: c.env.AUTH_STORAGE }),
    subjects,
    providers: {
      password: PasswordProvider(
        PasswordUI({
          sendCode: async (email, code) => {
            console.log(`Sending code ${code} to ${email}`);
          },
          copy: { input_code: "Code (check Worker logs)" },
        }),
      ),
    },
    theme: {
      title: "Authentication",
      primary: "#FF0000",
      favicon: "https://service.readtalk.workers.dev/logo.png",
      logo: { dark: "https://service.readtalk.workers.dev/logo.png", light: "https://service.readtalk.workers.dev/logo.png" },
    },
    success: async (ctx, value) => {
      const userId = await getOrCreateUser(c.env, value.email);
      return ctx.subject("user", { id: userId });
    },
  });

  return authHandler.fetch(c.req.raw, c.env, c.executionCtx);
});

// ==================== REACT ROUTER ====================
app.get("*", async (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );
  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

async function getOrCreateUser(env: Env, email: string): Promise<string> {
  const result = await env.AUTH_DB.prepare(
    `INSERT INTO user (email) VALUES (?) ON CONFLICT (email) DO UPDATE SET email = email RETURNING id;`
  )
    .bind(email)
    .first<{ id: string }>();
  if (!result) throw new Error(`Unable to process user: ${email}`);
  return result.id;
}

export default app;
