// app/welcome/welcome.tsx
import { useState } from "react";

export function Welcome() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback");
    window.location.href = `/auth/authorize?redirect_uri=${redirectUri}`;
  };

  return (
    <main className="flex items-center justify-center pt-16 pb-4 min-h-screen bg-zinc-950 text-white">
      <div className="flex-1 flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <div className="w-[500px] max-w-[100vw] p-4">
            <img src="/logo.png" alt="ReadTalk" className="w-full" />
          </div>
        </header>

        <div className="max-w-[300px] w-full space-y-6 px-4">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl text-lg transition"
          >
            {isLoading ? "Connecting to OpenAuth..." : "Sign in with OpenAuth"}
          </button>
        </div>
      </div>
    </main>
  );
}
