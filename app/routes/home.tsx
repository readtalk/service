// app/routes/home.tsx
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { redirect } from "react-router";

// ============================================================
// LOADER: Memeriksa session & mengambil data user
// ============================================================

export async function loader({ request, context }: Route.LoaderArgs) {
  // 1. Ambil cookie dari request
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = cookieHeader?.match(/session=([^;]+)/)?.[1];

  // 2. Jika tidak ada session, redirect ke OpenAuth
  if (!sessionToken) {
    throw redirect("/auth/authorize");
  }

  // 3. Verifikasi session di KV
  const env = context.cloudflare?.env as Env;
  const sessionData = await env.AUTH_STORAGE.get(`session:${sessionToken}`);

  if (!sessionData) {
    // Session tidak valid atau expired
    throw redirect("/auth/authorize");
  }

  // 4. Parse data user dari session
  const user = JSON.parse(sessionData) as { userId: string; email: string };

  // 5. Ambil message dari environment (opsional)
  const message = env.VALUE_FROM_CLOUDFLARE || "Welcome to ReadTalk!";

  return { user, message };
}

// ============================================================
// KOMPONEN HOME (tetap sama seperti sebelumnya)
// ============================================================

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={loaderData.message} user={loaderData.user} />;
}

// ============================================================
// META (tetap sama)
// ============================================================

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ReadTalk - Home" },
    { name: "description", content: "Welcome to ReadTalk Messenger!" },
  ];
}

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface Env {
  AUTH_STORAGE: KVNamespace;
  AUTH_DB: D1Database;
  VALUE_FROM_CLOUDFLARE?: string;
}
