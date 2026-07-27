import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "READTalk" },
    { name: "description", content: "Welcome to READTalk" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  // Loader tetap mengambil data dari environment
  // Data user akan diambil oleh AuthContext di client
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  // Home meneruskan message ke Welcome
  return <Welcome message={loaderData.message} />;
}
