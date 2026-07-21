import { Hono } from "hono";
import { createRequestHandler } from "react-router";

import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

const subjects = createSubjects({
  user: object({ id: string() }),
});

// === OpenAuth Handler ===
const authApp = new Hono();

authApp.all("*", async (c) => {
  const url = new URL(c.req.url);

  // Redirect root ke /authorize
  if (url.pathname === "/") {
    url.searchParams.set("redirect_uri", url.origin + "/callback");
    url.searchParams.set("client_id", "your-client-id"); // GANTI NANTI
    url.searchParams.set("response_type", "code");
    url.pathname = "/authorize";
    return c.redirect(url.toString());
  }

  // Callback sederhana
  if (url.pathname === "/callback") {
    return c.json({
      message: "OAuth flow complete!",
      params: Object.fromEntries(url.searchParams.entries()),
    });
  }

  // Jalankan OpenAuth Issuer
  const openAuth = issuer({
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
      logo: { 
        dark: "https://service.readtalk.workers.dev/logo.png", 
        light: "https://service.readtalk.workers.dev/logo.png" 
      },
    },
    success: async (ctx, value) => {
      const userId = await getOrCreateUser(c.env, value.email);
      return ctx.subject("user", { id: userId });
    },
  });

  return openAuth.fetch(c.req.raw, c.env, c.executionCtx);
});

// === Main App ===
const app = new Hono();

// Mount OpenAuth di /auth
app.route("/auth", authApp);

// React Router untuk semua halaman lain
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

// Helper function
async function getOrCreateUser(env: Env, email: string): Promise<string> {
  const result = await env.AUTH_DB.prepare(
    `INSERT INTO user (email) VALUES (?) ON CONFLICT (email) DO UPDATE SET email = email RETURNING id;`
  )
    .bind(email)
    .first<{ id: string }>();

  if (!result) throw new Error(`Unable to process user: ${email}`);
  return result.id;
}
