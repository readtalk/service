// app/routes/home.tsx
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

// --- FUNGSI UTILITY UNTUK MENDAPATKAN USER (SEMENTARA) ---
// Nanti akan dipindah ke services/auth.server.ts
async function getUserFromSession(request: Request, env: Env) {
  // 1. Ambil cookie/session dari request
  // 2. Validasi token
  // 3. Ambil data user dari D1
  // Untuk sekarang, return mock data
  return { id: "user-1", email: "user@example.com" };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "READTalk" },
    { name: "description", content: "Welcome to READTalk" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare?.env as Env;
  
  // 1. Ambil data user dari session
  const user = await getUserFromSession(request, env);
  
  // 2. Ambil message dari environment
  const message = env.VALUE_FROM_CLOUDFLARE || "Welcome!";
  
  // 3. Kembalikan user + message
  return { user, message };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  // Teruskan user dan message ke Welcome
  return <Welcome user={loaderData.user} message={loaderData.message} />;
}

interface Env {
  VALUE_FROM_CLOUDFLARE?: string;
  AUTH_DB: D1Database;
}
