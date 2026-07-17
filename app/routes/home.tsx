// app/routes/home.tsx
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

// ============================================================
// META: Judul & Deskripsi Halaman
// ============================================================

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ReadTalk - Home" },
    { name: "description", content: "Welcome to ReadTalk Messenger!" },
  ];
}

// ============================================================
// LOADER: Ambil data user dari cookie/session
// ============================================================

export async function loader({ request, context }: Route.LoaderArgs) {
  // 1. Ambil cookie dari request
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").filter(Boolean).map((c) => {
      const [key, ...val] = c.split("=");
      return [key, val.join("=")];
    })
  );

  // 2. Cek apakah ada session userId di cookie
  const userId = cookies.userId;

  // 3. Jika tidak ada session, redirect ke halaman login
  if (!userId) {
    // Redirect ke root (yang akan redirect ke /authorize)
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  }

  // 4. Ambil data user dari D1
  const env = context.cloudflare?.env as Env;
  const user = await env.AUTH_DB.prepare(
    "SELECT id, email FROM user WHERE id = ?"
  )
    .bind(userId)
    .first<{ id: string; email: string }>();

  // 5. Jika user tidak ditemukan, redirect ke login
  if (!user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  }

  // 6. Kembalikan data user ke komponen
  return { user };
}

// ============================================================
// KOMPONEN HOME
// ============================================================

export default function Home({ loaderData }: Route.ComponentProps) {
  // Data dari loader
  const { user } = loaderData;

  // Kirim ke komponen Welcome
  return <Welcome message="Welcome to ReadTalk!" user={user} />;
}

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface Env {
  AUTH_STORAGE: KVNamespace;
  AUTH_DB: D1Database;
  VALUE_FROM_CLOUDFLARE?: string;
}
