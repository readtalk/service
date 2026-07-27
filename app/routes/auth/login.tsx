// app/routes/auth/login.tsx
import type { Route } from "./+types/login";
import { Form, redirect } from "react-router";

// ============================================================
// LOADER — Cek jika sudah login, redirect ke home
// ============================================================
export async function loader({ request }: Route.LoaderArgs) {
  // Cek session/cookie
  // Jika sudah login, redirect ke /home
  // return redirect("/home");
  return null;
}

// ============================================================
// ACTION — Handle login
// ============================================================
export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Validasi input
  if (!email || !password) {
    return { error: "Email and password required" };
  }

  // 2. Panggil OpenAuth server untuk login
  // const env = context.cloudflare?.env as Env;
  // const result = await fetch("/authorize", { ... });

  // 3. Redirect ke /home setelah login sukses
  // return redirect("/home");

  return { error: "Invalid credentials" };
}

// ============================================================
// KOMPONEN LOGIN
// ============================================================
export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Login to READTalk
        </h1>

        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Login
          </button>
        </Form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <a href="/auth/register" className="text-blue-600 hover:underline">
            Register
          </a>
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <a href="/auth/change-password" className="text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
