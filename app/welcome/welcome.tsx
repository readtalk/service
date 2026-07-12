// new welcome.tsx //
import { useState } from "react";
import { useAuth } from "./AuthContext";
import logo from "./logo.svg";

export function Welcome({ message }: { message: string }) {
  const auth = useAuth();
  const [status, setStatus] = useState("");

  async function callApi() {
    const token = await auth.getToken();
    if (!token) return;

    const res = await fetch("https://service.readtalk.workers.dev/api/protected", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setStatus(res.ok ? "API call: success" : "API call: error");
  }

  if (!auth.loaded) {
    return (
      <main className="flex items-center justify-center pt-16 pb-4">
        <div className="text-center">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <div className="w-[500px] max-w-[100vw] p-4">
            <img src={logo} alt="READTalk" className="block w-full" />
          </div>
        </header>

        <div className="max-w-[300px] w-full space-y-6 px-4">
          {auth.loggedIn ? (
            <div className="space-y-4 text-center">
              <p className="text-lg">
                Logged in as <code className="bg-gray-100 px-2 py-1 rounded">{auth.userId}</code>
              </p>
              {status !== "" && <p className="text-sm text-gray-600">{status}</p>}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={callApi}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Call API
                </button>
                <button
                  onClick={auth.logout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-gray-700 dark:text-gray-200">{message}</p>
              <button
                onClick={auth.login}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Login with OpenAuth
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
