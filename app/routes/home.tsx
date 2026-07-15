import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "READTalk" },
    { name: "description", content: "Welcome to READTalk Messenger!" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  const res = await fetch("https://service.readtalk.workers.dev/me", {
    headers: {
      "Cookie": request.headers.get("Cookie") ?? ""
    }
  });

  if (res.status === 401) {
    
    return redirect("https://service.readtalk.workers.dev/");
  }

  const user = await res.json(); // { id, email }
  return user;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome user={loaderData} />;
}
