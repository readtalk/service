import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";
import { Hono } from "hono";
import { createRequestHandler } from "react-router";

// ============================================================
// 🔥 SUBJECTS (dengan email)
// ============================================================
const subjects = createSubjects({
  user: object({
    id: string(),
    email: string(),
  }),
});

// ============================================================
// 🔥 HONO APP
// ============================================================
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

// Callback → return JSON
app.get("/callback", (c) => {
  return c.json({
    message: "OAuth flow complete!",
    params: Object.fromEntries(new URL(c.req.url).searchParams.entries()),
  });
});

// ============================================================
// 🔥 API ENDPOINT: /api/user
// ============================================================
app.get("/api/user", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return c.json({ error: "Invalid token" }, 401);
  }

  // 🔥 Verifikasi token dengan OpenAuth
  const verified = await client.verify(subjects, token);
  if (verified.err) {
    return c.json({ error: "Invalid token" }, 401);
  }

  // 🔥 Ambil data user dari D1
  const userId = verified.subject.properties.id;
  const user = await c.env.AUTH_DB.prepare(
    "SELECT id, email FROM user WHERE id = ?"
  )
    .bind(userId)
    .first<{ id: string; email: string }>();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: user.id,
    email: user.email,
  });
});

// ============================================================
// 🔥 OPENAUTH ISSUER (menangani /authorize)
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
      // 🔥 Kirim id + email di subject
      return ctx.subject("user", {
        id: userId,
        email: value.email,
      });
    },
  }).fetch(request, env, ctx);
});

// ============================================================
// 🔥 REACT ROUTER (semua request lain)
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
    `INSERT INTO user (email) VALUES (?) ON CONFLICT (email) DO UPDATE SET email = email RETURNING id;`
  )
    .bind(email)
    .first<{ id: string }>();
  if (!result) throw new Error(`Unable to process user: ${email}`);
  return result.id;
}
