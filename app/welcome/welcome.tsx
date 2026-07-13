import { useContext } from "./AuthContext";
import logo from "./logo.svg";

export function Welcome({ message }: { message: string }) {
  const auth = useAuth();

  if (!auth.loaded) {
    return <div className="text-center p-8">Loading...</div>;
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
                Logged in as <code className="bg-gray-100 px-2 py-1 rounded">{auth.userId || "User"}</code>
              </p>
              <button
                onClick={auth.logout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
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
