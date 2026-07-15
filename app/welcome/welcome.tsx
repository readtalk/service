import logoDark from "./logo.svg";
import logoLight from "./logo.svg";

type User = {
  id: string;
  email: string;
}

export function Welcome({ user }: { user: User }) {
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <div className="w-[500px] max-w-[100vw] p-4">
            <img src={logoLight} alt="READTalk" className="block w-full dark:hidden" />
            <img src={logoDark} alt="READTalk" className="hidden w-full dark:block" />
          </div>
          <h1 className="text-4xl font-bold">Welcome to READTalk</h1>
        </header>

        <div className="max-w-[400px] w-full space-y-6 px-4">
          <nav className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <p className="leading-6 text-gray-700 dark:text-gray-200 text-center font-semibold">
              Kamu sudah login
            </p>
            <ul className="space-y-2">
              <li className="self-stretch p-3 leading-normal bg-gray-100 dark:bg-gray-800 rounded-lg">
                <b>ID:</b> {user.id}
              </li>
              <li className="self-stretch p-3 leading-normal bg-gray-100 dark:bg-gray-800 rounded-lg">
                <b>Email:</b> {user.email}
              </li>
            </ul>
            <a
              className="block text-center p-3 rounded-lg bg-red-500 text-white hover:bg-red-600"
              href="https://service.readtalk.workers.dev/logout"
            >
              Logout
            </a>
          </nav>
        </div>
      </div>
    </main>
  );
}
