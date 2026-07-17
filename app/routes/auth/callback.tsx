// app/routes/auth/callback.tsx
import type { Route } from "./+types/callback";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "/";

  if (!code) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  }

  // TODO: Tukar code dengan session
  // Untuk sekarang redirect ke home
  return new Response(null, {
    status: 302,
    headers: { Location: state },
  });
}
