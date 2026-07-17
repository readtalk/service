// ============================================================
// INTEGRASI: OpenAuth Server + React Router App
// ============================================================

import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";
import { createRequestHandler } from "@react-router/cloudflare";

// @ts-ignore - build/server akan dihasilkan saat `npm run build`
import * as build from "../build/server/index.js";

// ============================================================
// 1. KONFIGURASI OPEN AUTH
// ============================================================

const subjects = createSubjects({
  user: object({ id: string() }),
});

// ============================================================
// 2. FUNGSI UTAMA WORKER
// ============================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // --- ROUTING: OpenAuth Server ---
    // Semua request yang berhubungan dengan OpenAuth diarahkan ke sini
    if (
      url.pathname === "/authorize" ||
      url.pathname === "/callback" ||
      url.pathname === "/token" ||
      url.pathname === "/.well-known/openid-configuration" ||
      url.pathname.startsWith("/auth")
    ) {
      return handleOpenAuth(request, env, ctx);
    }

    // --- ROUTING: React Router App ---
    // Semua request lain (termasuk /, /home, /login, /logout, dll)
    // akan ditangani oleh React Router
    const requestHandler = createRequestHandler({
      build,
      getLoadContext: () => ({ env, ctx }),
    });
    return requestHandler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

// ============================================================
// 3. HANDLER OPEN AUTH
// ============================================================

async function handleOpenAuth(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);

  // --- CUSTOM HANDLER: /callback ---
  // Setelah user login sukses, OpenAuth akan redirect ke sini dengan code
  if (url.pathname === "/callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state") || "/";

    if (!code) {
      // Jika tidak ada code, redirect ke halaman login
      return Response.redirect("/auth/authorize", 302);
    }

    try {
      // 1. Tukar code dengan user data dari OpenAuth
      //    (ini adalah endpoint internal OpenAuth)
      const tokenResponse = await fetch(`${url.origin}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();
      
      // 2. Dapatkan user info dari token
      const userInfoResponse = await fetch(`${url.origin}/userinfo`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoResponse.ok) {
        throw new Error("Failed to get user info");
      }

      const userInfo = await userInfoResponse.json();

      // 3. Buat session cookie
      const sessionToken = crypto.randomUUID();
      const sessionData = {
        userId: userInfo.sub,
        email: userInfo.email,
        createdAt: Date.now(),
      };

      // Simpan session di KV (bisa juga di D1)
      await env.AUTH_STORAGE.put(
        `session:${sessionToken}`,
        JSON.stringify(sessionData),
        { expirationTtl: 60 * 60 * 24 * 7 } // 7 hari
      );

      // 4. Redirect ke React Router dengan cookie
      const headers = new Headers();
      headers.append("Location", state);
      headers.append(
        "Set-Cookie",
        `session=${sessionToken}; HttpOnly; Secure; Max-Age=${60 * 60 * 24 * 7}; Path=/`
      );

      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
      console.error("Callback error:", error);
      return Response.redirect("/auth/authorize?error=callback_failed", 302);
    }
  }

  // --- OPEN AUTH ISSUER ---
  // Untuk semua request OpenAuth lainnya, gunakan issuer default
  return issuer({
    storage: CloudflareStorage({
      namespace: env.AUTH_STORAGE,
    }),
    subjects,
    providers: {
      password: PasswordProvider(
        PasswordUI({
          sendCode: async (email, code) => {
            console.log(`[OpenAuth] Sending code ${code} to ${email}`);
            // TODO: Integrasi dengan email service (Resend, SendGrid, dll)
          },
          copy: {
            input_code: "Enter verification code",
            // Sesuaikan teks UI sesuai kebutuhan
          },
        }),
      ),
    },
    theme: {
      title: "ReadTalk Auth",
      primary: "#FF0000",
      favicon: "https://service.readtalk.workers.dev/logo.png",
      logo: {
        dark: "https://service.readtalk.workers.dev/logo.png",
        light: "https://service.readtalk.workers.dev/logo.png",
      },
    },
    // --- SUCCESS HANDLER ---
    // Ini akan dipanggil setelah user berhasil login di OpenAuth UI
    // Redirect ke /callback dengan code (default behavior OpenAuth)
    // Kita biarkan default, karena kita sudah handle /callback di atas
  }).fetch(request, env, ctx);
}

// ============================================================
// 4. FUNGSI UTILITY (untuk D1)
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

  console.log(`[DB] User ${result.id} (${email})`);
  return result.id;
}

// ============================================================
// 5. TYPE DEFINITIONS
// ============================================================

interface Env {
  AUTH_STORAGE: KVNamespace;
  AUTH_DB: D1Database;
  VALUE_FROM_CLOUDFLARE?: string;
  SESSION_SECRET?: string;
}

// ============================================================
// 6. CATATAN UNTUK DEPLOYMENT
// ============================================================
//
// 1. Pastikan React Router sudah di-build:
//    npm run build
//
// 2. Deploy Worker:
//    wrangler deploy
//
// 3. Environment variables yang dibutuhkan:
//    - SESSION_SECRET: untuk keamanan cookie
//    - VALUE_FROM_CLOUDFLARE: contoh value dari env
//
// 4. Pastikan D1 dan KV sudah terkonfigurasi di wrangler.jsonc
//
// ============================================================
