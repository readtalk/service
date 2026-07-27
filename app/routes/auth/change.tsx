// app/routes/auth/change.tsx
import type { Route } from "./+types/change-password";
import { Form, redirect } from "react-router";

// ============================================================
// LOADER — Cek jika belum login, redirect ke login
// ============================================================
export async function loader({ request }: Route.LoaderArgs) {
  // Cek session/cookie
  // Jika belum login, redirect ke /auth/login
  // return redirect("/auth/login");
  return null;
}

// ============================================================
// ACTION — Handle change password
// ============================================================
export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // 1. Validasi input
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields required" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  // 2. Panggil OpenAuth server untuk change password
  // const env = context.cloudflare?.env as Env;
  // ...

  // 3. Redirect ke /home setelah sukses
  // return redirect("/home");

  return { success: "Password changed successfully" };
}

// ============================================================
// KOMPONEN CHANGE PASSWORD
// ============================================================
export default function ChangePassword() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Change Password
        </h1>

        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              minLength={8}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Change Password
          </button>
        </Form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <a href="/home" className="text-blue-600 hover:underline">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
