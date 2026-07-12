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

const app = new Hono();

// ============================================================
// 🔥 OPENAUTH ROUTES
// ============================================================

// Root → redirect ke /authorize
app.get("/", (c) => {
  const url = new URL(c.req.url);
  url.searchParams.set("redirect_uri", url.origin + "/callback");
  url.searchParams.set("client_id", "your-client-id");
  url.searchParams.set("response_type", "code");
  url.pathname = "/authorize";
  return c.redirect(url.toString());
});

// Callback
app.get("/callback", (c) => {
  return c.json({
    message: "OAuth flow complete!",
    params: Object.fromEntries(new URL(c.req.url).searchParams.entries()),
  });
});

// ============================================================
// 🔥 OPENAUTH ISSUER (dengan redirect ke / setelah login)
// ============================================================
app.get("/authorize", async (c) => {
  const request = c.req.raw;
  const env = c.env;
  const ctx = c.executionCtx;

  return issuer({
    storage: CloudflareStorage({ namespace: env.AUTH_STORAGE }),
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
      favicon: "#",
      logo: { dark: "#", light: "#" },
    },
    success: async (ctx, value) => {
      const userId = await getOrCreateUser(env, value.email);
      
      // 🔥 REDIRECT KE / (HALAMAN UTAMA) SETELAH LOGIN
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `userId=${userId}; HttpOnly; Max-Age=${60 * 60 * 24 * 7}; Path=/`,
        },
      });
    },
  }).fetch(request, env, ctx);
});

// ============================================================
// 🔥 REACT ROUTER (menangani semua request lainnya)
// ============================================================
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

// ============================================================
// 🔥 HELPER FUNCTIONS
// ============================================================

async function getOrCreateUser(env: Env, email: string): Promise<string> {
  const result = await env.AUTH_DB.prepare(
    `
    INSERT INTO user (email)
    VALUES (?)
    ON CONFLICT (email) DO UPDATE SET email = email
    RETURNING id;
    `
  )
    .bind(email)
    .first<{ id: string }>();

  if (!result) {
    throw new Error(`Unable to process user: ${email}`);
  }

  console.log(`Found or created user ${result.id} with email ${email}`);
  return result.id;
}
