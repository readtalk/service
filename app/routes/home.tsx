// app/routes/home.tsx
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "READTalk" },
    { name: "description", content: "Welcome to READTalk" },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  // Cek session sederhana (bisa ditingkatkan nanti)
  const cookie = request.headers.get("Cookie") || "";
  
  // Contoh sederhana: cek apakah ada token
  if (!cookie.includes("auth_token")) {
    return redirect("/welcome");
  }

  return { 
    message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE || "Welcome to ReadTalk!" 
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={loaderData.message} />;
}
