// app/welcome/welcome.tsx
import type { Route } from "./+types/welcome";
import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

const subjects = createSubjects({
  user: object({ id: string() }),
});

// ============================================================
// LOADER: Jalankan OpenAuth server di sini
// ============================================================
export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare?.env as Env;
  const url = new URL(request.url);

  // Redirect root ke /authorize
  if (url.pathname === "/") {
    url.searchParams.set("redirect_uri", url.origin + "/callback");
    url.searchParams.set("client_id", "your-client-id");
    url.searchParams.set("response_type", "code");
    url.pathname = "/authorize";
    return new Response(null, {
      status: 302,
      headers: { Location: url.toString() },
    });
  }

  // Callback
  if (url.pathname === "/callback") {
    const code = url.searchParams.get("code");
    if (!code) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
    }
    // Redirect ke home setelah login
    return new Response(null, {
      status: 302,
      headers: { Location: "/home" },
    });
  }

  // OpenAuth issuer
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
      favicon: "https://service.readtalk.workers.dev/logo.png",
      logo: { dark: "https://service.readtalk.workers.dev/logo.png", light: "https://service.readtalk.workers.dev/logo.png" },
    },
    success: async (ctx, value) => {
      const userId = await getOrCreateUser(env, value.email);
      return ctx.subject("user", { id: userId });
    },
  }).fetch(request, env, context.ctx);
}

// ============================================================
// KOMPONEN WELCOME (tampilan setelah login)
// ============================================================
import { WelcomeUI } from "./WelcomeUI"; // Komponen presentasional

export default function Welcome() {
  // Komponen ini hanya akan dirender jika loader tidak redirect
  return <WelcomeUI />;
}

// ============================================================
// FUNGSI UTILITY
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

interface Env {
  AUTH_STORAGE: KVNamespace;
  AUTH_DB: D1Database;
}
