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

// 🔥 Root → redirect ke /password/authorize
app.get("/", (c) => {
  return c.redirect("/password/authorize");
});

// 🔥 OpenAuth issuer (menangani /password/*)
app.get("/password/*", async (c) => {
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
      // 🔥 Redirect ke / (halaman utama) setelah login
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/welcome",
          "Set-Cookie": `userId=${userId}; HttpOnly; Max-Age=${60 * 60 * 24 * 7}; Path=/`,
        },
      });
    },
  }).fetch(request, env, ctx);
});

// 🔥 React Router (semua request lain)
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

async function getOrCreateUser(env: Env, email: string): Promise<string> {
  const result = await env.AUTH_DB.prepare(
    `INSERT INTO user (email) VALUES (?) ON CONFLICT (email) DO UPDATE SET email = email RETURNING id;`
  )
    .bind(email)
    .first<{ id: string }>();
  if (!result) throw new Error(`Unable to process user: ${email}`);
  return result.id;
}
