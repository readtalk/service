import type { Route } from "./+types/home";
import { PasswordUI } from "@openauthjs/openauth/ui/password";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "READTalk - Login" },
    { name: "description", content: "Login to your account" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            READTalk
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Sign in to your account
          </p>
        </div>

        <PasswordUI
          sendCode={async (email, code) => {
            // Kirim kode ke OpenAuth server
            // Untuk testing, cukup console.log
            console.log(`[OpenAuth] Sending code ${code} to ${email}`);
            
            // TODO: Ganti dengan fetch ke OpenAuth server
            // await fetch("/auth/send-code", {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({ email, code }),
            // });
          }}
          copy={{
            input_code: "Enter verification code",
            send_code: "Send Code",
            verify_code: "Verify",
            resend_code: "Resend Code",
          }}
        />

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Don't have an account?{" "}
            <a href="/register" className="text-blue-600 hover:underline dark:text-blue-400">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
