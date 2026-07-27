// app/welcome/welcome.tsx
import { useAuth } from "~/context/AuthContext";
import logoDark from "./logo.svg";
import logoLight from "./logo.svg";

export function Welcome({ message }: { message: string }) {
  const auth = useAuth();

  // ============================================================
  // LOADING
  // ============================================================
  if (!auth.loaded) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  // ============================================================
  // BELUM LOGIN → TAMPILKAN TOMBOL LOGIN
  // ============================================================
  if (!auth.loggedIn) {
    return (
      <main className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-[200px] mx-auto">
            <img
              src={logoLight}
              alt="Logo"
              className="block w-full dark:hidden"
            />
            <img
              src={logoDark}
              alt="Logo"
              className="hidden w-full dark:block"
            />
          </div>
          <h1 className="text-2xl font-bold">Welcome to READTalk</h1>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
          <button
            onClick={auth.login}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Login with OAuth
          </button>
        </div>
      </main>
    );
  }

  // ============================================================
  // SUDAH LOGIN → TAMPILKAN DASHBOARD
  // ============================================================
  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="w-[200px] mx-auto">
          <img
            src={logoLight}
            alt="Logo"
            className="block w-full dark:hidden"
          />
          <img
            src={logoDark}
            alt="Logo"
            className="hidden w-full dark:block"
          />
        </div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Logged in as <strong>{auth.userId}</strong>
        </p>
        <div className="space-y-3">
          <button
            onClick={() => alert("API call!")}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            Call API
          </button>
          <button
            onClick={auth.logout}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
