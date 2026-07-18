// app/routes.ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Halaman utama (dilindungi)
  index("routes/home.tsx"),
  
  // Rute autentikasi
  route("auth/authorize", "routes/auth/authorize.tsx"),
  route("auth/callback", "routes/auth/callback.tsx"),
  
  // Logout
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
