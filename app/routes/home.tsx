// app/routes/home.tsx
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { getSession, commitSession } from "~/services/session.server";
import { redirect } from "react-router";

export async function loader({ request, context }: Route.LoaderArgs) {
  // 1. Ambil session dari cookie
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  // 2. Jika tidak ada session, redirect ke login
  if (!userId) {
    throw redirect("/auth/authorize");
  }

  // 3. Ambil data user dari D1 (berdasarkan userId)
  const env = context.cloudflare?.env as Env;
  const user = await env.AUTH_DB.prepare(
    "SELECT id, email FROM user WHERE id = ?"
  )
    .bind(userId)
    .first<{ id: string; email: string }>();

  // 4. Jika user tidak ditemukan di DB, hapus session dan redirect ke login
  if (!user) {
    throw redirect("/auth/authorize", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // 5. Return data untuk komponen
  return { 
    message: env.VALUE_FROM_CLOUDFLARE || "Welcome!", 
    user 
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={loaderData.message} user={loaderData.user} />;
}
