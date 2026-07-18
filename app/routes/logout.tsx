// app/routes/logout.tsx
import type { Route } from "./+types/logout";
import { getSession, destroySession } from "~/services/session.server";
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  
  // Hapus session dan redirect ke halaman login
  return redirect("/auth/authorize", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
