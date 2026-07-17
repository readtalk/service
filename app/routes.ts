// app/routes.ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth/authorize", "routes/auth/authorize.tsx"),
  route("auth/callback", "routes/auth/callback.tsx"),
] satisfies RouteConfig;
