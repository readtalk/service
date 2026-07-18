// app/routes/auth/authorize.tsx
import type { Route } from "./+types/authorize";

// Import dinamis di dalam loader (server-only)
export async function loader({ request, context }: Route.LoaderArgs) {
  // Semua import OpenAuth di-dalam loader
  const { issuer } = await import("@openauthjs/openauth");
  const { CloudflareStorage } = await import("@openauthjs/openauth/storage/cloudflare");
  const { PasswordProvider } = await import("@openauthjs/openauth/provider/password");
  const { PasswordUI } = await import("@openauthjs/openauth/ui/password");
  const { createSubjects } = await import("@openauthjs/openauth/subject");
  const { object, string } = await import("valibot");

  const subjects = createSubjects({
    user: object({ id: string() }),
  });

  const env = context.cloudflare?.env as Env;

  return issuer({
    storage: CloudflareStorage({ namespace: env.AUTH_STORAGE }),
    subjects,
    providers: {
      password: PasswordProvider(
        PasswordUI({
          sendCode: async (email, code) => {
            console.log(`[OpenAuth] Sending code ${code} to ${email}`);
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
      const userId = await getOrCreateUser(env, value.email);
      return ctx.subject("user", { id: userId });
    },
  }).fetch(request, env, context.ctx);
}

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
